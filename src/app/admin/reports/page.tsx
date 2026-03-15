"use client";

import { useEffect, useState } from "react";
import { Flag, Check, X, EyeOff, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";

interface ReportItem {
  id: string;
  story_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  story: { id: string; title: string | null; author_name: string; content: string; is_hidden: boolean } | null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  function load() {
    setLoading(true);
    fetch(`/api/admin/reports?status=${filter}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setReports)
      .finally(() => setLoading(false));
  }

  useEffect(load, [filter]);

  async function handleAction(reportId: string, status: string, storyAction?: string, storyId?: string) {
    // Update report status
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reportId, status }),
    });
    // Optionally hide the story
    if (storyAction === "hide" && storyId) {
      await fetch("/api/admin/stories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: storyId, action: "hide", reason: "Reported content" }),
      });
    }
    load();
  }

  const FILTERS = ["pending", "actioned", "dismissed", "all"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin" className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><ArrowLeft size={18} /></a>
        <h1 className="text-xl font-bold">Report Queue</h1>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === f ? "bg-red-500/20 text-red-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800/50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-500" /></div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start gap-3 mb-3">
                <Flag size={16} className="text-orange-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {r.story?.title || r.story?.content?.slice(0, 60) || "Unknown story"}
                    {r.story?.is_hidden && <span className="ml-2 text-[10px] text-yellow-400">(already hidden)</span>}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    by {r.story?.author_name || "Unknown"} &middot; reported {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  r.status === "pending" ? "bg-orange-400/10 text-orange-400" :
                  r.status === "actioned" ? "bg-red-400/10 text-red-400" :
                  "bg-gray-700 text-gray-400"
                }`}>
                  {r.status}
                </span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800/50 rounded p-2 mb-3">
                <p className="text-xs text-gray-400">&ldquo;{r.reason}&rdquo;</p>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(r.id, "actioned", "hide", r.story_id)}
                    className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded flex items-center gap-1"
                  >
                    <EyeOff size={11} /> Hide Story
                  </button>
                  <button
                    onClick={() => handleAction(r.id, "dismissed")}
                    className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded flex items-center gap-1"
                  >
                    <X size={11} /> Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
          {reports.length === 0 && (
            <div className="text-center py-10">
              <Check size={32} className="mx-auto text-green-400 mb-2" />
              <p className="text-gray-500">No {filter} reports. All clear.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
