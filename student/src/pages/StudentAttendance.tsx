import { useEffect, useState } from "react";
import { api } from "../api";
import { QrCode, CheckCircle, XCircle, Clock } from "lucide-react";

type Session = { id: string; date: string; startTime?: string; courseId: string };
type Record = { id: string; sessionId: string; status: string; checkInAt?: string };

export default function StudentAttendance() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [qrText, setQrText] = useState("");

  useEffect(() => { api<Session[]>("/attendance/sessions").then(setSessions).catch(() => {}); }, []);

  async function checkIn(sessionId: string) {
    try {
      await api(`/attendance/sessions/${sessionId}/checkin`, {
        method: "POST",
        body: JSON.stringify({ checkInMethod: "qr" }),
      });
      api<Record[]>("/attendance/student/me").then(setRecords).catch(() => {});
    } catch (e) { alert("Check-in failed"); }
  }

  async function scanQr() {
    const code = prompt("Paste QR code value:");
    if (!code) return;
    const [sessionId] = code.split(":");
    if (sessionId) await checkIn(sessionId);
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-2xl font-bold">Attendance</h1>
      <div className="card p-4 flex items-center gap-4">
        <button className="btn-primary flex items-center gap-2" onClick={scanQr}>
          <QrCode className="w-5 h-5" /> Scan QR Code
        </button>
        <span className="text-sm text-slate-500">or use text input to paste QR code data</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-lg font-bold mb-3">Upcoming Sessions</h2>
          {sessions.slice(0, 10).map((s) => (
            <div key={s.id} className="flex justify-between items-center p-2 border-b last:border-0">
              <div>
                <p className="font-semibold text-sm">{new Date(s.date).toLocaleDateString()}</p>
                <p className="text-xs text-slate-500">{s.startTime}</p>
              </div>
              <button className="btn-secondary text-xs" onClick={() => checkIn(s.id)}>Check In</button>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="text-lg font-bold mb-3">My Records</h2>
          {records.map((r) => (
            <div key={r.id} className="flex items-center gap-2 p-2 border-b last:border-0">
              {r.status === "present" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                r.status === "late" ? <Clock className="w-4 h-4 text-amber-500" /> :
                <XCircle className="w-4 h-4 text-red-400" />}
              <span className="text-sm capitalize">{r.status}</span>
              {r.checkInAt && <span className="text-xs text-slate-400 ml-auto">{new Date(r.checkInAt).toLocaleTimeString()}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
