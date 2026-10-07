import { Link, useLocation } from "react-router-dom";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import { useState, useEffect } from "react";
import { getUser } from "./api";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  Award,
  QrCode,
  Megaphone,
  MessagesSquare,
  CalendarClock,
  BarChart3,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@bio/ui";

const nav = [
  { label: "Dashboard", href: "/lms", icon: LayoutDashboard },
  { label: "Courses", href: "/lms/courses", icon: BookOpen },
  { label: "Quizzes", href: "/lms/quizzes", icon: ClipboardList },
  { label: "Assignments", href: "/lms/assignments", icon: FileText },
  { label: "Grades", href: "/lms/grades", icon: Award },
  { label: "Attendance", href: "/lms/attendance", icon: QrCode },
  { label: "Announcements", href: "/lms/announcements", icon: Megaphone },
  { label: "Forums", href: "/lms/forums", icon: MessagesSquare },
  { label: "Timetable", href: "/lms/timetable", icon: CalendarClock },
  { label: "Analytics", href: "/lms/analytics", icon: BarChart3 },
];

type Theme = "light" | "dark";

export function useTheme(): [Theme, Dispatch<SetStateAction<Theme>>] {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("lec_theme") as Theme) || "light");
  useEffect(() => {
    localStorage.setItem("lec_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return [theme, setTheme];
}

export default function Layout({
  children,
  onLogout,
  theme,
  setTheme,
}: {
  children: ReactNode;
  onLogout: () => void;
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
}) {
  const loc = useLocation();
  const user = getUser();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [loc.pathname]);

  const navLinks = (
    <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
      {nav.map((n) => {
        const active = loc.pathname === n.href;
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            to={n.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-[var(--bio-surface-2)] dark:bg-slate-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--bio-border)] bg-slate-900 md:flex">
        <div className="border-b border-slate-800 p-4">
          <h2 className="text-base font-bold text-white">Lecturer Portal</h2>
          <p className="mt-1 text-xs text-slate-400">{user?.email}</p>
        </div>
        {navLinks}
        <div className="space-y-2 border-t border-slate-800 p-3">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <Button variant="ghost" onClick={onLogout} className="w-full justify-start text-rose-400 hover:bg-rose-950/40">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <span className="text-base font-bold text-white">Lecturer Portal</span>
              <button onClick={() => setOpen(false)} className="text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            {navLinks}
            <div className="space-y-2 border-t border-slate-800 p-3">
              <Button variant="ghost" onClick={onLogout} className="w-full justify-start text-rose-400 hover:bg-rose-950/40">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-[var(--bio-border)] bg-[var(--bio-surface)] px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} className="text-slate-600 dark:text-slate-300">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-brand-600 dark:text-brand-400">Lecturer Portal</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
