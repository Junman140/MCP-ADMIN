import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";

type Faculty = { id: string; name: string };
type Department = { id: string; name: string; facultyId: string | null; matricPattern?: string };
type Course = {
  id: string;
  code: string;
  title: string;
  facultyId?: string | null;
  departmentId?: string | null;
  faculty?: string | null;
  department?: string | null;
};

type Tab = "faculties" | "departments" | "courses";

export default function Catalog() {
  const [tab, setTab] = useState<Tab>("faculties");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [facName, setFacName] = useState("");
  const [depName, setDepName] = useState("");
  const [depFacultyId, setDepFacultyId] = useState<string>("");
  const [depMatricPattern, setDepMatricPattern] = useState("");
  const [cCode, setCCode] = useState("");
  const [cTitle, setCTitle] = useState("");
  const [cFacultyId, setCFacultyId] = useState<string>("");
  const [cDeptId, setCDeptId] = useState<string>("");

  const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [popDept, setPopDept] = useState<Department | null>(null);
  const [editCourse, setEditCourse] = useState<Course | null>(null);

  const [popCount, setPopCount] = useState(10);
  const [popLevel, setPopLevel] = useState("100");
  const [popPattern, setPopPattern] = useState("");
  const [popStart, setPopStart] = useState(1);
  const [popLoading, setPopLoading] = useState(false);

  const facultyById = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of faculties) m.set(f.id, f.name);
    return m;
  }, [faculties]);

  const loadFaculties = useCallback(async () => {
    const rows = await api<Faculty[]>("/faculties");
    setFaculties(rows);
  }, []);

  const loadDepartments = useCallback(async () => {
    const rows = await api<Department[]>("/departments");
    setDepartments(rows);
  }, []);

  const loadCourses = useCallback(async () => {
    const rows = await api<Course[]>("/courses");
    setCourses(rows);
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadFaculties(), loadDepartments(), loadCourses()]);
  }, [loadCourses, loadDepartments, loadFaculties]);

  useEffect(() => {
    loadAll().catch((e) => setErr(String(e)));
  }, [loadAll]);

  const deptsForCourseFaculty = useMemo(() => {
    if (!cFacultyId) return departments;
    return departments.filter((d) => d.facultyId === cFacultyId || d.facultyId == null);
  }, [cFacultyId, departments]);

  async function addFaculty(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api("/faculties", { method: "POST", body: JSON.stringify({ name: facName }) });
      setFacName("");
      await loadFaculties();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function saveFaculty(e: React.FormEvent) {
    e.preventDefault();
    if (!editFaculty) return;
    setErr(null);
    try {
      await api(`/faculties/${editFaculty.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editFaculty.name }),
      });
      setEditFaculty(null);
      await loadFaculties();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function delFaculty(id: string) {
    if (!confirm("Delete this faculty? Departments may still reference it.")) return;
    setErr(null);
    try {
      await api(`/faculties/${id}`, { method: "DELETE" });
      await loadFaculties();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api("/departments", {
        method: "POST",
        body: JSON.stringify({
          name: depName,
          facultyId: depFacultyId || null,
          matricPattern: depMatricPattern || undefined,
        }),
      });
      setDepName("");
      setDepFacultyId("");
      setDepMatricPattern("");
      await loadDepartments();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function saveDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!editDept) return;
    setErr(null);
    try {
      await api(`/departments/${editDept.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editDept.name,
          facultyId: editDept.facultyId,
          matricPattern: editDept.matricPattern,
        }),
      });
      setEditDept(null);
      await loadDepartments();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function delDepartment(id: string) {
    if (!confirm("Delete this department?")) return;
    setErr(null);
    try {
      await api(`/departments/${id}`, { method: "DELETE" });
      await loadDepartments();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function runPopulation(e: React.FormEvent) {
    e.preventDefault();
    if (!popDept) return;
    setErr(null);
    setPopLoading(true);
    try {
      const res = await api<{ count: number }>("/students/populate", {
        method: "POST",
        body: JSON.stringify({
          departmentId: popDept.id,
          pattern: popPattern,
          count: popCount,
          startNumber: popStart,
          level: popLevel,
        }),
      });
      alert(`Successfully generated ${res.count} students for ${popDept.name}`);
      setPopDept(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error during population");
    } finally {
      setPopLoading(false);
    }
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api("/courses", {
        method: "POST",
        body: JSON.stringify({
          code: cCode,
          title: cTitle,
          facultyId: cFacultyId || undefined,
          departmentId: cDeptId || undefined,
        }),
      });
      setCCode("");
      setCTitle("");
      setCFacultyId("");
      setCDeptId("");
      await loadCourses();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!editCourse) return;
    setErr(null);
    try {
      await api(`/courses/${editCourse.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          code: editCourse.code,
          title: editCourse.title,
          facultyId: editCourse.facultyId ?? undefined,
          departmentId: editCourse.departmentId ?? undefined,
        }),
      });
      setEditCourse(null);
      await loadCourses();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function delCourse(id: string) {
    if (!confirm("Delete this course?")) return;
    setErr(null);
    try {
      await api(`/courses/${id}`, { method: "DELETE" });
      await loadCourses();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Catalog Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Maintain <strong>faculties</strong>, <strong>departments</strong>, and <strong>courses</strong>. These lists power dropdowns when enrolling students and scheduling exams.
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {(
          [
            ["faculties", "Faculties"],
            ["departments", "Departments"],
            ["courses", "Courses"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === k
                ? "bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400"
                : "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
            }`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      
      {err && <p className="error p-4 bg-red-50 dark:bg-red-500/10 rounded-xl mb-4">{err}</p>}

      {tab === "faculties" && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Add faculty</h2>
          <form onSubmit={addFaculty} className="max-w-md">
            <label>Name</label>
            <input value={facName} onChange={(e) => setFacName(e.target.value)} required />
            <div className="mt-4">
              <button type="submit">Add Faculty</button>
            </div>
          </form>
          {editFaculty && (
            <form onSubmit={saveFaculty} className="max-w-md mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-4">Edit faculty</h3>
              <label>Name</label>
              <input
                value={editFaculty.name}
                onChange={(e) => setEditFaculty({ ...editFaculty, name: e.target.value })}
                required
              />
              <div className="mt-4 flex gap-2">
                <button type="submit">Save Changes</button>
                <button type="button" className="secondary" onClick={() => setEditFaculty(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          <div className="overflow-x-auto mt-8">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {faculties.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{f.name}</td>
                    <td className="py-3 px-4 flex justify-end gap-2">
                      <button type="button" className="secondary text-xs px-3 py-1.5" onClick={() => setEditFaculty({ ...f })}>
                        Edit
                      </button>
                      <button type="button" className="secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => void delFaculty(f.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "departments" && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Add department</h2>
          <form onSubmit={addDepartment} className="max-w-md">
            <label>Name</label>
            <input value={depName} onChange={(e) => setDepName(e.target.value)} required />
            <label>Faculty (optional)</label>
            <select value={depFacultyId} onChange={(e) => setDepFacultyId(e.target.value)}>
              <option value="">— None —</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <label>Matric Pattern (e.g. 19/AN/ED/VE/####)</label>
            <input value={depMatricPattern} onChange={(e) => setDepMatricPattern(e.target.value)} placeholder="Use # for sequence numbers" />
            <div className="mt-4">
              <button type="submit">Add Department</button>
            </div>
          </form>
          {editDept && (
            <form onSubmit={saveDepartment} className="max-w-md mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-4">Edit department</h3>
              <label>Name</label>
              <input
                value={editDept.name}
                onChange={(e) => setEditDept({ ...editDept, name: e.target.value })}
                required
              />
              <label>Faculty</label>
              <select
                value={editDept.facultyId ?? ""}
                onChange={(e) => setEditDept({ ...editDept, facultyId: e.target.value || null })}
              >
                <option value="">— None —</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <label>Matric Pattern</label>
              <input
                value={editDept.matricPattern ?? ""}
                onChange={(e) => setEditDept({ ...editDept, matricPattern: e.target.value })}
                placeholder="e.g. 19/AN/ED/SC/####"
              />
              <div className="mt-4 flex gap-2">
                <button type="submit">Save Changes</button>
                <button type="button" className="secondary" onClick={() => setEditDept(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          {popDept && (
            <form onSubmit={runPopulation} className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-2">Populate Matric Numbers: {popDept.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Edit the pattern below if this set uses a different prefix (e.g. 19 vs 20).
              </p>
              <div className="max-w-md mb-4">
                <label>Matric Pattern (e.g. 19/AN/ED/VE/####)</label>
                <input value={popPattern} onChange={(e) => setPopPattern(e.target.value)} placeholder="Use # for sequence numbers" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                <div>
                  <label>Quantity to Generate</label>
                  <input type="number" value={popCount} onChange={(e) => setPopCount(parseInt(e.target.value))} min={1} max={1000} />
                </div>
                <div>
                  <label>Start Sequence #</label>
                  <input type="number" value={popStart} onChange={(e) => setPopStart(parseInt(e.target.value))} min={0} />
                </div>
                <div>
                  <label>Level</label>
                  <select value={popLevel} onChange={(e) => setPopLevel(e.target.value)}>
                    {["100", "200", "300", "400", "500", "600", "700", "Spill"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="submit" disabled={popLoading} className="bg-sky-500 text-white hover:bg-sky-400">{popLoading ? "Generating..." : "Generate Students"}</button>
                <button type="button" className="secondary" onClick={() => setPopDept(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          <div className="overflow-x-auto mt-8">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Faculty</th>
                  <th className="py-3 px-4 font-medium">Pattern</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{d.name}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{d.facultyId ? facultyById.get(d.facultyId) ?? "—" : "—"}</td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                        {d.matricPattern || "—"}
                      </code>
                    </td>
                    <td className="py-3 px-4 flex justify-end gap-2">
                      {d.matricPattern && (
                        <button type="button" className="text-xs px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20 rounded font-medium transition-colors" onClick={() => {
                          setPopDept({ ...d });
                          setPopPattern(d.matricPattern || "");
                        }}>
                          Populate
                        </button>
                      )}
                      <button type="button" className="secondary text-xs px-3 py-1.5" onClick={() => setEditDept({ ...d })}>
                        Edit
                      </button>
                      <button type="button" className="secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => void delDepartment(d.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "courses" && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Add course</h2>
          <form onSubmit={addCourse} className="max-w-md">
            <label>Code</label>
            <input value={cCode} onChange={(e) => setCCode(e.target.value)} required placeholder="e.g. CSC301" />
            <label>Title</label>
            <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} required />
            <label>Faculty (optional)</label>
            <select
              value={cFacultyId}
              onChange={(e) => {
                setCFacultyId(e.target.value);
                setCDeptId("");
              }}
            >
              <option value="">— None —</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <label>Department (optional)</label>
            <select value={cDeptId} onChange={(e) => setCDeptId(e.target.value)}>
              <option value="">— None —</option>
              {deptsForCourseFaculty.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <div className="mt-4">
              <button type="submit">Add Course</button>
            </div>
          </form>
          {editCourse && (
            <form onSubmit={saveCourse} className="max-w-md mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-4">Edit course</h3>
              <label>Code</label>
              <input
                value={editCourse.code}
                onChange={(e) => setEditCourse({ ...editCourse, code: e.target.value })}
                required
              />
              <label>Title</label>
              <input
                value={editCourse.title}
                onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                required
              />
              <label>Faculty</label>
              <select
                value={editCourse.facultyId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditCourse({ ...editCourse, facultyId: v || null, departmentId: null });
                }}
              >
                <option value="">— None —</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <label>Department</label>
              <select
                value={editCourse.departmentId ?? ""}
                onChange={(e) => setEditCourse({ ...editCourse, departmentId: e.target.value || null })}
              >
                <option value="">— None —</option>
                {(editCourse.facultyId
                  ? departments.filter((d) => d.facultyId === editCourse.facultyId || d.facultyId == null)
                  : departments
                ).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <div className="mt-4 flex gap-2">
                <button type="submit">Save Changes</button>
                <button type="button" className="secondary" onClick={() => setEditCourse(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          <div className="overflow-x-auto mt-8">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-medium">Code</th>
                  <th className="py-3 px-4 font-medium">Title</th>
                  <th className="py-3 px-4 font-medium">Faculty</th>
                  <th className="py-3 px-4 font-medium">Dept</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{c.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{c.title}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.facultyId ? facultyById.get(c.facultyId) ?? c.faculty ?? "—" : c.faculty ?? "—"}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {c.departmentId
                        ? departments.find((d) => d.id === c.departmentId)?.name ?? c.department ?? "—"
                        : c.department ?? "—"}
                    </td>
                    <td className="py-3 px-4 flex justify-end gap-2">
                      <button type="button" className="secondary text-xs px-3 py-1.5" onClick={() => setEditCourse({ ...c })}>
                        Edit
                      </button>
                      <button type="button" className="secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => void delCourse(c.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
