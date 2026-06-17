import { useEffect, useState } from "react";
import { api } from "../../api";
import { Plus, MessageSquare, Pin, Trash2, Lock } from "lucide-react";

type Forum = { id: string; courseId: string; title: string; isLocked: boolean; isModerated: boolean };
type Post = { id: string; forumId: string; content: string; authorRole: string; isPinned: boolean; createdAt: string };

export default function ForumModeration() {
  const [courses, setCourses] = useState<{ id: string; code: string; title: string }[]>([]);
  const [forums, setForums] = useState<Forum[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedForum, setSelectedForum] = useState("");
  const [newForumTitle, setNewForumTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => { api<{ id: string; code: string; title: string }[]>("/courses").then(setCourses).catch(() => {}); }, []);

  async function loadForums() {
    const q = selectedCourse ? `?courseId=${selectedCourse}` : "";
    api<Forum[]>(`/forums${q}`).then(setForums).catch(() => {});
  }
  useEffect(() => { loadForums(); }, [selectedCourse]);

  async function loadPosts(forumId: string) {
    setSelectedForum(forumId);
    api<Post[]>(`/forums/${forumId}/posts`).then(setPosts).catch(() => {});
  }

  async function createForum() {
    if (!newForumTitle || !selectedCourse) return;
    await api("/forums", { method: "POST", body: JSON.stringify({ courseId: selectedCourse, title: newForumTitle }) });
    setNewForumTitle("");
    loadForums();
  }

  async function deletePost(id: string) {
    await api(`/posts/${id}`, { method: "DELETE" });
    selectedForum && loadPosts(selectedForum);
  }

  async function togglePin(id: string) {
    await api(`/posts/${id}/pin`, { method: "POST" });
    selectedForum && loadPosts(selectedForum);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Discussion Forums</h1>

      <div className="flex gap-2">
        <select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
        </select>
        {selectedCourse && (
          <>
            <input className="input flex-1" placeholder="New forum title" value={newForumTitle} onChange={(e) => setNewForumTitle(e.target.value)} />
            <button className="btn-primary flex items-center gap-1" onClick={createForum}><Plus className="w-4 h-4" /> Create</button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h2 className="text-lg font-bold">Forums</h2>
          {forums.map((f) => (
            <div key={f.id} className={`card p-3 cursor-pointer ${selectedForum === f.id ? "border-sky-500" : ""}`} onClick={() => loadPosts(f.id)}>
              <div className="flex items-center gap-2">
                {f.isLocked && <Lock className="w-4 h-4 text-amber-500" />}
                <span className="font-semibold">{f.title}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-lg font-bold">Posts</h2>
          {posts.map((p) => (
            <div key={p.id} className={`card p-3 ${p.isPinned ? "border-amber-400" : ""}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    {p.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                    <span className="text-xs text-slate-400">{p.authorRole}</span>
                    <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm mt-1">{p.content}</p>
                </div>
                <div className="flex gap-1">
                  <button className="text-slate-400 hover:text-amber-500 text-xs" onClick={() => togglePin(p.id)}>
                    {p.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button className="text-red-400 hover:text-red-600" onClick={() => deletePost(p.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {selectedForum && posts.length === 0 && <p className="text-sm text-slate-400">No posts yet</p>}
        </div>
      </div>
    </div>
  );
}
