import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import { BookOpen, Bell, CalendarClock } from "lucide-react";
import { Card, PageHeader, StatCard } from "@bio/ui";

type Dashboard = {
  enrolledCourses: { id: string; code: string; title: string }[];
  gpa: number;
  totalCourses: number;
  recentAnnouncements: { id: string; title: string; content: string }[];
  upcomingDeadlines: { title: string; deadline: string }[];
};

export default function StudentDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    api<Dashboard>("/student/dashboard")
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Welcome back" subtitle="Here's a snapshot of your studies." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="GPA" value={(data?.gpa ?? 0).toFixed(2)} />
        <StatCard label="Enrolled courses" value={data?.totalCourses ?? 0} />
        <StatCard label="Upcoming deadlines" value={data?.upcomingDeadlines?.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <BookOpen className="h-5 w-5 text-brand-500" /> My Courses
          </h2>
          {data?.enrolledCourses?.length ? (
            <div className="divide-y divide-[var(--bio-border)]">
              {data.enrolledCourses.map((c) => (
                <Link
                  key={c.id}
                  to={`/course/${c.id}`}
                  className="block rounded-lg px-3 py-3 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20"
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{c.code}</p>
                  <p className="text-sm text-[var(--bio-muted)]">{c.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-[var(--bio-muted)]">No courses enrolled yet.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Bell className="h-5 w-5 text-amber-500" /> Announcements
          </h2>
          {data?.recentAnnouncements?.length ? (
            <div className="divide-y divide-[var(--bio-border)]">
              {data.recentAnnouncements.map((a) => (
                <div key={a.id} className="py-3">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.title}</p>
                  <p className="text-xs text-[var(--bio-muted)]">{a.content.slice(0, 100)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-[var(--bio-muted)]">No announcements.</p>
          )}
        </Card>
      </div>

      {data?.upcomingDeadlines?.length ? (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <CalendarClock className="h-5 w-5 text-brand-500" /> Upcoming Deadlines
          </h2>
          <div className="divide-y divide-[var(--bio-border)]">
            {data.upcomingDeadlines.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-100">{d.title}</span>
                <span className="text-[var(--bio-muted)]">{new Date(d.deadline).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
