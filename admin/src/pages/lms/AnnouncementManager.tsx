import { useEffect, useState } from "react";
import { api } from "../../api";
import { Plus, Megaphone, Trash2, AlertTriangle } from "lucide-react";

type Announcement = { id: string; title: string; content: string; priority: string; targetRole: string; courseId?: string; createdAt: string };

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [targetRole, setTargetRole] = useState("all");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<{ id: string; code: string; title: string }[]>([]);

  useEffect(() => { api<{ id: string; code: string; title: string }[]>("/courses").then(setCourses).catch(() => {}); }, []);
  useEffect(() => { api<Announcement[]>("/announcements").then(setAnnouncements).catch(() => {}); }, []);

  async function create() {
    if (!title || !content) return;
    await api("/announcements", { method: "POST", body: JSON.stringify({ title, content, priority, targetRole, courseId: courseId || undefined }) });
    setTitle(""); setContent("");
    api<Announcement[]>("/announcements").then(setAnnouncements).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Announcements</h1>
      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-bold">New Announcement</h2>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input" rows={3} placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex gap-2">
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
          <select className="input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
            <option value="all">All</option>
            <option value="student">Students only</option>
            <option value="lecturer">Lecturers only</option>
          </select>
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
              <div className="flex items-center gap-2">
                {a.priority === "urgent" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                <h3 className="font-semibold">{a.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${a.priority === "urgent" ? "bg-red-100 text-red-600" : a.priority === "important" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>{a.priority}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{a.content.slice(0, 150)}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
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
