import { useEffect, useState } from "react";
import { api } from "../../api";
import { Plus, Save, Trash2, X, CreditCard } from "lucide-react";

interface FeeConfig {
  id: string;
  feeType: string;
  label: string;
  amount: number;
  serviceFee: number;
  academicSessionId?: string;
  level?: string;
  departmentId?: string;
  isActive: boolean;
}

export default function FeeConfigs() {
  const [configs, setConfigs] = useState<FeeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Partial<FeeConfig> | null>(null);

  const fetch = () => {
    setLoading(true);
    api<FeeConfig[]>("/payments/fee-configs")
      .then(setConfigs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const saveConfig = async () => {
    if (!editing) return;
    setLoading(true);
    setError("");
    try {
      if (editing.id) {
        await api(`/payments/fee-configs/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(editing),
        });
      } else {
        await api("/payments/fee-configs", {
          method: "POST",
          body: JSON.stringify(editing),
        });
      }
      setEditing(null);
      fetch();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fee Configuration</h1>
        <button
          onClick={() => setEditing({ feeType: "school_fees", label: "", amount: 0, serviceFee: 500, isActive: true })}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700"
        >
          <Plus className="w-4 h-4" /> Add Fee Config
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {editing && (
        <div className="card mb-6 border-2 border-sky-200">
          <h2 className="font-semibold mb-4">{editing.id ? "Edit" : "New"} Fee Configuration</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fee Type</label>
              <select
                value={editing.feeType || "school_fees"}
                onChange={(e) => setEditing({ ...editing, feeType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="school_fees">School Fees</option>
                <option value="course_registration">Course Registration</option>
                <option value="departmental_dues">Departmental Dues</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Label</label>
              <input
                value={editing.label || ""}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                placeholder="e.g. 2024/2025 First Semester Fees"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fee Amount (₦)</label>
              <input
                type="number"
                value={editing.amount || 0}
                onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Fee (₦)</label>
              <input
                type="number"
                value={editing.serviceFee || 0}
                onChange={(e) => setEditing({ ...editing, serviceFee: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Level (optional)</label>
              <input
                value={editing.level || ""}
                onChange={(e) => setEditing({ ...editing, level: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                placeholder="e.g. 100, 200, 300"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.isActive !== false}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  className="rounded"
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveConfig} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-400">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 py-8 text-center">Loading...</p>
      ) : configs.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">No fee configurations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-500">Label</th>
                <th className="text-left p-3 text-sm font-medium text-slate-500">Type</th>
                <th className="text-right p-3 text-sm font-medium text-slate-500">Fee (₦)</th>
                <th className="text-right p-3 text-sm font-medium text-slate-500">Service Fee (₦)</th>
                <th className="text-right p-3 text-sm font-medium text-slate-500">Total (₦)</th>
                <th className="text-center p-3 text-sm font-medium text-slate-500">Status</th>
                <th className="text-right p-3 text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {configs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 text-sm font-medium">{c.label}</td>
                  <td className="p-3 text-sm capitalize text-slate-500">{c.feeType.replace(/_/g, " ")}</td>
                  <td className="p-3 text-sm text-right font-mono">{c.amount.toLocaleString()}</td>
                  <td className="p-3 text-sm text-right font-mono">{c.serviceFee.toLocaleString()}</td>
                  <td className="p-3 text-sm text-right font-mono font-bold">{(c.amount + c.serviceFee).toLocaleString()}</td>
                  <td className="p-3 text-sm text-center">
                    {c.isActive ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">Inactive</span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-right">
                    <button
                      onClick={() => setEditing(c)}
                      className="px-3 py-1 bg-sky-50 text-sky-700 rounded text-xs hover:bg-sky-100"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
