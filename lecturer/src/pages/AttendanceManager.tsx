import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, QrCode, BarChart3, X } from "lucide-react";
import { Button, Card, Input, Modal, PageHeader } from "@bio/ui";

type Session = { id: string; date: string; courseId: string; code: string; status: string };
type Report = { present: number; absent: number; late: number; students: { name: string; status: string }[] };

export default function AttendanceManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseId, setCourseId] = useState("");
  const [qrModal, setQrModal] = useState<{ sessionId: string; code: string } | null>(null);
  const [reportModal, setReportModal] = useState<{ sessionId: string; report: Report | null; loading: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    api<Session[]>("/attendance/sessions")
      .then(setSessions)
      .catch(() => setError("Failed to load sessions"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createSession() {
    if (!courseId.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await api("/attendance/sessions", { method: "POST", body: JSON.stringify({ courseId: courseId.trim() }) });
      setCourseId("");
      load();
    } catch { setError("Failed to create session"); }
    finally { setSubmitting(false); }
  }

  async function showQR(sessionId: string) {
    try {
      setError("");
      const data = await api<{ code: string }>(`/attendance/sessions/${sessionId}/qr`);
      setQrModal({ sessionId, code: data.code });
    } catch { setError("Failed to generate QR code"); }
  }

  async function showReport(sessionId: string) {
    setReportModal({ sessionId, report: null, loading: true });
    try {
      setError("");
      const data = await api<Report>(`/attendance/sessions/${sessionId}/report`);
      setReportModal({ sessionId, report: data, loading: false });
    } catch { setError("Failed to load report"); setReportModal(null); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Manager" subtitle="Run sessions and review attendance reports." />

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>
      )}

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <Plus className="h-4 w-4 text-brand-500" /> Create Session
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          <Input className="sm:col-span-2" placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          <Button variant="primary" onClick={createSession} disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <QrCode className="h-4 w-4 text-brand-500" /> Attendance Sessions
        </h3>
        {loading && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
        {!loading && sessions.length === 0 && <p className="text-sm text-[var(--bio-muted)]">No sessions found</p>}
        <div className="divide-y divide-[var(--bio-border)]">
          {sessions.map(s => (
            <div key={s.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Course: {s.courseId}</p>
                <p className="text-xs text-[var(--bio-muted)]">
                  {s.date ? new Date(s.date).toLocaleString() : "—"} · Code: {s.code || "—"} · {s.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => showQR(s.id)} className="px-2.5 py-1 text-xs">
                  <QrCode className="h-3.5 w-3.5" /> QR
                </Button>
                <Button variant="secondary" onClick={() => showReport(s.id)} className="px-2.5 py-1 text-xs">
                  <BarChart3 className="h-3.5 w-3.5" /> Report
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={!!qrModal} onClose={() => setQrModal(null)} title="Attendance Code">
        {qrModal && (
          <div className="text-center">
            <p className="mb-4 text-4xl font-bold tracking-[0.2em] text-brand-600 dark:text-brand-400">{qrModal.code}</p>
            <p className="mb-4 text-xs text-[var(--bio-muted)]">Session: {qrModal.sessionId}</p>
            <Button variant="secondary" onClick={() => setQrModal(null)}>Close</Button>
          </div>
        )}
      </Modal>

      <Modal open={!!reportModal} onClose={() => setReportModal(null)} title="Attendance Report">
        {reportModal && (
          <div>
            {reportModal.loading && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
            {reportModal.report && (
              <div>
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-[var(--bio-surface-2)] p-3 text-center">
                    <p className="text-xs text-[var(--bio-muted)]">Present</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{reportModal.report.present}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bio-surface-2)] p-3 text-center">
                    <p className="text-xs text-[var(--bio-muted)]">Absent</p>
                    <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{reportModal.report.absent}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bio-surface-2)] p-3 text-center">
                    <p className="text-xs text-[var(--bio-muted)]">Late</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{reportModal.report.late}</p>
                  </div>
                </div>
                {reportModal.report.students && reportModal.report.students.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[var(--bio-border)] text-xs uppercase tracking-wide text-[var(--bio-muted)]">
                          <th className="px-2 py-2 font-medium">Student</th>
                          <th className="px-2 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportModal.report.students.map((st, i) => (
                          <tr key={i} className="border-b border-[var(--bio-border)] last:border-b-0">
                            <td className="px-2 py-2 text-slate-800 dark:text-slate-100">{st.name}</td>
                            <td className={`px-2 py-2 text-sm font-medium ${
                              st.status === "absent"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}>{st.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setReportModal(null)}>
                <X className="h-4 w-4" /> Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
