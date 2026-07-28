import { useEffect, useState } from "react";
import { api } from "../api";

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

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", width: "100%",
  };
  const btnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap",
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Timetable</h1>
      {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.5rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}

      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Add Timetable Entry</h3>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <select style={inputStyle} value={day} onChange={e => setDay(e.target.value)}>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <input style={inputStyle} placeholder="Time (e.g. 09:00-10:00)" value={timeSlot} onChange={e => setTimeSlot(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <input style={inputStyle} placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <input style={inputStyle} placeholder="Room (optional)" value={room} onChange={e => setRoom(e.target.value)} />
          </div>
          <button onClick={createEntry} style={btnStyle}>Add</button>
        </div>
      </div>

      {loading && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
      {!loading && entries.length === 0 && (
        <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", textAlign: "center" }}>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No timetable entries found</p>
        </div>
      )}

      {days.map(d => {
        const dayEntries = entries.filter(e => e.day === d).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        if (dayEntries.length === 0) return null;
        return (
          <div key={d} style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "1rem", overflow: "hidden" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.9rem", background: "#f8fafc" }}>{d}</div>
            {dayEntries.map(e => (
              <div key={e.id} style={{ padding: "0.6rem 1rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2563eb", minWidth: 100 }}>{e.timeSlot}</span>
                  <span style={{ fontSize: "0.85rem" }}>{e.courseCode || e.courseId}</span>
                  {e.room && <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Room: {e.room}</span>}
                </div>
                <button onClick={() => deleteEntry(e.id)}
                  style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem" }}>x</button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
