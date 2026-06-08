import { useEffect, useState } from "react";
import { api } from "../api";
import { Smartphone, Shield, Clock } from "lucide-react";

type Device = { id: string; name: string; hallLabel: string | null; lastSeenAt: string | null };

export default function Devices() {
  const [list, setList] = useState<Device[]>([]);
  const [name, setName] = useState("Hall A");
  const [hall, setHall] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const rows = await api<Device[]>("/devices");
    setList(rows);
  }

  useEffect(() => {
    load().catch((e) => setErr(String(e)));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSecret(null);
    try {
      const res = await api<{ id: string; apiKey: string }>("/devices", {
        method: "POST",
        body: JSON.stringify({ name, hallLabel: hall || undefined }),
      });
      setSecret(`${res.id} / ${res.apiKey}`);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function delDevice(id: string) {
    if (!confirm("Remove this device?")) return;
    setErr(null);
    try {
      await api(`/devices/${id}`, { method: "DELETE" });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Devices</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage biometric capture devices and their API keys.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Register New Device</h2>
            <form onSubmit={create}>
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Front Gate Terminal" />
              <label className="mt-4">Hall label (optional)</label>
              <input value={hall} onChange={(e) => setHall(e.target.value)} placeholder="e.g. Hall A" />
              {err && <p className="error mt-4">{err}</p>}
              {secret && (
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
                  <p className="text-emerald-700 dark:text-emerald-400 font-bold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Device API Key (Show once!)
                  </p>
                  <code className="block bg-white dark:bg-slate-950 p-2 rounded text-sm text-emerald-600 dark:text-emerald-400 break-all border border-emerald-100 dark:border-emerald-900/50">
                    {secret}
                  </code>
                </div>
              )}
              <div className="mt-6">
                <button type="submit" className="w-full">Register device</button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden h-full">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold m-0">Registered Devices</h2>
            </div>
            
            <div className="overflow-x-auto">
              {list.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <Smartphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p>No devices registered yet.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-5 font-medium">Device / Hall</th>
                      <th className="py-3 px-5 font-medium">Status</th>
                      <th className="py-3 px-5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {list.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-5">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-slate-400" />
                            {d.name}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 mt-1 ml-6">{d.hallLabel || "No Hall"}</div>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Last seen: {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : "Never"}
                          </div>
                        </td>
                        <td className="py-3 px-5 flex justify-end">
                          <button type="button" className="secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => delDevice(d.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
