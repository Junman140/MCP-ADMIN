import { useState } from "react";
import { api } from "../api";
import { Key, Loader2 } from "lucide-react";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);
    try {
      await api("/student/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setMessage({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to change password. Check your current password." });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-sky-500" /> Change Password
        </h2>

        {message && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Current Password</label>
            <input className="input w-full mt-1" type="password" value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">New Password</label>
            <input className="input w-full mt-1" type="password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Confirm New Password</label>
            <input className="input w-full mt-1" type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 inline animate-spin" /> : null} Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
