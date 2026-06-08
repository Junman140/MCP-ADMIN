import { NavLink, Outlet } from "react-router-dom";
import { Settings } from "lucide-react";

export default function SettingsLayout() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-500" /> Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure global settings, devices, and catalogs.</p>
      </div>

      <nav className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { to: "/settings/catalog", label: "Catalog" },
          { to: "/settings/sessions", label: "Sessions" },
          { to: "/settings/registrations", label: "Course Regs" },
          { to: "/settings/devices", label: "Devices" },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "bg-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </>
  );
}
