import { useEffect, useRef, useState } from "react";

interface CaptureResult {
  imageBase64: string;
  width: number;
  height: number;
}

interface WebcamCaptureProps {
  onCapture: (result: CaptureResult) => void;
  onError?: (err: string) => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

async function enumerateCameras(): Promise<CameraDevice[]> {
  try {
    const all = await navigator.mediaDevices.enumerateDevices();
    return all
      .filter((d) => d.kind === "videoinput")
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${i + 1}`,
      }));
  } catch {
    return [];
  }
}

async function openStream(deviceId: string): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    },
    audio: false,
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

export default function WebcamCapture({ onCapture, onError }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    enumerateCameras().then(setCameras);
    const onChange = () => enumerateCameras().then(setCameras);
    navigator.mediaDevices.addEventListener("devicechange", onChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", onChange);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const stream = pendingStreamRef.current;
    if (!active || !stream || !videoRef.current) return;

    videoRef.current.srcObject = stream;
    streamRef.current = stream;
    pendingStreamRef.current = null;

    videoRef.current.play().catch(() => {
      /* muted + autoplay should work */
    });
  }, [active]);

  async function switchCamera(deviceId: string) {
    setSelectedCamera(deviceId);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    try {
      const stream = await openStream(deviceId);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      await enumerateCameras().then(setCameras);
    } catch {
      setCamErr("Could not switch to selected camera.");
    }
  }

  async function start() {
    setCamErr(null);
    setStarting(true);
    try {
      const stream = await openStream(selectedCamera);
      pendingStreamRef.current = stream;

      const list = await enumerateCameras();
      setCameras(list);
      if (!selectedCamera && list.length) {
        setSelectedCamera(list[0].deviceId);
      }

      setActive(true);
    } catch (e: unknown) {
      let msg: string;
      if (e instanceof DOMException) {
        switch (e.name) {
          case "NotAllowedError":
            msg = "Camera permission denied. Allow camera access in browser settings.";
            break;
          case "NotFoundError":
            msg = "No camera found. Connect a webcam and try again.";
            break;
          case "NotReadableError":
            msg = "Camera is in use by another application. Close other apps using the camera.";
            break;
          case "OverconstrainedError":
            msg = "Requested camera not available. Try selecting a different one.";
            break;
          default:
            msg = e.message || "Camera error";
        }
      } else if (e instanceof Error) {
        msg = e.message;
      } else {
        msg = "Could not access camera.";
      }
      setCamErr(msg);
      onError?.(msg);
    } finally {
      setStarting(false);
    }
  }

  function stop() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    pendingStreamRef.current = null;
    setActive(false);
  }

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const base64 = dataUrl.split(",")[1];
    setCaptured(dataUrl);
    onCapture({ imageBase64: base64, width: canvas.width, height: canvas.height });
    stop();
  }

  function retake() {
    setCaptured(null);
    start();
  }

  if (captured) {
    return (
      <div className="text-center">
        <img
          src={`data:image/jpeg;base64,${captured}`}
          alt="Captured face"
          className="max-w-[280px] max-h-[280px] rounded-xl border-2 border-emerald-500 mx-auto block"
        />
        <div className="mt-4 flex gap-3 justify-center">
          <button type="button" className="secondary" onClick={retake}>
            Retake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      {!active ? (
        <>
          {cameras.length > 0 && (
            <div className="mb-4">
              <label className="text-left">Camera</label>
              <select
                value={selectedCamera || cameras[0]?.deviceId || ""}
                onChange={(e) => setSelectedCamera(e.target.value)}
              >
                {cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button type="button" onClick={start} disabled={starting} className="px-6">
            {starting ? "Opening..." : "Open Camera"}
          </button>
        </>
      ) : (
        <>
          {cameras.length > 1 && (
            <div className="mb-3">
              <select
                value={selectedCamera}
                onChange={(e) => switchCamera(e.target.value)}
                className="max-w-[220px] mx-auto"
              >
                {cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-[320px] max-h-[320px] rounded-xl border-2 border-sky-500 mx-auto block bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-4 flex gap-3 justify-center">
            <button type="button" className="secondary" onClick={stop}>
              Cancel
            </button>
            <button
              type="button"
              onClick={capture}
              className="bg-sky-500 hover:bg-sky-400 text-white"
            >
              Take Photo
            </button>
          </div>
        </>
      )}
      {camErr && (
        <p className="text-red-600 dark:text-red-400 text-sm mt-3">{camErr}</p>
      )}
    </div>
  );
}
