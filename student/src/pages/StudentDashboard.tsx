import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import { BookOpen, Clock, Bell } from "lucide-react";

type Dashboard = { enrolledCourses: { id: string; code: string; title: string }[]; gpa: number; totalCourses: number; recentAnnouncements: { id: string; title: string; content: string }[]; upcomingDeadlines: { title: string; deadline: string }[] };

export default function StudentDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => { api<Dashboard>("/student/dashboard").then(setData).catch(() => {}); }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-sm text-slate-500">GPA</p><p className="text-3xl font-bold mt-1">{(data?.gpa ?? 0).toFixed(2)}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Courses</p><p className="text-3xl font-bold mt-1">{data?.totalCourses ?? 0}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Deadlines</p><p className="text-3xl font-bold mt-1">{data?.upcomingDeadlines?.length ?? 0}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-sky-500" />My Courses</h2>
          {data?.enrolledCourses?.map((c) => (
            <Link key={c.id} to={`/course/${c.id}`} className="block p-3 rounded-lg hover:bg-sky-50 transition-colors border-b last:border-0">
              <p className="font-semibold">{c.code}</p>
              <p className="text-sm text-slate-500">{c.title}</p>
            </Link>
          ))}
        </div>
        <div className="card">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" />Announcements</h2>
          {data?.recentAnnouncements?.map((a) => (
            <div key={a.id} className="p-3 border-b last:border-0">
              <p className="font-semibold text-sm">{a.title}</p>
              <p className="text-xs text-slate-500">{a.content.slice(0, 100)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
