import { useEffect, useState } from "react";
import { api, apiUrl } from "../../api";

type GradeEntry = { id: string; studentId: string; courseId: string; academicYear: string; semester: number; type: string; score: number; letterGrade?: string; isApproved: boolean };
type Student = { id: string; matricNo: string; fullName: string };
type Course = { id: string; code: string; title: string };

export default function GradeBook() {
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [studentId, setStudentId] = useState("");
  const [score, setScore] = useState("");
  const [type, setType] = useState("final");
  const [academicYear, setAcademicYear] = useState("2025/2026");
  const [semester, setSemester] = useState("1");

  useEffect(() => { api<Course[]>("/courses").then(setCourses).catch(() => {}); }, []);

  async function loadGrades() {
    const q = selectedCourse ? `?courseId=${selectedCourse}` : "";
    api<GradeEntry[]>(`/grades${q}`).then(setGrades).catch(() => {});
  }
  useEffect(() => { loadGrades(); }, [selectedCourse]);

  async function addGrade() {
    if (!studentId || !selectedCourse || !score) return;
    await api("/grades", {
      method: "POST",
      body: JSON.stringify({ studentId, courseId: selectedCourse, academicYear, semester: parseInt(semester), type, score: parseFloat(score) }),
    });
    setStudentId(""); setScore("");
    loadGrades();
  }

  async function approveGrade(id: string) {
    await api(`/grades/${id}/approve`, { method: "POST", body: JSON.stringify({}) });
    loadGrades();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Grade Book</h1>
      <div className="flex gap-2 flex-wrap">
        <select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
        </select>
        <input className="input" placeholder="Academic Year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
        <select className="input w-24" value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="1">Sem 1</option>
          <option value="2">Sem 2</option>
        </select>
      </div>

      <div className="card p-4 space-y-2">
        <h3 className="font-semibold">Add Grade</h3>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          <input className="input w-24" type="number" placeholder="Score" value={score} onChange={(e) => setScore(e.target.value)} />
          <select className="input w-32" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="final">Final</option>
            <option value="assignment">Assignment</option>
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
          </select>
          <button className="btn-primary" onClick={addGrade}>Add</button>
        </div>
        <a href={apiUrl("/grades/bulk-csv")} className="text-sm text-sky-500 hover:underline">Bulk import via CSV (POST multipart)</a>
      </div>

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b"><th className="p-2 text-left">Student ID</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Score</th><th className="p-2 text-left">Year</th><th className="p-2 text-left">Sem</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Action</th></tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.id} className="border-b">
                <td className="p-2">{g.studentId.slice(0, 8)}...</td>
                <td className="p-2">{g.type}</td>
                <td className="p-2 font-mono">{g.score ?? "-"}</td>
                <td className="p-2">{g.academicYear}</td>
                <td className="p-2">{g.semester}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${g.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {g.isApproved ? "Approved" : "Pending"}
                  </span>
                </td>
                <td className="p-2">
                  {!g.isApproved && (
                    <button className="text-xs text-sky-500 hover:underline" onClick={() => approveGrade(g.id)}>Approve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
