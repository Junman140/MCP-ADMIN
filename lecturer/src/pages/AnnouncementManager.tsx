import { useEffect, useState } from "react";
import { api } from "../api";

type Announcement = { id: string; title: string; body: string; courseId: string; createdAt: string };

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [courseId, setCourseId] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api<Announcement[]>("/announcements")
      .then(setAnnouncements)
      .catch(() => setError("Failed to load announcements"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createAnnouncement() {
    if (!title.trim() || !body.trim()) return;
    try {
      setError("");
      await api("/announcements", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), body: body.trim(), courseId: courseId.trim() || undefined }),
      });
      setTitle("");
      setBody("");
      setCourseId("");
      load();
    } catch { setError("Failed to create announcement"); }
  }

  async function deleteAnnouncement(id: string) {
    try {
      setError("");
      await api(`/announcements/${id}`, { method: "DELETE" });
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch { setError("Failed to delete announcement"); }
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", width: "100%",
  };
  const btnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap",
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Announcements</h1>
      {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.5rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}
      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>New Announcement</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 2 }}>
              <input style={inputStyle} placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <input style={inputStyle} placeholder="Course ID (optional)" value={courseId} onChange={e => setCourseId(e.target.value)} />
            </div>
          </div>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="Announcement body" value={body} onChange={e => setBody(e.target.value)} />
          <button onClick={createAnnouncement} style={{ ...btnStyle, alignSelf: "flex-end" }}>Post</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>All Announcements</div>
        {loading && <p style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
        {!loading && announcements.length === 0 && <p style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>No announcements yet</p>}
        {announcements.map(a => (
          <div key={a.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{a.title}</p>
              <button onClick={() => deleteAnnouncement(a.id)}
                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem", padding: "0.25rem" }}>Delete</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#475569", margin: "0 0 0.25rem" }}>{a.body}</p>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: 0 }}>
              {a.courseId ? `Course: ${a.courseId} · ` : ""}{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
