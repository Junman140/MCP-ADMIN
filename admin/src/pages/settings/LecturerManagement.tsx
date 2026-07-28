import { useEffect, useState } from "react";
import { api } from "../../api";

type Lecturer = {
  id: string;
  _id: string;
  staffId: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  departmentId: string;
  employmentType: string;
  qualifications: string[];
  isActive: boolean;
  createdAt: string;
};

type Course = { id: string; _id: string; code: string; title: string };

export default function LecturerManagement() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<{ id: string; _id: string; name: string }[]>([]);
  const [edit, setEdit] = useState<Lecturer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [createCourseIds, setCreateCourseIds] = useState<string[]>([]);

  // Create form state
  const [createFields, setCreateFields] = useState({
    email: "", password: "", staffId: "", fullName: "", title: "", phone: "",
    departmentId: "", employmentType: "full-time" as string,
    qualifications: [] as string[],
  });

  async function load() {
    setLoading(true);
    try {
      const [l, c, d] = await Promise.all([
        api<Lecturer[]>("/lecturers"),
        api<Course[]>("/courses"),
        api<{ id: string; _id: string; name: string }[]>("/departments"),
      ]);
      setLecturers(l.filter(x => x.isActive !== false));
      setCourses(c);
      setDepartments(d);
    } catch {
      setError("Failed to load data. Check that the API is running.");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(profileId: string) {
    if (!confirm("Delete this lecturer? They will be removed from all courses.")) return;
    try {
      await api(`/lecturer/${profileId}`, { method: "DELETE" });
      setSuccess("Lecturer deleted");
      load();
    } catch (e) {
      setError("Delete failed: " + (e as Error).message);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setError("");
    setSuccess("");
    try {
      await api(`/lecturer/${edit._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          staffId: edit.staffId,
          title: edit.title,
          fullName: edit.fullName,
          phone: edit.phone,
          departmentId: edit.departmentId,
          employmentType: edit.employmentType,
          qualifications: edit.qualifications,
          courseIds: selectedCourseIds,
        }),
      });
      setSuccess("Lecturer updated");
      setEdit(null);
      load();
    } catch (e) {
      setError("Update failed: " + (e as Error).message);
    }
  }

  function handleEditClick(l: Lecturer) {
    // Find courses where this lecturer is assigned
    const assigned = courses.filter(c => (c as any).lecturerIds?.includes(l._id)).map(c => c.id);
    setSelectedCourseIds(assigned);
    setEdit(l);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api("/lecturer/register", {
        method: "POST",
        body: JSON.stringify({ ...createFields, courseIds: createCourseIds }),
      });
      setSuccess("Lecturer created");
      setShowCreate(false);
      setCreateFields({ email: "", password: "", staffId: "", fullName: "", title: "", phone: "", departmentId: "", employmentType: "full-time", qualifications: [] });
      load();
    } catch (e) {
      setError("Create failed: " + (e as Error).message);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Lecturer Management</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ color: "#64748b", fontSize: "0.875rem" }}>{lecturers.length} active</span>
          <button onClick={() => setShowCreate(!showCreate)} style={{ padding: "6px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 }}>
            {showCreate ? "Cancel" : "Add Lecturer"}
          </button>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Assign Courses</label>
              <select multiple value={createCourseIds} onChange={e => setCreateCourseIds(Array.from(e.target.selectedOptions, o => o.value))}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2, minHeight: 100 }}>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
              </select>
            </div>
          </div>

      {error && <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "0.5rem" }}>{error}</p>}
      {success && <p style={{ color: "#16a34a", fontSize: "0.875rem", marginBottom: "0.5rem" }}>{success}</p>}

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: "#fff", padding: "1.25rem", borderRadius: 8, marginBottom: "1.5rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Add New Lecturer</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Email (login)</label>
              <input value={createFields.email} onChange={e => setCreateFields({ ...createFields, email: e.target.value })} required
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Password</label>
              <input value={createFields.password} onChange={e => setCreateFields({ ...createFields, password: e.target.value })} required type="password"
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Staff ID</label>
              <input value={createFields.staffId} onChange={e => setCreateFields({ ...createFields, staffId: e.target.value })} required
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Full Name</label>
              <input value={createFields.fullName} onChange={e => setCreateFields({ ...createFields, fullName: e.target.value })} required
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Title</label>
              <select value={createFields.title} onChange={e => setCreateFields({ ...createFields, title: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }}>
                <option value="">None</option>
                <option>Prof.</option><option>Dr.</option><option>Mr.</option><option>Mrs.</option><option>Ms.</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Phone</label>
              <input value={createFields.phone} onChange={e => setCreateFields({ ...createFields, phone: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Department</label>
              <select value={createFields.departmentId} onChange={e => setCreateFields({ ...createFields, departmentId: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }}>
                <option value="">None</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Employment Type</label>
              <select value={createFields.employmentType} onChange={e => setCreateFields({ ...createFields, employmentType: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="adjunct">Adjunct</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button type="submit" style={{ padding: "0.5rem 1.5rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}>Create Lecturer</button>
          </div>
        </form>
      )}

      {edit && (
        <form onSubmit={handleUpdate} style={{ background: "#fff", padding: "1.25rem", borderRadius: 8, marginBottom: "1.5rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Edit: {edit.fullName}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Staff ID</label>
              <input value={edit.staffId} onChange={e => setEdit({ ...edit, staffId: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Title</label>
              <select value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }}>
                <option value="">None</option>
                <option>Prof.</option><option>Dr.</option><option>Mr.</option><option>Mrs.</option><option>Ms.</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Full Name</label>
              <input value={edit.fullName} onChange={e => setEdit({ ...edit, fullName: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Phone</label>
              <input value={edit.phone || ""} onChange={e => setEdit({ ...edit, phone: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Department</label>
              <select value={edit.departmentId || ""} onChange={e => setEdit({ ...edit, departmentId: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }}>
                <option value="">None</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Employment Type</label>
              <select value={edit.employmentType} onChange={e => setEdit({ ...edit, employmentType: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2 }}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="adjunct">Adjunct</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Assigned Courses (Ctrl+click multi)</label>
              <select multiple value={selectedCourseIds} onChange={e => setSelectedCourseIds(Array.from(e.target.selectedOptions, o => o.value))}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 4, marginTop: 2, minHeight: 120 }}>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Save Changes</button>
            <button type="button" onClick={() => setEdit(null)} style={{ padding: "0.5rem 1rem", background: "#e2e8f0", border: "none", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
            {["Name", "Staff ID", "Email", "Department", "Type", "Status", "Actions"].map(h => (
              <th key={h} style={{ padding: "0.75rem", fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lecturers.map(l => {
            const dept = departments.find(d => d.id === l.departmentId);
            return (
              <tr key={l.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                  <span style={{ fontWeight: 500 }}>{l.title ? `${l.title} ` : ""}{l.fullName}</span>
                </td>
                <td style={{ padding: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>{l.staffId}</td>
                <td style={{ padding: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>{l.email}</td>
                <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>{dept?.name || "-"}</td>
                <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>{l.employmentType}</td>
                <td style={{ padding: "0.75rem" }}>
                  <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: 10, background: l.isActive ? "#dcfce7" : "#fee2e2", color: l.isActive ? "#16a34a" : "#dc2626" }}>
                    {l.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => handleEditClick(l)} style={{ padding: "4px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem" }}>Edit</button>
                  <button onClick={() => handleDelete(l._id)} style={{ padding: "4px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem" }}>Delete</button>
                </td>
              </tr>
            );
          })}
          {lecturers.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>No lecturers found. Create them via API or registration.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
