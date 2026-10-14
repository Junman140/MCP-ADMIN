import { useEffect, useState } from "react";
import { api } from "../api";
import { AlertTriangle, Activity, BarChart3, Search } from "lucide-react";
import { Badge, Button, Card, Input, PageHeader } from "@bio/ui";

type AtRiskStudent = { studentId: string; studentName: string; courseId: string; riskScore: number; reason: string };
type EngagementData = { courseId: string; attendanceRate: number; submissionRate: number; avgSessionMinutes: number };
type GradeDistribution = { courseId: string; A: number; B: number; C: number; D: number; F: number; total: number };

export default function LMSAnalytics() {
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [distribution, setDistribution] = useState<GradeDistribution | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(true);
  const [loadingEng, setLoadingEng] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  const [error, setError] = useState("");
  const [engCourseId, setEngCourseId] = useState("");
  const [distCourseId, setDistCourseId] = useState("");

  useEffect(() => {
    api<AtRiskStudent[]>("/analytics/at-risk")
      .then(setAtRisk)
      .catch(() => setError("Failed to load at-risk data"))
      .finally(() => setLoadingRisk(false));
  }, []);

  function loadEngagement() {
    if (!engCourseId.trim()) return;
    setLoadingEng(true);
    setError("");
    api<EngagementData>(`/analytics/engagement/${engCourseId.trim()}`)
      .then(setEngagement)
      .catch(() => setError("Failed to load engagement data"))
      .finally(() => setLoadingEng(false));
  }

  function loadDistribution() {
    if (!distCourseId.trim()) return;
    setLoadingDist(true);
    setError("");
    api<GradeDistribution>(`/analytics/grade-distribution/${distCourseId.trim()}`)
      .then(setDistribution)
      .catch(() => setError("Failed to load grade distribution"))
      .finally(() => setLoadingDist(false));
  }

  const gradeBarBg: Record<string, string> = { A: "bg-emerald-500", B: "bg-brand-500", C: "bg-amber-500", D: "bg-orange-500", F: "bg-rose-500" };
  const gradeText: Record<string, string> = { A: "text-emerald-600 dark:text-emerald-400", B: "text-brand-600 dark:text-brand-400", C: "text-amber-600 dark:text-amber-400", D: "text-orange-600 dark:text-orange-400", F: "text-rose-600 dark:text-rose-400" };

  return (
    <div className="space-y-6">
      <PageHeader title="LMS Analytics" subtitle="At-risk students, engagement metrics, and grade distributions." />

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>
      )}

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <AlertTriangle className="h-4 w-4 text-amber-500" /> At-Risk Students
        </h3>
        {loadingRisk && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
        {!loadingRisk && atRisk.length === 0 && <p className="text-sm text-[var(--bio-muted)]">No at-risk students identified</p>}
        <div className="space-y-2">
          {atRisk.map((s, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 ${
                s.riskScore >= 70
                  ? "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20"
                  : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.studentName || s.studentId}</p>
                <Badge tone={s.riskScore >= 70 ? "red" : "amber"}>Risk: {s.riskScore}%</Badge>
              </div>
              <p className="text-xs text-[var(--bio-muted)]">Course: {s.courseId} · {s.reason}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <Activity className="h-4 w-4 text-brand-500" /> Course Engagement
        </h3>
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          <Input
            className="sm:col-span-2"
            placeholder="Course ID"
            value={engCourseId}
            onChange={e => setEngCourseId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadEngagement()}
          />
          <Button variant="primary" onClick={loadEngagement}>
            <Search className="h-4 w-4" /> Load
          </Button>
        </div>
        {loadingEng && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
        {engagement && !loadingEng && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Attendance", value: `${engagement.attendanceRate}%` },
              { label: "Submission Rate", value: `${engagement.submissionRate}%` },
              { label: "Avg Session", value: `${engagement.avgSessionMinutes} min` },
            ].map(m => (
              <div key={m.label} className="rounded-lg bg-[var(--bio-surface-2)] p-3 text-center">
                <p className="text-xs text-[var(--bio-muted)]">{m.label}</p>
                <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{m.value}</p>
              </div>
            ))}
          </div>
        )}
        {!engagement && !loadingEng && engCourseId && <p className="text-sm text-[var(--bio-muted)]">No data loaded</p>}
      </Card>

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <BarChart3 className="h-4 w-4 text-brand-500" /> Grade Distribution
        </h3>
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          <Input
            className="sm:col-span-2"
            placeholder="Course ID"
            value={distCourseId}
            onChange={e => setDistCourseId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadDistribution()}
          />
          <Button variant="primary" onClick={loadDistribution}>
            <Search className="h-4 w-4" /> Load
          </Button>
        </div>
        {loadingDist && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
        {distribution && !loadingDist && (
          <div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(["A", "B", "C", "D", "F"] as const).map(g => {
                const count = distribution[g] || 0;
                const pct = distribution.total > 0 ? Math.round((count / distribution.total) * 100) : 0;
                return (
                  <div key={g} className="rounded-lg bg-[var(--bio-surface-2)] p-2.5 text-center">
                    <p className="text-xs text-[var(--bio-muted)]">Grade {g}</p>
                    <p className={`text-lg font-bold ${gradeText[g]}`}>{count}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bio-border)]">
                      <div className={`h-full rounded-full ${gradeBarBg[g]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--bio-muted)]">{pct}%</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-right text-xs text-[var(--bio-muted)]">Total: {distribution.total} students</p>
          </div>
        )}
        {!distribution && !loadingDist && distCourseId && <p className="text-sm text-[var(--bio-muted)]">No data loaded</p>}
      </Card>
    </div>
  );
}
