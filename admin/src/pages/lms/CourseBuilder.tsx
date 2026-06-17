import { useEffect, useState } from "react";
import { api } from "../../api";
import { Plus, Trash2, GripVertical } from "lucide-react";

type Module = { id: string; title: string; description?: string; order: number; parentId?: string };
type ContentItem = { id: string; type: string; title: string; order: number; minioKey?: string; duration?: number };

export default function CourseBuilder() {
  const [courses, setCourses] = useState<{ id: string; code: string; title: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [items, setItems] = useState<Record<string, ContentItem[]>>({});
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemType, setNewItemType] = useState("text");
  const [selectedModule, setSelectedModule] = useState("");

  useEffect(() => {
    api<{ id: string; code: string; title: string }[]>("/courses").then(setCourses).catch(() => {});
  }, []);

  async function loadModules(courseId: string) {
    setSelectedCourse(courseId);
    const m = await api<Module[]>(`/courses/${courseId}/modules`);
    setModules(m);
    m.forEach((mod) => loadItems(mod.id));
  }

  async function loadItems(moduleId: string) {
    const it = await api<ContentItem[]>(`/modules/${moduleId}/items`);
    setItems((prev) => ({ ...prev, [moduleId]: it }));
  }

  async function createModule() {
    if (!newModuleTitle || !selectedCourse) return;
    await api(`/courses/${selectedCourse}/modules`, { method: "POST", body: JSON.stringify({ title: newModuleTitle }) });
    setNewModuleTitle("");
    loadModules(selectedCourse);
  }

  async function deleteModule(id: string) {
    await api(`/modules/${id}`, { method: "DELETE" });
    loadModules(selectedCourse);
  }

  async function createItem() {
    if (!newItemTitle || !selectedModule) return;
    await api(`/modules/${selectedModule}/items`, {
      method: "POST",
      body: JSON.stringify({ title: newItemTitle, type: newItemType }),
    });
    setNewItemTitle("");
    loadItems(selectedModule);
  }

  async function deleteItem(id: string) {
    await api(`/items/${id}`, { method: "DELETE" });
    selectedModule && loadItems(selectedModule);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, moduleId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await fetch(`/api/content/upload/file?tenantId=${localStorage.getItem("selectedTenantId") ?? ""}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: form,
    });
    loadItems(moduleId);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Course Builder</h1>
      <select className="input" value={selectedCourse} onChange={(e) => loadModules(e.target.value)}>
        <option value="">Select a course...</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
      </select>

      {selectedCourse && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="New module title" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} />
            <button className="btn-primary flex items-center gap-1" onClick={createModule}><Plus className="w-4 h-4" /> Add Module</button>
          </div>

          {modules.map((mod) => (
            <div key={mod.id} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{mod.title}</h3>
                <button className="text-red-500 hover:text-red-700" onClick={() => deleteModule(mod.id)}><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="space-y-2">
                {(items[mod.id] ?? []).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded">
                    <span className="text-xs uppercase text-slate-400 w-12">{item.type}</span>
                    <span className="flex-1 text-sm">{item.title}</span>
                    <button className="text-red-400 hover:text-red-600" onClick={() => deleteItem(item.id)}><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <input className="input flex-1 text-sm" placeholder="New item title"
                  value={selectedModule === mod.id ? newItemTitle : ""}
                  onChange={(e) => { setSelectedModule(mod.id); setNewItemTitle(e.target.value); }} />
                <select className="input w-24 text-sm" value={newItemType} onChange={(e) => setNewItemType(e.target.value)}>
                  <option value="text">Text</option>
                  <option value="url">URL</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                </select>
                <button className="btn-primary text-sm" onClick={createItem}>Add</button>
              </div>

              <div className="mt-2">
                <input type="file" className="text-sm" onChange={(e) => handleFileUpload(e, mod.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
