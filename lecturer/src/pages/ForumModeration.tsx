import { useEffect, useState } from "react";
import { api } from "../api";

type Forum = { id: string; title: string; courseId: string; postCount: number };
type Post = { id: string; content: string; author: string; createdAt: string; pinned: boolean };

export default function ForumModeration() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingForums, setLoadingForums] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState("");
  const [selectedForumId, setSelectedForumId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");

  function loadForums() {
    setLoadingForums(true);
    setError("");
    api<Forum[]>("/forums")
      .then(setForums)
      .catch(() => setError("Failed to load forums"))
      .finally(() => setLoadingForums(false));
  }

  useEffect(() => { loadForums(); }, []);

  function selectForum(id: string) {
    setSelectedForumId(id);
    setLoadingPosts(true);
    setError("");
    api<Post[]>(`/forums/${id}/posts`)
      .then(setPosts)
      .catch(() => setError("Failed to load posts"))
      .finally(() => setLoadingPosts(false));
  }

  async function createForum() {
    if (!title.trim()) return;
    try {
      setError("");
      await api("/forums", { method: "POST", body: JSON.stringify({ title: title.trim(), courseId: courseId.trim() || undefined }) });
      setTitle("");
      setCourseId("");
      loadForums();
    } catch { setError("Failed to create forum"); }
  }

  async function deletePost(id: string) {
    try {
      setError("");
      await api(`/posts/${id}`, { method: "DELETE" });
      setPosts(posts.filter(p => p.id !== id));
    } catch { setError("Failed to delete post"); }
  }

  async function togglePin(id: string) {
    try {
      setError("");
      const updated = await api<Post>(`/posts/${id}/pin`, { method: "POST" });
      setPosts(posts.map(p => p.id === id ? updated : p));
    } catch { setError("Failed to toggle pin"); }
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", width: "100%",
  };
  const btnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap",
  };
  const colStyle: React.CSSProperties = {
    flex: 1, background: "#fff", borderRadius: 8, padding: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "auto", maxHeight: "calc(100vh - 180px)",
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Forum Moderation</h1>
      {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.5rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}

      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Create Forum</h3>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div style={{ flex: 2 }}>
            <input style={inputStyle} placeholder="Forum title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <input style={inputStyle} placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          </div>
          <button onClick={createForum} style={btnStyle}>Create</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={colStyle}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Forums</h3>
          {loadingForums && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
          {!loadingForums && forums.length === 0 && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No forums found</p>}
          {forums.map(f => (
            <div key={f.id} onClick={() => selectForum(f.id)}
              style={{ padding: "0.6rem 0.75rem", borderRadius: 6, cursor: "pointer", marginBottom: 2, background: selectedForumId === f.id ? "#eff6ff" : "transparent", border: selectedForumId === f.id ? "1px solid #bfdbfe" : "1px solid transparent" }}>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>{f.title}</p>
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>Course: {f.courseId} · {f.postCount ?? 0} posts</p>
            </div>
          ))}
        </div>

        <div style={colStyle}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Posts</h3>
          {!selectedForumId && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Select a forum</p>}
          {selectedForumId && loadingPosts && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
          {selectedForumId && !loadingPosts && posts.length === 0 && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No posts yet</p>}
          {selectedForumId && posts.map(p => (
            <div key={p.id} style={{ padding: "0.6rem 0.75rem", borderRadius: 6, marginBottom: 4, border: "1px solid #e2e8f0", background: p.pinned ? "#fffbeb" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                <div>
                  {p.pinned && <span style={{ fontSize: "0.65rem", color: "#d97706", fontWeight: 600, marginRight: "0.5rem" }}>PINNED</span>}
                  <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{p.author}</span>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", marginLeft: "0.5rem" }}>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</span>
                </div>
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  <button onClick={() => togglePin(p.id)}
                    style={{ background: "transparent", border: "1px solid #e2e8f0", color: p.pinned ? "#d97706" : "#64748b", padding: "0.2rem 0.5rem", borderRadius: 4, cursor: "pointer", fontSize: "0.65rem" }}>
                    {p.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button onClick={() => deletePost(p.id)}
                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem" }}>x</button>
                </div>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#475569", margin: 0, lineHeight: 1.4 }}>{p.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
