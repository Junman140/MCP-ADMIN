import { useEffect, useState } from "react";
import { api } from "../api";
import { captureFromBridge, pingBridge } from "../lib/capture";
import WebcamCapture from "../components/WebcamCapture";

type Exam = { id: string; title: string; courseId: string | null; academicYear: string | null; semester: number | null };

type VerifyResult = {
  result: string;
  matchScore: number | null;
  student?: { id: string; matricNo: string; fullName?: string; photoUrl?: string | null } | null;
  actualStudent?: { id: string; matricNo: string; fullName: string } | null;
  examId?: string;
  courseId?: string | null;
  academicYear?: string | null;
  semester?: number | null;
  detail?: string;
  hint?: string;
  error?: string;
};

type RecentEvent = {
  id: string;
  capturedAt: string;
  result: string;
  matchScore: number | null;
  student: { matricNo: string; fullName: string };
};

function readPng(file: File): Promise<{ base64: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (file.type && file.type !== "image/png") {
      reject(new Error("Only PNG files are supported."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const i = dataUrl.indexOf("base64,");
        resolve({ base64: i >= 0 ? dataUrl.slice(i + 7) : dataUrl, width: w, height: h });
      };
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });
}

const RESULT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  match:                    { label: "MATCH",                  color: "#052e16", bg: "#22c55e" },
  already_verified:         { label: "ALREADY VERIFIED",       color: "#052e16", bg: "#38bdf8" },
  no_match:                 { label: "NO MATCH",               color: "#fef2f2", bg: "#ef4444" },
  no_face_detected:         { label: "NO FACE DETECTED",       color: "#fef2f2", bg: "#ef4444" },
  not_enrolled:             { label: "NOT ENROLLED",           color: "#422006", bg: "#f59e0b" },
  no_student:               { label: "STUDENT NOT FOUND",      color: "#422006", bg: "#f59e0b" },
  not_on_roster:            { label: "NOT ON EXAM ROSTER",     color: "#422006", bg: "#f59e0b" },
  not_registered_for_course:{ label: "NOT REGISTERED FOR COURSE", color: "#422006", bg: "#f59e0b" },
  exam_not_found:           { label: "EXAM NOT FOUND",         color: "#422006", bg: "#f59e0b" },
  exam_not_configured:      { label: "EXAM NOT CONFIGURED",    color: "#422006", bg: "#f59e0b" },
  session_mismatch:         { label: "SESSION MISMATCH",       color: "#422006", bg: "#f59e0b" },
  course_mismatch:          { label: "COURSE MISMATCH",        color: "#422006", bg: "#f59e0b" },
  mismatch:                 { label: "MISMATCH (IMPERSONATION)", color: "#fef2f2", bg: "#7c3aed" },
};

export default function Verify() {
  const [tab, setTab] = useState<"fingerprint" | "face">("fingerprint");
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState("");
  const [imageBase64, setImg] = useState("");
  const [imgFormat, setImgFormat] = useState<"png" | "raw_gray8">("png");
  const [width, setW] = useState(0);
  const [height, setH] = useState(0);
  const [dpi, setDpi] = useState(500);
  const [previewUrl, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [recent, setRecent] = useState<RecentEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [bridgeUrl, setBridgeUrl] = useState(() => localStorage.getItem("captureBridgeUrl") || "http://127.0.0.1:5055");
  const [bridgeStatus, setBridgeStatus] = useState<"checking" | "ok" | "error" | null>(null);
  const [bridgeScanner, setBridgeScanner] = useState<string | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  // Face-specific state
  const [faceImg, setFaceImg] = useState("");
  const [faceW, setFaceW] = useState(0);
  const [faceH, setFaceH] = useState(0);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceResult, setFaceResult] = useState<VerifyResult | null>(null);
  const [faceMatchThreshold, setFaceMatchThreshold] = useState(0.55);

  // Student Search is no longer used for verification (it's 1-to-N now)
  // const [searchQ, setSearchQ] = useState("");
  // const [searchResults, setSearchResults] = useState<{ id: string; matricNo: string; fullName: string }[]>([]);
  // const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    api<Exam[]>("/exams").then(setExams).catch(() => {});
    api<RecentEvent[]>("/reports/verification-events")
      .then((r) => setRecent(r.slice(0, 20)))
      .catch(() => {});
    checkBridge();
  }, []);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  async function checkBridge() {
    setBridgeStatus("checking");
    setBridgeScanner(null);
    setBridgeError(null);
    localStorage.setItem("captureBridgeUrl", bridgeUrl);
    const info = await pingBridge(bridgeUrl);
    if (info.ok) {
      setBridgeStatus("ok");
      setBridgeScanner(`${info.vendor} ${info.scanner}`);
    } else {
      setBridgeStatus("error");
      setBridgeError(info.reason);
    }
  }

  async function captureLive() {
    setErr(null);
    setResult(null);
    setCapturing(true);
    localStorage.setItem("captureBridgeUrl", bridgeUrl);
    try {
      const res = await captureFromBridge(bridgeUrl);
      setImg(res.base64);
      setImgFormat(res.format as "png" | "raw_gray8");
      setW(res.width);
      setH(res.height);
      setDpi(res.dpi);
      
      if (res.format === "raw_gray8") {
        const canvas = document.createElement("canvas");
        canvas.width = res.width;
        canvas.height = res.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imgData = ctx.createImageData(res.width, res.height);
          const rawBytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
          for (let i = 0; i < rawBytes.length; i++) {
            imgData.data[i * 4] = rawBytes[i];     // R
            imgData.data[i * 4 + 1] = rawBytes[i]; // G
            imgData.data[i * 4 + 2] = rawBytes[i]; // B
            imgData.data[i * 4 + 3] = 255;         // A
          }
          ctx.putImageData(imgData, 0, 0);
          setPreview(canvas.toDataURL("image/png"));
        }
      } else {
        setPreview(`data:image/png;base64,${res.base64}`);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Capture failed. Is the bridge running?");
    } finally {
      setCapturing(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setResult(null);
    if (!imageBase64 || !width || !height) {
      setErr("Please capture a fingerprint first.");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        imageBase64,
        width,
        height,
        dpi,
        format: imgFormat,
      };
      if (examId) body.examId = examId;
      // We no longer send matricNo, we use /verify/identify
      const res = await api<VerifyResult>("/verify/identify", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(res);
      api<RecentEvent[]>("/reports/verification-events")
        .then((r) => setRecent(r.slice(0, 20)))
        .catch(() => {});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      if (msg.includes("Matching service")) {
        setErr("Matching service is not running. Start the SourceAFIS Java service (pnpm dev includes it).");
      } else {
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyFace() {
    setErr(null);
    setFaceResult(null);
    if (!faceImg) {
      setErr("Capture a face photo first.");
      return;
    }
    setFaceLoading(true);
    try {
      const body: Record<string, unknown> = {
        imageBase64: faceImg,
        matchThreshold: faceMatchThreshold,
      };
      if (examId) body.examId = examId;
      const res = await api<VerifyResult>("/verify/face/identify", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setFaceResult(res);
      api<RecentEvent[]>("/reports/verification-events")
        .then((r) => setRecent(r.slice(0, 20)))
        .catch(() => {});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      if (msg.includes("Face service")) {
        setErr("Face service is not running. Start it with `pnpm dev:face`.");
      } else {
        setErr(msg);
      }
    } finally {
      setFaceLoading(false);
    }
  }

  const badge = result ? RESULT_LABELS[result.result] ?? { label: result.result, color: "#fff", bg: "#64748b" } : null;
  const faceBadge = faceResult ? RESULT_LABELS[faceResult.result] ?? { label: faceResult.result, color: "#fff", bg: "#64748b" } : null;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Verify student identity</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Capture biometrics to identify the student. Optionally tie the verification to an <strong>exam</strong> for roster and course registration checks.
        </p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          type="button"
          onClick={() => { setTab("fingerprint"); setErr(null); setResult(null); }}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg -mb-px border transition-colors ${
            tab === "fingerprint"
              ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-b-white dark:border-b-slate-900 text-slate-900 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent"
          }`}
        >
          Fingerprint
        </button>
        <button
          type="button"
          onClick={() => { setTab("face"); setErr(null); setFaceResult(null); }}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg -mb-px border transition-colors ${
            tab === "face"
              ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-b-white dark:border-b-slate-900 text-slate-900 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent"
          }`}
        >
          Face
        </button>
      </div>

      {tab === "fingerprint" && (
      <div className="card">
        <form onSubmit={verify}>
          <label>Exam (optional — limits search to roster + course check)</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">— No exam context (Search all students) —</option>
            {exams.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title} {x.academicYear ? `(${x.academicYear} sem ${x.semester ?? "?"})` : ""}
              </option>
            ))}
          </select>

          <div className={`p-4 rounded-xl mt-4 border ${
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
                  <button type="button" onClick={captureLive} disabled={capturing} className="bg-sky-500 hover:bg-sky-400 text-white text-xs py-1 px-2">
                    {capturing ? "Capturing..." : "Capture live"}
                  </button>
                )}
              </div>
            </div>

            {bridgeStatus === "ok" && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 m-0">Scanner connected. Place finger and capture to identify.</p>
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

          {previewUrl && (
            <div className="mt-4 text-center">
              <img src={previewUrl} alt="Fingerprint" className="max-w-[220px] max-h-[220px] border-2 border-emerald-500 rounded-lg mx-auto block" />
              <p className="text-sm text-emerald-500 mt-2 font-medium">Fingerprint captured successfully ({width} × {height}px)</p>
              <button type="button" className="secondary mt-3" onClick={() => {
                setPreview(null);
                setImg("");
                setW(0);
                setH(0);
                setResult(null);
              }}>
                Discard & Retry
              </button>
            </div>
          )}

          {err && <p className="error mt-4">{err}</p>}

          <div className="mt-6">
            <button type="submit" disabled={loading || !imageBase64} className={`w-full py-3 text-lg font-bold shadow-sm ${imageBase64 ? "bg-sky-500 hover:bg-sky-400 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500"}`}>
            {loading ? "Identifying…" : "Identify Student"}
              </button>
          </div>
        </form>
      </div>
      )}

      {tab === "face" && (
      <div className="card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyFace();
          }}
        >
          <label>Exam (optional — limits search to roster + course check)</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">— No exam context (Search all students) —</option>
            {exams.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title} {x.academicYear ? `(${x.academicYear} sem ${x.semester ?? "?"})` : ""}
              </option>
            ))}
          </select>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mt-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3">Capture Face</h3>
            <WebcamCapture
              onCapture={(r) => { setFaceImg(r.imageBase64); setFaceW(r.width); setFaceH(r.height); }}
              onError={(msg) => setErr(msg)}
            />
          </div>

          <label className="mt-4">Match threshold (0–1, higher = stricter)</label>
          <input
            type="number"
            value={faceMatchThreshold}
            onChange={(e) => setFaceMatchThreshold(+e.target.value)}
            min={0}
            max={1}
            step={0.05}
          />

          {faceImg && (
            <div className="mt-4 text-center">
              <img
                src={`data:image/jpeg;base64,${faceImg}`}
                alt="Face"
                className="max-w-[220px] max-h-[220px] border-2 border-emerald-500 rounded-lg mx-auto block"
              />
              <p className="text-sm text-emerald-500 mt-2 font-medium">
                Face captured ({faceW} × {faceH}px)
              </p>
              <button
                type="button"
                className="secondary mt-3"
                onClick={() => {
                  setFaceImg("");
                  setFaceW(0);
                  setFaceH(0);
                  setFaceResult(null);
                }}
              >
                Discard &amp; Retry
              </button>
            </div>
          )}

          {err && <p className="error mt-4">{err}</p>}

          <div className="mt-6">
            <button
              type="submit"
              disabled={faceLoading || !faceImg}
              className={`w-full py-3 text-lg font-bold shadow-sm ${
                faceImg
                  ? "bg-sky-500 hover:bg-sky-400 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
              }`}
            >
              {faceLoading ? "Identifying…" : "Identify Face"}
            </button>
          </div>
        </form>
      </div>
      )}

      {tab === "fingerprint" && result && badge && (
        <div
          className="card mt-4"
          style={{ borderLeft: `4px solid ${badge.bg}` }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span style={{ background: badge.bg, color: badge.color }} className="px-3 py-1 rounded-md font-bold text-sm">
              {badge.label}
            </span>
            {result.detail && (
              <span className="text-sm text-red-500 dark:text-red-400 font-medium">
                ({result.detail})
              </span>
            )}
            {result.matchScore != null && (
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Score: <strong className="text-slate-900 dark:text-slate-100">{result.matchScore.toFixed(1)}</strong>
              </span>
            )}
          </div>
          {result.student && (
            <div className={`mt-4 ${result.result === "mismatch" ? "border border-purple-500 dark:border-purple-500/50 p-4 rounded-lg bg-purple-50 dark:bg-purple-500/5" : ""}`}>
              {result.result === "mismatch" && <p className="text-purple-600 dark:text-purple-400 font-bold mb-2 text-sm">Claimed Identity:</p>}
              <p className="text-lg font-bold text-slate-900 dark:text-white m-0">
                {result.student.fullName ?? "—"} <span className="text-slate-500 dark:text-slate-400 text-base font-normal">({result.student.matricNo})</span>
              </p>
              {result.student.photoUrl && (
                <img
                  src={result.student.photoUrl}
                  alt="Student"
                  className="max-w-[80px] max-h-[80px] rounded-lg mt-3 border border-slate-200 dark:border-slate-800"
                />
              )}
            </div>
          )}
          {result.result === "mismatch" && result.actualStudent && (
            <div className="mt-4 border border-red-500 dark:border-red-500/50 p-4 rounded-lg bg-red-50 dark:bg-red-500/5">
              <p className="text-red-600 dark:text-red-400 font-bold mb-2 text-sm">Actual Identified Student:</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white m-0">
                {result.actualStudent.fullName} <span className="text-slate-500 dark:text-slate-400 text-base font-normal">({result.actualStudent.matricNo})</span>
              </p>
            </div>
          )}
          {result.examId && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 m-0 font-medium">
              Exam: {result.examId}
              {result.academicYear && ` · ${result.academicYear}`}
              {result.semester != null && ` · Semester ${result.semester}`}
              {result.courseId && ` · Course ${result.courseId}`}
            </p>
          )}
          {result.detail && (
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-2 font-medium">{result.detail}</p>
          )}
        </div>
      )}

      {tab === "face" && faceResult && faceBadge && (
        <div
          className="card mt-4"
          style={{ borderLeft: `4px solid ${faceBadge.bg}` }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span style={{ background: faceBadge.bg, color: faceBadge.color }} className="px-3 py-1 rounded-md font-bold text-sm">
              {faceBadge.label}
            </span>
            {faceResult.matchScore != null && (
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Similarity: <strong className="text-slate-900 dark:text-slate-100">{(faceResult.matchScore * 100).toFixed(1)}%</strong>
              </span>
            )}
          </div>
          {faceResult.student && (
            <div className="mt-4">
              <p className="text-lg font-bold text-slate-900 dark:text-white m-0">
                {faceResult.student.fullName ?? "—"} <span className="text-slate-500 dark:text-slate-400 text-base font-normal">({faceResult.student.matricNo})</span>
              </p>
              {faceResult.student.photoUrl && (
                <img
                  src={faceResult.student.photoUrl}
                  alt="Student"
                  className="max-w-[80px] max-h-[80px] rounded-lg mt-3 border border-slate-200 dark:border-slate-800"
                />
              )}
            </div>
          )}
          {faceResult.detail && (
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-2 font-medium">{faceResult.detail}</p>
          )}
        </div>
      )}

      <div className="card mt-6">
        <h2 className="text-lg font-bold mb-4">Recent verifications</h2>
        {recent.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 py-4 text-center">No verification events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 font-medium">When</th>
                  <th className="py-3 font-medium">Result</th>
                  <th className="py-3 font-medium">Score</th>
                  <th className="py-3 font-medium">Student</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {recent.map((r) => {
                  const b = RESULT_LABELS[r.result];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 text-slate-500 dark:text-slate-400">{new Date(r.capturedAt).toLocaleString()}</td>
                      <td className="py-3">
                        <span style={{ background: b?.bg ?? "#64748b", color: b?.color ?? "#fff" }} className="px-2 py-1 rounded text-xs font-bold tracking-wide">
                          {b?.label ?? r.result}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-700 dark:text-slate-300">{r.matchScore?.toFixed(1) ?? "—"}</td>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        {r.student.matricNo} <span className="text-slate-500 dark:text-slate-400 font-normal">— {r.student.fullName}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
