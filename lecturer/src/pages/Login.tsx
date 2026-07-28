import { useState } from "react";
import { login } from "../api";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      onLogin();
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f1f5f9" }}>
      <form onSubmit={handleLogin} style={{ background: "#fff", padding: "2rem", borderRadius: 8, width: 360, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Lecturer Portal</h1>
        {error && <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "0.5rem" }}>{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "0.625rem", marginBottom: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 6 }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: "0.625rem", marginBottom: "1rem", border: "1px solid #e2e8f0", borderRadius: 6 }} />
        <button type="submit" disabled={loading}
          style={{ width: "100%", padding: "0.625rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
