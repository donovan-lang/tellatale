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
      <span className="flex items-center gap-1 text-xs text-green-400">
        <Check size={12} /> Reported
      </span>
    );
  }

  return (
    <span className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-600 hover:text-red-400 transition-colors p-1"
        title="Report"
      >
        <Flag size={12} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400">Report content</span>
            <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-400">
              <X size={12} />
            </button>
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What's wrong with this content?"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-red-500"
            maxLength={500}
          />
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || sending}
            className="mt-2 w-full text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded font-medium disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {sending ? <Loader2 size={10} className="animate-spin" /> : <Flag size={10} />}
            Submit Report
          </button>
        </div>
      )}
    </span>
  );
}
