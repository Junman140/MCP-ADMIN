import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, ClipboardList, Award, MessageSquare, CalendarClock, QrCode, Bell, LogOut, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api";

export default function StudentLayout({ onLogout }: { onLogout: () => void }) {
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const poll = () => {
      api<{ count: number }>("/notifications/unread-count").then((r) => setUnreadCount(r.count)).catch(() => {});
    };
    poll();
    const timer = setInterval(poll, 30000);
    return () => clearInterval(timer);
  }, []);

  const links = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/assessments", icon: ClipboardList, label: "Assessments" },
    { href: "/grades", icon: Award, label: "Grades" },
    { href: "/forums", icon: MessageSquare, label: "Forums" },
    { href: "/messages", icon: Bell, label: "Messages", badge: unreadCount },
    { href: "/timetable", icon: CalendarClock, label: "Timetable" },
    { href: "/attendance", icon: QrCode, label: "Attendance" },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 font-bold text-sky-600 text-xl">Student Portal</div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link key={l.href} to={l.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-100"}`}>
                <Icon className="w-4 h-4" />{l.label}
                {l.badge && l.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{l.badge > 99 ? "99+" : l.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-2 m-3 p-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">
          <LogOut className="w-4 h-4" />Sign out
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
    </div>
  );
}
