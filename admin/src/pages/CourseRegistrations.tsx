import { useEffect, useState } from "react";
import { api } from "../api";
import { BookOpen, UserPlus, Filter } from "lucide-react";

type Reg = {
  id: string;
  studentId: string;
  courseId: string;
  academicSessionId?: string | null;
  academicYear: string;
  semester: number;
};

type AcademicSession = { id: string; label: string };

export default function CourseRegistrations() {
  const [list, setList] = useState<Reg[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [academicSessionId, setAcademicSessionId] = useState("");
  const [academicYearManual, setAcademicYearManual] = useState("");
  const [semester, setSemester] = useState(1);
  const [filterStudent, setFilterStudent] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function loadRegs() {
    const qs = filterStudent.trim() ? `?studentId=${encodeURIComponent(filterStudent.trim())}` : "";
    const rows = await api<Reg[]>(`/course-registrations${qs}`);
    setList(rows);
  }

  useEffect(() => {
    api<AcademicSession[]>("/academic-sessions")
      .then((sess) => {
        setSessions(sess);
        setAcademicSessionId((prev) => prev || sess[0]?.id || "");
      })
      .catch((e) => setErr(String(e)));
  }, []);

  useEffect(() => {
    loadRegs().catch((e) => setErr(String(e)));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const yearTrim = academicYearManual.trim();
      if (!academicSessionId && !yearTrim) {
        setErr("Select an academic session or enter a manual academic year.");
        return;
      }
      const body: Record<string, unknown> = {
        studentId,
        courseId,
        semester,
      };
      if (academicSessionId) body.academicSessionId = academicSessionId;
      if (yearTrim) body.academicYear = yearTrim;
      await api("/course-registrations", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setStudentId("");
      setCourseId("");
      setAcademicYearManual("");
      await loadRegs();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-500" /> Course Registrations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
          Registers a student for a course in a given <strong>academic session</strong> (or manual year) and <strong>semester</strong>. Required before exam verification when the exam is tied to that course and session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-sky-500" /> Register student</h2>
            <form onSubmit={create}>
              <div className="space-y-4">
                <div>
                  <label className="mt-0">Student ID</label>
                  <input value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
                </div>
                <div>
                  <label className="mt-0">Course ID</label>
                  <input value={courseId} onChange={(e) => setCourseId(e.target.value)} required />
                </div>
                <div>
                  <label className="mt-0">Academic session</label>
                  <select value={academicSessionId} onChange={(e) => setAcademicSessionId(e.target.value)}>
                    <option value="">— None —</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mt-0">Manual academic year (if no session)</label>
                  <input
                    value={academicYearManual}
                    onChange={(e) => setAcademicYearManual(e.target.value)}
                    placeholder="e.g. 2024/2025"
                  />
                </div>
                <div>
                  <label className="mt-0">Semester</label>
                  <select value={semester} onChange={(e) => setSemester(+e.target.value)}>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </select>
                </div>
              </div>
              
              {err && <p className="error mt-4 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg text-sm">{err}</p>}
              <div className="mt-6">
                <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-white">Save Registration</button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold m-0 flex items-center gap-2"><Filter className="w-5 h-5 text-slate-400" /> Filter Records</h2>
              <div className="max-w-xs w-full">
                <input
                  placeholder="Filter by Student ID (leave empty for all)"
                  value={filterStudent}
                  onChange={(e) => setFilterStudent(e.target.value)}
                  onBlur={() => loadRegs().catch((e) => setErr(String(e)))}
                  onKeyDown={(e) => e.key === 'Enter' && loadRegs()}
                  className="py-1.5 text-sm"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              {list.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No registrations found.</div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-5 font-medium">Student</th>
                      <th className="py-3 px-5 font-medium">Course</th>
                      <th className="py-3 px-5 font-medium">Year</th>
                      <th className="py-3 px-5 font-medium">Sem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {list.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-5">
                          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300 font-mono">
                            {r.studentId}
                          </code>
                        </td>
                        <td className="py-3 px-5">
                          <code className="text-xs bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 px-2 py-1 rounded text-sky-700 dark:text-sky-300 font-mono font-bold">
                            {r.courseId}
                          </code>
                        </td>
                        <td className="py-3 px-5 text-slate-600 dark:text-slate-400 font-medium">{r.academicYear}</td>
                        <td className="py-3 px-5 text-slate-600 dark:text-slate-400 font-medium">{r.semester}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
