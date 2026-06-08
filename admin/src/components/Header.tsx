import { Moon, Sun, LogOut, Bell } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { clearSession, setSelectedTenantId, type TenantRow } from "../api";

interface HeaderProps {
  isSuper: boolean;
  tenantKey: string;
  setTenantKey: (key: string) => void;
  tenants: TenantRow[];
  onLogout: () => void;
  unreadCount: number;
}

export default function Header({
  isSuper,
  tenantKey,
  setTenantKey,
  tenants,
  onLogout,
  unreadCount,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const nav = useNavigate();

  return (
    <header className="h-16 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Placeholder for future breadcrumbs or mobile menu toggle */}
      </div>

      <div className="flex items-center gap-4">
        {isSuper && (
          <select
            value={tenantKey}
            onChange={(e) => {
              setSelectedTenantId(e.target.value || null);
              setTenantKey(e.target.value);
            }}
            className="w-48 bg-slate-100 dark:bg-slate-900 border-none text-sm"
          >
            {tenants.length === 0 ? (
              <option value="">No tenants</option>
            ) : (
              tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))
            )}
          </select>
        )}

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <Link
          to="/notifications"
          className="p-2 rounded-md relative text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-950">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => {
            clearSession();
            onLogout();
            nav("/login");
          }}
          className="p-2 rounded-md bg-transparent text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          title="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
