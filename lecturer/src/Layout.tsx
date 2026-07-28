import { Link, useLocation } from "react-router-dom";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import { getUser } from "./api";

const nav = [
  { label: "Dashboard", href: "/lms" },
  { label: "Courses", href: "/lms/courses" },
  { label: "Quizzes", href: "/lms/quizzes" },
  { label: "Assignments", href: "/lms/assignments" },
  { label: "Grades", href: "/lms/grades" },
  { label: "Attendance", href: "/lms/attendance" },
  { label: "Announcements", href: "/lms/announcements" },
  { label: "Forums", href: "/lms/forums" },
  { label: "Timetable", href: "/lms/timetable" },
  { label: "Analytics", href: "/lms/analytics" },
];

type Theme = "light" | "dark";

const colors: Record<Theme, { bg: string; sidebar: string; text: string; sub: string; hover: string; accent: string; border: string; main: string }> = {
  light: { bg: "#f1f5f9", sidebar: "#1e293b", text: "#0f172a", sub: "#94a3b8", hover: "#334155", accent: "#3b82f6", border: "#334155", main: "#f8fafc" },
  dark: { bg: "#0f172a", sidebar: "#020617", text: "#f1f5f9", sub: "#64748b", hover: "#1e293b", accent: "#60a5fa", border: "#1e293b", main: "#0f172a" },
};

export function useTheme(): [Theme, Dispatch<SetStateAction<Theme>>] {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("lec_theme") as Theme) || "light");
  useEffect(() => { localStorage.setItem("lec_theme", theme); }, [theme]);
  return [theme, setTheme];
}

import { useState, useEffect } from "react";

export default function Layout({ children, onLogout, theme, setTheme }: { children: ReactNode; onLogout: () => void; theme: Theme; setTheme: Dispatch<SetStateAction<Theme>> }) {
  const loc = useLocation();
  const user = getUser();
  const c = colors[theme];

  return (
    <div style={{ display: "flex", height: "100vh", background: c.bg, color: c.text, fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ width: 220, background: c.sidebar, color: "#fff", padding: "1rem 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "0 1rem 1rem", borderBottom: `1px solid ${c.border}` }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Lecturer Portal</h2>
          <p style={{ fontSize: "0.7rem", color: c.sub, margin: "4px 0 0" }}>{user?.email}</p>
        </div>
        <nav style={{ flex: 1, padding: "0.5rem 0", overflowY: "auto" }}>
          {nav.map((n) => (
            <Link key={n.href} to={n.href}
              style={{
                display: "block", padding: "0.5rem 1rem", margin: "0 0.5rem", borderRadius: 6,
                background: loc.pathname === n.href ? c.hover : "transparent",
                color: loc.pathname === n.href ? "#fff" : c.sub, textDecoration: "none", fontSize: "0.85rem",
                transition: "all 0.15s",
              }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "0.5rem 1rem", borderTop: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} style={{
            background: theme === "dark" ? c.accent : c.border, border: "none", borderRadius: 14, width: 40, height: 22, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: theme === "dark" ? "flex-end" : "flex-start", padding: 2, transition: "all 0.3s"
          }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff" }} />
          </button>
          <span style={{ fontSize: "0.7rem", color: c.sub }}>{theme === "dark" ? "Dark" : "Light"}</span>
        </div>
        <button onClick={onLogout} style={{ margin: "0.5rem 1rem", padding: "0.5rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 }}>Sign Out</button>
      </aside>
      <main style={{ flex: 1, overflow: "auto", padding: "1.5rem", background: c.main }}>
        {children}
      </main>
    </div>
  );
}
