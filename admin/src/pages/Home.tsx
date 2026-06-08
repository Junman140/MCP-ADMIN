import { useEffect, useState } from "react";
import { api, apiCBT } from "../api";
import { Users, BookOpen, Fingerprint, Activity, Clock, ShieldAlert, CheckSquare } from "lucide-react";
import { Link } from "react-router-dom";

type BioStats = {
  total_enrolled: number;
  total_verified: number;
};

type CbtStats = {
  total_students: number;
  registered_exams: number;
  passed_biometrics: number;
  exams_submitted: number;
};

type RecentEvent = {
  id: string;
  capturedAt: string;
  result: string;
  matchScore: number | null;
  student: { matricNo: string; fullName: string };
};

export default function Home() {
  const [bioStats, setBioStats] = useState<BioStats | null>(null);
  const [cbtStats, setCbtStats] = useState<CbtStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<BioStats>("/reports/cbt-stats").then(setBioStats).catch(() => {}),
      apiCBT<CbtStats>("/stats").then(setCbtStats).catch(() => {}),
      api<RecentEvent[]>("/reports/verification-events")
        .then((r) => setRecentEvents(r.slice(0, 6)))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Enrolled Students", value: bioStats?.total_enrolled ?? 0, icon: Fingerprint, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Cleared to Write", value: bioStats?.total_verified ?? 0, icon: Users, color: "text-sky-500", bg: "bg-sky-500/10" },
    { label: "Active Exams", value: cbtStats?.registered_exams ?? 0, icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Exams Submitted", value: cbtStats?.exams_submitted ?? 0, icon: Activity, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Monitor your biometric enrollments and CBT exam progress in real-time.
        </p>
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
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {loading ? "..." : stat.value.toLocaleString()}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/registration" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Enroll Student</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Capture biometrics for a new student.</p>
              </Link>
              
              <Link to="/verify" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Verify Identity</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Verify a student for exam entry.</p>
              </Link>
              
              <Link to="/cbt/manage" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Manage Exams</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Create and configure CBT exams.</p>
              </Link>

              <Link to="/reports" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">View Reports</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Export verification and exam reports.</p>
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            <Link to="/reports" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">View all</Link>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading activity...</p>
            ) : recentEvents.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
            ) : (
              recentEvents.map((evt) => {
                const isMatch = evt.result === "match" || evt.result === "already_verified";
                const isMismatch = evt.result === "mismatch";
                
                return (
                  <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div className={`mt-0.5 p-1.5 rounded-full ${
                      isMatch ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" :
                      isMismatch ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" :
                      "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                    }`}>
                      {isMatch ? <Fingerprint className="w-4 h-4" /> : 
                       isMismatch ? <ShieldAlert className="w-4 h-4" /> : 
                       <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {evt.student?.fullName || "Unknown Student"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {evt.student?.matricNo || "---"}
                      </p>
                      <p className={`text-xs mt-1 font-medium ${
                        isMatch ? "text-emerald-600 dark:text-emerald-400" :
                        isMismatch ? "text-red-600 dark:text-red-400" :
                        "text-amber-600 dark:text-amber-400"
                      }`}>
                        {evt.result.toUpperCase().replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(evt.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
