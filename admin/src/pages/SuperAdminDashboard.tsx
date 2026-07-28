import { useEffect, useState, createContext, useContext } from "react";
import { api, clearSession, getUser } from "../api";

type TenantSummary = { id: string; name: string; slug: string; students: number; lecturers: number; courses: number; verifications: number; createdAt: string };
type DashboardData = { totalTenants: number; totalStudents: number; totalLecturers: number; totalCourses: number; tenants: TenantSummary[] };
type StatsData = { id: string; name: string; slug: string; students: number; lecturers: number; courses: number; registrations: number; verifications: number; admins: { email: string; displayName: string }[]; createdAt: string };

type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });

const colors: Record<Theme, Record<string, string>> = {
  light: { bg: "#f8fafc", card: "#fff", text: "#0f172a", sub: "#64748b", border: "#e2e8f0", accent: "#3b82f6", danger: "#dc2626", warn: "#f59e0b", success: "#16a34a", headerBg: "#f1f5f9", rowBorder: "#f1f5f9" },
  dark: { bg: "#0f172a", card: "#1e293b", text: "#f1f5f9", sub: "#94a3b8", border: "#334155", accent: "#60a5fa", danger: "#ef4444", warn: "#fbbf24", success: "#22c55e", headerBg: "#1e293b", rowBorder: "#334155" },
};

function StatCard({ label, value, accent = false, t }: { label: string; value: number | string; accent?: boolean; t: Record<string, string> }) {
  return (
    <div style={{ background: accent ? t.accent : t.card, color: accent ? "#fff" : t.text, padding: "clamp(1rem, 2vw, 1.5rem)", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: accent ? "none" : `1px solid ${t.border}`, transition: "all 0.2s" }}>
      <p style={{ fontSize: "0.8rem", color: accent ? "rgba(255,255,255,0.8)" : t.sub, margin: 0, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: "clamp(1.25rem, 3vw, 2rem)", fontWeight: 700, margin: "0.25rem 0 0" }}>{value}</p>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "light");
  const t = colors[theme];
  const toggleTheme = () => { const n = theme === "light" ? "dark" : "light"; setTheme(n); localStorage.setItem("theme", n); };
  const [data, setData] = useState<DashboardData | null>(null);
  const [selected, setSelected] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [tab, setTab] = useState<"overview" | "schools">("overview");
  const user = getUser();

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    try { setData(await api<DashboardData>("/super/dashboard")); } catch { setError("Failed to load data"); }
    setLoading(false);
  }

  async function viewStats(tenantId: string) {
    setSuccess(""); setError("");
    try { setSelected(await api<StatsData>(`/super/tenants/${tenantId}/stats`)); } catch { setError("Failed to load stats"); }
  }

  async function deleteSchool(tenantId: string, name: string) {
    if (!confirm(`DELETE "${name}" and ALL its data? This cannot be undone.`)) return;
    try { const r = await api<{ ok: boolean; deleted: string }>(`/super/tenants/${tenantId}`, { method: "DELETE" });
      setSuccess(`Deleted "${r.deleted}"`); setSelected(null); loadDashboard(); } catch { setError("Delete failed"); }
  }

  async function resetPassword(tenantId: string, email: string) {
    try { await api(`/super/tenants/${tenantId}/reset-password`, { method: "POST", body: JSON.stringify({ email, newPassword: "Reset123!" }) });
      setResetMsg(`Password reset for ${email}. New: Reset123!`); } catch { setResetMsg("Reset failed"); }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: t.bg, color: t.text }}><p>Loading dashboard...</p></div>;

  return (
    <ThemeCtx.Provider value={{ theme, toggle: toggleTheme }}>
      <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "system-ui, sans-serif" }}>
        {/* Header */}
        <header style={{ background: t.card, borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: t.text }}>Super Admin</h1>
              <p style={{ fontSize: "0.8rem", color: t.sub, margin: "2px 0 0" }}>{user?.email}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: t.sub }}>☀️</span>
                <button onClick={toggleTheme} style={{
                  background: theme === "dark" ? t.accent : t.border, border: "none", borderRadius: 20, padding: "2px", cursor: "pointer",
                  width: 44, height: 24, display: "flex", alignItems: "center", justifyContent: theme === "dark" ? "flex-end" : "flex-start",
                  transition: "all 0.3s", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)"
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: theme === "dark" ? "#fff" : t.accent, boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "all 0.3s" }} />
                </button>
                <span style={{ fontSize: "0.75rem", color: t.sub }}>🌙</span>
              </div>
              <button onClick={() => { clearSession(); window.location.reload(); }} style={{ padding: "0.5rem 1.25rem", background: t.danger, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 }}>Sign Out</button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div style={{ padding: "1rem 1.5rem 0", display: "flex", gap: "0.25rem", borderBottom: `1px solid ${t.border}` }}>
          {([["overview", "Overview"], ["schools", "Schools"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "0.5rem 1.25rem", background: "none", border: "none", borderBottom: tab === k ? `2px solid ${t.accent}` : "2px solid transparent",
              color: tab === k ? t.accent : t.sub, cursor: "pointer", fontWeight: tab === k ? 600 : 400, fontSize: "0.875rem"
            }}>{label}</button>
          ))}
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
          {error && <p style={{ color: t.danger, marginBottom: "0.75rem", fontSize: "0.875rem" }}>{error}</p>}
          {success && <p style={{ color: t.success, marginBottom: "0.75rem", fontSize: "0.875rem" }}>{success}</p>}

          {tab === "overview" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                <StatCard label="Total Schools" value={data?.totalTenants ?? 0} accent t={t} />
                <StatCard label="Total Students" value={data?.totalStudents ?? 0} t={t} />
                <StatCard label="Total Lecturers" value={data?.totalLecturers ?? 0} t={t} />
                <StatCard label="Total Courses" value={data?.totalCourses ?? 0} t={t} />
              </div>

              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>All Schools</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: t.headerBg, textAlign: "left" }}>
                      {["School", "Students", "Lecturers", "Courses", "Actions"].map(h => (
                        <th key={h} style={{ padding: "0.75rem", color: t.sub, fontWeight: 600, fontSize: "0.75rem", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.tenants ?? []).map(tn => (
                      <tr key={tn.id} style={{ borderBottom: `1px solid ${t.rowBorder}` }}>
                        <td style={{ padding: "0.75rem", fontWeight: 500 }}>{tn.name}</td>
                        <td style={{ padding: "0.75rem" }}>{tn.students}</td>
                        <td style={{ padding: "0.75rem" }}>{tn.lecturers}</td>
                        <td style={{ padding: "0.75rem" }}>{tn.courses}</td>
                        <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <button onClick={() => viewStats(tn.id)} style={{ padding: "4px 12px", background: t.accent, color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem" }}>View</button>
                          <button onClick={() => deleteSchool(tn.id, tn.name)} style={{ padding: "4px 12px", background: t.danger, color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem" }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "schools" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {(data?.tenants ?? []).map(tn => (
                <div key={tn.id} style={{ background: t.card, borderRadius: 12, padding: "1.25rem", border: `1px solid ${t.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.5rem" }}>{tn.name}</h3>
                  <p style={{ fontSize: "0.75rem", color: t.sub, margin: "0 0 1rem" }}>Created {new Date(tn.createdAt).toLocaleDateString()}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                    {[["Students", tn.students], ["Lecturers", tn.lecturers], ["Courses", tn.courses], ["Verifications", tn.verifications]].map(([l, v]) => (
                      <div key={l as string} style={{ padding: "0.5rem", background: t.bg, borderRadius: 6, textAlign: "center" }}>
                        <p style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{v as number}</p>
                        <p style={{ fontSize: "0.7rem", color: t.sub, margin: 0 }}>{l as string}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => viewStats(tn.id)} style={{ flex: 1, padding: "6px 0", background: t.accent, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 }}>Details</button>
                    <button onClick={() => deleteSchool(tn.id, tn.name)} style={{ padding: "6px 12px", background: "transparent", color: t.danger, border: `1px solid ${t.danger}`, borderRadius: 6, cursor: "pointer", fontSize: "0.8rem" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected school details modal */}
          {selected && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: "1rem" }} onClick={() => setSelected(null)}>
              <div style={{ background: t.card, borderRadius: 12, padding: "1.5rem", maxWidth: 640, width: "100%", maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{selected.name}</h3>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: t.sub, fontSize: "1.2rem" }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {[["Students", selected.students], ["Lecturers", selected.lecturers], ["Courses", selected.courses], ["Registrations", selected.registrations], ["Verifications", selected.verifications]].map(([l, v]) => (
                    <div key={l as string} style={{ padding: "0.75rem", background: t.bg, borderRadius: 8, textAlign: "center" }}>
                      <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>{v as number}</p>
                      <p style={{ fontSize: "0.7rem", color: t.sub, margin: "2px 0 0" }}>{l as string}</p>
                    </div>
                  ))}
                </div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>School Admins</h4>
                {(selected.admins ?? []).map((a, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: `1px solid ${t.rowBorder}` }}>
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 500, margin: 0 }}>{a.email}</p>
                      <p style={{ fontSize: "0.75rem", color: t.sub, margin: 0 }}>{a.displayName || "-"}</p>
                    </div>
                    <button onClick={() => resetPassword(selected.id, a.email)} style={{ padding: "4px 12px", background: t.warn, color: "#000", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem", fontWeight: 500 }}>Reset Password</button>
                  </div>
                ))}
                {resetMsg && <p style={{ fontSize: "0.8rem", color: resetMsg.includes("failed") ? t.danger : t.success, marginTop: "0.5rem" }}>{resetMsg}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
