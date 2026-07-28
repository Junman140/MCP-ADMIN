import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

type DashboardData = { courseCount: number; totalStudents: number; courses: { id: string; code: string; title: string; studentCount: number }[] };

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => { api<DashboardData>("/lecturer/dashboard").then(setData).catch(() => {}); }, []);

  return (
    <div style={{ maxWidth: 960 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>LMS Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[{ label: "Courses", v: data?.courseCount ?? 0 }, { label: "Students", v: data?.totalStudents ?? 0 }, { label: "Actions", v: "-" }].map((s, i) => (
          <div key={i} style={{ background: "#fff", padding: "1.25rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{s.label}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>{s.v}</p>
          </div>
        ))}
      </div>
      {data?.courses && data.courses.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>My Courses</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {data.courses.map(c => (
              <div key={c.id} style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{c.code}</p>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.25rem 0" }}>{c.title}</p>
                <p style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{c.studentCount} students</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {[{ to: "/lms/courses", label: "Course Builder" }, { to: "/lms/assignments", label: "Assignments" }, { to: "/lms/grades", label: "Grade Book" }].map(l => (
          <Link key={l.to} to={l.to} style={{ background: "#fff", padding: "1rem", borderRadius: 8, textDecoration: "none", color: "#1e293b", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <p style={{ fontWeight: 600, margin: 0 }}>{l.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
