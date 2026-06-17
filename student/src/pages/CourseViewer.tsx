import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { Play, FileText, FileImage, CheckCircle } from "lucide-react";

type Module = { id: string; title: string; order: number };
type ContentItem = { id: string; type: string; title: string; minioKey?: string; duration?: number; description?: string };
type Progress = { id: string; moduleId: string; completionPercent: number };

export default function CourseViewer() {
  const { id } = useParams<{ id: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [items, setItems] = useState<Record<string, ContentItem[]>>({});
  const [progress, setProgress] = useState<Progress[]>([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (!id) return;
    api<Module[]>(`/courses/${id}/modules`).then(setModules).catch(() => {});
    api<Progress[]>(`/student/progress/${id}`).then(setProgress).catch(() => {});
  }, [id]);

  async function selectModule(modId: string) {
    setSelectedModule(modId);
    const it = await api<ContentItem[]>(`/modules/${modId}/items`);
    setItems((prev) => ({ ...prev, [modId]: it }));
    await api(`/student/progress/${id}`, {
      method: "POST",
      body: JSON.stringify({ moduleId: modId, completionPercent: 0, lastAccessedAt: new Date().toISOString() }),
    });
  }

  if (!id) return <p>Select a course</p>;

  const completedModules = progress?.filter((p) => p.completionPercent >= 100).length ?? 0;

  return (
    <div className="flex gap-6 max-w-6xl">
      <div className="w-72 shrink-0 space-y-2">
        <h2 className="text-lg font-bold">Modules</h2>
        <div className="bg-slate-200 dark:bg-slate-700 h-2 rounded mb-1">
          <div className="bg-sky-500 h-2 rounded" style={{ width: `${modules.length > 0 ? (completedModules / modules.length) * 100 : 0}%` }} />
        </div>
        <p className="text-xs text-slate-500 mb-3">{completedModules}/{modules.length} completed</p>
        {modules.map((m) => {
          const p = progress?.find((x) => x.moduleId === m.id);
          const active = selectedModule === m.id;
          return (
            <div key={m.id}>
              <button onClick={() => selectModule(m.id)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${active ? "bg-sky-50 border border-sky-300" : "hover:bg-slate-100 border border-transparent"}`}>
                <div className="flex items-center gap-2">
                  {p && p.completionPercent >= 100 ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <FileText className="w-4 h-4 text-slate-400" />}
                  <span className="font-medium">{m.title}</span>
                </div>
                {p && <div className="ml-6 mt-1 h-1.5 bg-slate-200 rounded"><div className="h-1.5 bg-sky-500 rounded" style={{ width: `${p.completionPercent}%` }} /></div>}
              </button>
              {active && (items[m.id] ?? []).map((item) => (
                <button key={item.id} onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-2 pl-8 text-sm hover:bg-slate-50 ${selectedItem?.id === item.id ? "text-sky-600 font-medium" : "text-slate-600"}`}>
                  <div className="flex items-center gap-2">
                    {item.type === "video" ? <Play className="w-3 h-3" /> : item.type === "pdf" ? <FileText className="w-3 h-3" /> : <FileImage className="w-3 h-3" />}
                    {item.title}
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex-1 card p-6 min-h-[400px]">
        {selectedItem ? (
          <div>
            <h1 className="text-xl font-bold mb-3">{selectedItem.title}</h1>
            {selectedItem.type === "video" && (
              <div className="bg-black rounded-lg aspect-video">
                <video className="w-full h-full" controls playsInline crossOrigin="anonymous"
                  src={selectedItem.minioKey ? `/hls/${selectedItem.minioKey}` : undefined}
                  poster={selectedItem.minioKey ? `/hls/${selectedItem.minioKey.replace(/\.m3u8$/, ".jpg")}` : undefined}>
                </video>
              </div>
            )}
            {selectedItem.type === "pdf" && (
              selectedItem.minioKey ? (
                <iframe src={`/hls/${selectedItem.minioKey}`} className="w-full h-[70vh] rounded-lg border" title="PDF Viewer" />
              ) : (
                <p className="text-slate-500">No PDF file attached.</p>
              )
            )}
            {selectedItem.type === "slide" && selectedItem.minioKey && (
              <div className="space-y-4">
                <img src={`/hls/${selectedItem.minioKey}`} alt={selectedItem.title} className="w-full rounded-lg" />
              </div>
            )}
            {selectedItem.type === "text" && <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: selectedItem.description || "No content." }} />}
            {selectedItem.type === "url" && selectedItem.minioKey && (
              <a href={selectedItem.minioKey} target="_blank" rel="noopener" className="text-sky-500 underline break-all">Open external resource</a>
            )}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-12">Select a module and item to begin</p>
        )}
      </div>
    </div>
  );
}
