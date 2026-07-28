import { useEffect, useState } from "react";
import { api } from "../api";

type Assignment = { id: string; title: string; courseId: string; dueDate: string; submissions: number };

export default function AssignmentManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api<Assignment[]>("/assignments")
      .then(setAssignments)
      .catch(() => setError("Failed to load assignments"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createAssignment() {
    if (!title.trim() || !courseId.trim()) return;
    try {
      setError("");
      await api("/assignments", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), courseId: courseId.trim(), dueDate: dueDate || undefined }),
      });
      setTitle("");
      setCourseId("");
      setDueDate("");
      load();
    } catch { setError("Failed to create assignment"); }
  }

  async function deleteAssignment(id: string) {
    try {
      setError("");
      await api(`/assignments/${id}`, { method: "DELETE" });
      setAssignments(assignments.filter(a => a.id !== id));
    } catch { setError("Failed to delete assignment"); }
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", width: "100%",
  };
  const btnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap",
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Assignment Manager</h1>
      {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.5rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}
      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Create Assignment</h3>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div style={{ flex: 2 }}>
            <input style={inputStyle} placeholder="Assignment title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <button onClick={createAssignment} style={btnStyle}>Create</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>Assignments</div>
        {loading && <p style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
        {!loading && assignments.length === 0 && <p style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>No assignments found</p>}
        {assignments.map(a => (
          <div key={a.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{a.title}</p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>
                Course: {a.courseId} {a.dueDate && ` · Due: ${new Date(a.dueDate).toLocaleDateString()}`} · {a.submissions ?? 0} submissions
              </p>
            </div>
            <button onClick={() => deleteAssignment(a.id)}
              style={{ background: "transparent", border: "1px solid #fecaca", color: "#dc2626", padding: "0.3rem 0.75rem", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem" }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
