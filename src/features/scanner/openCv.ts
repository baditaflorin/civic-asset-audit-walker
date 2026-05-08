type OpenCvLike = {
  Mat?: unknown;
  onRuntimeInitialized?: () => void;
};

const OPENCV_URL =
  "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.12.0-release.1/dist/opencv.js";

declare global {
  interface Window {
    cv?: OpenCvLike;
  }
}

let loadPromise: Promise<"opencv" | "canvas"> | undefined;

export async function loadOpenCvForScanner(): Promise<"opencv" | "canvas"> {
  loadPromise ??= loadOpenCvScript();
  return loadPromise;
}

async function loadOpenCvScript(): Promise<"opencv" | "canvas"> {
  if (window.cv?.Mat) {
    return "opencv";
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${OPENCV_URL}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("OpenCV failed")), {
          once: true
        });
        return;
      }

      const script = document.createElement("script");
      script.src = OPENCV_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("OpenCV failed"));
      document.head.append(script);
    });

    if (window.cv?.Mat) {
      return "opencv";
    }

    if (typeof window.cv?.onRuntimeInitialized === "function") {
      await new Promise<void>((resolve) => {
        window.cv!.onRuntimeInitialized = () => resolve();
      });
    }

    return window.cv?.Mat ? "opencv" : "canvas";
  } catch {
    return "canvas";
  }
}
