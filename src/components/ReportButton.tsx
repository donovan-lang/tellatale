"use client";

import { useState } from "react";
import { Flag, X, Loader2, Check } from "lucide-react";

export default function ReportButton({ storyId }: { storyId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!reason.trim() || sending) return;
    setSending(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: storyId, reason: reason.trim() }),
      });
      setSent(true);
      setTimeout(() => { setOpen(false); setSent(false); setReason(""); }, 1500);
    } catch {}
    setSending(false);
  }

  if (sent) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
        <Check size={10} /> Reported
      </span>
    );
  }

  return (
    <span className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
        title="Report content"
      >
        <Flag size={12} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-4 shadow-2xl shadow-black/20 dark:shadow-black/40 z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Report content</span>
            <button onClick={() => setOpen(false)} className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="What's wrong with this content?"
            className="input-field text-xs py-2"
            maxLength={500}
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || sending}
            className="mt-3 w-full text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-2 rounded-lg font-medium disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all duration-200"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Flag size={12} />}
            Submit Report
          </button>
        </div>
      )}
    </span>
  );
}
