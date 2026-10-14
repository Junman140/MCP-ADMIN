import { useEffect, useState } from "react";
import { api } from "../api";
import { Send, Megaphone, Trash2 } from "lucide-react";
import { Button, Card, Input, PageHeader, Textarea } from "@bio/ui";

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

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Post updates to students across your courses." />

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>
      )}

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <Send className="h-4 w-4 text-brand-500" /> New Announcement
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input className="sm:col-span-2" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <Input placeholder="Course ID (optional)" value={courseId} onChange={e => setCourseId(e.target.value)} />
          </div>
          <Textarea className="min-h-[80px] resize-y" placeholder="Announcement body" value={body} onChange={e => setBody(e.target.value)} />
          <div className="flex justify-end">
            <Button variant="primary" onClick={createAnnouncement}>
              <Send className="h-4 w-4" /> Post
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <Megaphone className="h-4 w-4 text-brand-500" /> All Announcements
        </h3>
        {loading && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
        {!loading && announcements.length === 0 && <p className="text-sm text-[var(--bio-muted)]">No announcements yet</p>}
        <div className="divide-y divide-[var(--bio-border)]">
          {announcements.map(a => (
            <div key={a.id} className="py-3">
              <div className="mb-1 flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.title}</p>
                <Button
                  variant="ghost"
                  onClick={() => deleteAnnouncement(a.id)}
                  className="shrink-0 px-2 py-1 text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
              <p className="mb-1 text-sm text-slate-600 dark:text-slate-300">{a.body}</p>
              <p className="text-xs text-[var(--bio-muted)]">
                {a.courseId ? `Course: ${a.courseId} · ` : ""}{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
