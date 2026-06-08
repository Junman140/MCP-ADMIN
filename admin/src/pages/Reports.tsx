import { useEffect, useState } from "react";
import { api, apiUrl, getToken } from "../api";
import { Download } from "lucide-react";

type Row = {
  id: string;
  capturedAt: string;
  result: string;
  matchScore: number | null;
  examId: string | null;
  courseId: string | null;
  academicYear: string | null;
  semester: number | null;
  student: { matricNo: string; fullName: string };
  device: { name: string; hallLabel: string | null } | null;
};

export default function Reports() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<Row[]>("/reports/verification-events")
      .then(setRows)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Verification Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and export biometric verification logs.</p>
        </div>
        <button
          type="button"
          className="secondary shrink-0 flex items-center gap-2"
          onClick={async () => {
            const token = getToken();
            const res = await fetch(apiUrl("/reports/verification-events/export.csv"), {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "verification-events.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {err && <p className="error p-4">{err}</p>}
        {rows.length === 0 && !err ? (
          <div className="p-8 text-center text-slate-500">No verification events yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-medium">When</th>
                  <th className="py-3 px-4 font-medium">Result</th>
                  <th className="py-3 px-4 font-medium">Score</th>
                  <th className="py-3 px-4 font-medium">Year</th>
                  <th className="py-3 px-4 font-medium">Sem</th>
                  <th className="py-3 px-4 font-medium">Course</th>
                  <th className="py-3 px-4 font-medium">Student</th>
                  <th className="py-3 px-4 font-medium">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{new Date(r.capturedAt).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wide ${
                        r.result === "match" || r.result === "already_verified" 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : r.result === "mismatch"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {r.result.toUpperCase().replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{r.matchScore?.toFixed(1) ?? "—"}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.academicYear ?? "—"}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.semester ?? "—"}</td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sky-600 dark:text-sky-400 font-mono">
                        {r.courseId ?? "—"}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 dark:text-white">{r.student.matricNo}</span> <span className="text-slate-500">— {r.student.fullName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {r.device?.name ?? ""} {r.device?.hallLabel ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
