import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import { BookOpen, Users, Wrench, ArrowRight } from "lucide-react";
import { Card, PageHeader, StatCard } from "@bio/ui";

type DashboardData = {
  courseCount: number;
  totalStudents: number;
  courses: { id: string; code: string; title: string; studentCount: number }[];
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api<DashboardData>("/lecturer/dashboard")
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="LMS Dashboard" subtitle="Overview of your courses and quick actions." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Courses" value={data?.courseCount ?? 0} />
        <StatCard label="Students" value={data?.totalStudents ?? 0} />
        <StatCard label="Published items" value="—" />
      </div>

      {data?.courses && data.courses.length > 0 && (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <BookOpen className="h-5 w-5 text-brand-500" /> My Courses
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.courses.map((c) => (
              <div key={c.id} className="rounded-lg border border-[var(--bio-border)] p-4">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{c.code}</p>
                <p className="mt-0.5 text-sm text-[var(--bio-muted)]">{c.title}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-[var(--bio-muted)]">
                  <Users className="h-3.5 w-3.5" /> {c.studentCount} students
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { to: "/lms/courses", label: "Course Builder", icon: BookOpen },
          { to: "/lms/assignments", label: "Assignments", icon: Wrench },
          { to: "/lms/grades", label: "Grade Book", icon: BookOpen },
        ].map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className="card flex items-center justify-between transition-colors hover:border-brand-300"
            >
              <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                <Icon className="h-4 w-4 text-brand-500" /> {l.label}
              </span>
              <ArrowRight className="h-4 w-4 text-[var(--bio-muted)]" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
