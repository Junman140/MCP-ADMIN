import { useEffect, useState } from "react";
import { api } from "../api";
import { Award } from "lucide-react";
import { Card, PageHeader, StatCard } from "@bio/ui";

type GradeEntry = { id: string; courseId: string; academicYear: string; semester: number; type: string; score: number; letterGrade?: string; isApproved: boolean };
type Course = { id: string; code: string; title: string };

const LETTER_POINTS: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };

export default function GradesView() {
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api<GradeEntry[]>("/grades").then(setGrades).catch(() => {});
    api<Course[]>("/courses").then(setCourses).catch(() => {});
  }, []);

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const finalGrades = grades.filter((g) => g.isApproved && g.type === "final");
  const gpa =
    finalGrades.reduce((sum, g) => sum + (LETTER_POINTS[(g.letterGrade ?? "F")[0]] ?? 0), 0) /
    Math.max(1, finalGrades.length);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Grades" subtitle="Your academic record and GPA." />

      <StatCard label="GPA" value={gpa.toFixed(2)} />

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--bio-border)] text-left text-[var(--bio-muted)]">
              <th className="p-3 font-medium">Course</th>
              <th className="p-3 font-medium">Year</th>
              <th className="p-3 font-medium">Sem</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Score</th>
              <th className="p-3 font-medium">Grade</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.id} className="border-b border-[var(--bio-border)] last:border-0">
                <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{courseMap[g.courseId]?.code ?? g.courseId.slice(0, 8)}</td>
                <td className="p-3 text-[var(--bio-muted)]">{g.academicYear}</td>
                <td className="p-3 text-[var(--bio-muted)]">{g.semester}</td>
                <td className="p-3 capitalize text-slate-600 dark:text-slate-300">{g.type}</td>
                <td className="p-3 font-mono text-slate-700 dark:text-slate-200">{g.score}</td>
                <td className="p-3 font-bold text-slate-800 dark:text-white">{g.letterGrade ?? "-"}</td>
                <td className="p-3">
                  {g.isApproved ? (
                    <span className="text-emerald-500">Approved</span>
                  ) : (
                    <span className="text-amber-500">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {grades.length === 0 && (
          <p className="py-8 text-center text-[var(--bio-muted)]">No grades available yet.</p>
        )}
      </Card>
    </div>
  );
}
