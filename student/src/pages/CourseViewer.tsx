import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { Play, FileText, FileImage, CheckCircle } from "lucide-react";

type Module = { id: string; title: string; order: number };
type ContentItem = { id: string; type: string; title: string; url?: string; minioKey?: string; duration?: number; description?: string; body?: string };

/** Convert a video URL into an embeddable form (YouTube, etc.). */
function toEmbedUrl(raw?: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    // Already an embed or unknown host: use as-is inside an iframe.
    return raw;
  } catch {
    return null;
  }
}
type Progress = { id: string; completedItemIds: string[]; completionPercentage: number };

export default function CourseViewer() {
  const { id } = useParams<{ id: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [items, setItems] = useState<Record<string, ContentItem[]>>({});
  const [progress, setProgress] = useState<Progress | null>(null);
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (!id) return;
    api<Module[]>(`/courses/${id}/modules`).then(setModules).catch(() => {});
    api<Progress>(`/student/progress/${id}`).then(setProgress).catch(() => {});
  }, [id]);

  async function selectModule(modId: string) {
    setSelectedModule(modId);
    try {
      const it = await api<ContentItem[]>(`/modules/${modId}/items`);
      setItems((prev) => ({ ...prev, [modId]: Array.isArray(it) ? it : [] }));
    } catch (_) {
      setItems((prev) => ({ ...prev, [modId]: [] }));
    }
  }

  async function markItemComplete(itemId: string) {
    try {
      const updated = await api<Progress>(`/student/progress/${id}`, {
        method: "POST",
        body: JSON.stringify({ itemId, completed: true }),
      });
      setProgress(updated);
    } catch (_) {}
  }

  if (!id) return <p>Select a course</p>;

  const completedItems = progress?.completedItemIds?.length ?? 0;
  const allItems = Object.values(items).flat().length;
  const overallPct = progress?.completionPercentage ?? 0;

  return (
    <div className="flex gap-6 max-w-6xl">
      <div className="w-72 shrink-0 space-y-2">
        <h2 className="text-lg font-bold">Modules</h2>
        <div className="bg-slate-200 dark:bg-slate-700 h-2 rounded mb-1">
          <div className="bg-sky-500 h-2 rounded" style={{ width: `${overallPct}%` }} />
        </div>
        <p className="text-xs text-slate-500 mb-3">{completedItems} items completed ({overallPct}%)</p>
        {modules.map((m) => {
          const active = selectedModule === m.id;
          const moduleItems = items[m.id] ?? [];
          const moduleCompleted = moduleItems.filter((it) => progress?.completedItemIds?.includes(it.id)).length;
          return (
            <div key={m.id}>
              <button onClick={() => selectModule(m.id)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${active ? "bg-sky-50 border border-sky-300" : "hover:bg-slate-100 border border-transparent"}`}>
                <div className="flex items-center gap-2">
                  {moduleItems.length > 0 && moduleCompleted === moduleItems.length ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <FileText className="w-4 h-4 text-slate-400" />}
                  <span className="font-medium">{m.title}</span>
                </div>
                {moduleItems.length > 0 && (
                  <div className="ml-6 mt-1 h-1.5 bg-slate-200 rounded">
                    <div className="h-1.5 bg-sky-500 rounded" style={{ width: `${(moduleCompleted / moduleItems.length) * 100}%` }} />
                  </div>
                )}
              </button>
              {active && moduleItems.map((item) => (
                <button key={item.id}
                  onClick={() => { setSelectedItem(item); markItemComplete(item.id); }}
                  className={`w-full text-left p-2 pl-8 text-sm hover:bg-slate-50 ${selectedItem?.id === item.id ? "text-sky-600 font-medium" : "text-slate-600"}`}>
                  <div className="flex items-center gap-2">
                    {progress?.completedItemIds?.includes(item.id) ? <CheckCircle className="w-3 h-3 text-emerald-500" /> :
                      item.type === "video" ? <Play className="w-3 h-3" /> : item.type === "pdf" ? <FileText className="w-3 h-3" /> : <FileImage className="w-3 h-3" />}
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
            {selectedItem.type === "video" && (() => {
              const embed = selectedItem.minioKey
                ? `/hls/${selectedItem.minioKey}`
                : toEmbedUrl(selectedItem.url);
              if (!embed) return <p className="text-slate-500">No video source attached.</p>;
              return (
                <div className="bg-black rounded-lg aspect-video overflow-hidden">
                  <iframe
                    className="w-full h-full"
                    src={embed}
                    title={selectedItem.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            })()}
            {selectedItem.type === "pdf" && (() => {
              const src = selectedItem.minioKey ? `/hls/${selectedItem.minioKey}` : selectedItem.url;
              if (!src) return <p className="text-slate-500">No PDF file attached.</p>;
              return <iframe src={src} className="w-full h-[70vh] rounded-lg border" title="PDF Viewer" />;
            })()}
            {selectedItem.type === "slide" && (() => {
              const src = selectedItem.minioKey ? `/hls/${selectedItem.minioKey}` : selectedItem.url;
              if (!src) return <p className="text-slate-500">No slide attached.</p>;
              return <img src={src} alt={selectedItem.title} className="w-full rounded-lg" />;
            })()}
            {selectedItem.type === "text" && <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: selectedItem.description || selectedItem.body || "No content." }} />}
            {(selectedItem.type === "link" || selectedItem.type === "url") && selectedItem.url && (
              <a href={selectedItem.url} target="_blank" rel="noopener" className="text-sky-500 underline break-all">Open external resource</a>
            )}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-12">Select a module and item to begin</p>
        )}
      </div>
    </div>
  );
}
