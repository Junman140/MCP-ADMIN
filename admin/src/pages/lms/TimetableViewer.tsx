import { useEffect, useState } from "react";
import { api } from "../../api";
import { Plus, Trash2, Video, MapPin } from "lucide-react";

type Entry = {
  id: string; courseId?: string; lecturerId?: string; dayOfWeek: number; startTime: string;
  endTime: string; room?: string; virtualMeetingLink?: string; type: string;
};
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetableViewer() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [courses, setCourses] = useState<{ id: string; code: string; title: string }[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [room, setRoom] = useState("");
  const [virtualLink, setVirtualLink] = useState("");
  const [type, setType] = useState("lecture");
  const [courseId, setCourseId] = useState("");

  useEffect(() => { api<{ id: string; code: string; title: string }[]>("/courses").then(setCourses).catch(() => {}); }, []);
  useEffect(() => { api<Entry[]>("/timetable").then(setEntries).catch(() => {}); }, []);

  async function add() {
    if (!startTime || !endTime) return;
    await api("/timetable", {
      method: "POST",
      body: JSON.stringify({
        dayOfWeek: parseInt(dayOfWeek), startTime, endTime,
        room: room || undefined, virtualMeetingLink: virtualLink || undefined,
        type, courseId: courseId || undefined,
      }),
    });
    api<Entry[]>("/timetable").then(setEntries).catch(() => {});
  }

  async function remove(id: string) {
    await api(`/timetable/${id}`, { method: "DELETE" });
    api<Entry[]>("/timetable").then(setEntries).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Timetable</h1>
      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-bold">Add Entry</h2>
        <div className="flex gap-2 flex-wrap">
          <select className="input" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <input className="input w-24" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <input className="input w-24" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          <input className="input flex-1" placeholder="Room" value={room} onChange={(e) => setRoom(e.target.value)} />
          <input className="input flex-1" placeholder="Virtual link" value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)} />
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="lecture">Lecture</option>
            <option value="tutorial">Tutorial</option>
            <option value="lab">Lab</option>
            <option value="office_hour">Office Hour</option>
          </select>
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Select course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          <button className="btn-primary" onClick={add}><Plus className="w-4 h-4 inline" /> Add</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, i) => {
          const dayEntries = entries.filter((e) => e.dayOfWeek === i).sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <div key={i} className="card p-2 min-h-[100px]">
              <h3 className="text-xs font-bold mb-1 text-center">{day.slice(0, 3)}</h3>
              {dayEntries.map((e) => (
                <div key={e.id} className="text-xs p-1 mb-1 rounded bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800">
                  <p className="font-semibold">{e.startTime}-{e.endTime}</p>
                  <p>{e.room || "—"}</p>
                  <div className="flex gap-1 mt-1">
                    {e.virtualMeetingLink && <Video className="w-3 h-3 text-sky-500" />}
                    {e.room && <MapPin className="w-3 h-3 text-emerald-500" />}
                    <button className="text-red-400 hover:text-red-600 ml-auto" onClick={() => remove(e.id)}><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
