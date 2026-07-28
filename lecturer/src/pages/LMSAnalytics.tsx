import { useEffect, useState } from "react";
import { api } from "../api";

type AtRiskStudent = { studentId: string; studentName: string; courseId: string; riskScore: number; reason: string };
type EngagementData = { courseId: string; attendanceRate: number; submissionRate: number; avgSessionMinutes: number };
type GradeDistribution = { courseId: string; A: number; B: number; C: number; D: number; F: number; total: number };

export default function LMSAnalytics() {
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [distribution, setDistribution] = useState<GradeDistribution | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(true);
  const [loadingEng, setLoadingEng] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  const [error, setError] = useState("");
  const [engCourseId, setEngCourseId] = useState("");
  const [distCourseId, setDistCourseId] = useState("");

  useEffect(() => {
    api<AtRiskStudent[]>("/analytics/at-risk")
      .then(setAtRisk)
      .catch(() => setError("Failed to load at-risk data"))
      .finally(() => setLoadingRisk(false));
  }, []);

  function loadEngagement() {
    if (!engCourseId.trim()) return;
    setLoadingEng(true);
    setError("");
    api<EngagementData>(`/analytics/engagement/${engCourseId.trim()}`)
      .then(setEngagement)
      .catch(() => setError("Failed to load engagement data"))
      .finally(() => setLoadingEng(false));
  }

  function loadDistribution() {
    if (!distCourseId.trim()) return;
    setLoadingDist(true);
    setError("");
    api<GradeDistribution>(`/analytics/grade-distribution/${distCourseId.trim()}`)
      .then(setDistribution)
      .catch(() => setError("Failed to load grade distribution"))
      .finally(() => setLoadingDist(false));
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", width: "100%",
  };
  const btnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap",
  };
  const cardStyle: React.CSSProperties = {
    background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "1.5rem",
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>LMS Analytics</h1>
      {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.5rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}

      <div style={cardStyle}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>At-Risk Students</h3>
        {loadingRisk && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
        {!loadingRisk && atRisk.length === 0 && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No at-risk students identified</p>}
        {atRisk.map((s, i) => (
          <div key={i} style={{ padding: "0.6rem 0.75rem", borderRadius: 6, marginBottom: 4, background: s.riskScore >= 70 ? "#fef2f2" : "#fffbeb", border: "1px solid #fecaca" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontWeight: 600, fontSize: "0.85rem", margin: 0 }}>{s.studentName || s.studentId}</p>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: 10, background: s.riskScore >= 70 ? "#fee2e2" : "#fef3c7", color: s.riskScore >= 70 ? "#dc2626" : "#d97706" }}>
                Risk: {s.riskScore}%
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>Course: {s.courseId} · {s.reason}</p>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Course Engagement</h3>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} placeholder="Course ID" value={engCourseId} onChange={e => setEngCourseId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loadEngagement()} />
          </div>
          <button onClick={loadEngagement} style={btnStyle}>Load</button>
        </div>
        {loadingEng && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
        {engagement && !loadingEng && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {[["Attendance", `${engagement.attendanceRate}%`], ["Submission Rate", `${engagement.submissionRate}%`], ["Avg Session", `${engagement.avgSessionMinutes} min`]].map(([l, v], i) => (
              <div key={i} style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: 6, textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>{l}</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#2563eb" }}>{v}</p>
              </div>
            ))}
          </div>
        )}
        {!engagement && !loadingEng && engCourseId && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No data loaded</p>}
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Grade Distribution</h3>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} placeholder="Course ID" value={distCourseId} onChange={e => setDistCourseId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loadDistribution()} />
          </div>
          <button onClick={loadDistribution} style={btnStyle}>Load</button>
        </div>
        {loadingDist && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
        {distribution && !loadingDist && (
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              {(["A", "B", "C", "D", "F"] as const).map(g => {
                const count = distribution[g] || 0;
                const pct = distribution.total > 0 ? Math.round((count / distribution.total) * 100) : 0;
                const colors: Record<string, string> = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#ea580c", F: "#dc2626" };
                return (
                  <div key={g} style={{ flex: 1, textAlign: "center", background: "#f8fafc", padding: "0.75rem 0.5rem", borderRadius: 6 }}>
                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 0.25rem" }}>Grade {g}</p>
                    <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: colors[g] }}>{count}</p>
                    <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, marginTop: "0.25rem", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: colors[g], borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: "0.65rem", color: "#94a3b8", margin: "0.15rem 0 0" }}>{pct}%</p>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.5rem", textAlign: "right" }}>Total: {distribution.total} students</p>
          </div>
        )}
        {!distribution && !loadingDist && distCourseId && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No data loaded</p>}
      </div>
    </div>
  );
}
