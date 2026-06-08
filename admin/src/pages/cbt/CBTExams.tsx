import { useEffect, useState } from "react";
import { api, apiCBT } from "../../api";
import { Download, Plus, PenSquare, Trash2, Filter, X } from "lucide-react";

type AssessmentType = "exam" | "test" | "assignment";
type QuestionType = "mcq" | "essay" | "file_upload";

interface Exam {
  id: string;
  type?: AssessmentType;
  rules?: { is_proctored: boolean; max_attempts: number };
  metadata: { title: string; duration_minutes: number; shuffle_questions?: boolean; shuffle_options?: boolean };
  questions: any[];
  course_id?: string;
  course_name?: string;
  faculty_id?: string;
  faculty_name?: string;
  department_id?: string;
  department_name?: string;
  level?: string;
  semester?: string;
  created_at: string;
}

interface Faculty { id: string; name: string; }
interface Department { id: string; name: string; facultyId: string; }
interface Course { id: string; code: string; title: string; departmentId?: string; facultyId?: string; }

const LEVELS = ["100", "200", "300", "400", "500", "600", "700", "Spill"];
const SEMESTERS = ["First", "Second"];

export default function CBTExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Draft form
  const [draftType, setDraftType] = useState<AssessmentType>("exam");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDuration, setDraftDuration] = useState(60);
  const [draftIsProctored, setDraftIsProctored] = useState(true);
  const [draftMaxAttempts, setDraftMaxAttempts] = useState(1);
  const [draftCourseId, setDraftCourseId] = useState("");
  const [draftFacultyId, setDraftFacultyId] = useState("");
  const [draftDepartmentId, setDraftDepartmentId] = useState("");
  const [draftLevel, setDraftLevel] = useState("");
  const [draftSemester, setDraftSemester] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);

  // Filters for list
  const [filterCourseId, setFilterCourseId] = useState("");
  const [filterFacultyId, setFilterFacultyId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  async function load() {
    try {
      const qs = new URLSearchParams();
      if (filterCourseId) qs.set("course_id", filterCourseId);
      if (filterFacultyId) qs.set("faculty_id", filterFacultyId);
      if (filterDepartmentId) qs.set("department_id", filterDepartmentId);
      if (filterLevel) qs.set("level", filterLevel);
      const q = qs.toString();
      const res = await apiCBT<Exam[]>("/exams" + (q ? `?${q}` : ""));
      setExams(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadCatalog() {
    try {
      const [fac, dept, crs] = await Promise.all([
        api<Faculty[]>("/faculties"),
        api<Department[]>("/departments"),
        api<Course[]>("/courses"),
      ]);
      setFaculties(fac || []);
      setDepartments(dept || []);
      setCourses(crs || []);
    } catch (e) {
      console.error("Catalog load failed:", e);
    }
  }

  useEffect(() => { loadCatalog(); }, []);
  useEffect(() => { load(); }, [filterCourseId, filterFacultyId, filterDepartmentId, filterLevel]);

  function addQuestion(type: QuestionType) {
    const q: any = { q_id: `q-${Date.now()}`, type, content: "", points: 1 };
    if (type === "mcq") {
      q.options = [
        { opt_id: `opt-${Date.now()}-1`, text: "Option A" },
        { opt_id: `opt-${Date.now()}-2`, text: "Option B" },
      ];
      q.correct_opt_id = q.options[0].opt_id;
    } else if (type === "essay") {
      q.word_limit = 500;
    } else if (type === "file_upload") {
      q.file_upload = { max_bytes: 10485760, max_files: 1, allowed_mime_types: [] };
    }
    setQuestions([...questions, q]);
  }

  function getSelectedCourse(): Course | undefined {
    return courses.find(c => c.id === draftCourseId);
  }

  async function create() {
    try {
      const defaultTitle = draftTitle.trim() ||
        (draftType === "exam" ? `CBT Exam ${exams.length + 1}` :
         draftType === "test" ? `CBT Test ${exams.length + 1}` :
         `CBT Assignment ${exams.length + 1}`);

      const selCourse = getSelectedCourse();
      const selDept = departments.find(d => d.id === draftDepartmentId);
      const selFac = faculties.find(f => f.id === draftFacultyId);

      await apiCBT("/exams", {
        method: "POST",
        body: JSON.stringify({
          type: draftType,
          rules: { is_proctored: draftIsProctored, max_attempts: Math.max(1, Number(draftMaxAttempts) || 1) },
          metadata: {
            title: defaultTitle,
            duration_minutes: Math.max(1, Number(draftDuration) || 60),
            shuffle_questions: true,
            shuffle_options: true,
          },
          course_id: draftCourseId || undefined,
          course_name: selCourse ? `${selCourse.code} - ${selCourse.title}` : undefined,
          faculty_id: draftFacultyId || undefined,
          faculty_name: selFac?.name || undefined,
          department_id: draftDepartmentId || undefined,
          department_name: selDept?.name || undefined,
          level: draftLevel || undefined,
          semester: draftSemester || undefined,
          questions,
        }),
      });
      setDraftTitle("");
      setQuestions([]);
      load();
    } catch (e) {
      alert(String(e));
    }
  }

  function clearFilters() {
    setFilterCourseId("");
    setFilterFacultyId("");
    setFilterDepartmentId("");
    setFilterLevel("");
  }

  const hasFilters = filterCourseId || filterFacultyId || filterDepartmentId || filterLevel;

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">CBT Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage exam payloads with academic scoping (course, department, level).</p>
        </div>
      </div>

      {/* Assessment Builder */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold mb-4">New Assessment</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          <label className="text-xs text-slate-500 flex flex-col gap-1">
            Type
            <select className="input h-9" value={draftType} onChange={(e) => {
              const v = e.target.value as AssessmentType;
              setDraftType(v);
              setDraftIsProctored(v === "exam");
              setDraftMaxAttempts(v === "test" ? 2 : 1);
            }}>
              <option value="exam">Exam</option>
              <option value="test">Test</option>
              <option value="assignment">Assignment</option>
            </select>
          </label>
          <label className="text-xs text-slate-500 flex flex-col gap-1">
            Title
            <input className="input h-9" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="e.g. Midterm" />
          </label>
          <label className="text-xs text-slate-500 flex flex-col gap-1">
            Duration (mins)
            <input className="input h-9" type="number" min={1} value={draftDuration} onChange={(e) => setDraftDuration(Number(e.target.value))} />
          </label>
          <label className="text-xs text-slate-500 flex flex-col gap-1">
            Proctored
            <select className="input h-9" value={draftIsProctored ? "yes" : "no"} onChange={(e) => setDraftIsProctored(e.target.value === "yes")}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="text-xs text-slate-500 flex flex-col gap-1">
            Max Attempts
            <input className="input h-9" type="number" min={1} value={draftMaxAttempts} onChange={(e) => setDraftMaxAttempts(Number(e.target.value))} />
          </label>
        </div>

        {/* Academic Scoping */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mb-3">
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Academic Scope</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <label className="text-xs text-slate-500 flex flex-col gap-1">
              Faculty
              <select className="input h-9" value={draftFacultyId} onChange={(e) => setDraftFacultyId(e.target.value)}>
                <option value="">All Faculties</option>
                {faculties.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500 flex flex-col gap-1">
              Department
              <select className="input h-9" value={draftDepartmentId} onChange={(e) => setDraftDepartmentId(e.target.value)}>
                <option value="">All Departments</option>
                {departments.filter(d => !draftFacultyId || d.facultyId === draftFacultyId).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500 flex flex-col gap-1">
              Course
              <select className="input h-9" value={draftCourseId} onChange={(e) => setDraftCourseId(e.target.value)}>
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500 flex flex-col gap-1">
              Level
              <select className="input h-9" value={draftLevel} onChange={(e) => setDraftLevel(e.target.value)}>
                <option value="">All Levels</option>
                {LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
              </select>
            </label>
            <label className="text-xs text-slate-500 flex flex-col gap-1">
              Semester
              <select className="input h-9" value={draftSemester} onChange={(e) => setDraftSemester(e.target.value)}>
                <option value="">Any</option>
                {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Questions Builder */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{questions.length} question(s)</span>
            <div className="flex gap-2">
              <button type="button" className="secondary text-xs" onClick={() => addQuestion("mcq")}>+ MCQ</button>
              <button type="button" className="secondary text-xs" onClick={() => addQuestion("essay")}>+ Essay</button>
              <button type="button" className="secondary text-xs" onClick={() => addQuestion("file_upload")}>+ File</button>
            </div>
          </div>

          {questions.map((q, i) => (
            <div key={q.q_id} className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase text-slate-500">{q.type}</span>
                <button type="button" className="text-red-500 hover:text-red-600" onClick={() => setQuestions(questions.filter(x => x.q_id !== q.q_id))}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input className="input mb-2" placeholder="Question text (Markdown/LaTeX OK)" value={q.content} onChange={(e) => { const n = [...questions]; n[i].content = e.target.value; setQuestions(n); }} />
              {q.type === "mcq" && (
                <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-2">
                  {q.options.map((opt: any, oi: number) => (
                    <div key={opt.opt_id} className="flex gap-2 items-center">
                      <input type="radio" name={`correct-${q.q_id}`} checked={q.correct_opt_id === opt.opt_id} onChange={() => { const n = [...questions]; n[i].correct_opt_id = opt.opt_id; setQuestions(n); }} />
                      <input className="input h-8 text-sm" value={opt.text} onChange={(e) => { const n = [...questions]; n[i].options[oi].text = e.target.value; setQuestions(n); }} />
                    </div>
                  ))}
                  <button type="button" className="text-xs text-sky-500" onClick={() => { const n = [...questions]; n[i].options.push({ opt_id: `opt-${Date.now()}`, text: "New Option" }); setQuestions(n); }}>+ Add option</button>
                </div>
              )}
              {q.type === "essay" && (
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-slate-500">Word limit:</label>
                  <input type="number" className="input h-8 w-24 text-sm" value={q.word_limit} onChange={(e) => { const n = [...questions]; n[i].word_limit = Number(e.target.value); setQuestions(n); }} />
                </div>
              )}
              {q.type === "file_upload" && (
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-slate-500">Max files:</label>
                  <input type="number" className="input h-8 w-24 text-sm" value={q.file_upload.max_files} onChange={(e) => { const n = [...questions]; n[i].file_upload.max_files = Number(e.target.value); setQuestions(n); }} />
                </div>
              )}
            </div>
          ))}

          <button type="button" onClick={create} className="flex items-center gap-2 h-10 mt-2">
            <Plus className="w-4 h-4" /> Create Assessment
          </button>
        </div>
      </div>

      {/* Exam List with Filters */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Filter</span>
          <select className="input h-8 text-xs w-40" value={filterFacultyId} onChange={(e) => setFilterFacultyId(e.target.value)}>
            <option value="">All Faculties</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select className="input h-8 text-xs w-40" value={filterDepartmentId} onChange={(e) => setFilterDepartmentId(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="input h-8 text-xs w-40" value={filterCourseId} onChange={(e) => setFilterCourseId(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          <select className="input h-8 text-xs w-32" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
            <option value="">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
          </select>
          {hasFilters && (
            <button type="button" className="text-xs text-red-500 flex items-center gap-1" onClick={clearFilters}>
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border-dashed border-2 m-4 rounded-xl">No CBT exams found{hasFilters ? " with current filters" : ""}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Title</th>
                  <th className="py-3 px-4 font-medium">Course</th>
                  <th className="py-3 px-4 font-medium">Dept / Level</th>
                  <th className="py-3 px-4 font-medium">Duration</th>
                  <th className="py-3 px-4 font-medium">Questions</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {exams.map((x) => (
                  <tr key={x.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {(x.type || "exam").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white max-w-[200px] truncate">{x.metadata.title}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                      {x.course_name || x.course_id || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                      {x.department_name && (
                        <span>{x.department_name}{x.level ? ` · ${x.level}L` : ""}</span>
                      )}
                      {!x.department_name && x.department_id && <span className="font-mono">{x.department_id.slice(0, 8)}</span>}
                      {!x.department_id && "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {x.type === "assignment" ? "—" : `${x.metadata.duration_minutes} mins`}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {x.questions?.length || 0} Qs
                      </span>
                    </td>
                    <td className="py-3 px-4 flex justify-end">
                      <div className="flex items-center gap-2">
                        <a className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5" href="/cbt/marking" title="Go to Marking">
                          <PenSquare className="w-3 h-3" /> Marking
                        </a>
                        <button type="button" className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                          onClick={() => window.open(`/cbt-api/exams/${x.id}/download`, "_blank")}>
                          <Download className="w-3 h-3" /> Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
