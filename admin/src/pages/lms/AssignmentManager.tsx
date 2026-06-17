import { useEffect, useState } from "react";
import { api } from "../../api";
import { Plus, Trash2, FileText } from "lucide-react";

type Assignment = { id: string; courseId: string; title: string; deadline?: string; maxScore: number };

export default function AssignmentManager() {
  const [courses, setCourses] = useState<{ id: string; code: string; title: string }[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState("100");

  useEffect(() => { api<{ id: string; code: string; title: string }[]>("/courses").then(setCourses).catch(() => {}); }, []);

  useEffect(() => {
    if (selectedCourse) api<Assignment[]>(`/assignments?courseId=${selectedCourse}`).then(setAssignments).catch(() => {});
  }, [selectedCourse]);

  async function create() {
    if (!title || !selectedCourse) return;
    await api("/assignments", { method: "POST", body: JSON.stringify({ courseId: selectedCourse, title, deadline: deadline || undefined, maxScore: parseInt(maxScore) }) });
    setTitle(""); setDeadline(""); setMaxScore("100");
    api<Assignment[]>(`/assignments?courseId=${selectedCourse}`).then(setAssignments).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Assignment Manager</h1>
      <select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
        <option value="">Select a course...</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
      </select>
      {selectedCourse && (
        <div className="card p-4 space-y-3">
          <h2 className="text-lg font-bold">Create Assignment</h2>
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <input className="input flex-1" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <input className="input w-24" type="number" placeholder="Score" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={create}><Plus className="w-4 h-4 inline" /> Create</button>
        </div>
      )}
      {assignments.length > 0 && (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div key={a.id} className="card p-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-sky-500" />
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-slate-500">Due: {a.deadline ? new Date(a.deadline).toLocaleDateString() : "N/A"} | Max: {a.maxScore}</p>
                </div>
              </div>
              <button className="text-red-400 hover:text-red-600" onClick={async () => {
                await api(`/assignments/${a.id}`, { method: "DELETE" });
                api<Assignment[]>(`/assignments?courseId=${selectedCourse}`).then(setAssignments).catch(() => {});
              }}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
