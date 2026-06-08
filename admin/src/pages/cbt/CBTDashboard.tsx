import { useEffect, useRef, useState } from "react";
import { apiCBT } from "../../api";
import { Users, FileText, CheckCircle, AlertCircle, Radio, Focus, AlertTriangle, Activity, Wifi, WifiOff } from "lucide-react";

interface Stats {
  total_students: number;
  registered_exams: number;
  passed_biometrics: number;
  exams_submitted: number;
}

interface Exam {
  id: string;
  course_name?: string;
  course_id?: string;
  department_name?: string;
  department_id?: string;
  level?: string;
  type?: string;
  metadata: { title: string };
}

interface TelemetryEvent {
  student_id: string;
  exam_id: string;
  status: string;
  focus: boolean;
  violation: string;
  timestamp: string;
}

const MAX_FEED = 50;

export default function CBTDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [err, setErr] = useState("");
  const [feed, setFeed] = useState<TelemetryEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [examFilter, setExamFilter] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    Promise.all([
      apiCBT<Stats>("/stats"),
      apiCBT<Exam[]>("/exams"),
    ])
      .then(([s, e]) => { setStats(s); setExams(e || []); })
      .catch((e) => setErr(String(e)));
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const query = examFilter ? `?exam_id=${encodeURIComponent(examFilter)}` : "";
    const url = `${protocol}//${host}/cbt-api/telemetry/stream${query}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (e) => {
      try {
        const event: TelemetryEvent = JSON.parse(e.data);
        setFeed((prev) => [event, ...prev].slice(0, MAX_FEED));
      } catch {}
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [examFilter]);

  if (err) return <p className="error">{err}</p>;
  if (!stats) return <p className="text-slate-500 py-8 text-center">Loading stats...</p>;

  const statCards = [
    { label: "Total Students", value: stats.total_students.toLocaleString(), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Exams Created", value: stats.registered_exams.toLocaleString(), icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Cleared to Write", value: stats.passed_biometrics.toLocaleString(), icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Exams Submitted", value: stats.exams_submitted.toLocaleString(), icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  const violations = feed.filter((e) => e.violation);
  const activeCount = feed.filter((e) => e.status === "active" || e.status === "started").length;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">CBT Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Overview of computer-based testing statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card flex items-center p-6 gap-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Academic Breakdown */}
      {exams.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Exams by Course</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto">
            {(() => {
              const grouped: Record<string, { name: string; dept: string; level: string; count: number; qCount: number }> = {};
              exams.forEach((e) => {
                const key = e.course_id || e.course_name || e.metadata.title;
                if (!grouped[key]) {
                  grouped[key] = {
                    name: e.course_name || e.course_id || e.metadata.title,
                    dept: e.department_name || e.department_id || "",
                    level: e.level || "",
                    count: 0,
                    qCount: 0,
                  };
                }
                grouped[key].count++;
                grouped[key].qCount += (e as any).questions?.length || 0;
              });
              return Object.entries(grouped).map(([key, g]) => (
                <div key={key} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-sky-200 dark:hover:border-sky-700 transition-colors">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{g.name}</p>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    {g.dept && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{g.dept}</span>}
                    {g.level && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{g.level}L</span>}
                  </div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-sky-600 dark:text-sky-400 font-medium">{g.count} exam(s)</span>
                    <span className="text-slate-500">{g.qCount} questions</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Live Telemetry */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <Radio className={`w-5 h-5 ${connected ? "text-emerald-500" : "text-slate-400"}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Telemetry</h2>
              <p className="text-xs text-slate-500">
                {connected ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Wifi className="w-3 h-3" /> Connected &middot; {feed.length} events &middot; {activeCount} active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400">
                    <WifiOff className="w-3 h-3" /> Disconnected — waiting for exam activity
                  </span>
                )}
              </p>
            </div>
          </div>
          <input
            type="text"
            placeholder="Filter by Exam ID..."
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 w-48"
          />
        </div>

        {/* Summary Bubbles */}
        {feed.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              {activeCount} Active
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300">
              {feed.filter((e) => e.focus).length} In Focus
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300">
              {violations.length} Violations
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
              {feed.length} Total Events
            </span>
          </div>
        )}

        {/* Event Feed */}
        {feed.length === 0 ? (
          <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="text-center space-y-2">
              <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No telemetry events yet. Students will appear here when they start exams.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-auto max-h-[400px] rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-3 font-medium">Time</th>
                  <th className="py-2 px-3 font-medium">Student</th>
                  <th className="py-2 px-3 font-medium">Exam</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Focus</th>
                  <th className="py-2 px-3 font-medium">Violation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {feed.map((evt, i) => (
                  <tr key={i} className={`${evt.violation ? "bg-red-50 dark:bg-red-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                    <td className="py-2 px-3 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">{evt.student_id}</td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">{evt.exam_id.slice(0, 8)}...</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                        evt.status === "active" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" :
                        evt.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" :
                        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      }`}>
                        {evt.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {evt.focus ? (
                        <Focus className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {evt.violation ? (
                        <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {evt.violation}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
