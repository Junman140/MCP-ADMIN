import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { Trash2, Plus, Upload, CheckCircle2 } from "lucide-react";
import { Badge, Button, Card, Input, PageHeader, Select } from "@bio/ui";

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
    } catch {
      setError("Failed to create module");
    }
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
      setNewItemTitle("");
      setNewItemUrl("");
      setNewItemBody("");
      setSuccess("Item added");
    } catch {
      setError("Failed to create item");
    }
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
        setNewItemType(file.type.startsWith("video/") ? "video" : "pdf");
        setSuccess("File uploaded — URL set");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Upload failed");
      setUploading(false);
    }
  }

  async function deleteModule(id: string) {
    try {
      await api(`/modules/${id}`, { method: "DELETE" });
      setModules(modules.filter((m) => m.id !== id));
      if (selectedModuleId === id) {
        setSelectedModuleId(null);
        setItems([]);
      }
    } catch {
      setError("Failed to delete module");
    }
  }

  async function deleteItem(id: string) {
    try {
      await api(`/items/${id}`, { method: "DELETE" });
      setItems(items.filter((i) => i.id !== id));
    } catch {
      setError("Failed to delete item");
    }
  }

  return (
    <div>
      <PageHeader title="Course Builder" subtitle="Organize courses into modules and content items." />

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col">
          <h3 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">Courses</h3>
          {loadingCourses && <p className="text-sm text-[var(--bio-muted)]">Loading…</p>}
          {!loadingCourses && courses.length === 0 && <p className="text-sm text-[var(--bio-muted)]">No courses found</p>}
          <div className="space-y-1">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCourse(c.id)}
                className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                  selectedCourseId === c.id
                    ? "border-brand-300 bg-brand-50 dark:bg-brand-900/30"
                    : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.code}</p>
                <p className="text-xs text-[var(--bio-muted)]">{c.title}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
          <h3 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">Modules</h3>
          {!selectedCourseId && <p className="text-sm text-[var(--bio-muted)]">Select a course</p>}
          {selectedCourseId && loadingModules && <p className="text-sm text-[var(--bio-muted)]">Loading…</p>}
          {selectedCourseId && !loadingModules && modules.length === 0 && (
            <p className="text-sm text-[var(--bio-muted)]">No modules yet</p>
          )}
          <div className="space-y-1">
            {selectedCourseId &&
              modules.map((m) => (
                <div
                  key={m.id}
                  onClick={() => selectModule(m.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-colors ${
                    selectedModuleId === m.id
                      ? "border-brand-300 bg-brand-50 dark:bg-brand-900/30"
                      : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="text-sm text-slate-800 dark:text-slate-100">{m.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteModule(m.id);
                    }}
                    className="text-rose-500 hover:text-rose-700"
                    aria-label="Delete module"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
          {selectedCourseId && (
            <div className="mt-3 flex gap-2">
              <Input placeholder="Module title" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} />
              <Button variant="primary" onClick={createModule}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          )}
        </Card>

        <Card className="flex flex-col">
          <h3 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">Items</h3>
          {!selectedModuleId && <p className="text-sm text-[var(--bio-muted)]">Select a module</p>}
          {selectedModuleId && loadingItems && <p className="text-sm text-[var(--bio-muted)]">Loading…</p>}
          {selectedModuleId && !loadingItems && items.length === 0 && (
            <p className="text-sm text-[var(--bio-muted)]">No items yet</p>
          )}
          <div className="space-y-1">
            {selectedModuleId &&
              items.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--bio-border)] p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-800 dark:text-slate-100">{i.title}</span>
                    <Badge tone="brand">{i.type}</Badge>
                  </div>
                  <button onClick={() => deleteItem(i.id)} className="text-rose-500 hover:text-rose-700" aria-label="Delete item">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
          {selectedModuleId && (
            <div className="mt-3 space-y-2">
              <Input placeholder="Item title *" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} />
              <Select value={newItemType} onChange={(e) => setNewItemType(e.target.value)}>
                <option value="text">Text</option>
                <option value="video">Video (URL)</option>
                <option value="pdf">PDF / File</option>
                <option value="link">Link (URL)</option>
                <option value="quiz-ref">Quiz Ref</option>
                <option value="assignment-ref">Assignment Ref</option>
              </Select>
              {(newItemType === "video" || newItemType === "link" || newItemType === "pdf") && (
                <div className="space-y-2">
                  <Input
                    placeholder="URL or upload file"
                    value={newItemUrl}
                    onChange={(e) => setNewItemUrl(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input ref={fileRef} type="file" className="hidden" onChange={uploadFile} />
                    <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload File"}
                    </Button>
                  </div>
                </div>
              )}
              {newItemType === "text" && (
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Content body…"
                  value={newItemBody}
                  onChange={(e) => setNewItemBody(e.target.value)}
                />
              )}
              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={createItem}>
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
                {success && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {success}
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
