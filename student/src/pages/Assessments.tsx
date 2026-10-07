import { useEffect, useState } from "react";
import { api } from "../api";
import { FileText, Clock, Upload, Loader2 } from "lucide-react";
import { Button, Card, PageHeader, Select, Tabs } from "@bio/ui";

type Assignment = { id: string; courseId: string; title: string; deadline?: string; maxScore: number };
type QuizDef = { id: string; courseId: string; title: string; timeLimit?: number; questions?: { _id: string; text: string; type: string; points: number; options?: string[] }[] };
type Course = { id: string; code: string; title: string };
type QuizAttempt = { id: string };

export default function Assessments() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDef[]>([]);
  const [tab, setTab] = useState<"assignments" | "quizzes">("assignments");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizDef | null>(null);
  const [quizId, setQuizId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<Course[]>("/courses")
      .then(setCourses)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      api<Assignment[]>(`/assignments?courseId=${selectedCourse}`)
        .then(setAssignments)
        .catch(() => {});
      api<QuizDef[]>(`/quizzes?courseId=${selectedCourse}`)
        .then(setQuizzes)
        .catch(() => {});
    }
  }, [selectedCourse]);

  async function startQuiz(qid: string) {
    try {
      const a = await api<QuizAttempt>(`/quizzes/${qid}/start`, { method: "POST" });
      const quiz = quizzes.find((q) => q.id === qid);
      setQuizId(qid);
      setQuizAttempt(a);
      setActiveQuiz(quiz ?? null);
      setAnswers({});
    } catch {}
  }

  async function submitQuiz() {
    if (!quizAttempt) return;
    setSubmitting(true);
    try {
      await api(`/quizzes/${quizId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      alert("Quiz submitted! Check Grades for results.");
    } catch {}
    setSubmitting(false);
    setQuizAttempt(null);
    setActiveQuiz(null);
    setQuizId("");
  }

  if (quizAttempt && activeQuiz) {
    const questions = activeQuiz.questions ?? [];
    return (
      <div className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{activeQuiz.title}</h1>
          <span className="text-sm text-[var(--bio-muted)]">{questions.length} questions</span>
        </div>
        {questions.map((q) => (
          <Card key={q._id} className="p-4">
            <p className="mb-2 font-semibold text-slate-800 dark:text-slate-100">{q.text}</p>
            {q.type === "multiple-choice" && q.options ? (
              q.options.map((opt, oi) => (
                <label key={oi} className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input
                    type="radio"
                    name={q._id}
                    checked={answers[q._id] === opt}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: opt }))}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))
            ) : q.type === "true-false" ? (
              ["True", "False"].map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input
                    type="radio"
                    name={q._id}
                    checked={answers[q._id] === opt}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: opt }))}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))
            ) : (
              <textarea
                className="input mt-2 w-full"
                rows={3}
                placeholder="Your answer…"
                value={answers[q._id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q._id]: e.target.value }))}
              />
            )}
          </Card>
        ))}
        <Button className="w-full" onClick={submitQuiz} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit Quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title="Assessments" subtitle="Submit assignments and take quizzes for your courses." />

      <Select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
        <option value="">Select a course…</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} - {c.title}
          </option>
        ))}
      </Select>

      <Tabs<"assignments" | "quizzes">
        tabs={[
          { id: "assignments", label: "Assignments" },
          { id: "quizzes", label: "Quizzes" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "assignments" &&
        (assignments.length === 0 ? (
          <p className="py-8 text-center text-[var(--bio-muted)]">Select a course to see assignments.</p>
        ) : (
          assignments.map((a) => (
            <Card key={a.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-brand-500" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{a.title}</p>
                  <p className="text-sm text-[var(--bio-muted)]">
                    Max: {a.maxScore} | Due: {a.deadline ? new Date(a.deadline).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              <label className="btn-secondary flex cursor-pointer items-center gap-1 text-sm">
                {uploading === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading === a.id ? "Uploading…" : "Submit"}
                <input
                  type="file"
                  hidden
                  onChange={async (e) => {
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
                  }}
                />
              </label>
            </Card>
          ))
        ))}

      {tab === "quizzes" &&
        (quizzes.length === 0 ? (
          <p className="py-8 text-center text-[var(--bio-muted)]">Select a course to see quizzes.</p>
        ) : (
          quizzes.map((q) => (
            <Card key={q.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{q.title}</p>
                  <p className="text-sm text-[var(--bio-muted)]">
                    {q.questions?.length ?? 0} questions | {q.timeLimit ? `${q.timeLimit} min` : "No limit"}
                  </p>
                </div>
              </div>
              <Button variant="primary" className="text-sm" onClick={() => startQuiz(q.id)}>
                Start Quiz
              </Button>
            </Card>
          ))
        ))}
    </div>
  );
}
