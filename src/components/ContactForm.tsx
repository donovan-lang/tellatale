"use client";

import { useState } from "react";
import { Loader2, Check, Send } from "lucide-react";

const TOPICS = [
  ["general", "General question"],
  ["support", "Account / support"],
  ["bug", "Bug report"],
  ["partnership", "Partnership"],
  ["press", "Press"],
  ["legal", "Legal / content concern"],
  ["other", "Other"],
];

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", topic: "general", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send your message.");
      setState("sent");
    } catch (err: any) {
      setError(err.message || "Couldn't send your message.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="card flex items-center gap-3 text-sm">
        <Check size={18} className="text-green-500" />
        Thanks — your message was sent. If you left an email, we&apos;ll reply there.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="block mb-1 font-medium">Name <span className="text-gray-500 font-normal">(optional)</span></span>
          <input className="input-field" value={form.name} onChange={set("name")} maxLength={80} />
        </label>
        <label className="block text-sm">
          <span className="block mb-1 font-medium">Email <span className="text-gray-500 font-normal">(for a reply)</span></span>
          <input type="email" className="input-field" value={form.email} onChange={set("email")} maxLength={120} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Topic</span>
        <select className="input-field" value={form.topic} onChange={set("topic")}>
          {TOPICS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Message</span>
        <textarea className="input-field min-h-[160px]" value={form.message} onChange={set("message")} maxLength={2600} required />
      </label>
      {/* Honeypot — hidden from people, bots fill it */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={set("website")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={state === "sending" || form.message.trim().length < 5} className="btn-primary flex items-center gap-2 disabled:opacity-50">
        {state === "sending" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Send message
      </button>
    </form>
  );
}
