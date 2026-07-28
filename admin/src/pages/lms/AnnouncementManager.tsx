import { useEffect, useState } from "react";
import { api } from "../../api";
import { Plus, Megaphone, Trash2, AlertTriangle } from "lucide-react";

type Announcement = { id: string; title: string; body: string; courseId?: string; createdAt: string };

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<{ id: string; code: string; title: string }[]>([]);

  useEffect(() => { api<{ id: string; code: string; title: string }[]>("/courses").then(setCourses).catch(() => {}); }, []);
  useEffect(() => { api<Announcement[]>("/announcements").then(setAnnouncements).catch(() => {}); }, []);

  async function create() {
    if (!title || !body) return;
    await api("/announcements", { method: "POST", body: JSON.stringify({ courseId: courseId || (courses[0]?.id ?? ""), title, body }) });
    setTitle(""); setBody("");
    api<Announcement[]>("/announcements").then(setAnnouncements).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Announcements</h1>
      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-bold">New Announcement</h2>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input" rows={3} placeholder="Content" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex gap-2">
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">All courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={create}><Megaphone className="w-4 h-4 inline" /> Post</button>
      </div>

      <div className="space-y-2">
        {announcements.map((a) => (
          <div key={a.id} className="card p-3 flex justify-between">
            <div>
              <h3 className="font-semibold">{a.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{a.body?.slice(0, 150) ?? ""}</p>
              <p className="text-xs text-slate-400 mt-1">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</p>
            </div>
            <button className="text-red-400 hover:text-red-600" onClick={async () => {
              await api(`/announcements/${a.id}`, { method: "DELETE" });
              api<Announcement[]>("/announcements").then(setAnnouncements).catch(() => {});
            }}><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
