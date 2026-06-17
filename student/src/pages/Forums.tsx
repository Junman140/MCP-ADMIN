import { useEffect, useState } from "react";
import { api } from "../api";
import { MessageSquare, Send } from "lucide-react";

type Forum = { id: string; title: string; courseId: string };
type Post = { id: string; content: string; authorRole: string; isPinned: boolean; createdAt: string };

export default function Forums() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedForum, setSelectedForum] = useState("");
  const [newPost, setNewPost] = useState("");

  useEffect(() => { api<Forum[]>("/forums").then(setForums).catch(() => {}); }, []);

  async function loadPosts(forumId: string) {
    setSelectedForum(forumId);
    api<Post[]>(`/forums/${forumId}/posts`).then(setPosts).catch(() => {});
  }

  async function createPost() {
    if (!newPost || !selectedForum) return;
    await api(`/forums/${selectedForum}/posts`, { method: "POST", body: JSON.stringify({ content: newPost }) });
    setNewPost("");
    loadPosts(selectedForum);
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-2xl font-bold">Discussion Forums</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          {forums.map((f) => (
            <button key={f.id} onClick={() => loadPosts(f.id)}
              className={`w-full text-left p-3 rounded-lg mb-1 text-sm ${selectedForum === f.id ? "bg-sky-50 border border-sky-300" : "hover:bg-slate-100"}`}>
              <MessageSquare className="w-4 h-4 inline mr-2" />{f.title}
            </button>
          ))}
        </div>
        <div className="lg:col-span-2 space-y-3">
          {selectedForum && (
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Write a post..." value={newPost} onChange={(e) => setNewPost(e.target.value)} />
              <button className="btn-primary flex items-center gap-1" onClick={createPost}><Send className="w-4 h-4" /> Post</button>
            </div>
          )}
          {posts.map((p) => (
            <div key={p.id} className="card p-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>{p.authorRole}</span><span>{new Date(p.createdAt).toLocaleDateString()}</span>
                {p.isPinned && <span className="text-amber-500">Pinned</span>}
              </div>
              <p className="text-sm">{p.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
