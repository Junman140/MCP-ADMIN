import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type Faculty = { id: string; name: string };
type Department = { id: string; name: string; facultyId: string | null };
type Student = {
  id: string;
  matricNo: string;
  fullName: string;
  facultyId?: string | null;
  departmentId?: string | null;
  faculty: string | null;
  department: string | null;
  isEnrolled?: boolean;
};

export default function Students() {
  const [list, setList] = useState<Student[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [q, setQ] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [level, setLevel] = useState("");
  const [enrolled, setEnrolled] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const filteredDepartments = useMemo(() => {
    if (!facultyId) return departments;
    return departments.filter(d => d.facultyId === facultyId);
  }, [departments, facultyId]);

  const facultyById = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of faculties) m.set(f.id, f.name);
    return m;
  }, [faculties]);

  const deptById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of departments) m.set(d.id, d.name);
    return m;
  }, [departments]);

  const loadRefs = useCallback(async () => {
    const [f, d] = await Promise.all([api<Faculty[]>("/faculties"), api<Department[]>("/departments")]);
    setFaculties(f);
    setDepartments(d);
  }, []);

  async function load(page = meta.page) {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (facultyId) params.append("facultyId", facultyId);
    if (departmentId) params.append("departmentId", departmentId);
    if (level) params.append("level", level);
    if (enrolled) params.append("enrolled", enrolled);
    params.append("page", String(page));
    params.append("limit", "10");

    try {
      const res = await api<{ data: Student[], meta: typeof meta }>(`/students?${params.toString()}`);
      setList(res.data);
      setMeta(res.meta);
    } catch (e) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    Promise.all([loadRefs(), load(1)]).catch((e) => setErr(String(e)));
  }, []);

  function displayFaculty(s: Student) {
    if (s.facultyId && facultyById.has(s.facultyId)) return facultyById.get(s.facultyId);
    return s.faculty ?? "—";
  }

  function displayDept(s: Student) {
    if (s.departmentId && deptById.has(s.departmentId)) return deptById.get(s.departmentId);
    return s.department ?? "—";
  }

  async function deleteBiometric(studentId: string) {
    if (!confirm("Are you sure you want to delete this student's biometric data? They will need to re-enroll to be verified.")) return;
    try {
      await api(`/students/${studentId}/enrollments`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete biometric");
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Student Directory</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage student records, enrollments, and filter by faculty or department.</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label>Search Name/Matric</label>
            <input
              placeholder="Search..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
            />
          </div>
          <div>
            <label>Faculty</label>
            <select value={facultyId} onChange={(e) => { setFacultyId(e.target.value); setDepartmentId(""); }}>
              <option value="">All Faculties</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label>Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">All Departments</option>
              {filteredDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label>Level / Year</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">All Levels</option>
              {["100", "200", "300", "400", "500", "600", "700", "Spill"].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label>Enrollment Status</label>
            <select value={enrolled} onChange={(e) => setEnrolled(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="true">Enrolled</option>
              <option value="false">Not Enrolled</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="secondary" onClick={() => {
            setQ(""); setFacultyId(""); setDepartmentId(""); setLevel(""); setEnrolled("");
            setTimeout(() => load(1), 0);
          }}>Clear Filters</button>
          <button type="button" onClick={() => load(1)}>Apply Filters</button>
        </div>
        
        {list.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full mt-6 text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-3 font-medium">Matric</th>
                    <th className="py-3 font-medium">Name</th>
                    <th className="py-3 font-medium">Level</th>
                    <th className="py-3 font-medium">Faculty</th>
                    <th className="py-3 font-medium">Dept</th>
                    <th className="py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {list.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 text-slate-700 dark:text-slate-300">{s.matricNo}</td>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        {s.fullName}
                        {s.isEnrolled && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded font-bold tracking-wide">ENROLLED</span>}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">{s.level || "—"}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">{displayFaculty(s)}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">{displayDept(s)}</td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-3 text-sm">
                          <Link to={`/students/${s.id}/edit`} className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">Edit</Link>
                          <Link to={`/enroll/${s.id}`} className={s.isEnrolled ? "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" : "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"}>
                            {s.isEnrolled ? "Re-enroll" : "Enroll"}
                          </Link>
                          {s.isEnrolled && (
                            <button 
                              type="button" 
                              className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded transition-colors"
                              onClick={() => deleteBiometric(s.id)}
                            >
                              Delete Biometric
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} students
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" className="secondary text-sm px-3 py-1.5" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>Previous</button>
                  <button type="button" className="secondary text-sm px-3 py-1.5" disabled={meta.page >= meta.totalPages} onClick={() => load(meta.page + 1)}>Next</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="mt-6 text-slate-500 dark:text-slate-400 text-center py-8">
            {q ? "No students found matching your search." : "Enter a search term above to find students."}
          </p>
        )}
      </div>
    </>
  );
}
