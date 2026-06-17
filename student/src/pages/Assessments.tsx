import { useEffect, useState } from "react";
import { api, getUser } from "../api";
import { FileText, Clock, Upload, Loader2 } from "lucide-react";

type Assignment = { id: string; courseId: string; title: string; deadline?: string; maxScore: number };
type QuizDef = { id: string; courseId: string; title: string; timeLimit?: number; questions?: { text: string; type: string; points: number }[] };
type Course = { id: string; code: string; title: string };
type QuizQuestion = { text: string; type: string; points: number; options?: { text: string }[] };
type QuizAttempt = { id: string; questions: QuizQuestion[] };

export default function Assessments() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDef[]>([]);
  const [tab, setTab] = useState<"assignments" | "quizzes">("assignments");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
  const [quizId, setQuizId] = useState("");
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { api<Course[]>("/courses").then(setCourses).catch(() => {}); }, []);

  useEffect(() => {
    if (selectedCourse) {
      api<Assignment[]>(`/assignments?courseId=${selectedCourse}`).then(setAssignments).catch(() => {});
      api<QuizDef[]>(`/quizzes?courseId=${selectedCourse}`).then(setQuizzes).catch(() => {});
    }
  }, [selectedCourse]);

  async function startQuiz(qid: string) {
    try {
      const a = await api<QuizAttempt>(`/quizzes/${qid}/start`, { method: "POST" });
      setQuizId(qid);
      setQuizAttempt(a);
      setAnswers({});
    } catch {}
  }

  async function submitQuiz() {
    if (!quizAttempt) return;
    setSubmitting(true);
    const formatted = quizAttempt.questions.map((q, i) => ({
      questionIndex: i,
      selectedOptions: answers[i] ?? [],
    }));
    try {
      await api(`/quizzes/${quizId}/submit`, {
        method: "POST",
        body: JSON.stringify({ attemptId: quizAttempt.id, answers: formatted }),
      });
      alert("Quiz submitted! Check Grades for results.");
    } catch {}
    setSubmitting(false);
    setQuizAttempt(null);
    setQuizId("");
  }

  if (quizAttempt) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quiz</h1>
          <span className="text-sm text-slate-500">{quizAttempt.questions.length} questions</span>
        </div>
        {quizAttempt.questions.map((q, qi) => (
          <div key={qi} className="card p-4">
            <p className="font-semibold mb-2">{qi + 1}. {q.text}</p>
            {q.options && q.options.map((o, oi) => (
              <label key={oi} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                <input type="checkbox" checked={(answers[qi] ?? []).includes(oi)}
                  onChange={(e) => {
                    setAnswers((prev) => {
                      const cur = new Set(prev[qi] ?? []);
                      e.target.checked ? cur.add(oi) : cur.delete(oi);
                      return { ...prev, [qi]: [...cur] };
                    });
                  }} />
                <span className="text-sm">{o.text}</span>
              </label>
            ))}
            {!q.options && (
              <textarea className="input mt-2" rows={3} placeholder="Your answer..." value={(answers[qi] ?? []).join("")}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [qi]: [e.target.value as unknown as number] }))} />
            )}
          </div>
        ))}
        <button className="btn-primary w-full" onClick={submitQuiz} disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 inline animate-spin" /> : null} Submit Quiz
        </button>
      </div>
    );
  }

  const user = getUser();

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-2xl font-bold">Assessments</h1>
      <select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
        <option value="">Select a course...</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
      </select>

      <div className="flex gap-2">
        <button className={`px-4 py-2 rounded-lg text-sm ${tab === "assignments" ? "bg-sky-600 text-white" : "border"}`} onClick={() => setTab("assignments")}>Assignments</button>
        <button className={`px-4 py-2 rounded-lg text-sm ${tab === "quizzes" ? "bg-sky-600 text-white" : "border"}`} onClick={() => setTab("quizzes")}>Quizzes</button>
      </div>

      {tab === "assignments" && assignments.map((a) => (
        <div key={a.id} className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-sky-500" />
            <div>
              <p className="font-semibold">{a.title}</p>
              <p className="text-sm text-slate-500">Max: {a.maxScore} | Due: {a.deadline ? new Date(a.deadline).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
          <label className="btn-secondary text-sm cursor-pointer flex items-center gap-1">
            {uploading === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading === a.id ? "Uploading..." : "Submit"}
            <input type="file" hidden onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(a.id);
              const form = new FormData();
              form.append("file", file);
              await fetch(`/api/assignments/${a.id}/submit`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                body: form,
              });
              setUploading(null);
              alert("Submitted!");
            }} />
          </label>
        </div>
      ))}

      {tab === "quizzes" && quizzes.map((q) => (
        <div key={q.id} className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-semibold">{q.title}</p>
              <p className="text-sm text-slate-500">{q.questions?.length ?? 0} questions | {q.timeLimit ? `${q.timeLimit} min` : "No limit"}</p>
            </div>
          </div>
          <button className="btn-primary text-sm" onClick={() => startQuiz(q.id)}>Start Quiz</button>
        </div>
      ))}
    </div>
  );
}
