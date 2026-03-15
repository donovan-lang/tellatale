"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Trash2, Search, Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import type { Story } from "@/types";

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (showHidden) params.set("hidden", "true");
    if (search) params.set("search", search);
    fetch(`/api/admin/stories?${params}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setStories)
      .finally(() => setLoading(false));
  }

  useEffect(load, [showHidden]);

  async function action(id: string, act: string) {
    const reason = act === "hide" ? prompt("Reason for hiding:") : undefined;
    if (act === "hide" && !reason) return;
    if (act === "delete" && !confirm("Permanently delete this story?")) return;
    await fetch("/api/admin/stories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: act, reason }),
    });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin" className="text-gray-500 hover:text-white"><ArrowLeft size={18} /></a>
        <h1 className="text-xl font-bold">Manage Stories</h1>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search by title or author..."
            className="input-field pl-9 py-2 focus:border-red-500 focus:ring-red-500/20"
          />
        </div>
        <button
          onClick={() => setShowHidden(!showHidden)}
          className={`btn-ghost text-xs flex items-center gap-1.5 ${showHidden ? "text-yellow-400" : ""}`}
        >
          <EyeOff size={14} />
          {showHidden ? "Showing hidden" : "Show hidden"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-500" /></div>
      ) : (
        <div className="space-y-2">
          {stories.map((s) => (
            <div key={s.id} className={`card p-3 flex items-center gap-3 ${s.is_hidden ? "opacity-50 border-yellow-500/30" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {s.title || s.teaser || s.content?.slice(0, 60)}
                  {s.is_hidden && <span className="ml-2 text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">HIDDEN</span>}
                </p>
                <p className="text-[10px] text-gray-500">
                  by {s.author_name} &middot; {s.story_type} &middot; depth {s.depth} &middot; {s.upvotes - s.downvotes} votes
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={`/story/${s.slug || s.id}`} target="_blank" className="p-1.5 text-gray-500 hover:text-white"><ExternalLink size={13} /></a>
                {s.is_hidden ? (
                  <button onClick={() => action(s.id, "unhide")} className="p-1.5 text-yellow-400 hover:text-green-400" title="Unhide"><Eye size={13} /></button>
                ) : (
                  <button onClick={() => action(s.id, "hide")} className="p-1.5 text-gray-500 hover:text-yellow-400" title="Hide"><EyeOff size={13} /></button>
                )}
                <button onClick={() => action(s.id, "delete")} className="p-1.5 text-gray-500 hover:text-red-400" title="Delete"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {stories.length === 0 && <p className="text-center text-gray-500 py-10">No stories found.</p>}
        </div>
      )}
    </div>
  );
}
