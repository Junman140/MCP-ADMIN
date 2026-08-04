import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";

type Faculty = { id: string; name: string };
type Department = { id: string; name: string; facultyId: string | null; matricPattern?: string };
type FacultyTree = Faculty & { departments: { id: string; name: string }[] };
type Course = {
  id: string;
  code: string;
  title: string;
  courseType?: string;
  facultyId?: string | null;
  departmentIds?: string[];
  semester?: number;
  level?: string | null;
  creditUnits?: number;
  lecturerIds?: string[];
  faculty?: string | null;
  department?: string | null;
};

const COURSE_TYPES: Record<string, string> = {
  general: "General (cross-department)",
  departmental: "Departmental",
  faculty: "Faculty-wide",
};
const SEMESTERS = [1, 2];
const LEVELS = ["100", "200", "300", "400", "500", "600", "700", "Spill"];

type Tab = "faculties" | "departments" | "courses";

export default function Catalog() {
  const [tab, setTab] = useState<Tab>("faculties");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [facultyTree, setFacultyTree] = useState<FacultyTree[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseData, setCourseData] = useState<{ data: Course[]; total: number }>({ data: [], total: 0 });
  const [err, setErr] = useState<string | null>(null);

  const [facName, setFacName] = useState("");
  const [depName, setDepName] = useState("");
  const [depFacultyId, setDepFacultyId] = useState<string>("");
  const [depMatricPattern, setDepMatricPattern] = useState("");
  const [cCode, setCCode] = useState("");
  const [cTitle, setCTitle] = useState("");
  const [cFacultyId, setCFacultyId] = useState<string>("");
  const [cDeptIds, setCDeptIds] = useState<string[]>([]);
  const [cCourseType, setCCourseType] = useState("departmental");
  const [cSemester, setCSemester] = useState(1);
  const [cLevel, setCLevel] = useState("");
  const [cCreditUnits, setCCreditUnits] = useState(3);

  const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [popDept, setPopDept] = useState<Department | null>(null);

  const [popCount, setPopCount] = useState(10);
  const [popLevel, setPopLevel] = useState("100");
  const [popPattern, setPopPattern] = useState("");
  const [popStart, setPopStart] = useState(1);
  const [popLoading, setPopLoading] = useState(false);

  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const facultyById = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of faculties) m.set(f.id, f.name);
    return m;
  }, [faculties]);

  const loadAll = useCallback(async () => {
    try {
      const [facs, tree, deps, crs] = await Promise.all([
        api<Faculty[]>("/faculties"),
        api<FacultyTree[]>("/faculties/tree"),
        api<Department[]>("/departments"),
        api<Course[]>("/courses?limit=500"),
      ]);
      setFaculties(facs);
      setFacultyTree(tree);
      setDepartments(deps);
      setCourses(Array.isArray(crs) ? crs : (crs as { data: Course[] }).data || []);
      setCourseData(Array.isArray(crs) ? { data: crs, total: crs.length } : (crs as { data: Course[]; total: number }));
    } catch (e) { setErr(String(e)); }
  }, []);

  useEffect(() => { loadAll().catch((e) => setErr(String(e))); }, [loadAll]);

  const filteredCourses = useMemo(() => {
    let list = courseData.data.length ? courseData.data : courses;
    if (filterFaculty) list = list.filter((c) => c.facultyId === filterFaculty);
    if (filterDept) list = list.filter((c) => (c.departmentIds || []).includes(filterDept));
    if (filterSemester) list = list.filter((c) => c.semester === parseInt(filterSemester));
    if (filterType) list = list.filter((c) => c.courseType === filterType);
    if (filterSearch) {
      const s = filterSearch.toLowerCase();
      list = list.filter((c) => c.code.toLowerCase().includes(s) || c.title.toLowerCase().includes(s));
    }
    list.sort((a, b) => {
      if ((a.semester || 1) !== (b.semester || 1)) return (a.semester || 1) - (b.semester || 1);
      if ((a.courseType || "") !== (b.courseType || "")) return (a.courseType || "").localeCompare(b.courseType || "");
      return (a.code || "").localeCompare(b.code || "");
    });
    return list;
  }, [courses, courseData, filterFaculty, filterDept, filterSemester, filterType, filterSearch]);

  function deptLabel(id: string | undefined | null) {
    if (!id) return "—";
    return departments.find((d) => d.id === id)?.name || id;
  }

  function deptLabels(ids?: string[]) {
    if (!ids || !ids.length) return "—";
    return ids.map((id) => deptLabel(id)).join(", ");
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    try {
      await api("/courses", { method: "POST", body: JSON.stringify({
        code: cCode, title: cTitle, courseType: cCourseType || undefined,
        facultyId: cFacultyId || undefined, departmentIds: cDeptIds.length ? cDeptIds : undefined,
        semester: cSemester, level: cLevel || undefined, creditUnits: cCreditUnits,
      })});
      setCCode(""); setCTitle(""); setCFacultyId(""); setCDeptIds([]); setCCourseType("departmental"); setCSemester(1); setCLevel(""); setCCreditUnits(3);
      await loadAll();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault(); if (!editCourse) return; setErr(null);
    try {
      await api(`/courses/${editCourse.id}`, { method: "PATCH", body: JSON.stringify({
        code: editCourse.code, title: editCourse.title, courseType: editCourse.courseType,
        facultyId: editCourse.facultyId ?? undefined,
        departmentIds: editCourse.departmentIds?.length ? editCourse.departmentIds : undefined,
        semester: editCourse.semester, level: editCourse.level || undefined,
        creditUnits: editCourse.creditUnits,
      })});
      setEditCourse(null); await loadAll();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  async function delCourse(id: string) {
    if (!confirm("Delete this course?")) return; setErr(null);
    try { await api(`/courses/${id}`, { method: "DELETE" }); await loadAll(); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  async function addFaculty(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    try { await api("/faculties", { method: "POST", body: JSON.stringify({ name: facName }) }); setFacName(""); await loadAll(); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  async function saveFaculty(e: React.FormEvent) {
    e.preventDefault(); if (!editFaculty) return; setErr(null);
    try { await api(`/faculties/${editFaculty.id}`, { method: "PATCH", body: JSON.stringify({ name: editFaculty.name }) }); setEditFaculty(null); await loadAll(); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  async function delFaculty(id: string) {
    if (!confirm("Delete this faculty?")) return; setErr(null);
    try { await api(`/faculties/${id}`, { method: "DELETE" }); await loadAll(); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    try {
      await api("/departments", { method: "POST", body: JSON.stringify({ name: depName, facultyId: depFacultyId || null, matricPattern: depMatricPattern || undefined }) });
      setDepName(""); setDepFacultyId(""); setDepMatricPattern(""); await loadAll();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  async function saveDepartment(e: React.FormEvent) {
    e.preventDefault(); if (!editDept) return; setErr(null);
    try { await api(`/departments/${editDept.id}`, { method: "PATCH", body: JSON.stringify({ name: editDept.name, facultyId: editDept.facultyId, matricPattern: editDept.matricPattern }) }); setEditDept(null); await loadAll(); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  async function delDepartment(id: string) {
    if (!confirm("Delete this department?")) return; setErr(null);
    try { await api(`/departments/${id}`, { method: "DELETE" }); await loadAll(); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  async function runPopulation(e: React.FormEvent) {
    e.preventDefault(); if (!popDept) return; setErr(null); setPopLoading(true);
    try {
      const res = await api<{ count: number }>("/students/populate", { method: "POST", body: JSON.stringify({ departmentId: popDept.id, pattern: popPattern, count: popCount, startNumber: popStart, level: popLevel }) });
      alert(`Generated ${res.count} students for ${popDept.name}`); setPopDept(null);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setPopLoading(false); }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Catalog Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Faculties, departments, and courses with hierarchical organization.</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {(["faculties", "departments", "courses"] as const).map((k) => (
          <button key={k} type="button" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === k ? "bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400" : "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"}`} onClick={() => setTab(k)}>
            {k === "faculties" ? "Faculties" : k === "departments" ? "Departments" : "Courses"}
          </button>
        ))}
      </div>

      {err && <p className="error p-4 bg-red-50 dark:bg-red-500/10 rounded-xl mb-4">{err}</p>}

      {tab === "faculties" && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Faculty hierarchy</h2>
          <div className="space-y-3 mb-8">
            {facultyTree.map((f) => (
              <details key={f.id} className="border border-slate-200 dark:border-slate-700 rounded-lg" open>
                <summary className="px-4 py-2 cursor-pointer font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between">
                  <span>📁 {f.name}</span>
                  <span className="text-xs text-slate-400">{f.departments.length} dept{f.departments.length !== 1 ? "s" : ""}</span>
                </summary>
                <div className="border-t border-slate-100 dark:border-slate-700/50 px-4 py-2">
                  {f.departments.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No departments</p>
                  ) : (
                    <div className="space-y-1">
                      {f.departments.map((d) => (
                        <div key={d.id} className="text-sm text-slate-600 dark:text-slate-400 pl-4">📄 {d.name}</div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>

          <h2 className="text-lg font-bold mb-4">Add faculty</h2>
          <form onSubmit={addFaculty} className="max-w-md">
            <label>Name</label>
            <input value={facName} onChange={(e) => setFacName(e.target.value)} required />
            <div className="mt-4"><button type="submit">Add Faculty</button></div>
          </form>
          {editFaculty && (
            <form onSubmit={saveFaculty} className="max-w-md mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-4">Edit</h3>
              <label>Name</label>
              <input value={editFaculty.name} onChange={(e) => setEditFaculty({ ...editFaculty, name: e.target.value })} required />
              <div className="mt-4 flex gap-2">
                <button type="submit">Save</button>
                <button type="button" className="secondary" onClick={() => setEditFaculty(null)}>Cancel</button>
              </div>
            </form>
          )}
          <div className="overflow-x-auto mt-8">
            <table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-900/50"><tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"><th className="py-3 px-4 font-medium">Name</th><th className="py-3 px-4 font-medium text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {faculties.map((f) => (<tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{f.name}</td><td className="py-3 px-4 flex justify-end gap-2"><button type="button" className="secondary text-xs px-3 py-1.5" onClick={() => setEditFaculty({ ...f })}>Edit</button><button type="button" className="secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => void delFaculty(f.id)}>Delete</button></td></tr>))}
            </tbody></table>
          </div>
        </div>
      )}

      {tab === "departments" && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Add department</h2>
          <form onSubmit={addDepartment} className="max-w-md">
            <label>Name</label><input value={depName} onChange={(e) => setDepName(e.target.value)} required />
            <label>Faculty</label>
            <select value={depFacultyId} onChange={(e) => setDepFacultyId(e.target.value)}><option value="">— None —</option>{faculties.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}</select>
            <label>Matric Pattern</label><input value={depMatricPattern} onChange={(e) => setDepMatricPattern(e.target.value)} placeholder="19/AN/ED/VE/####" />
            <div className="mt-4"><button type="submit">Add Department</button></div>
          </form>
          {editDept && (<form onSubmit={saveDepartment} className="max-w-md mt-6 pt-6 border-t border-slate-200 dark:border-slate-800"><h3 className="text-lg font-bold mb-4">Edit</h3><label>Name</label><input value={editDept.name} onChange={(e) => setEditDept({ ...editDept, name: e.target.value })} required /><label>Faculty</label><select value={editDept.facultyId ?? ""} onChange={(e) => setEditDept({ ...editDept, facultyId: e.target.value || null })}><option value="">— None —</option>{faculties.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}</select><label>Matric Pattern</label><input value={editDept.matricPattern ?? ""} onChange={(e) => setEditDept({ ...editDept, matricPattern: e.target.value })} /><div className="mt-4 flex gap-2"><button type="submit">Save</button><button type="button" className="secondary" onClick={() => setEditDept(null)}>Cancel</button></div></form>)}
          {popDept && (<form onSubmit={runPopulation} className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800"><h3 className="text-lg font-bold mb-2">Populate: {popDept.name}</h3><div className="max-w-md mb-4"><label>Matric Pattern</label><input value={popPattern} onChange={(e) => setPopPattern(e.target.value)} /></div><div className="grid grid-cols-3 gap-4 max-w-2xl"><div><label>Quantity</label><input type="number" value={popCount} onChange={(e) => setPopCount(+e.target.value)} min={1} max={1000} /></div><div><label>Start #</label><input type="number" value={popStart} onChange={(e) => setPopStart(+e.target.value)} min={0} /></div><div><label>Level</label><select value={popLevel} onChange={(e) => setPopLevel(e.target.value)}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div></div><div className="mt-4 flex gap-2"><button type="submit" disabled={popLoading} className="bg-sky-500 text-white hover:bg-sky-400">{popLoading ? "Generating..." : "Generate"}</button><button type="button" className="secondary" onClick={() => setPopDept(null)}>Cancel</button></div></form>)}
          <div className="overflow-x-auto mt-8"><table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-900/50"><tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"><th className="py-3 px-4 font-medium">Name</th><th className="py-3 px-4 font-medium">Faculty</th><th className="py-3 px-4 font-medium">Pattern</th><th className="py-3 px-4 font-medium text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {departments.map((d) => (<tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{d.name}</td><td className="py-3 px-4 text-slate-600 dark:text-slate-400">{d.facultyId ? facultyById.get(d.facultyId) ?? "—" : "—"}</td><td className="py-3 px-4"><code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{d.matricPattern || "—"}</code></td><td className="py-3 px-4 flex justify-end gap-2">{d.matricPattern && (<button type="button" className="text-xs px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20 rounded font-medium" onClick={() => { setPopDept({ ...d }); setPopPattern(d.matricPattern || ""); }}>Populate</button>)}<button type="button" className="secondary text-xs px-3 py-1.5" onClick={() => setEditDept({ ...d })}>Edit</button><button type="button" className="secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => void delDepartment(d.id)}>Delete</button></td></tr>))}
          </tbody></table></div>
        </div>
      )}

      {tab === "courses" && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Add course</h2>
          <form onSubmit={addCourse} className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label>Code</label><input value={cCode} onChange={(e) => setCCode(e.target.value)} required placeholder="e.g. CSC301" /></div>
            <div><label>Title</label><input value={cTitle} onChange={(e) => setCTitle(e.target.value)} required /></div>
            <div><label>Type</label><select value={cCourseType} onChange={(e) => setCCourseType(e.target.value)}>{Object.entries(COURSE_TYPES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
            <div><label>Faculty</label><select value={cFacultyId} onChange={(e) => { setCFacultyId(e.target.value); setCDeptIds([]); }}><option value="">— None —</option>{faculties.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}</select></div>
            <div><label>Departments (multi-select)</label><select multiple value={cDeptIds} onChange={(e) => setCDeptIds(Array.from((e.target as HTMLSelectElement).selectedOptions, (o) => o.value))} className="h-28">{departments.filter((d) => !cFacultyId || d.facultyId === cFacultyId || d.facultyId == null).map((d) => (<option key={d.id} value={d.id}>{d.name}{d.facultyId ? ` (${facultyById.get(d.facultyId) || ""})` : ""}</option>))}</select><p className="text-xs text-slate-400 mt-1">Ctrl+Click for multi-select. General courses can belong to multiple departments.</p></div>
            <div><label>Semester</label><select value={cSemester} onChange={(e) => setCSemester(+e.target.value)}>{SEMESTERS.map((s) => (<option key={s} value={s}>Semester {s}</option>))}</select></div>
            <div><label>Level (optional)</label><select value={cLevel} onChange={(e) => setCLevel(e.target.value)}><option value="">— Any —</option>{LEVELS.map((l) => (<option key={l} value={l}>{l}L</option>))}</select></div>
            <div><label>Credit Units</label><input type="number" value={cCreditUnits} onChange={(e) => setCCreditUnits(+e.target.value)} min={1} max={10} /></div>
            <div className="sm:col-span-2"><button type="submit">Add Course</button></div>
          </form>

          {editCourse && (
            <form onSubmit={saveCourse} className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold sm:col-span-2">Edit course</h3>
              <div><label>Code</label><input value={editCourse.code} onChange={(e) => setEditCourse({ ...editCourse, code: e.target.value })} required /></div>
              <div><label>Title</label><input value={editCourse.title} onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })} required /></div>
              <div><label>Type</label><select value={editCourse.courseType ?? "departmental"} onChange={(e) => setEditCourse({ ...editCourse, courseType: e.target.value })}>{Object.entries(COURSE_TYPES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
              <div><label>Faculty</label><select value={editCourse.facultyId ?? ""} onChange={(e) => setEditCourse({ ...editCourse, facultyId: e.target.value || null })}><option value="">— None —</option>{faculties.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}</select></div>
              <div><label>Departments</label><select multiple value={editCourse.departmentIds ?? []} onChange={(e) => setEditCourse({ ...editCourse, departmentIds: Array.from((e.target as HTMLSelectElement).selectedOptions, (o) => o.value) })} className="h-28">{departments.filter((d) => !editCourse.facultyId || d.facultyId === editCourse.facultyId || d.facultyId == null).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}</select></div>
              <div><label>Semester</label><select value={editCourse.semester ?? 1} onChange={(e) => setEditCourse({ ...editCourse, semester: +e.target.value })}>{SEMESTERS.map((s) => (<option key={s} value={s}>Semester {s}</option>))}</select></div>
              <div><label>Level</label><select value={editCourse.level ?? ""} onChange={(e) => setEditCourse({ ...editCourse, level: e.target.value || null })}><option value="">— Any —</option>{LEVELS.map((l) => (<option key={l} value={l}>{l}L</option>))}</select></div>
              <div><label>Credit Units</label><input type="number" value={editCourse.creditUnits ?? 3} onChange={(e) => setEditCourse({ ...editCourse, creditUnits: +e.target.value })} min={1} max={10} /></div>
              <div className="sm:col-span-2 flex gap-2"><button type="submit">Save</button><button type="button" className="secondary" onClick={() => setEditCourse(null)}>Cancel</button></div>
            </form>
          )}

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <div><label className="text-xs">Faculty</label><select value={filterFaculty} onChange={(e) => setFilterFaculty(e.target.value)}><option value="">All</option>{faculties.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}</select></div>
            <div><label className="text-xs">Department</label><select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}><option value="">All</option>{departments.filter((d) => !filterFaculty || d.facultyId === filterFaculty).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}</select></div>
            <div><label className="text-xs">Semester</label><select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}><option value="">All</option><option value="1">Semester 1</option><option value="2">Semester 2</option></select></div>
            <div><label className="text-xs">Type</label><select value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="">All</option>{Object.entries(COURSE_TYPES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
            <div><label className="text-xs">Search</label><input value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Code or title..." /></div>
          </div>

          <div className="overflow-x-auto mt-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-2 font-medium">Code</th><th className="py-3 px-2 font-medium">Title</th><th className="py-3 px-2 font-medium">Type</th>
                  <th className="py-3 px-2 font-medium">Fac/Sem</th><th className="py-3 px-2 font-medium">Level</th><th className="py-3 px-2 font-medium">Units</th>
                  <th className="py-3 px-2 font-medium">Departments</th><th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-2 font-bold text-slate-900 dark:text-white">{c.code}</td>
                    <td className="py-2 px-2 text-slate-700 dark:text-slate-300">{c.title}</td>
                    <td className="py-2 px-2"><span className={`text-xs px-1.5 py-0.5 rounded font-medium ${c.courseType === "general" ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400" : c.courseType === "faculty" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"}`}>{COURSE_TYPES[c.courseType || ""] || "—"}</span></td>
                    <td className="py-2 px-2 text-xs text-slate-500">{c.facultyId ? facultyById.get(c.facultyId) : "—"} / S{c.semester || 1}</td>
                    <td className="py-2 px-2 text-xs text-slate-500">{c.level || "Any"}</td>
                    <td className="py-2 px-2 text-xs text-slate-500">{c.creditUnits ?? 3}</td>
                    <td className="py-2 px-2 text-xs text-slate-500 max-w-[180px] truncate">{deptLabels(c.departmentIds)}</td>
                    <td className="py-2 px-2 flex justify-end gap-1">
                      <button type="button" className="secondary text-xs px-2 py-1" onClick={() => setEditCourse(c)}>Edit</button>
                      <button type="button" className="secondary text-xs px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => void delCourse(c.id)}>Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCourses.length === 0 && <p className="text-center text-slate-400 py-8">No courses found.</p>}
          </div>
        </div>
      )}
    </>
  );
}
