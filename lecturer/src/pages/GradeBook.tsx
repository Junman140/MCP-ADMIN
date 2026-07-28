import { useEffect, useState } from "react";
import { api } from "../api";

type Grade = { id: string; studentId: string; studentName: string; courseId: string; score: number; grade: string; approved: boolean };

export default function GradeBook() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [score, setScore] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api<Grade[]>("/grades")
      .then(setGrades)
      .catch(() => setError("Failed to load grades"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createGrade() {
    if (!studentId.trim() || !courseId.trim() || !score) return;
    try {
      setError("");
      await api("/grades", {
        method: "POST",
        body: JSON.stringify({ studentId: studentId.trim(), courseId: courseId.trim(), score: Number(score) }),
      });
      setStudentId("");
      setCourseId("");
      setScore("");
      load();
    } catch { setError("Failed to create grade"); }
  }

  async function approveGrade(id: string) {
    try {
      setError("");
      await api(`/grades/${id}/approve`, { method: "POST" });
      setGrades(grades.map(g => g.id === id ? { ...g, approved: true } : g));
    } catch { setError("Failed to approve grade"); }
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", width: "100%",
  };
  const btnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap",
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Grade Book</h1>
      {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.5rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}
      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Add Grade</h3>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} type="number" placeholder="Score (%)" value={score} onChange={e => setScore(e.target.value)} min="0" max="100" />
          </div>
          <button onClick={createGrade} style={btnStyle}>Add</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>Grades</div>
        {loading && <p style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
        {!loading && grades.length === 0 && <p style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>No grades found</p>}
        {grades.map(g => (
          <div key={g.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{g.studentName || g.studentId}</p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>
                Course: {g.courseId} · Score: {g.score}% · Grade: {g.grade || "—"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {g.approved
                ? <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>Approved</span>
                : (<button onClick={() => approveGrade(g.id)}
                    style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "0.3rem 0.75rem", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem" }}>Approve</button>)
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
