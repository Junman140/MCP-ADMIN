import { useEffect, useState } from "react";
import { api } from "../api";
import { Bell, Check, Info, AlertTriangle, XCircle, FileText } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  meta?: any;
};

export default function Notifications() {
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const rows = await api<Notification[]>("/notifications");
      setList(rows);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAsRead(id: string) {
    try {
      await api(`/notifications/${id}/read`, { method: "POST" });
      setList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      alert("Failed to mark as read");
    }
  }

  async function markAllAsRead() {
    try {
      await api("/notifications/read-all", { method: "POST" });
      setList(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      alert("Failed to mark all as read");
    }
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "mismatch": return <AlertTriangle className="w-5 h-5 text-purple-500" />;
      case "error": return <XCircle className="w-5 h-5 text-red-500" />;
      case "system": return <Info className="w-5 h-5 text-sky-500" />;
      case "report": return <FileText className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading notifications...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View alerts and system messages.</p>
        </div>
        {list.some(n => !n.isRead) && (
          <button type="button" className="secondary shrink-0 flex items-center gap-2" onClick={markAllAsRead}>
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {err && <p className="error p-4 bg-red-50 dark:bg-red-500/10 rounded-xl mb-4">{err}</p>}

      <div className="card p-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl">
        {list.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              You don't have any notifications right now. We'll let you know when something needs your attention.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {list.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 transition-colors ${n.isRead ? 'bg-transparent' : 'bg-sky-50/50 dark:bg-sky-900/10'}`}
              >
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    {getIconForType(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className={`text-base m-0 ${n.isRead ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>
                          {n.title}
                        </h3>
                        <p className={`text-sm mt-1 mb-0 ${n.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {n.message}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button 
                          type="button" 
                          className="secondary text-xs px-2 py-1 shrink-0 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700" 
                          onClick={() => markAsRead(n.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 block">
                      {new Date(n.createdAt).toLocaleString(undefined, { 
                        weekday: 'short', month: 'short', day: 'numeric', 
                        hour: 'numeric', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
