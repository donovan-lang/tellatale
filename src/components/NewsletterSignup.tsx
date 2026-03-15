"use client";

import { useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";

export default function NewsletterSignup({ source = "homepage" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      if (!res.ok) throw new Error("Failed to subscribe");
      setDone(true);
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-brand-400 text-sm font-medium">
        <Check size={18} />
        You&apos;re in! We&apos;ll keep you posted.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : "Subscribe"}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </form>
  );
}
