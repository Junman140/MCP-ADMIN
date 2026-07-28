import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import { captureFromBridge, pingBridge } from "../lib/capture";
import WebcamCapture from "../components/WebcamCapture";

type EnrollmentsState = {
  fingerprint: boolean;
  face: boolean;
  fingers: string[];
};

const LEFT_FINGERS = ["LEFT_THUMB", "LEFT_INDEX", "LEFT_MIDDLE", "LEFT_RING", "LEFT_LITTLE"] as const;
const RIGHT_FINGERS = ["RIGHT_THUMB", "RIGHT_INDEX", "RIGHT_MIDDLE", "RIGHT_RING", "RIGHT_LITTLE"] as const;
const FINGER_LABELS: Record<string, string> = {
  LEFT_THUMB: "Thumb", LEFT_INDEX: "Index", LEFT_MIDDLE: "Middle", LEFT_RING: "Ring", LEFT_LITTLE: "Little",
  RIGHT_THUMB: "Thumb", RIGHT_INDEX: "Index", RIGHT_MIDDLE: "Middle", RIGHT_RING: "Ring", RIGHT_LITTLE: "Little",
};

export default function Enroll() {
  const { studentId } = useParams();
  const [tab, setTab] = useState<"fingerprint" | "face">("fingerprint");
  const [enrollments, setEnrollments] = useState<EnrollmentsState>({
    fingerprint: false, face: false, fingers: [],
  });

  // Selected finger to capture
  const [selectedFinger, setSelectedFinger] = useState<string>("");
  const [imgBase64, setImgBase64] = useState("");
  const [imgFormat, setImgFormat] = useState<"png" | "raw_gray8">("png");
  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dpi, setDpi] = useState(500);
  const [fpErr, setFpErr] = useState<string | null>(null);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMsg, setFpMsg] = useState<string | null>(null);

  // Bridge
  const [bridgeUrl, setBridgeUrl] = useState(() => localStorage.getItem("captureBridgeUrl") || "http://127.0.0.1:5055");
  const [bridgeStatus, setBridgeStatus] = useState<"checking" | "ok" | "error" | null>(null);
  const [bridgeScanner, setBridgeScanner] = useState<string | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  // Face
  const [faceImg, setFaceImg] = useState("");
  const [faceW, setFaceW] = useState(0);
  const [faceH, setFaceH] = useState(0);
  const [faceQualityMin, setFaceQualityMin] = useState(0.5);
  const [faceErr, setFaceErr] = useState<string | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);

  useEffect(() => {
    api<EnrollmentsState>(`/students/${studentId}/enrollments/status`)
      .then((d) => setEnrollments(d))
      .catch(() => {});
  }, [studentId]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => { checkBridge(); }, []);

  async function checkBridge() {
    setBridgeStatus("checking"); setBridgeScanner(null); setBridgeError(null);
    localStorage.setItem("captureBridgeUrl", bridgeUrl);
    const info = await pingBridge(bridgeUrl);
    if (info.ok) { setBridgeStatus("ok"); setBridgeScanner(`${info.vendor} ${info.scanner}`); }
    else { setBridgeStatus("error"); setBridgeError(info.reason); }
  }

  async function captureLive() {
    setFpErr(null); setCapturing(true);
    localStorage.setItem("captureBridgeUrl", bridgeUrl);
    try {
      const res = await captureFromBridge(bridgeUrl);
      setImgBase64(res.base64); setImgFormat(res.format as "png" | "raw_gray8");
      setImgW(res.width); setImgH(res.height); setDpi(res.dpi);
      if (res.format === "raw_gray8") {
        const c = document.createElement("canvas"); c.width = res.width; c.height = res.height;
        const ctx = c.getContext("2d");
        if (ctx) {
          const d = ctx.createImageData(res.width, res.height);
          const b = Uint8Array.from(atob(res.base64), (x) => x.charCodeAt(0));
          for (let i = 0; i < b.length; i++) { d.data[i*4]=b[i]; d.data[i*4+1]=b[i]; d.data[i*4+2]=b[i]; d.data[i*4+3]=255; }
          ctx.putImageData(d, 0, 0); setPreviewUrl(c.toDataURL("image/png"));
        }
      } else { setPreviewUrl(`data:image/png;base64,${res.base64}`); }
    } catch (e: unknown) {
      setFpErr(e instanceof Error ? e.message : "Capture failed");
    } finally { setCapturing(false); }
  }

  async function saveFinger() {
    if (!selectedFinger || !imgBase64) { setFpErr("Select a finger and capture it first."); return; }
    setFpErr(null); setFpMsg(null); setFpLoading(true);
    try {
      const res = await api<{ id: string; qualityScore?: number }>(`/students/${studentId}/enrollments`, {
        method: "POST",
        body: JSON.stringify({ fingerCode: selectedFinger, imageBase64: imgBase64, width: imgW, height: imgH, dpi, format: imgFormat, qualityMin: 50 }),
      });
      setEnrollments((prev) => {
        const fingers = prev.fingers.includes(selectedFinger) ? prev.fingers : [...prev.fingers, selectedFinger];
        return { ...prev, fingerprint: true, fingers };
      });
      setFpMsg(`${FINGER_LABELS[selectedFinger] || selectedFinger} enrolled (score: ${Math.round(res.qualityScore ?? 0)})`);
      resetCapture();
    } catch (e: unknown) {
      setFpErr(e instanceof Error ? e.message : "Enrollment failed");
    } finally { setFpLoading(false); }
  }

  function resetCapture() {
    setImgBase64(""); setImgW(0); setImgH(0); setPreviewUrl(null);
  }

  function selectFinger(code: string) {
    setSelectedFinger(code); setFpErr(null); setFpMsg(null); resetCapture();
  }

  async function submitFace() {
    setFaceErr(null);
    if (!faceImg) { setFaceErr("Capture a face photo first."); return; }
    setFaceLoading(true);
    try {
      await api(`/students/${studentId}/enrollments/face`, {
        method: "POST", body: JSON.stringify({ imageBase64: faceImg, qualityMin: faceQualityMin }),
      });
      setEnrollments((prev) => ({ ...prev, face: true }));
      setFaceImg(""); setFaceW(0); setFaceH(0);
    } catch (e: unknown) {
      setFaceErr(e instanceof Error ? e.message : "Face enrollment failed");
    } finally { setFaceLoading(false); }
  }

  const allEnrolled = enrollments.fingerprint && enrollments.face;
  const enrolledSet = new Set(enrollments.fingers);

  return (
    <>
      <div className="mb-6">
        <p className="mb-2">
          <Link to="/students" className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Directory
          </Link>
        </p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Biometric Enrollment</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Student ID: {studentId}</p>
      </div>

      {allEnrolled && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
          <h3 className="text-emerald-700 dark:text-emerald-400 font-bold mb-1">All biometrics enrolled</h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-500 m-0">Both fingerprint and face are registered. You can re-enroll below.</p>
        </div>
      )}

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button type="button" onClick={() => setTab("fingerprint")}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg -mb-px border transition-colors flex items-center gap-2 ${tab==="fingerprint" ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-b-white dark:border-b-slate-900 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent"}`}>
          Fingerprint {enrollments.fingerprint && <span className="text-emerald-500 text-xs">&#10003;</span>}
        </button>
        <button type="button" onClick={() => setTab("face")}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg -mb-px border transition-colors flex items-center gap-2 ${tab==="face" ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-b-white dark:border-b-slate-900 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent"}`}>
          Face {enrollments.face && <span className="text-emerald-500 text-xs">&#10003;</span>}
        </button>
      </div>

      {tab === "fingerprint" && (
      <div className="card">
        {!enrollments.face && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-center justify-between">
            <div><h3 className="text-amber-700 dark:text-amber-400 font-bold mb-1">Face not enrolled yet</h3><p className="text-sm text-amber-600 dark:text-amber-500 m-0">Complete both for full coverage.</p></div>
            <button type="button" onClick={() => setTab("face")} className="secondary text-xs">Enroll Face</button>
          </div>
        )}

        {/* Bridge status card */}
        <div className={`mb-6 p-5 rounded-xl border ${
          bridgeStatus === "ok" ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" :
          bridgeStatus === "error" ? "bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30" :
          bridgeStatus === "checking" ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" :
          "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                bridgeStatus === "ok" ? "bg-emerald-500 animate-pulse" :
                bridgeStatus === "error" ? "bg-red-500" :
                bridgeStatus === "checking" ? "bg-amber-500 animate-pulse" : "bg-slate-400"
              }`} />
              Fingerprint Scanner
              {bridgeStatus === "ok" && <span className="text-emerald-600 dark:text-emerald-400 font-normal text-xs ml-1">{bridgeScanner}</span>}
            </h3>
            <div className="flex gap-2">
              <button type="button" onClick={checkBridge} disabled={bridgeStatus === "checking"} className="secondary text-xs py-1 px-2">
                {bridgeStatus === "checking" ? "Checking..." : "Retry"}
              </button>
              {bridgeStatus === "ok" && (
                <button type="button" onClick={captureLive} disabled={capturing || !selectedFinger} className="bg-sky-500 hover:bg-sky-400 text-white text-xs py-1 px-2">
                  {capturing ? "Capturing..." : selectedFinger ? `Capture ${FINGER_LABELS[selectedFinger]}` : "Select finger"}
                </button>
              )}
            </div>
          </div>

          {bridgeStatus === "ok" && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 m-0">Scanner connected and ready. Select a finger and click Capture.</p>
          )}

          {bridgeStatus === "error" && (
            <div className="mt-2">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 m-0 mb-1">Scanner not available</p>
              <p className="text-xs text-red-600 dark:text-red-400 m-0 mb-2">{bridgeError || "Could not reach the fingerprint scanner."}</p>
              <details className="text-xs text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-black/20 rounded-lg p-3 border border-red-200 dark:border-red-500/20">
                <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300 mb-2">How to fix this</summary>
                <ol className="m-0 pl-4 space-y-1">
                  <li>Make sure the Futronic FS80H scanner is plugged into a <strong>USB port</strong> on this computer.</li>
                  <li>The fingerprint bridge must be running. Double-click <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">Fingerprint Scanner Bridge.bat</code> in the project folder.</li>
                  <li>If the bridge is already running, restart it and click <strong>Retry</strong>.</li>
                  <li>If this is a different computer, update the scanner address below.</li>
                </ol>
              </details>
              <div className="mt-2 flex items-center gap-2">
                <input value={bridgeUrl} onChange={(e) => { setBridgeUrl(e.target.value); setBridgeStatus(null); setBridgeError(null); }} placeholder="http://127.0.0.1:5055" className="max-w-[220px] text-xs" />
                <span className="text-xs text-slate-400">Advanced: scanner address</span>
              </div>
            </div>
          )}

          {bridgeStatus === "checking" && (
            <p className="text-sm text-amber-600 dark:text-amber-400 m-0">Checking scanner connection...</p>
          )}

          {bridgeStatus === null && (
            <p className="text-sm text-slate-500 dark:text-slate-400 m-0">Checking connection automatically...</p>
          )}
        </div>

        {fpMsg && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
            <p className="text-sm text-emerald-600 dark:text-emerald-500 m-0 font-medium">{fpMsg}</p>
          </div>
        )}

        {/* Finger grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {(["left","right"] as const).map((side) => {
            const fingers = side === "left" ? LEFT_FINGERS : RIGHT_FINGERS;
            return (
              <div key={side}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 text-center">
                  {side} hand
                </h4>
                <div className="flex flex-col gap-2">
                  {fingers.map((code) => {
                    const isEnrolled = enrolledSet.has(code);
                    const isSelected = selectedFinger === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => selectFinger(code)}
                        className={`w-full py-2.5 px-3 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${
                          isSelected
                            ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10 ring-2 ring-sky-500/30"
                            : isEnrolled
                            ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${
                          isEnrolled ? "border-emerald-500 text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20" :
                          isSelected ? "border-sky-500 text-sky-600 bg-sky-100 dark:bg-sky-500/20" :
                          "border-slate-300 dark:border-slate-600"
                        }`}>
                          {isEnrolled ? "✓" : isSelected ? "●" : ""}
                        </span>
                        {FINGER_LABELS[code]}
                        {isEnrolled && <span className="ml-auto text-emerald-500 text-xs">enrolled</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Capture preview + save */}
        {previewUrl && (
          <div className="text-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
            <p className="text-xs text-slate-500 mb-2">Capturing: <strong>{FINGER_LABELS[selectedFinger] || selectedFinger}</strong></p>
            <img src={previewUrl} alt="Fingerprint" className="max-w-[200px] max-h-[200px] border-2 border-sky-500 rounded-lg mx-auto block bg-black" />
            <div className="mt-4 flex gap-3 justify-center">
              <button type="button" className="secondary" onClick={resetCapture}>Discard</button>
              <button type="button" onClick={saveFinger} disabled={fpLoading || !imgBase64} className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-6">
                {fpLoading ? "Saving…" : `Save ${FINGER_LABELS[selectedFinger]}`}
              </button>
            </div>
          </div>
        )}

        {fpErr && <p className="error p-3 bg-red-50 dark:bg-red-500/10 rounded-lg mt-4">{fpErr}</p>}
      </div>
      )}

      {tab === "face" && (
      <div className="card">
        {enrollments.face && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
            <h3 className="text-emerald-700 dark:text-emerald-400 font-bold mb-1">Face enrolled</h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 m-0">You can re-enroll below.</p>
          </div>
        )}
        {!enrollments.fingerprint && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-center justify-between">
            <div><h3 className="text-amber-700 dark:text-amber-400 font-bold mb-1">Fingerprint not enrolled yet</h3><p className="text-sm text-amber-600 dark:text-amber-500 m-0">Complete both for full coverage.</p></div>
            <button type="button" onClick={() => setTab("fingerprint")} className="secondary text-xs">Enroll Fingerprint</button>
          </div>
        )}

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Use your webcam to capture a clear, front-facing photo for face recognition enrollment.</p>

        <div className="max-w-md">
          <label>Minimum face detection confidence (0–1)</label>
          <input type="number" value={faceQualityMin} onChange={(e) => setFaceQualityMin(+e.target.value)} min={0} max={1} step={0.05} />

          {!faceImg ? (
            <div className="mt-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <WebcamCapture onCapture={(r) => { setFaceImg(r.imageBase64); setFaceW(r.width); setFaceH(r.height); }} onError={(msg) => setFaceErr(msg)} />
            </div>
          ) : (
            <div className="mt-6 text-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <img src={`data:image/jpeg;base64,${faceImg}`} alt="Face preview" className="max-w-[280px] max-h-[280px] border-2 border-emerald-500 rounded-lg mx-auto block" />
              <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-4 mb-2">Face captured ({faceW}×{faceH}px)</p>
              <div className="mt-4 flex gap-3 justify-center">
                <button type="button" className="secondary" onClick={() => { setFaceImg(""); setFaceW(0); setFaceH(0); }}>Discard &amp; Retry</button>
                <button type="button" disabled={faceLoading || !faceImg} onClick={submitFace} className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-6">{faceLoading ? "Saving…" : "Save & Enroll"}</button>
              </div>
            </div>
          )}

          {faceErr && <p className="error mt-4 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">{faceErr}</p>}
        </div>
      </div>
      )}
    </>
  );
}
