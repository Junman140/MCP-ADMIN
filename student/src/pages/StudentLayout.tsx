import { Outlet, Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Award,
  MessageSquare,
  CalendarClock,
  QrCode,
  Bell,
  LogOut,
  LayoutDashboard,
  Settings2,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api";
import { Badge, Button } from "@bio/ui";

export default function StudentLayout({ onLogout }: { onLogout: () => void }) {
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const poll = () => {
      api<{ count: number }>("/notifications/unread-count")
        .then((r) => setUnreadCount(r.count))
        .catch(() => {});
    };
    poll();
    const timer = setInterval(poll, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/payments", icon: CreditCard, label: "Payments" },
    { href: "/assessments", icon: ClipboardList, label: "Assessments" },
    { href: "/grades", icon: Award, label: "Grades" },
    { href: "/forums", icon: MessageSquare, label: "Forums" },
    { href: "/messages", icon: Bell, label: "Messages", badge: unreadCount },
    { href: "/timetable", icon: CalendarClock, label: "Timetable" },
    { href: "/attendance", icon: QrCode, label: "Attendance" },
    { href: "/settings", icon: Settings2, label: "Settings" },
  ];

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
      {links.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            to={l.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{l.label}</span>
            {l.badge && l.badge > 0 && (
              <Badge tone="red">{l.badge > 99 ? "99+" : l.badge}</Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-[var(--bio-surface-2)] dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--bio-border)] bg-[var(--bio-surface)] dark:bg-slate-900">
        <div className="flex items-center gap-2 p-4 font-bold text-brand-600 dark:text-brand-400 text-lg">
          <BookOpen className="w-5 h-5" /> Student Portal
        </div>
        {nav}
        <Button variant="ghost" onClick={onLogout} className="m-3 justify-start text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40">
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col bg-[var(--bio-surface)] shadow-pop">
            <div className="flex items-center justify-between p-4 font-bold text-brand-600 text-lg">
              <span className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Portal</span>
              <button onClick={() => setOpen(false)} className="text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            {nav}
            <Button variant="ghost" onClick={onLogout} className="m-3 justify-start text-rose-500 hover:bg-rose-50">
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-[var(--bio-border)] bg-[var(--bio-surface)] px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} className="text-slate-600 dark:text-slate-300">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-brand-600 dark:text-brand-400">Student Portal</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
