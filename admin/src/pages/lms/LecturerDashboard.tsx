import { useEffect, useState } from "react";
import { api } from "../../api";
import { Link } from "react-router-dom";

type DashboardData = {
  courseCount: number;
  totalStudents: number;
  courses: { id: string; code: string; title: string; studentCount: number }[];
};

export default function LecturerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api<DashboardData>("/lecturer/dashboard").then(setData).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">LMS Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Courses", value: data?.courseCount ?? 0 },
          { label: "Total Students", value: data?.totalStudents ?? 0 },
          { label: "Pending Actions", value: "-" },
        ].map((s, i) => (
          <div key={i} className="card p-4">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      {data?.courses && data.courses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">My Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.courses.map((c) => (
              <div key={c.id} className="card p-4">
                <p className="font-semibold">{c.code}</p>
                <p className="text-sm text-slate-500">{c.title}</p>
                <p className="text-xs text-slate-400 mt-1">{c.studentCount} student(s)</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/lms/courses" className="card p-4 hover:border-sky-500 transition-colors">
          <h3 className="font-semibold">Course Builder</h3>
          <p className="text-sm text-slate-500">Manage modules and content</p>
        </Link>
        <Link to="/lms/assignments" className="card p-4 hover:border-emerald-500 transition-colors">
          <h3 className="font-semibold">Assignments</h3>
          <p className="text-sm text-slate-500">Create and grade assignments</p>
        </Link>
        <Link to="/lms/grades" className="card p-4 hover:border-amber-500 transition-colors">
          <h3 className="font-semibold">Grade Book</h3>
          <p className="text-sm text-slate-500">Manage student grades</p>
        </Link>
      </div>
    </div>
  );
}
