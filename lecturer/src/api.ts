const base = "/api";

const USER_KEY = "lec_user";
const TOKEN_KEY = "lec_token";

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t: string | null) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }
function getUser(): { id: string; email: string; role: string } | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setUser(u: { id: string; email: string; role: string } | null) {
  u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY);
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...opts, headers });
  if (!res.ok) { const t = await res.text(); throw new Error(t || res.statusText); }
  return res.json();
}

export async function login(email: string, password: string) {
  const data = await api<{ token: string; user: { id: string; email: string; role: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

export function logout() { setToken(null); setUser(null); }
export function isLoggedIn() { return !!getToken(); }
export { getUser };
