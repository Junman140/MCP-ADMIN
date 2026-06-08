import { useEffect, useMemo, useState } from "react";
import { apiCBT } from "../../api";
import { CheckCircle, Pencil, Sparkles, Loader2, Bot, AlertTriangle, Eye, X } from "lucide-react";

type AssessmentType = "exam" | "test" | "assignment";

type ExamRow = {
  id: string;
  type?: AssessmentType;
  metadata: { title: string; duration_minutes: number };
  course_name?: string;
  course_id?: string;
  department_name?: string;
  level?: string;
  created_at: string;
};

type Submission = {
  id: string;
  assessment_id: string;
  student_id: string;
  attempt: number;
  status: "in_progress" | "submitted" | "graded";
  updated_at: string;
  submitted_at?: string | null;
  answers?: { question_id: string; essay_text: string; selected_option_id: string }[];
  file_uploads?: { question_id: string; file_name: string }[];
  ai_per_feedback?: Record<string, string>;
  ai_confidences?: Record<string, number>;
  grade?: {
    total_score: number;
    feedback: string;
    by_user_id: string;
    at: string;
    per_question?: Record<string, number>;
  } | null;
};

type AIGradeResult = {
  submission_id: string;
  per_question: Record<string, number>;
  per_feedback: Record<string, string>;
  confidences: Record<string, number>;
  total_score: number;
  max_score: number;
  elapsed_ms: number;
};

export default function CBTMarking() {
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [assessmentId, setAssessmentId] = useState("");
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [aiGradingId, setAiGradingId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIGradeResult | null>(null);
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null);

  async function loadExams() {
    const list = await apiCBT<ExamRow[]>("/exams");
    setExams(list || []);
    if (!assessmentId && list?.length) setAssessmentId(list[0].id);
  }

  async function loadSubmissions(id: string) {
    const list = await apiCBT<Submission[]>(`/submissions?assessment_id=${encodeURIComponent(id)}`);
    setSubs(list || []);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadExams()])
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!assessmentId) return;
    setErr("");
    loadSubmissions(assessmentId).catch((e) => setErr(String(e)));
  }, [assessmentId]);

  async function openGrade(s: Submission) {
    setGradingId(s.id);
    setGradeScore(s.grade?.total_score ?? 0);
    setGradeFeedback(s.grade?.feedback ?? "");
  }

  async function saveGrade() {
    if (!gradingId) return;
    await apiCBT(`/submissions/${gradingId}/grade`, {
      method: "PATCH",
      body: JSON.stringify({
        total_score: Number(gradeScore) || 0,
        feedback: gradeFeedback,
        per_question: {},
      }),
    });
    setGradingId(null);
    setGradeFeedback("");
    if (assessmentId) await loadSubmissions(assessmentId);
  }

  async function aiGrade(s: Submission) {
    setAiGradingId(s.id);
    setAiResult(null);
    try {
      const res = await apiCBT<AIGradeResult>(`/ai/grade-submission/${s.id}`, { method: "POST" });
      setAiResult(res);
      if (assessmentId) await loadSubmissions(assessmentId);
    } catch (e) {
      setErr("AI grading failed: " + String(e));
    } finally {
      setAiGradingId(null);
    }
  }

  function acceptAiGrade() {
    if (!aiResult) return;
    setAiResult(null);
    if (assessmentId) loadSubmissions(assessmentId);
  }

  function getConfidenceColor(c: number): string {
    if (c >= 0.85) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";
    if (c >= 0.65) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">CBT Marking</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review submissions, apply manual grades, or use AI auto-grading for essays.</p>
        </div>
        <div className="flex items-end gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1">
            Assessment
            <select className="input h-9 min-w-[280px]" value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)}>
              {exams.map((x) => (
                <option key={x.id} value={x.id}>
                  {(x.type || "exam").toUpperCase()} — {x.metadata.title}
                  {x.course_name ? ` [${x.course_name}]` : ""}
                  {x.department_name ? ` · ${x.department_name}` : ""}
                  {x.level ? ` · ${x.level}L` : ""}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="secondary h-9" onClick={() => assessmentId && loadSubmissions(assessmentId)}>
            Refresh
          </button>
        </div>
      </div>

      {err ? <p className="error">{err}</p> : null}
      {loading ? <p className="text-slate-500 py-8 text-center">Loading...</p> : null}

      <div className="card p-0 overflow-hidden">
        {subs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No submissions yet for this assessment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-medium">Student</th>
                  <th className="py-3 px-4 font-medium">Attempt</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Updated</th>
                  <th className="py-3 px-4 font-medium">Score</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {subs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{s.student_id}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{s.attempt}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.status === "graded"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : s.status === "submitted"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                      }`}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{new Date(s.updated_at).toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{s.grade?.total_score ?? "—"}</td>
                    <td className="py-3 px-4 flex justify-end gap-2">
                      <button
                        type="button"
                        className="text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setViewSubmission(s)}
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        type="button"
                        className="text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-50"
                        onClick={() => aiGrade(s)}
                        disabled={aiGradingId === s.id}
                      >
                        {aiGradingId === s.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Bot className="w-3 h-3" />
                        )}
                        {aiGradingId === s.id ? "AI Grading..." : "AI Grade"}
                      </button>
                      <button type="button" className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={() => openGrade(s)}>
                        <Pencil className="w-3 h-3" />
                        Grade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Grade Result Panel */}
      {aiResult && (
        <div className="card p-6 space-y-4 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10">
                <Bot className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Grading Result</h2>
                <p className="text-xs text-slate-500">
                  Total: {aiResult.total_score}/{aiResult.max_score} &middot; {aiResult.elapsed_ms}ms
                </p>
              </div>
            </div>
            <button type="button" className="secondary text-sm" onClick={acceptAiGrade}>
              <X className="w-4 h-4" /> Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">Per-Question Scores</div>
              {Object.entries(aiResult.per_question).map(([qid, score]) => (
                <div key={qid} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-800/50 rounded text-sm mb-1">
                  <span className="truncate max-w-[240px] text-slate-600 dark:text-slate-400">{qid}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{score} pts</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">Feedback & Confidence</div>
              {Object.entries(aiResult.confidences).map(([qid, conf]) => (
                <div key={qid} className="py-1.5 px-3 rounded text-sm mb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="truncate max-w-[200px] text-xs text-slate-500">{qid}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getConfidenceColor(conf)}`}>
                      {Math.round(conf * 100)}% confidence
                    </span>
                  </div>
                  {aiResult.per_feedback[qid] && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{aiResult.per_feedback[qid]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-slate-500">
              AI grades are saved automatically. Review and override if needed using the manual Grade button. Low-confidence items (&lt;65%) should be reviewed carefully.
            </p>
          </div>
        </div>
      )}

      {/* View Submission Answers */}
      {viewSubmission && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Submission: {viewSubmission.student_id}
              </h2>
              <p className="text-xs text-slate-500">
                Attempt {viewSubmission.attempt} &middot; Status: {viewSubmission.status}
              </p>
            </div>
            <button type="button" className="secondary text-sm" onClick={() => setViewSubmission(null)}>
              <X className="w-4 h-4" /> Close
            </button>
          </div>

          {viewSubmission.answers && viewSubmission.answers.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {viewSubmission.answers.map((ans, i) => (
                <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Q{i + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{ans.question_id}</span>
                    {ans.selected_option_id && (
                      <span className="text-xs bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded">
                        Selected: {ans.selected_option_id}
                      </span>
                    )}
                  </div>
                  {ans.essay_text ? (
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ans.essay_text}</p>
                  ) : ans.selected_option_id ? (
                    <p className="text-sm text-slate-500">MCQ answer selected: {ans.selected_option_id}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No answer submitted</p>
                  )}
                  {viewSubmission.ai_per_feedback?.[ans.question_id] && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">AI Feedback: </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{viewSubmission.ai_per_feedback[ans.question_id]}</span>
                      {viewSubmission.ai_confidences?.[ans.question_id] != null && (
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getConfidenceColor(viewSubmission.ai_confidences[ans.question_id])}`}>
                          {Math.round(viewSubmission.ai_confidences[ans.question_id] * 100)}% confidence
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm py-4">No answers in this submission.</p>
          )}
        </div>
      )}

      {/* Manual Grade Panel */}
      {gradingId ? (
        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold mb-1">Apply Grade</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">This sets the submission status to GRADED.</p>
            </div>
            <button type="button" className="secondary" onClick={() => setGradingId(null)}>
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label>Total Score</label>
              <input type="number" value={gradeScore} onChange={(e) => setGradeScore(Number(e.target.value))} />
            </div>
            <div>
              <label>Feedback</label>
              <input value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} placeholder="Optional notes to student" />
            </div>
          </div>

          <div className="mt-4">
            <button type="button" className="bg-emerald-500 hover:bg-emerald-400 text-white flex items-center gap-2" onClick={saveGrade}>
              <CheckCircle className="w-4 h-4" />
              Save Grade
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
