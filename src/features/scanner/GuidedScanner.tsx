import { Camera, Check, Printer, ScanLine, SquareDashedMousePointer } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { tagFromAprilTagId } from "../../lib/schema";
import {
  decodeCenteredAprilTag,
  renderAprilTagMatrix,
  renderAprilTagSvg,
  type AprilTagDetection
} from "./aprilTag";
import { loadOpenCvForScanner } from "./openCv";

type GuidedScannerProps = {
  onDetected: (assetTag: string, tagId?: number) => void;
  onMessage: (message: string) => void;
};

export default function GuidedScanner({ onDetected, onMessage }: GuidedScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [detected, setDetected] = useState<AprilTagDetection | null>(null);
  const [demoTagId, setDemoTagId] = useState(23);
  const [scannerMode, setScannerMode] = useState<"opencv" | "canvas" | "idle">("idle");

  const demoMatrix = useMemo(() => renderAprilTagMatrix(demoTagId), [demoTagId]);
  const demoSvg = useMemo(() => renderAprilTagSvg(demoTagId, 14), [demoTagId]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function startCamera() {
    setLoadingCamera(true);
    const mode = await loadOpenCvForScanner();
    setScannerMode(mode);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      onMessage(mode === "opencv" ? "OpenCV.js scanner ready." : "Canvas scanner ready.");
    } catch {
      onMessage("Camera permission failed. Manual and demo tag entry still work.");
    } finally {
      setLoadingCamera(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      onMessage("Camera frame is not ready yet.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      onMessage("Could not read the camera frame.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const detection = decodeCenteredAprilTag(image);

    if (!detection) {
      onMessage("No centered tag matched. Fill the square guide and try again.");
      return;
    }

    setDetected(detection);
    onDetected(detection.assetTag, detection.tagId);
    onMessage(`Detected ${detection.assetTag}.`);
  }

  function useDemoTag() {
    const assetTag = tagFromAprilTagId(demoTagId);
    onDetected(assetTag, demoTagId);
    setDetected({
      tagId: demoTagId,
      assetTag,
      rotation: 0,
      hammingDistance: 0,
      confidence: 1,
      matrix: demoMatrix.map((row) => row.map((pixel) => (pixel === "b" ? "b" : "w")))
    });
    onMessage(`Loaded demo tag ${assetTag}.`);
  }

  return (
    <section className="surface scanner-panel">
      <div className="section-heading">
        <h2>Tag scanner</h2>
        <span>{scannerMode === "idle" ? "Ready" : scannerMode}</span>
      </div>

      <div className="scanner-grid">
        <div className="camera-frame">
          <video muted playsInline ref={videoRef} />
          <div className="scan-guide" aria-hidden="true">
            <SquareDashedMousePointer size={34} />
          </div>
          {!cameraActive && <span className="camera-placeholder">Camera idle</span>}
        </div>

        <div className="tag-preview" aria-label={`AprilTag ${demoTagId}`}>
          <div className="tag-svg" dangerouslySetInnerHTML={{ __html: demoSvg }} />
          <label className="field compact">
            <span>Sticker id</span>
            <input
              max={699}
              min={0}
              onChange={(event) => setDemoTagId(Number(event.target.value))}
              type="number"
              value={demoTagId}
            />
          </label>
        </div>
      </div>

      <div className="toolbar">
        <button
          className="ghost-button"
          disabled={loadingCamera}
          onClick={startCamera}
          type="button"
        >
          <Camera size={16} />
          {cameraActive ? "Restart camera" : "Open camera"}
        </button>
        <button
          className="primary-button"
          disabled={!cameraActive}
          onClick={captureFrame}
          type="button"
        >
          <ScanLine size={17} />
          Scan frame
        </button>
        <button className="ghost-button" onClick={useDemoTag} type="button">
          <Check size={16} />
          Use demo
        </button>
        <button className="ghost-button" onClick={() => window.print()} type="button">
          <Printer size={16} />
          Print
        </button>
      </div>

      {detected && (
        <p className="scanner-result">
          {detected.assetTag} · confidence {(detected.confidence * 100).toFixed(0)}%
        </p>
      )}

      <canvas hidden ref={canvasRef} />
    </section>
  );
}
