import { useEffect, useState } from "react";
import { api } from "../../api";
import { Link } from "react-router-dom";

export default function LecturerDashboard() {
  type Workload = { activeCourses: number; totalStudents: number; pendingGrading: number; teachingHours: number };
  const [data, setData] = useState<Workload | null>(null);

  useEffect(() => {
    api<Workload>("/lecturer/workload").then(setData).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">LMS Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Courses", value: data?.activeCourses ?? 0 },
          { label: "Students", value: data?.totalStudents ?? 0 },
          { label: "Pending Grading", value: data?.pendingGrading ?? 0 },
          { label: "Teaching Hours", value: data?.teachingHours ?? 0 },
        ].map((s, i) => (
          <div key={i} className="card p-4">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
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
