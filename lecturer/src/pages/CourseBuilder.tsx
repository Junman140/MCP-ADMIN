import { useEffect, useState, useRef } from "react";
import { api } from "../api";

type Course = { id: string; code: string; title: string };
type Module = { id: string; title: string; courseId: string };
type Item = { id: string; title: string; type: string; url?: string; body?: string; moduleId: string };

export default function CourseBuilder() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemType, setNewItemType] = useState("text");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemBody, setNewItemBody] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<Course[]>("/courses")
      .then(setCourses)
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoadingCourses(false));
  }, []);

  function selectCourse(id: string) {
    setSelectedCourseId(id);
    setSelectedModuleId(null);
    setItems([]);
    setLoadingModules(true);
    api<Module[]>(`/courses/${id}/modules`)
      .then(setModules)
      .catch(() => setError("Failed to load modules"))
      .finally(() => setLoadingModules(false));
  }

  function selectModule(id: string) {
    setSelectedModuleId(id);
    setLoadingItems(true);
    api<Item[]>(`/modules/${id}/items`)
      .then(setItems)
      .catch(() => setError("Failed to load items"))
      .finally(() => setLoadingItems(false));
  }

  async function createModule() {
    if (!selectedCourseId || !newModuleTitle.trim()) return;
    try {
      const mod = await api<Module>(`/courses/${selectedCourseId}/modules`, {
        method: "POST",
        body: JSON.stringify({ title: newModuleTitle.trim() }),
      });
      setModules([...modules, mod]);
      setNewModuleTitle("");
    } catch { setError("Failed to create module"); }
  }

  async function createItem() {
    if (!selectedModuleId || !newItemTitle.trim()) return;
    try {
      const itemData: Record<string, any> = { title: newItemTitle.trim(), type: newItemType };
      if (newItemUrl) itemData.url = newItemUrl;
      if (newItemBody) itemData.body = newItemBody;
      const item = await api<Item>(`/modules/${selectedModuleId}/items`, {
        method: "POST",
        body: JSON.stringify(itemData),
      });
      setItems([...items, item]);
      setNewItemTitle(""); setNewItemUrl(""); setNewItemBody(""); setSuccess("Item added");
    } catch { setError("Failed to create item"); }
  }

  async function uploadFile() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await api<{ url: string }>("/content/upload", {
          method: "POST",
          body: JSON.stringify({ data: base64, fileName: file.name, contentType: file.type }),
        });
        setNewItemUrl(res.url);
        setNewItemType(file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "pdf" : "pdf");
        setSuccess("File uploaded — URL set");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch { setError("Upload failed"); setUploading(false); }
  }

  async function deleteModule(id: string) {
    try {
      await api(`/modules/${id}`, { method: "DELETE" });
      setModules(modules.filter(m => m.id !== id));
      if (selectedModuleId === id) { setSelectedModuleId(null); setItems([]); }
    } catch { setError("Failed to delete module"); }
  }

  async function deleteItem(id: string) {
    try {
      await api(`/items/${id}`, { method: "DELETE" });
      setItems(items.filter(i => i.id !== id));
    } catch { setError("Failed to delete item"); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.5rem", marginBottom: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem",
  };
  const btnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem",
  };
  const colStyle: React.CSSProperties = {
    flex: 1, background: "#fff", borderRadius: 8, padding: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "auto", maxHeight: "calc(100vh - 180px)",
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Course Builder</h1>
      {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.5rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}
      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={colStyle}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Courses</h3>
          {loadingCourses && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
          {!loadingCourses && courses.length === 0 && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No courses found</p>}
          {courses.map(c => (
            <div key={c.id} onClick={() => selectCourse(c.id)}
              style={{ padding: "0.6rem 0.75rem", borderRadius: 6, cursor: "pointer", marginBottom: 2, background: selectedCourseId === c.id ? "#eff6ff" : "transparent", border: selectedCourseId === c.id ? "1px solid #bfdbfe" : "1px solid transparent" }}>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>{c.code}</p>
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>{c.title}</p>
            </div>
          ))}
        </div>

        <div style={colStyle}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Modules</h3>
          {!selectedCourseId && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Select a course</p>}
          {selectedCourseId && loadingModules && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
          {selectedCourseId && !loadingModules && modules.length === 0 && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No modules yet</p>}
          {selectedCourseId && modules.map(m => (
            <div key={m.id} onClick={() => selectModule(m.id)}
              style={{ padding: "0.5rem 0.75rem", borderRadius: 6, cursor: "pointer", marginBottom: 2, background: selectedModuleId === m.id ? "#eff6ff" : "transparent", border: selectedModuleId === m.id ? "1px solid #bfdbfe" : "1px solid transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem" }}>{m.title}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteModule(m.id); }}
                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem" }}>x</button>
            </div>
          ))}
          {selectedCourseId && (
            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
              <input style={inputStyle} placeholder="Module title" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} />
              <button onClick={createModule} style={btnStyle}>Add</button>
            </div>
          )}
        </div>

        <div style={colStyle}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Items</h3>
          {!selectedModuleId && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Select a module</p>}
          {selectedModuleId && loadingItems && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading...</p>}
          {selectedModuleId && !loadingItems && items.length === 0 && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No items yet</p>}
          {selectedModuleId && items.map(i => (
            <div key={i.id} style={{ padding: "0.5rem 0.75rem", borderRadius: 6, marginBottom: 2, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.875rem" }}>{i.title}</span>
                <span style={{ fontSize: "0.7rem", color: "#94a3b8", marginLeft: "0.5rem", textTransform: "uppercase" }}>{i.type}</span>
              </div>
              <button onClick={() => deleteItem(i.id)}
                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem" }}>x</button>
            </div>
          ))}
          {selectedModuleId && (
            <div style={{ marginTop: "0.75rem" }}>
              <input style={inputStyle} placeholder="Item title *" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
              <select style={{ ...inputStyle, width: "auto", marginRight: "0.5rem" }} value={newItemType} onChange={e => setNewItemType(e.target.value)}>
                <option value="text">Text</option>
                <option value="video">Video (URL)</option>
                <option value="pdf">PDF / File</option>
                <option value="link">Link (URL)</option>
                <option value="quiz-ref">Quiz Ref</option>
                <option value="assignment-ref">Assignment Ref</option>
              </select>
              {(newItemType === "video" || newItemType === "link" || newItemType === "pdf") && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                  <input style={{ ...inputStyle, marginBottom: 0, flex: 1 }} placeholder="URL or upload file" value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} />
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>or</span>
                  <input ref={fileRef} type="file" style={{ display: "none" }} onChange={uploadFile} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ ...btnStyle, background: "#16a34a", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                    {uploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              )}
              {newItemType === "text" && (
                <textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="Content body..." value={newItemBody} onChange={e => setNewItemBody(e.target.value)} />
              )}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={createItem} style={btnStyle}>Add Item</button>
                {success && <span style={{ fontSize: "0.75rem", color: "#16a34a", display: "flex", alignItems: "center" }}>{success}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
