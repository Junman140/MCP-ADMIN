import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  api,
  getSelectedTenantId,
  getUser,
  setSelectedTenantId,
  type TenantRow,
} from "../api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function Layout({ onLogout }: { onLogout: () => void }) {
  const nav = useNavigate();
  const user = getUser();
  const isSuper = user?.role === "SUPER_ADMIN";
  const [tenantKey, setTenantKey] = useState(() => getSelectedTenantId() ?? "");
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [tenantReady, setTenantReady] = useState(!isSuper);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCount = () => {
      api<{ count: number }>("/notifications/unread-count")
        .then(res => setUnreadCount(res.count))
        .catch(() => {});
    };
    fetchCount();
    const timer = setInterval(fetchCount, 30000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (!isSuper) { setTenantReady(true); return; }
    setTenantReady(false);
    api<TenantRow[]>("/tenants")
      .then((list) => {
        setTenants(list);
        let tid = getSelectedTenantId();
        if (!tid && list.length) { tid = list[0].id; setSelectedTenantId(tid); }
        setTenantKey(tid ?? "");
      })
      .catch(() => {})
      .finally(() => setTenantReady(true));
  }, [isSuper]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          isSuper={isSuper} 
          tenantKey={tenantKey} 
          setTenantKey={setTenantKey} 
          tenants={tenants} 
          onLogout={onLogout} 
          unreadCount={unreadCount} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {!tenantReady ? (
              <p className="p-4 text-slate-500">Loading workspace…</p>
            ) : isSuper && tenants.length === 0 ? (
              <div className="card max-w-lg mx-auto mt-8">
                <h2 className="text-xl font-bold mb-2">No tenant yet</h2>
                <p className="text-slate-500">Create a tenant first via <code>POST /tenants</code> or <code>pnpm db:seed</code>, then refresh.</p>
              </div>
            ) : (
              <Outlet key={isSuper ? tenantKey : "default"} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
