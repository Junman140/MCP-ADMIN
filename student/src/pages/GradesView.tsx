import { useEffect, useState } from "react";
import { api, getUser } from "../api";
import { Award } from "lucide-react";

type GradeEntry = { id: string; courseId: string; academicYear: string; semester: number; type: string; score: number; letterGrade?: string; isApproved: boolean };
type Course = { id: string; code: string; title: string };

export default function GradesView() {
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api<GradeEntry[]>("/grades").then(setGrades).catch(() => {});
    api<Course[]>("/courses").then(setCourses).catch(() => {});
  }, []);

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const gpa = grades.filter((g) => g.isApproved && g.type === "final").reduce((sum, g) => {
    const l = (g.letterGrade ?? "F")[0];
    return sum + ({ A: 4, B: 3, C: 2, D: 1 }[l] ?? 0);
  }, 0) / Math.max(1, grades.filter((g) => g.isApproved && g.type === "final").length);

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-2xl font-bold">Grades</h1>
      <div className="card p-4"><p className="text-sm text-slate-500">GPA</p><p className="text-2xl font-bold">{gpa.toFixed(2)}</p></div>
      <div className="card">
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="p-2 text-left">Course</th><th className="p-2 text-left">Year</th><th className="p-2 text-left">Sem</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Score</th><th className="p-2 text-left">Grade</th><th className="p-2 text-left">Status</th></tr></thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.id} className="border-b">
                <td className="p-2">{courseMap[g.courseId]?.code ?? g.courseId.slice(0, 8)}</td>
                <td className="p-2">{g.academicYear}</td>
                <td className="p-2">{g.semester}</td>
                <td className="p-2">{g.type}</td>
                <td className="p-2 font-mono">{g.score}</td>
                <td className="p-2 font-bold">{g.letterGrade ?? "-"}</td>
                <td className="p-2">{g.isApproved ? <span className="text-emerald-500">Approved</span> : <span className="text-amber-500">Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
