import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, CalendarClock, X } from "lucide-react";
import { Button, Card, EmptyState, Input, PageHeader, Select } from "@bio/ui";

type Entry = { id: string; day: string; timeSlot: string; courseId: string; courseCode: string; room: string };

export default function TimetableViewer() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [day, setDay] = useState("Monday");
  const [timeSlot, setTimeSlot] = useState("");
  const [courseId, setCourseId] = useState("");
  const [room, setRoom] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api<Entry[]>("/timetable")
      .then(setEntries)
      .catch(() => setError("Failed to load timetable"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createEntry() {
    if (!day || !timeSlot.trim() || !courseId.trim()) return;
    try {
      setError("");
      await api("/timetable", {
        method: "POST",
        body: JSON.stringify({ day, timeSlot: timeSlot.trim(), courseId: courseId.trim(), room: room.trim() || undefined }),
      });
      setTimeSlot("");
      setCourseId("");
      setRoom("");
      load();
    } catch { setError("Failed to create entry"); }
  }

  async function deleteEntry(id: string) {
    try {
      setError("");
      await api(`/timetable/${id}`, { method: "DELETE" });
      setEntries(entries.filter(e => e.id !== id));
    } catch { setError("Failed to delete entry"); }
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="space-y-6">
      <PageHeader title="Timetable" subtitle="View and manage your weekly teaching schedule." />

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>
      )}

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          <Plus className="h-4 w-4 text-brand-500" /> Add Timetable Entry
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <Select value={day} onChange={e => setDay(e.target.value)}>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Input placeholder="Time (e.g. 09:00-10:00)" value={timeSlot} onChange={e => setTimeSlot(e.target.value)} />
          <Input placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          <Input placeholder="Room (optional)" value={room} onChange={e => setRoom(e.target.value)} />
          <Button variant="primary" onClick={createEntry}>Add</Button>
        </div>
      </Card>

      {loading && <p className="text-sm text-[var(--bio-muted)]">Loading...</p>}
      {!loading && entries.length === 0 && (
        <EmptyState title="No timetable entries found" hint="Add your first entry with the form above." />
      )}

      {days.map(d => {
        const dayEntries = entries.filter(e => e.day === d).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        if (dayEntries.length === 0) return null;
        return (
          <Card key={d}>
            <h3 className="mb-3 flex items-center gap-2 border-b border-[var(--bio-border)] pb-3 text-base font-semibold text-slate-800 dark:text-slate-100">
              <CalendarClock className="h-4 w-4 text-brand-500" /> {d}
            </h3>
            <div className="divide-y divide-[var(--bio-border)]">
              {dayEntries.map(e => (
                <div key={e.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <span className="min-w-[100px] text-sm font-semibold text-brand-600 dark:text-brand-400">{e.timeSlot}</span>
                    <span className="text-sm text-slate-800 dark:text-slate-100">{e.courseCode || e.courseId}</span>
                    {e.room && <span className="text-xs text-[var(--bio-muted)]">Room: {e.room}</span>}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => deleteEntry(e.id)}
                    className="self-start px-2 py-1 text-rose-500 hover:text-rose-700 dark:text-rose-400 sm:self-auto"
                    aria-label="Delete entry"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
