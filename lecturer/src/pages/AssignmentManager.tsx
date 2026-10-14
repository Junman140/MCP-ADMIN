import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, FileText, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, PageHeader } from "@bio/ui";

type Assignment = { id: string; title: string; courseId: string; dueDate: string; submissions: number };

export default function AssignmentManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api<Assignment[]>("/assignments")
      .then(setAssignments)
      .catch(() => setError("Failed to load assignments"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createAssignment() {
    if (!title.trim() || !courseId.trim()) return;
    try {
      setError("");
      await api("/assignments", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), courseId: courseId.trim(), dueDate: dueDate || undefined }),
      });
      setTitle("");
      setCourseId("");
      setDueDate("");
      load();
    } catch { setError("Failed to create assignment"); }
  }

  async function deleteAssignment(id: string) {
    try {
      setError("");
      await api(`/assignments/${id}`, { method: "DELETE" });
      setAssignments(assignments.filter(a => a.id !== id));
    } catch { setError("Failed to delete assignment"); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Assignment Manager" subtitle="Create assignments and track submissions." />

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>
      )}

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <Plus className="h-4 w-4 text-brand-500" /> Create Assignment
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <Input className="lg:col-span-2" placeholder="Assignment title" value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <Button variant="primary" onClick={createAssignment} className="sm:col-span-2 lg:col-span-4">Create</Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <FileText className="h-4 w-4 text-brand-500" /> Assignments
        </h3>
        {loading && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
        {!loading && assignments.length === 0 && <p className="text-sm text-[var(--bio-muted)]">No assignments found</p>}
        <div className="divide-y divide-[var(--bio-border)]">
          {assignments.map(a => (
            <div key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.title}</p>
                <p className="text-xs text-[var(--bio-muted)]">
                  Course: {a.courseId} {a.dueDate && ` · Due: ${new Date(a.dueDate).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="brand">{a.submissions ?? 0} submissions</Badge>
                <Button
                  variant="secondary"
                  onClick={() => deleteAssignment(a.id)}
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
