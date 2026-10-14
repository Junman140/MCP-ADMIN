import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, Award, CheckCircle2 } from "lucide-react";
import { Badge, Button, Card, Input, PageHeader } from "@bio/ui";

type Grade = { id: string; studentId: string; studentName: string; courseId: string; score: number; grade: string; approved: boolean };

export default function GradeBook() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [score, setScore] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api<Grade[]>("/grades")
      .then(setGrades)
      .catch(() => setError("Failed to load grades"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createGrade() {
    if (!studentId.trim() || !courseId.trim() || !score) return;
    try {
      setError("");
      await api("/grades", {
        method: "POST",
        body: JSON.stringify({ studentId: studentId.trim(), courseId: courseId.trim(), score: Number(score) }),
      });
      setStudentId("");
      setCourseId("");
      setScore("");
      load();
    } catch { setError("Failed to create grade"); }
  }

  async function approveGrade(id: string) {
    try {
      setError("");
      await api(`/grades/${id}/approve`, { method: "POST" });
      setGrades(grades.map(g => g.id === id ? { ...g, approved: true } : g));
    } catch { setError("Failed to approve grade"); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Grade Book" subtitle="Record scores and approve student grades." />

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>
      )}

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <Plus className="h-4 w-4 text-brand-500" /> Add Grade
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <Input placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} />
          <Input placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          <Input type="number" placeholder="Score (%)" value={score} onChange={e => setScore(e.target.value)} min="0" max="100" />
          <Button variant="primary" onClick={createGrade}>Add</Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <Award className="h-4 w-4 text-brand-500" /> Grades
        </h3>
        {loading && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
        {!loading && grades.length === 0 && <p className="text-sm text-[var(--bio-muted)]">No grades found</p>}
        <div className="divide-y divide-[var(--bio-border)]">
          {grades.map(g => (
            <div key={g.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{g.studentName || g.studentId}</p>
                <p className="text-xs text-[var(--bio-muted)]">
                  Course: {g.courseId} · Score: {g.score}% · Grade: {g.grade || "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {g.approved
                  ? <Badge tone="green"><CheckCircle2 className="mr-1 h-3 w-3" /> Approved</Badge>
                  : (<Button
                      variant="secondary"
                      onClick={() => approveGrade(g.id)}
                      className="px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400"
                    >Approve</Button>)
                }
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
