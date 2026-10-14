import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, MessagesSquare, MessageSquare, Pin, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, PageHeader } from "@bio/ui";

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

  return (
    <div className="space-y-6">
      <PageHeader title="Forum Moderation" subtitle="Manage course forums, pin posts, and moderate content." />

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>
      )}

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <Plus className="h-4 w-4 text-brand-500" /> Create Forum
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          <Input className="sm:col-span-2" placeholder="Forum title" value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          <Button variant="primary" onClick={createForum} className="sm:col-span-3">Create</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            <MessagesSquare className="h-4 w-4 text-brand-500" /> Forums
          </h3>
          {loadingForums && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
          {!loadingForums && forums.length === 0 && <p className="text-sm text-[var(--bio-muted)]">No forums found</p>}
          <div className="max-h-[calc(100vh-260px)] space-y-1 overflow-y-auto">
            {forums.map(f => (
              <button
                key={f.id}
                onClick={() => selectForum(f.id)}
                className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                  selectedForumId === f.id
                    ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/30"
                    : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{f.title}</p>
                <p className="text-xs text-[var(--bio-muted)]">Course: {f.courseId} · {f.postCount ?? 0} posts</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            <MessageSquare className="h-4 w-4 text-brand-500" /> Posts
          </h3>
          {!selectedForumId && <p className="text-sm text-[var(--bio-muted)]">Select a forum</p>}
          {selectedForumId && loadingPosts && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
          {selectedForumId && !loadingPosts && posts.length === 0 && <p className="text-sm text-[var(--bio-muted)]">No posts yet</p>}
          <div className="max-h-[calc(100vh-260px)] space-y-2 overflow-y-auto">
            {selectedForumId && posts.map(p => (
              <div
                key={p.id}
                className={`rounded-lg border p-3 ${
                  p.pinned
                    ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20"
                    : "border-[var(--bio-border)] bg-[var(--bio-surface)]"
                }`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.pinned && <Badge tone="amber"><Pin className="mr-1 h-3 w-3" /> Pinned</Badge>}
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.author}</span>
                    <span className="text-xs text-[var(--bio-muted)]">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="secondary"
                      onClick={() => togglePin(p.id)}
                      className={`px-2 py-1 text-xs ${p.pinned ? "text-amber-600 dark:text-amber-400" : ""}`}
                    >
                      <Pin className="h-3 w-3" /> {p.pinned ? "Unpin" : "Pin"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => deletePost(p.id)}
                      className="px-2 py-1 text-rose-500 hover:text-rose-700 dark:text-rose-400"
                      aria-label="Delete post"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{p.content}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
