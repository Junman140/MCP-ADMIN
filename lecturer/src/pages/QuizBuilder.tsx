import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, ClipboardList, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, PageHeader } from "@bio/ui";

type Quiz = { id: string; title: string; courseId: string; questionCount: number };

export default function QuizBuilder() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api<Quiz[]>("/quizzes")
      .then(setQuizzes)
      .catch(() => setError("Failed to load quizzes"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createQuiz() {
    if (!title.trim() || !courseId.trim()) return;
    try {
      setError("");
      await api("/quizzes", { method: "POST", body: JSON.stringify({ title: title.trim(), courseId: courseId.trim() }) });
      setTitle("");
      setCourseId("");
      load();
    } catch { setError("Failed to create quiz"); }
  }

  async function deleteQuiz(id: string) {
    try {
      setError("");
      await api(`/quizzes/${id}`, { method: "DELETE" });
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch { setError("Failed to delete quiz"); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quiz Builder" subtitle="Create quizzes and manage question banks." />

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>
      )}

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <Plus className="h-4 w-4 text-brand-500" /> Create Quiz
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
          <Input placeholder="Quiz title" value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          <Button variant="primary" onClick={createQuiz}>Create</Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <ClipboardList className="h-4 w-4 text-brand-500" /> Quizzes
        </h3>
        {loading && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
        {!loading && quizzes.length === 0 && <p className="text-sm text-[var(--bio-muted)]">No quizzes found</p>}
        <div className="divide-y divide-[var(--bio-border)]">
          {quizzes.map(q => (
            <div key={q.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{q.title}</p>
                <p className="text-xs text-[var(--bio-muted)]">Course: {q.courseId}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="brand">{q.questionCount ?? 0} questions</Badge>
                <Button
                  variant="secondary"
                  onClick={() => deleteQuiz(q.id)}
                  className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
