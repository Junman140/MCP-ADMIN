import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { UserPlus } from "lucide-react";

type Faculty = { id: string; name: string };
type Department = { id: string; name: string; facultyId: string | null };

export default function StudentAdd() {
  const nav = useNavigate();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [matric, setMatric] = useState("");
  const [fullName, setFullName] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const deptsForFaculty = useMemo(() => {
    if (!facultyId) return departments;
    return departments.filter((d) => d.facultyId === facultyId || d.facultyId == null);
  }, [departments, facultyId]);

  const loadRefs = useCallback(async () => {
    try {
      const [f, d] = await Promise.all([api<Faculty[]>("/faculties"), api<Department[]>("/departments")]);
      setFaculties(f);
      setDepartments(d);
    } catch (e) {
      setErr("Failed to load faculties/departments");
    }
  }, []);

  useEffect(() => {
    loadRefs();
  }, [loadRefs]);

  function onFacultyChange(fid: string) {
    setFacultyId(fid);
    setDepartmentId("");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api<{ id: string }>("/students", {
        method: "POST",
        body: JSON.stringify({
          matricNo: matric,
          fullName,
          facultyId: facultyId || undefined,
          departmentId: departmentId || undefined,
        }),
      });
      // After creation, go to directory or enroll? 
      // User said "independent page", let's go back to directory
      nav("/students");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-emerald-500" /> Student Registration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Enter student profile details to register them in the system.</p>
      </div>
      
      <div className="card max-w-2xl">
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mt-0">Matric / Reg No</label>
              <input 
                value={matric} 
                onChange={(e) => setMatric(e.target.value)} 
                required 
                placeholder="e.g. UED/2024/001"
                autoFocus
              />
            </div>
            <div>
              <label className="mt-0">Full Name</label>
              <input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
                placeholder="Firstname Lastname"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mt-0">Faculty</label>
              <select value={facultyId} onChange={(e) => onFacultyChange(e.target.value)}>
                <option value="">— Select Faculty —</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mt-0">Department</label>
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">— Select Department —</option>
                {deptsForFaculty.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {err && <p className="error p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">{err}</p>}
          
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
            <button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-medium px-6">
              {loading ? "Registering..." : "Register Student"}
            </button>
            <button type="button" className="secondary font-medium px-6" onClick={() => nav("/students")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
