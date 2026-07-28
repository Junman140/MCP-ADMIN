import { useEffect, useState } from "react";
import { api } from "../api";

type Quiz = { id: string; title: string; courseId: string; questionCount: number };

export default function QuizBuilder() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api<Quiz[]>("/quizzes")
      .then(setQuizzes)
      .catch(() => setError("Failed to load quizzes"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createQuiz() {
    if (!title.trim() || !courseId.trim()) return;
    try {
      setError("");
      await api("/quizzes", { method: "POST", body: JSON.stringify({ title: title.trim(), courseId: courseId.trim() }) });
      setTitle("");
      setCourseId("");
      load();
    } catch { setError("Failed to create quiz"); }
  }

  async function deleteQuiz(id: string) {
    try {
      setError("");
      await api(`/quizzes/${id}`, { method: "DELETE" });
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch { setError("Failed to delete quiz"); }
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", width: "100%",
  };
  const btnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem",
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Quiz Builder</h1>
      {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.5rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}
      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Create Quiz</h3>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} placeholder="Quiz title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          </div>
          <button onClick={createQuiz} style={btnStyle}>Create</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>Quizzes</div>
        {loading && <p style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
        {!loading && quizzes.length === 0 && <p style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>No quizzes found</p>}
        {quizzes.map(q => (
          <div key={q.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{q.title}</p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Course: {q.courseId} &middot; {q.questionCount ?? 0} questions</p>
            </div>
            <button onClick={() => deleteQuiz(q.id)}
              style={{ background: "transparent", border: "1px solid #fecaca", color: "#dc2626", padding: "0.3rem 0.75rem", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem" }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
