import { Copy, Link2, PlugZap, RadioTower, Send } from "lucide-react";
import { useRef, useState } from "react";
import type { AuditReport } from "../../lib/schema";
import {
  createEnvelope,
  createPeerConnection,
  decodeSignal,
  encodeSignal,
  waitForIceGathering,
  wireChannel
} from "./webrtc";

type WebRtcSyncProps = {
  reports: AuditReport[];
  onImport: (
    reports: AuditReport[]
  ) => Promise<{ added: number; updated: number; skipped: number }>;
  onMessage: (message: string) => void;
};

export default function WebRtcSync({ reports, onImport, onMessage }: WebRtcSyncProps) {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const [localSignal, setLocalSignal] = useState("");
  const [remoteSignal, setRemoteSignal] = useState("");
  const [status, setStatus] = useState("Idle");

  const handlers = {
    onOpen: () => {
      setStatus("Connected");
      sendReports();
    },
    onReports: async (incoming: AuditReport[]) => {
      const result = await onImport(incoming.map((report) => ({ ...report, source: "peer" })));
      onMessage(
        `Peer sync added ${result.added}, updated ${result.updated}, skipped ${result.skipped}.`
      );
    },
    onStatus: (message: string) => setStatus(message)
  };

  async function startOffer() {
    closePeer();
    const peer = createPeerConnection(handlers);
    const channel = wireChannel(peer.createDataChannel("caw-reports"), handlers);
    peerRef.current = peer;
    channelRef.current = channel;
    await peer.setLocalDescription(await peer.createOffer());
    await waitForIceGathering(peer);
    setLocalSignal(encodeSignal(peer.localDescription!));
    setStatus("Offer ready");
  }

  async function acceptOffer() {
    closePeer();
    const offer = decodeSignal(remoteSignal);
    const peer = createPeerConnection(handlers);
    peer.ondatachannel = (event) => {
      channelRef.current = wireChannel(event.channel, handlers);
    };
    peerRef.current = peer;
    await peer.setRemoteDescription(offer);
    await peer.setLocalDescription(await peer.createAnswer());
    await waitForIceGathering(peer);
    setLocalSignal(encodeSignal(peer.localDescription!));
    setStatus("Answer ready");
  }

  async function acceptAnswer() {
    if (!peerRef.current) {
      onMessage("Start an offer before accepting an answer.");
      return;
    }
    await peerRef.current.setRemoteDescription(decodeSignal(remoteSignal));
    setStatus("Answer accepted");
  }

  function sendReports() {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== "open") {
      setStatus("Channel is not open");
      return;
    }
    channel.send(createEnvelope(reports));
    setStatus(`Sent ${reports.length} reports`);
  }

  async function copyLocalSignal() {
    await navigator.clipboard.writeText(localSignal);
    onMessage("Signal copied.");
  }

  function closePeer() {
    channelRef.current?.close();
    peerRef.current?.close();
    channelRef.current = null;
    peerRef.current = null;
  }

  return (
    <section className="surface sync-panel">
      <div className="section-heading">
        <h2>Peer sync</h2>
        <span>{status}</span>
      </div>

      <div className="toolbar">
        <button className="ghost-button" onClick={startOffer} type="button">
          <RadioTower size={16} />
          Create offer
        </button>
        <button
          className="ghost-button"
          disabled={!remoteSignal}
          onClick={acceptOffer}
          type="button"
        >
          <PlugZap size={16} />
          Accept offer
        </button>
        <button
          className="ghost-button"
          disabled={!remoteSignal}
          onClick={acceptAnswer}
          type="button"
        >
          <Link2 size={16} />
          Accept answer
        </button>
        <button className="primary-button" onClick={sendReports} type="button">
          <Send size={16} />
          Send
        </button>
      </div>

      <label className="field">
        <span>Local signal</span>
        <textarea readOnly rows={4} value={localSignal} />
      </label>
      <button
        className="ghost-button wide"
        disabled={!localSignal}
        onClick={copyLocalSignal}
        type="button"
      >
        <Copy size={16} />
        Copy local signal
      </button>

      <label className="field">
        <span>Remote signal</span>
        <textarea
          onChange={(event) => setRemoteSignal(event.target.value)}
          rows={4}
          value={remoteSignal}
        />
      </label>
    </section>
  );
}
