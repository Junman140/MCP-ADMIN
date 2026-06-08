import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { User, ChevronLeft } from "lucide-react";

type Faculty = { id: string; name: string };
type Department = { id: string; name: string; facultyId: string | null };
type Student = {
  id: string;
  matricNo: string;
  fullName: string;
  facultyId?: string | null;
  departmentId?: string | null;
  faculty?: string | null;
  department?: string | null;
  level?: string | null;
  photoUrl?: string | null;
};

export default function StudentEdit() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [matricNo, setMatricNo] = useState("");
  const [fullName, setFullName] = useState("");
  const [level, setLevel] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [facultyId, setFacultyId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const deptsFiltered = useMemo(() => {
    if (!facultyId) return departments;
    return departments.filter((d) => d.facultyId === facultyId || d.facultyId == null);
  }, [departments, facultyId]);

  const loadFaculties = useCallback(async () => {
    const rows = await api<Faculty[]>("/faculties");
    setFaculties(rows);
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        const [s, fac, deps] = await Promise.all([
          api<Student>(`/students/${id}`),
          api<Faculty[]>("/faculties"),
          api<Department[]>("/departments"),
        ]);
        if (cancelled) return;
        setFaculties(fac);
        setDepartments(deps);
        setStudent(s);
        setMatricNo(s.matricNo);
        setFullName(s.fullName);
        setLevel(s.level ?? "");
        setPhotoUrl(s.photoUrl ?? "");
        const fid = s.facultyId ?? "";
        setFacultyId(fid);
        setDepartmentId(s.departmentId ?? "");
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function onFacultyChange(fid: string) {
    setFacultyId(fid);
    setDepartmentId("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setErr(null);
    try {
      await api(`/students/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          matricNo,
          fullName,
          level: level || undefined,
          photoUrl: photoUrl || undefined,
          facultyId: facultyId || null,
          departmentId: departmentId || null,
        }),
      });
      nav("/students");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  if (!id) return <p>Missing student id.</p>;

  return (
    <>
      <div className="mb-6">
        <p className="mb-2">
          <Link to="/students" className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> Back to Directory
          </Link>
        </p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <User className="w-6 h-6 text-sky-500" /> Edit Student
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Update profile fields. Fingerprint templates are managed from <strong>Enroll fingerprint</strong> on the students list.
        </p>
      </div>
      
      {!student && !err && <p className="text-slate-500 p-4 text-center">Loading student data…</p>}
      {err && <p className="error p-4 bg-red-50 dark:bg-red-500/10 rounded-xl mb-4">{err}</p>}
      
      {student && (
        <div className="card max-w-2xl">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mt-0">Matric No.</label>
                <input value={matricNo} onChange={(e) => setMatricNo(e.target.value)} required />
              </div>
              <div>
                <label className="mt-0">Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mt-0">Level (optional)</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">— Select Level —</option>
                  {["100", "200", "300", "400", "500", "600", "700", "Spill"].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="mt-0">Photo URL (optional)</label>
                <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} type="url" placeholder="https://..." />
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
                  {deptsFiltered.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button type="submit" className="bg-sky-500 hover:bg-sky-400 text-white font-medium px-6">Save Changes</button>
              <button type="button" className="secondary font-medium px-6" onClick={() => nav("/students")}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
