import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { Calendar as CalendarIcon, Lightbulb, RefreshCw, AlertTriangle } from "lucide-react";

type SessionRow = { id: string; label: string };

export default function AcademicSessions() {
  const [list, setList] = useState<SessionRow[]>([]);
  const [label, setLabel] = useState("");
  const [suggested, setSuggested] = useState<string | null>(null);
  const [basedOnCount, setBasedOnCount] = useState(0);
  const [edit, setEdit] = useState<SessionRow | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await api<SessionRow[]>("/academic-sessions");
    setList(rows);
  }, []);

  const loadSuggest = useCallback(async () => {
    const res = await api<{ suggested: string | null; basedOnCount: number }>("/academic-sessions/suggest-next");
    setSuggested(res.suggested);
    setBasedOnCount(res.basedOnCount);
  }, []);

  useEffect(() => {
    Promise.all([load(), loadSuggest()]).catch((e) => setErr(String(e)));
  }, [load, loadSuggest]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api("/academic-sessions", { method: "POST", body: JSON.stringify({ label: label.trim() }) });
      setLabel("");
      await Promise.all([load(), loadSuggest()]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function saveEdit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!edit) return;
    setErr(null);
    try {
      await api(`/academic-sessions/${edit.id}`, {
        method: "PATCH",
        body: JSON.stringify({ label: edit.label.trim() }),
      });
      setEdit(null);
      await Promise.all([load(), loadSuggest()]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this academic session? References in exams or registrations may break.")) return;
    setErr(null);
    try {
      await api(`/academic-sessions/${id}`, { method: "DELETE" });
      await Promise.all([load(), loadSuggest()]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  function useSuggested() {
    if (suggested) setLabel(suggested);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-indigo-500" /> Academic Sessions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
          Sessions (e.g. <strong>2024/2025</strong>) are shared across exams and course registrations. The API suggests a <strong>next</strong> label from existing data; you can still type any label.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Add Session</h2>
          <div className="mb-4 p-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-lg flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300 m-0">
                Suggestion from data:{" "}
                <strong className="text-slate-900 dark:text-white ml-1">{suggested ?? "—"}</strong>
              </p>
              {basedOnCount > 0 && <p className="text-xs text-slate-500 mt-1">Based on {basedOnCount} existing sessions</p>}
            </div>
          </div>
          <form onSubmit={add}>
            <label>Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="2025/2026" required />
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white">Add Session</button>
              <button type="button" className="secondary flex items-center gap-1.5" onClick={useSuggested} disabled={!suggested}>
                Fill suggestion
              </button>
              <button type="button" className="secondary flex items-center gap-1.5" onClick={() => void loadSuggest().catch((e) => setErr(String(e)))}>
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </form>
          {err && <p className="error mt-4 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {err}</p>}
        </div>

        <div className="card">
          <h2 className="text-lg font-bold mb-4">Existing Sessions</h2>
          
          {edit && (
            <form onSubmit={saveEdit} className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
              <h3 className="font-semibold text-sm mb-2">Edit label</h3>
              <input
                value={edit.label}
                onChange={(e) => setEdit({ ...edit, label: e.target.value })}
                required
              />
              <div className="mt-3 flex gap-2">
                <button type="submit" className="text-sm py-1.5 px-3">Save</button>
                <button type="button" className="secondary text-sm py-1.5 px-3" onClick={() => setEdit(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          {list.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No sessions created yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/50 m-0 p-0 list-none">
              {list.map((s) => (
                <li key={s.id} className="py-3 flex flex-wrap items-center justify-between gap-2 group hover:bg-slate-50 dark:hover:bg-slate-800/30 px-2 -mx-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <strong className="text-slate-900 dark:text-white">{s.label}</strong>
                    <code className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono hidden sm:inline-block">{s.id}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="secondary text-xs px-2 py-1" onClick={() => setEdit({ ...s })}>
                      Edit
                    </button>
                    <button type="button" className="secondary text-xs px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => void remove(s.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
