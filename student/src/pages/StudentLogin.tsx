import { useState } from "react";
import { api, setToken } from "../api";
import { useNavigate } from "react-router-dom";

export default function StudentLogin({ onLogin }: { onLogin: () => void }) {
  const [matricNo, setMatricNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try {
      const res = await api<{ token: string; message?: string; student?: { needsPasswordChange?: boolean } }>("/student/login", {
        method: "POST",
        body: JSON.stringify({ matricNo, password }),
      });
      setToken(res.token);
      onLogin();
      nav("/");
    } catch (e: any) {
      setError(e?.message || "Invalid matric number or password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-sky-600 text-center">Student Portal</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input className="input" type="text" placeholder="Matric Number" value={matricNo} onChange={(e) => setMatricNo(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn-primary w-full" type="submit">Sign In</button>
      </form>
    </div>
  );
}
