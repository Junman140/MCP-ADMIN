import { useEffect, useState } from "react";
import { api } from "../../api";
import { Plus, Trash2, Edit3 } from "lucide-react";

type QuizDef = { id: string; courseId: string; title: string; timeLimit?: number; questions?: { text: string; type: string; points: number }[] };

export default function QuizBuilder() {
  const [courses, setCourses] = useState<{ id: string; code: string; title: string }[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDef[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [questions, setQuestions] = useState<{ text: string; type: string; points: number; options: { text: string; isCorrect: boolean }[] }[]>([{ text: "", type: "multiple_choice", points: 1, options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] }]);

  useEffect(() => {
    api<{ id: string; code: string; title: string }[]>("/courses").then(setCourses).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCourse) api<QuizDef[]>(`/quizzes?courseId=${selectedCourse}`).then(setQuizzes).catch(() => {});
  }, [selectedCourse]);

  async function createQuiz() {
    if (!title || !selectedCourse) return;
    const q = questions.filter((q) => q.text.trim());
    await api("/quizzes", {
      method: "POST",
      body: JSON.stringify({ courseId: selectedCourse, title, timeLimit: timeLimit ? parseInt(timeLimit) : undefined, questions: q }),
    });
    setTitle(""); setTimeLimit(""); setQuestions([{ text: "", type: "multiple_choice", points: 1, options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] }]);
    api<QuizDef[]>(`/quizzes?courseId=${selectedCourse}`).then(setQuizzes).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Quiz Builder</h1>
      <select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
        <option value="">Select a course...</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
      </select>

      {selectedCourse && (
        <div className="card p-4 space-y-3">
          <h2 className="text-lg font-bold">Create Quiz</h2>
          <input className="input" placeholder="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input" type="number" placeholder="Time limit (minutes)" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />

          {questions.map((q, qi) => (
            <div key={qi} className="border p-3 rounded space-y-2">
              <div className="flex gap-2">
                <input className="input flex-1" placeholder={`Question ${qi + 1}`} value={q.text} onChange={(e) => {
                  const qq = [...questions]; qq[qi].text = e.target.value; setQuestions(qq);
                }} />
                <select className="input w-40" value={q.type} onChange={(e) => {
                  const qq = [...questions]; qq[qi].type = e.target.value; setQuestions(qq);
                }}>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="essay">Essay</option>
                </select>
              </div>
              {q.type === "multiple_choice" && (q.options ?? []).map((o, oi) => (
                <div key={oi} className="flex gap-2 items-center">
                  <input type="checkbox" checked={o.isCorrect} onChange={(e) => {
                    const qq = [...questions];
                    qq[qi].options![oi].isCorrect = e.target.checked;
                    setQuestions(qq);
                  }} />
                  <input className="input flex-1" placeholder={`Option ${oi + 1}`} value={o.text} onChange={(e) => {
                    const qq = [...questions]; qq[qi].options![oi].text = e.target.value; setQuestions(qq);
                  }} />
                </div>
              ))}
              <button className="text-red-500 text-sm" onClick={() => setQuestions(questions.filter((_, i) => i !== qi))}>Remove</button>
            </div>
          ))}

          <button className="btn-secondary text-sm" onClick={() => setQuestions([...questions, { text: "", type: "multiple_choice", points: 1, options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] }])}>
            <Plus className="w-4 h-4 inline" /> Add Question
          </button>

          <button className="btn-primary" onClick={createQuiz}>Create Quiz</button>
        </div>
      )}

      {quizzes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold">Existing Quizzes</h2>
          {quizzes.map((q) => (
            <div key={q.id} className="card p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold">{q.title}</p>
                <p className="text-sm text-slate-500">{q.questions?.length ?? 0} questions | {q.timeLimit ? `${q.timeLimit}min` : "No limit"}</p>
              </div>
              <button className="text-red-400 hover:text-red-600" onClick={async () => {
                await api(`/quizzes/${q.id}`, { method: "DELETE" });
                api<QuizDef[]>(`/quizzes?courseId=${selectedCourse}`).then(setQuizzes).catch(() => {});
              }}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
