import { useEffect, useState } from "react";
import { api } from "../../api";
import { TrendingUp, BarChart3, AlertTriangle } from "lucide-react";

type Engagement = { courseId: string; totalEnrolled: number; averageAttendanceRate: number };
type Distribution = { courseId: string; distribution: Record<string, number>; totalGraded: number };
type AtRisk = { id: string; matricNo: string; fullName: string; failingCourses: number }[];

export default function LMSAnalytics() {
  const [courses, setCourses] = useState<{ id: string; code: string; title: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [atRisk, setAtRisk] = useState<AtRisk>([]);

  useEffect(() => { api<{ id: string; code: string; title: string }[]>("/courses").then(setCourses).catch(() => {}); }, []);
  useEffect(() => { api<AtRisk>("/analytics/at-risk").then(setAtRisk).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    api<Engagement>(`/analytics/engagement/${selectedCourse}`).then(setEngagement).catch(() => {});
    api<Distribution>(`/analytics/grade-distribution/${selectedCourse}`).then(setDistribution).catch(() => {});
  }, [selectedCourse]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">LMS Analytics</h1>
      <select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
        <option value="">Select a course...</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
      </select>

      {selectedCourse && engagement && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-emerald-500" /><h2 className="text-lg font-bold">Engagement</h2></div>
            <p className="text-sm text-slate-500">Total Enrolled: <strong>{engagement.totalEnrolled}</strong></p>
            <p className="text-sm text-slate-500">Attendance Rate: <strong>{engagement.averageAttendanceRate}%</strong></p>
          </div>
          {distribution && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-5 h-5 text-sky-500" /><h2 className="text-lg font-bold">Grade Distribution</h2></div>
              <div className="flex gap-3">
                {Object.entries(distribution.distribution).map(([grade, count]) => (
                  <div key={grade} className="text-center">
                    <div className="text-lg font-bold">{count}</div>
                    <div className="text-xs text-slate-400">{grade}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Total graded: {distribution.totalGraded}</p>
            </div>
          )}
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-red-500" /><h2 className="text-lg font-bold">At-Risk Students</h2></div>
        {atRisk.length === 0 ? (
          <p className="text-sm text-slate-400">No at-risk students detected.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="p-2 text-left">Matric No</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Failing Courses</th></tr></thead>
            <tbody>
              {atRisk.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2">{s.matricNo}</td>
                  <td className="p-2">{s.fullName}</td>
                  <td className="p-2 text-red-500 font-bold">{s.failingCourses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
