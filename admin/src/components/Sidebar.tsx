import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Fingerprint,
  CheckSquare,
  Smartphone,
  BookOpen,
  ClipboardList,
  Activity,
  BarChart3,
  Settings,
  Calendar,
  FileBarChart,
  Bell,
  PenSquare,
  Sparkles,
  FileText,
  Award,
  CalendarCheck,
  Megaphone,
  MessageSquare,
  CalendarClock,
  TrendingUp,
} from "lucide-react";

export default function Sidebar() {
  const { pathname } = useLocation();

  const navGroups = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
      ],
    },
    {
      title: "Biometric",
      items: [
        { label: "Directory", href: "/students", icon: Users },
        { label: "Enrollment", href: "/registration", icon: Fingerprint },
        { label: "Verify", href: "/verify", icon: CheckSquare },
        { label: "Devices", href: "/settings/devices", icon: Smartphone },
      ],
    },
    {
      title: "CBT",
      items: [
        { label: "CBT Dashboard", href: "/cbt", icon: BarChart3 },
        { label: "Exams Roster", href: "/exams", icon: BookOpen },
        { label: "CBT Management", href: "/cbt/manage", icon: ClipboardList },
        { label: "CBT Marking", href: "/cbt/marking", icon: PenSquare },
        { label: "AI Generator", href: "/cbt/questions", icon: Sparkles },
      ],
    },
    {
      title: "LMS",
      items: [
        { label: "Course Builder", href: "/lms/courses", icon: BookOpen },
        { label: "Quizzes", href: "/lms/quizzes", icon: ClipboardList },
        { label: "Assignments", href: "/lms/assignments", icon: FileText },
        { label: "Grade Book", href: "/lms/grades", icon: Award },
        { label: "Attendance", href: "/lms/attendance", icon: CalendarCheck },
        { label: "Announcements", href: "/lms/announcements", icon: Megaphone },
        { label: "Discussions", href: "/lms/forums", icon: MessageSquare },
        { label: "Timetable", href: "/lms/timetable", icon: CalendarClock },
        { label: "LMS Analytics", href: "/lms/analytics", icon: TrendingUp },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Catalog", href: "/settings/catalog", icon: Settings },
        { label: "Sessions", href: "/settings/sessions", icon: Calendar },
        { label: "Reports", href: "/reports", icon: FileBarChart },
        { label: "Notifications", href: "/notifications", icon: Bell },
      ],
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-sky-600 dark:text-sky-400">
          Edu<span className="text-slate-900 dark:text-white">Admin</span>
        </h1>
      </div>
      
      <div className="flex-1 px-4 space-y-6 pb-8">
        {navGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
              {group.title}
            </h2>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
