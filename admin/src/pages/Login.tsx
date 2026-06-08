import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken, setUser, type UserJson } from "../api";
import { ShieldCheck } from "lucide-react";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await api<{ token: string; user: UserJson }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      setUser(res.user);
      onLogin();
      nav("/");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="card w-full max-w-md p-8 shadow-xl border-t-4 border-t-sky-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center m-0">EduAdmin Portal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">Sign in to manage biometrics and exams</p>
        </div>
        
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email address</label>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              placeholder="admin@example.com"
              required 
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
              className="w-full"
            />
          </div>
          
          {err && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="error m-0 text-sm text-center">{err}</p>
            </div>
          )}
          
          <div className="pt-2">
            <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 shadow-md transition-all active:scale-[0.98]">
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
