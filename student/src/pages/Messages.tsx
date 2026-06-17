import { useEffect, useState } from "react";
import { api } from "../api";
import { Send } from "lucide-react";

type Message = { id: string; senderId: string; recipientId: string; content: string; subject?: string; isRead: boolean; createdAt: string };

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");

  async function load() { api<Message[]>("/messages").then(setMessages).catch(() => {}); }
  useEffect(() => { load(); }, []);

  async function send() {
    if (!recipientId || !content) return;
    await api("/messages", { method: "POST", body: JSON.stringify({ recipientId, content, subject: subject || undefined }) });
    setContent(""); setSubject("");
    load();
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-2xl font-bold">Messages</h1>
      <div className="card p-4 space-y-2">
        <div className="flex gap-2">
          <input className="input" placeholder="Recipient ID" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} />
          <input className="input" placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <textarea className="input flex-1" rows={2} placeholder="Type a message..." value={content} onChange={(e) => setContent(e.target.value)} />
          <button className="btn-primary flex items-center gap-1" onClick={send}><Send className="w-4 h-4" /> Send</button>
        </div>
      </div>
      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`card p-3 ${!m.isRead ? "border-l-4 border-l-sky-500" : ""}`}>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{m.senderId.slice(0, 8)}...</span>
              <span>{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            {m.subject && <p className="font-semibold text-sm">{m.subject}</p>}
            <p className="text-sm">{m.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
