import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { BookOpen, Users, FileText } from "lucide-react";

type Faculty = { id: string; name: string };
type Department = { id: string; name: string; facultyId: string | null };

type Exam = {
  id: string;
  title: string;
  courseId: string | null;
  academicSessionId?: string | null;
  academicYear: string | null;
  semester: number | null;
};

type Course = { id: string; code: string; title: string };
type AcademicSession = { id: string; label: string };

export default function Exams() {
  const [list, setList] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [title, setTitle] = useState("Mid-semester");
  const [courseId, setCourseId] = useState("");
  const [academicSessionId, setAcademicSessionId] = useState("");
  const [academicYearOverride, setAcademicYearOverride] = useState("");
  const [semester, setSemester] = useState(1);
  const [examId, setExamId] = useState("");
  const [studentIds, setStudentIds] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const [exams, crs, sess, facs, depts] = await Promise.all([
      api<Exam[]>("/exams"),
      api<Course[]>("/courses"),
      api<AcademicSession[]>("/academic-sessions"),
      api<Faculty[]>("/faculties"),
      api<Department[]>("/departments"),
    ]);
    setList(exams);
    setCourses(crs);
    setSessions(sess);
    setFaculties(facs);
    setDepartments(depts);
    if (crs.length && !courseId) setCourseId(crs[0].id);
    if (sess.length && !academicSessionId) setAcademicSessionId(sess[0].id);
  }

  const deptsFiltered = useMemo(() => {
    if (!facultyId) return departments;
    return departments.filter((d) => d.facultyId === facultyId || d.facultyId == null);
  }, [departments, facultyId]);

  useEffect(() => {
    load().catch((e) => setErr(String(e)));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const yearTrim = academicYearOverride.trim();
      if (!academicSessionId && !yearTrim) {
        setErr("Select an academic session or enter a manual academic year.");
        return;
      }
      const body: Record<string, unknown> = {
        title,
        courseId,
        semester,
      };
      if (academicSessionId) body.academicSessionId = academicSessionId;
      if (yearTrim) body.academicYear = yearTrim;
      await api("/exams", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setAcademicYearOverride("");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function roster(e: React.FormEvent) {
    e.preventDefault();
    if (!examId) { setErr("Please select an exam first."); return; }
    setErr(null);
    try {
      const inputs = studentIds
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await api<{ ok: boolean, count: number, total: number }>(`/exams/${examId}/roster`, {
        method: "POST",
        body: JSON.stringify({ entries: inputs.map((v) => ({ matricNo: v })) }),
      });
      setStudentIds("");
      alert(`Success! Added ${res.count} of ${res.total} students to the roster.`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function rosterByDept(e: React.FormEvent) {
    e.preventDefault();
    if (!examId) { setErr("Please select an exam first."); return; }
    if (!departmentId) { setErr("Please select a department first."); return; }
    setErr(null);
    try {
      const res = await api<{ ok: boolean, count: number }>(`/exams/${examId}/roster/bulk-department`, {
        method: "POST",
        body: JSON.stringify({ departmentId }),
      });
      alert(`Success! Added ${res.count} students from the selected department to the roster.`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function delExam(id: string) {
    if (!confirm("Delete this exam?")) return;
    setErr(null);
    try {
      await api(`/exams/${id}`, { method: "DELETE" });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Exams & Roster</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage exam sessions and their allowed student rosters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500" /> Create Exam</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Tied to a course, academic year, and semester.
          </p>
          <form onSubmit={create}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <label>Course</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                  {courses.length === 0 ? (
                    <option value="">Create a course in Catalog first</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label>Academic Session</label>
                <select value={academicSessionId} onChange={(e) => setAcademicSessionId(e.target.value)}>
                  <option value="">—</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Manual Year</label>
                <input
                  value={academicYearOverride}
                  onChange={(e) => setAcademicYearOverride(e.target.value)}
                  placeholder="2024/2025"
                />
              </div>
              <div>
                <label>Semester</label>
                <select value={semester} onChange={(e) => setSemester(+e.target.value)}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </div>
            </div>

            {err && <p className="error p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">{err}</p>}
            <div className="mt-4">
              <button type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white w-full sm:w-auto">Create Exam</button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /> Add Roster Entries</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Select an exam and then add students by Department or manually.
          </p>
          
          <label>1. Select Exam</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} required className="mb-6">
            <option value="">— Select an exam —</option>
            {list.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title} ({x.academicYear} / Sem {x.semester})
              </option>
            ))}
          </select>

          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold mb-3">Option A: Bulk Add by Department</h3>
              <form onSubmit={rosterByDept}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="mt-0">Faculty</label>
                    <select value={facultyId} onChange={(e) => { setFacultyId(e.target.value); setDepartmentId(""); }}>
                      <option value="">— All Faculties —</option>
                      {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mt-0">Department</label>
                    <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
                      <option value="">— Select Department —</option>
                      {deptsFiltered.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={!examId || !departmentId} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900">
                  Add All Students in Dept
                </button>
              </form>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold mb-3">Option B: Manual Matric Numbers</h3>
              <form onSubmit={roster}>
                <label className="mt-0">Matric Numbers (comma or newline separated)</label>
                <textarea 
                  rows={3} 
                  value={studentIds} 
                  onChange={(e) => setStudentIds(e.target.value)} 
                  placeholder="UED/2020/001&#10;UED/2020/002"
                  className="mb-4"
                />
                <button type="submit" disabled={!examId} className="w-full secondary">
                  Add Manual List
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <h2 className="text-lg font-bold m-0 flex items-center gap-2"><FileText className="w-5 h-5 text-sky-500" /> Exams List</h2>
        </div>
        
        <div className="overflow-x-auto">
          {list.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No exams created yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5 font-medium">Title / ID</th>
                  <th className="py-3 px-5 font-medium">Offering</th>
                  <th className="py-3 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {list.map((x) => (
                  <tr key={x.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-5">
                      <div className="font-bold text-slate-900 dark:text-white">{x.title}</div>
                      <code className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono mt-1 block w-fit">{x.id}</code>
                    </td>
                    <td className="py-3 px-5">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {x.academicYear || "—"} / Sem {x.semester || "—"}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">Course: {x.courseId || "Missing!"}</div>
                    </td>
                    <td className="py-3 px-5 flex justify-end">
                      <button type="button" className="secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => delExam(x.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
