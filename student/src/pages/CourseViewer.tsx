import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { Play, FileText, FileImage, CheckCircle } from "lucide-react";
import { Card, ProgressBar } from "@bio/ui";

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
  const overallPct = progress?.completionPercentage ?? 0;

  return (
    <div className="flex max-w-6xl flex-col gap-6 md:flex-row">
      <div className="w-full shrink-0 space-y-2 md:w-72">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Modules</h2>
        <ProgressBar value={overallPct} />
        <p className="mb-3 text-xs text-[var(--bio-muted)]">{completedItems} items completed ({overallPct}%)</p>
        {modules.map((m) => {
          const active = selectedModule === m.id;
          const moduleItems = items[m.id] ?? [];
          const moduleCompleted = moduleItems.filter((it) => progress?.completedItemIds?.includes(it.id)).length;
          return (
            <div key={m.id}>
              <button
                onClick={() => selectModule(m.id)}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                  active
                    ? "border-brand-300 bg-brand-50 dark:bg-brand-900/30"
                    : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {moduleItems.length > 0 && moduleCompleted === moduleItems.length ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="font-medium text-slate-800 dark:text-slate-100">{m.title}</span>
                </div>
                {moduleItems.length > 0 && (
                  <div className="ml-6 mt-1">
                    <ProgressBar value={moduleItems.length ? (moduleCompleted / moduleItems.length) * 100 : 0} />
                  </div>
                )}
              </button>
              {active &&
                moduleItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      markItemComplete(item.id);
                    }}
                    className={`w-full py-2 pl-8 pr-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selectedItem?.id === item.id ? "font-medium text-brand-600 dark:text-brand-300" : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {progress?.completedItemIds?.includes(item.id) ? (
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                      ) : item.type === "video" ? (
                        <Play className="h-3 w-3" />
                      ) : item.type === "pdf" ? (
                        <FileText className="h-3 w-3" />
                      ) : (
                        <FileImage className="h-3 w-3" />
                      )}
                      {item.title}
                    </div>
                  </button>
                ))}
            </div>
          );
        })}
      </div>

      <Card className="min-h-[400px] flex-1 p-6">
        {selectedItem ? (
          <div>
            <h1 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">{selectedItem.title}</h1>
            {selectedItem.type === "video" &&
              (() => {
                const embed = selectedItem.minioKey ? `/hls/${selectedItem.minioKey}` : toEmbedUrl(selectedItem.url);
                if (!embed) return <p className="text-[var(--bio-muted)]">No video source attached.</p>;
                return (
                  <div className="aspect-video overflow-hidden rounded-lg bg-black">
                    <iframe
                      className="h-full w-full"
                      src={embed}
                      title={selectedItem.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              })()}
            {selectedItem.type === "pdf" &&
              (() => {
                const src = selectedItem.minioKey ? `/hls/${selectedItem.minioKey}` : selectedItem.url;
                if (!src) return <p className="text-[var(--bio-muted)]">No PDF file attached.</p>;
                return <iframe src={src} className="h-[70vh] w-full rounded-lg border" title="PDF Viewer" />;
              })()}
            {selectedItem.type === "slide" &&
              (() => {
                const src = selectedItem.minioKey ? `/hls/${selectedItem.minioKey}` : selectedItem.url;
                if (!src) return <p className="text-[var(--bio-muted)]">No slide attached.</p>;
                return <img src={src} alt={selectedItem.title} className="w-full rounded-lg" />;
              })()}
            {selectedItem.type === "text" && (
              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedItem.description || selectedItem.body || "No content." }}
              />
            )}
            {(selectedItem.type === "link" || selectedItem.type === "url") && selectedItem.url && (
              <a href={selectedItem.url} target="_blank" rel="noopener" className="break-all text-brand-500 underline">
                Open external resource
              </a>
            )}
          </div>
        ) : (
          <p className="py-12 text-center text-[var(--bio-muted)]">Select a module and item to begin</p>
        )}
      </Card>
    </div>
  );
}
