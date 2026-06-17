const base = "/api";

export function getToken(): string | null { return localStorage.getItem("token"); }
export function setToken(t: string | null) { if (t) localStorage.setItem("token", t); else localStorage.removeItem("token"); }

export function getUser(): { id: string; role: string } | null {
  const t = getToken();
  if (!t) return null;
  try {
    const parts = t.split(".");
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "====".slice(0, 4 - pad);
    const p = JSON.parse(atob(b64)) as { sub?: string; role?: string };
    if (!p.sub || !p.role) return null;
    return { id: p.sub, role: p.role };
  } catch { return null; }
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...opts, headers });
  if (!res.ok) { throw new Error(await res.text() || res.statusText); }
  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) return res.json() as Promise<T>;
  return undefined as T;
}
