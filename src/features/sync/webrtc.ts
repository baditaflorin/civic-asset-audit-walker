import { auditReportSchema, peerEnvelopeSchema, type AuditReport } from "../../lib/schema";

export type SignalPayload = {
  type: RTCSdpType;
  sdp: string;
};

export type PeerSyncHandlers = {
  onOpen: () => void;
  onReports: (reports: AuditReport[]) => Promise<void>;
  onStatus: (message: string) => void;
};

export function encodeSignal(description: RTCSessionDescriptionInit): string {
  return btoa(JSON.stringify({ type: description.type, sdp: description.sdp }));
}

export function decodeSignal(value: string): SignalPayload {
  const parsed: unknown = JSON.parse(atob(value.trim()));
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "type" in parsed &&
    "sdp" in parsed &&
    typeof parsed.type === "string" &&
    typeof parsed.sdp === "string"
  ) {
    return { type: parsed.type as RTCSdpType, sdp: parsed.sdp };
  }

  throw new Error("Invalid WebRTC signal.");
}

export function createPeerConnection(handlers: PeerSyncHandlers): RTCPeerConnection {
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  peer.onconnectionstatechange = () => {
    handlers.onStatus(`Peer ${peer.connectionState}.`);
  };

  peer.ondatachannel = (event) => {
    wireChannel(event.channel, handlers);
  };

  return peer;
}

export function wireChannel(
  channel: RTCDataChannel,
  handlers: PeerSyncHandlers
): RTCDataChannel {
  channel.onopen = () => handlers.onOpen();
  channel.onmessage = (event: MessageEvent<string>) => {
    try {
      const parsed = peerEnvelopeSchema.parse(JSON.parse(event.data));
      void handlers.onReports(parsed.reports.map((report) => auditReportSchema.parse(report)));
    } catch {
      handlers.onStatus("Ignored a malformed peer sync message.");
    }
  };
  channel.onerror = () => handlers.onStatus("Peer channel error.");
  channel.onclose = () => handlers.onStatus("Peer channel closed.");
  return channel;
}

export async function waitForIceGathering(peer: RTCPeerConnection): Promise<void> {
  if (peer.iceGatheringState === "complete") {
    return;
  }

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 2000);
    peer.addEventListener("icegatheringstatechange", () => {
      if (peer.iceGatheringState === "complete") {
        window.clearTimeout(timeout);
        resolve();
      }
    });
  });
}

export function createEnvelope(reports: AuditReport[]) {
  return JSON.stringify({
    type: "caw.sync.v1",
    sentAt: new Date().toISOString(),
    reports
  });
}
