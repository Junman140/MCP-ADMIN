import { useEffect, useState } from "react";
import { api } from "../api";

type Session = { id: string; date: string; courseId: string; code: string; status: string };
type Report = { present: number; absent: number; late: number; students: { name: string; status: string }[] };

export default function AttendanceManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseId, setCourseId] = useState("");
  const [qrModal, setQrModal] = useState<{ sessionId: string; code: string } | null>(null);
  const [reportModal, setReportModal] = useState<{ sessionId: string; report: Report | null; loading: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    api<Session[]>("/attendance/sessions")
      .then(setSessions)
      .catch(() => setError("Failed to load sessions"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createSession() {
    if (!courseId.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await api("/attendance/sessions", { method: "POST", body: JSON.stringify({ courseId: courseId.trim() }) });
      setCourseId("");
      load();
    } catch { setError("Failed to create session"); }
    finally { setSubmitting(false); }
  }

  async function showQR(sessionId: string) {
    try {
      setError("");
      const data = await api<{ code: string }>(`/attendance/sessions/${sessionId}/qr`);
      setQrModal({ sessionId, code: data.code });
    } catch { setError("Failed to generate QR code"); }
  }

  async function showReport(sessionId: string) {
    setReportModal({ sessionId, report: null, loading: true });
    try {
      setError("");
      const data = await api<Report>(`/attendance/sessions/${sessionId}/report`);
      setReportModal({ sessionId, report: data, loading: false });
    } catch { setError("Failed to load report"); setReportModal(null); }
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", width: "100%",
  };
  const btnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap",
  };
  const secondaryBtnStyle: React.CSSProperties = {
    padding: "0.3rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem", background: "#fff",
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Attendance Manager</h1>
      {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.5rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}

      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Create Session</h3>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          </div>
          <button onClick={createSession} disabled={submitting} style={btnStyle}>
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>Attendance Sessions</div>
        {loading && <p style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
        {!loading && sessions.length === 0 && <p style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>No sessions found</p>}
        {sessions.map(s => (
          <div key={s.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>Course: {s.courseId}</p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>
                {s.date ? new Date(s.date).toLocaleString() : "—"} · Code: {s.code || "—"} · {s.status}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => showQR(s.id)} style={secondaryBtnStyle}>QR</button>
              <button onClick={() => showReport(s.id)} style={secondaryBtnStyle}>Report</button>
            </div>
          </div>
        ))}
      </div>

      {qrModal && (
        <div onClick={() => setQrModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: "2rem", borderRadius: 8, textAlign: "center", minWidth: 280 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Attendance Code</h3>
            <p style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "0.2em", margin: "0 0 1rem", color: "#2563eb" }}>{qrModal.code}</p>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "1rem" }}>Session: {qrModal.sessionId}</p>
            <button onClick={() => setQrModal(null)} style={{ ...btnStyle, background: "#64748b" }}>Close</button>
          </div>
        </div>
      )}

      {reportModal && (
        <div onClick={() => setReportModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: "1.5rem", borderRadius: 8, maxWidth: 500, width: "90%", maxHeight: "80vh", overflow: "auto" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Attendance Report</h3>
            {reportModal.loading && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
            {reportModal.report && (
              <div>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  {[["Present", reportModal.report.present, "#16a34a"], ["Absent", reportModal.report.absent, "#dc2626"], ["Late", reportModal.report.late, "#d97706"]].map(([l, v, c]) => (
                    <div key={l as string} style={{ flex: 1, background: "#f8fafc", padding: "0.75rem", borderRadius: 6, textAlign: "center" }}>
                      <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>{l}</p>
                      <p style={{ fontSize: "1.25rem", fontWeight: 700, color: c as string, margin: 0 }}>{v}</p>
                    </div>
                  ))}
                </div>
                {reportModal.report.students && reportModal.report.students.length > 0 && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                    <thead><tr style={{ borderBottom: "2px solid #e2e8f0" }}><th style={{ padding: "0.5rem", textAlign: "left" }}>Student</th><th style={{ padding: "0.5rem", textAlign: "left" }}>Status</th></tr></thead>
                    <tbody>
                      {reportModal.report.students.map((st, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}><td style={{ padding: "0.5rem" }}>{st.name}</td><td style={{ padding: "0.5rem", color: st.status === "absent" ? "#dc2626" : "#16a34a" }}>{st.status}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            <button onClick={() => setReportModal(null)} style={{ ...btnStyle, background: "#64748b", marginTop: "1rem" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
