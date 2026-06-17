import { useEffect, useState } from "react";
import { api } from "../api";

type Entry = { id: string; dayOfWeek: number; startTime: string; endTime: string; room?: string; virtualMeetingLink?: string; type: string; courseId?: string };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentTimetable() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => { api<Entry[]>("/timetable").then(setEntries).catch(() => {}); }, []);

  return (
    <div className="space-y-4 max-w-6xl">
      <h1 className="text-2xl font-bold">My Timetable</h1>
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, i) => {
          const dayEntries = entries.filter((e) => e.dayOfWeek === i).sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <div key={i} className="card p-2 min-h-[120px]">
              <h3 className="text-xs font-bold mb-1 text-center border-b pb-1">{day}</h3>
              {dayEntries.map((e) => (
                <div key={e.id} className="text-xs p-1 mb-1 rounded bg-sky-50 border border-sky-200">
                  <p className="font-semibold">{e.startTime}</p>
                  <p className="text-slate-500">{e.endTime}</p>
                  <p className="text-slate-600">{e.type}</p>
                  <p className="text-slate-400">{e.room || "—"}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
