import { useEffect, useState } from "react";
import { api } from "../../api";
import { Plus, QrCode } from "lucide-react";

type Session = { id: string; courseId: string; date: string; startTime?: string; endTime?: string; hallLabel?: string; qrCode?: string };
type Record = { id: string; studentId: string; status: string; checkInMethod: string; checkInAt?: string };

export default function AttendanceManager() {
  const [courses, setCourses] = useState<{ id: string; code: string; title: string }[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [hallLabel, setHallLabel] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => { api<{ id: string; code: string; title: string }[]>("/courses").then(setCourses).catch(() => {}); }, []);

  useEffect(() => {
    if (selectedCourse) api<Session[]>(`/attendance/sessions?courseId=${selectedCourse}`).then(setSessions).catch(() => {});
  }, [selectedCourse]);

  async function createSession() {
    if (!selectedCourse) return;
    await api("/attendance/sessions", {
      method: "POST",
      body: JSON.stringify({ courseId: selectedCourse, date, startTime, endTime, hallLabel: hallLabel || undefined }),
    });
    api<Session[]>(`/attendance/sessions?courseId=${selectedCourse}`).then(setSessions).catch(() => {});
  }

  async function showQr(sessionId: string) {
    setSelectedSession(sessionId);
    const res = await api<{ qrCode: string }>(`/attendance/sessions/${sessionId}/qr`);
    setQrImage(res.qrCode);
    api<Record[]>(`/attendance/sessions/${sessionId}/report`).then(setRecords).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Attendance Manager</h1>
      <select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
        <option value="">Select a course...</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
      </select>

      {selectedCourse && (
        <div className="card p-4 space-y-3">
          <h2 className="text-lg font-bold">Create Session</h2>
          <div className="flex gap-2">
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input className="input w-24" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <input className="input w-24" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            <input className="input flex-1" placeholder="Hall (optional)" value={hallLabel} onChange={(e) => setHallLabel(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={createSession}><Plus className="w-4 h-4 inline" /> Create</button>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="card p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold">{new Date(s.date).toLocaleDateString()} {s.startTime}-{s.endTime}</p>
                <p className="text-sm text-slate-500">{s.hallLabel || "No hall"}</p>
              </div>
              <button className="btn-secondary text-sm flex items-center gap-1" onClick={() => showQr(s.id)}>
                <QrCode className="w-4 h-4" /> QR Code
              </button>
            </div>
          ))}
        </div>
      )}

      {qrImage && (
        <div className="card p-4 space-y-3">
          <h2 className="text-lg font-bold">Check-in QR Code</h2>
          <img src={qrImage} alt="QR Code" className="w-64 h-64" />
          <h3 className="font-semibold mt-3">Attendance Records</h3>
          <div className="space-y-1">
            {records.map((r) => (
              <div key={r.id} className="flex justify-between text-sm p-2 bg-slate-50 dark:bg-slate-900/50 rounded">
                <span>{r.studentId.slice(0, 8)}...</span>
                <span className={`capitalize ${r.status === "present" ? "text-emerald-500" : r.status === "late" ? "text-amber-500" : "text-red-500"}`}>{r.status}</span>
                <span className="text-slate-400">{r.checkInMethod}</span>
              </div>
            ))}
            {records.length === 0 && <p className="text-sm text-slate-400">No check-ins yet</p>}
          </div>
        </div>
      )}
    </div>
  );
}
