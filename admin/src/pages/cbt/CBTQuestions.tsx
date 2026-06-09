import { useState, useEffect } from "react";
import { api, apiCBT } from "../../api";
import { Sparkles, Save, Loader2, Check, AlertCircle, Info } from "lucide-react";

interface Option {
  opt_id: string;
  text: string;
}

interface GenQuestion {
  type: string;
  content: string;
  options: Option[];
  correct_opt_id: string;
  points: number;
  word_limit: number;
  difficulty: string;
  tags: string[];
  topic: string;
}

interface GenResult {
  questions: GenQuestion[];
  raw_output: string;
  elapsed_ms: number;
  model_used: string;
  parse_error?: string;
}

interface Faculty { id: string; name: string; }
interface Department { id: string; name: string; facultyId: string; }
interface Course { id: string; code: string; title: string; }

export default function CBTQuestions() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [qTypes, setQTypes] = useState<string[]>(["mcq"]);
  const [contextText, setContextText] = useState("");
  const [courseId, setCourseId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [batchProgress, setBatchProgress] = useState("");
  const [result, setResult] = useState<GenResult | null>(null);
  const [questions, setQuestions] = useState<GenQuestion[]>([]);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    Promise.all([
      api<Faculty[]>("/faculties"),
      api<Department[]>("/departments"),
      api<Course[]>("/courses"),
    ]).then(([f, d, c]) => {
      setFaculties(f || []);
      setDepartments(d || []);
      setCourses(c || []);
    }).catch(() => {});
  }, []);

  const toggleType = (t: string) => {
    setQTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const generate = async () => {
    if (!topic.trim() && !contextText.trim()) {
      setErr("Please enter a topic or context text.");
      return;
    }
    setErr("");
    setSaved(false);
    setLoading(true);
    setQuestions([]);
    setResult(null);

    const BATCH_SIZE = 5;
    const batches = Math.ceil(count / BATCH_SIZE);
    const allQuestions: GenQuestion[] = [];
    let lastResult: GenResult | null = null;
    let batchErrors: string[] = [];

    try {
      for (let i = 0; i < batches; i++) {
        const batchCount = Math.min(BATCH_SIZE, count - i * BATCH_SIZE);
        setBatchProgress(`Generating batch ${i + 1}/${batches} (${batchCount} questions)...`);

        const body: Record<string, unknown> = {
          topic: topic.trim(),
          difficulty,
          count: batchCount,
          types: qTypes,
        };
        if (courseId.trim()) body.course_name = courseId.trim();
        // Only send context on first batch to avoid repeats
        if (i === 0 && contextText.trim()) body.context_text = contextText.trim();

        try {
          const res = await apiCBT<GenResult>("/ai/generate", {
            method: "POST",
            body: JSON.stringify(body),
          });
          lastResult = res;
          if (res.questions?.length) {
            allQuestions.push(...res.questions);
          }
          if (res.parse_error) {
            batchErrors.push(`Batch ${i + 1}: ${res.parse_error}`);
          }
        } catch (batchErr) {
          batchErrors.push(`Batch ${i + 1}: ${String(batchErr)}`);
        }
      }

      setResult(lastResult);
      setQuestions(allQuestions);
      setBatchProgress("");
      if (batchErrors.length > 0 && allQuestions.length === 0) {
        setErr(batchErrors.join(" | "));
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (idx: number, field: string, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIdx: number, optIdx: number, field: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...(q.options || [])];
        opts[optIdx] = { ...opts[optIdx], [field]: value };
        return { ...q, options: opts };
      })
    );
  };

  const saveQuestions = async () => {
    if (questions.length === 0) return;
    setSaving(true);
    try {
      await apiCBT("/ai/save", {
        method: "POST",
        body: JSON.stringify({
          questions,
          course_id: courseId.trim() || undefined,
          faculty_id: facultyId || undefined,
          department_id: departmentId || undefined,
          level: level || undefined,
        }),
      });
      setSaved(true);
    } catch (e) {
      setErr("Save failed: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          AI Question Generator
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generate assessment questions using AI (Ollama). Review and edit before saving to the question bank.
        </p>
      </div>

      {/* Input Form */}
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Topic / Subject
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Introduction to Algorithms"
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Course / Course Code (optional)
            </label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="e.g. CSC 201"
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Number of Questions
            </label>
            <input
              type="number"
              value={count}
              min={1}
              max={50}
              onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              {count > 5 ? `Will generate in ${Math.ceil(count / 5)} batches of ~5` : "Max 5 per call for best quality"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Question Types
            </label>
            <div className="flex gap-2 flex-wrap">
              {["mcq", "essay", "file_upload"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    qTypes.includes(t)
                      ? "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40"
                      : "bg-white text-slate-600 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                  }`}
                >
                  {t === "mcq" ? "MCQ" : t === "essay" ? "Essay" : "File Upload"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Academic Scope for saving */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Faculty</label>
            <select className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
              <option value="">All</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Department</label>
            <select className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">All</option>
              {departments.filter(d => !facultyId || d.facultyId === facultyId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Level</label>
            <select className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">All</option>
              {["100","200","300","400","500","600","700"].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Curriculum / Past Paper Context (optional)
          </label>
          <textarea
            value={contextText}
            onChange={(e) => setContextText(e.target.value)}
            placeholder="Paste a short excerpt (1-2 paragraphs) for the AI to generate questions from. Long text will be truncated."
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-y"
          />
          {contextText.length > 2000 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Context is {contextText.length.toLocaleString()} chars. Only the first ~3,000 will be used. Consider shortening for better results.
            </p>
          )}
        </div>

        {err && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-md">
            <AlertCircle className="w-4 h-4" />
            {err}
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? (batchProgress || "Generating...") : "Generate Questions"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Generated Questions
              </h3>
              <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                {result.model_used} &middot; {result.elapsed_ms}ms
              </span>
            </div>
            <div className="flex gap-2">
              {saved && (
                <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4" /> Saved
                </span>
              )}
              <button
                onClick={saveQuestions}
                disabled={saving || questions.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save to Bank
              </button>
            </div>
          </div>

          {result.parse_error && (
            <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 p-2 rounded">
              Parse warning: {result.parse_error}. Showing raw output. You can still edit and save manually.
            </div>
          )}

          {questions.length === 0 && !result.parse_error && (
            <p className="text-slate-500 text-sm py-4">No questions were parsed. Check raw output below.</p>
          )}

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {questions.map((q, qi) => (
              <div key={qi} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 px-2 py-0.5 rounded">
                    Q{qi + 1}
                  </span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {q.type}
                  </span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {q.difficulty}
                  </span>
                  <input
                    type="number"
                    value={q.points}
                    onChange={(e) => updateQuestion(qi, "points", Number(e.target.value))}
                    className="text-xs w-16 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="Pts"
                  />
                </div>

                <textarea
                  value={q.content}
                  onChange={(e) => updateQuestion(qi, "content", e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-y"
                  rows={3}
                />

                {/* MCQ Options */}
                {q.type === "mcq" && q.options && (
                  <div className="space-y-2 pl-2 border-l-2 border-sky-200 dark:border-sky-800">
                    {(q.options || []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correct_opt_id === opt.opt_id}
                          onChange={() => updateQuestion(qi, "correct_opt_id", opt.opt_id)}
                          className="w-3.5 h-3.5 text-sky-600"
                        />
                        <span className="text-xs font-mono text-slate-400 w-5">{opt.opt_id}</span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOption(qi, oi, "text", e.target.value)}
                          className="flex-1 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Essay */}
                {q.type === "essay" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Word Limit:</span>
                    <input
                      type="number"
                      value={q.word_limit}
                      onChange={(e) => updateQuestion(qi, "word_limit", Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                )}

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(q.tags || []).map((tag, ti) => (
                    <span key={ti} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Raw Output */}
          {result.raw_output && (
            <details className="mt-4">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                View Raw AI Output
              </summary>
              <pre className="mt-2 p-3 bg-slate-950 text-slate-300 text-xs rounded-lg overflow-auto max-h-[300px] whitespace-pre-wrap">
                {result.raw_output}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
