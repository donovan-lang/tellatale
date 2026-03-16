"use client";
import { useState, useEffect } from "react";

const REACTIONS = [
  { emoji: "\u{1F92F}", label: "Mind-blown" },
  { emoji: "\u{1F602}", label: "Funny" },
  { emoji: "\u{1F631}", label: "Scary" },
  { emoji: "\u{1F60D}", label: "Beautiful" },
  { emoji: "\u{1F525}", label: "Fire" },
];

export default function Reactions({ storyId }: { storyId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reacted, setReacted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/stories/${storyId}/reactions`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data === "object" && data !== null && !data.error) setCounts(data);
      })
      .catch(() => {});
  }, [storyId]);

  async function handleReact(emoji: string) {
    if (loading) return;
    setLoading(true);
    const wasReacted = reacted === emoji;
    if (wasReacted) {
      setCounts((prev) => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 0) - 1) }));
      setReacted(null);
    } else {
      if (reacted) setCounts((prev) => ({ ...prev, [reacted!]: Math.max(0, (prev[reacted!] || 0) - 1) }));
      setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      setReacted(emoji);
    }
    try {
      const res = await fetch(`/api/stories/${storyId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (typeof data === "object" && data !== null && !data.error) setCounts(data);
    } catch {}
    setLoading(false);
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-3">
      {REACTIONS.map((r) => {
        const count = counts[r.emoji] || 0;
        const isActive = reacted === r.emoji;
        return (
          <button
            key={r.emoji}
            onClick={() => handleReact(r.emoji)}
            title={r.label}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all duration-200 ${
              isActive
                ? "bg-brand-100 dark:bg-brand-500/20 border-2 border-brand-400 scale-105 shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:scale-105 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <span className="text-sm">{r.emoji}</span>
            {count > 0 && (
              <span className={`text-[10px] font-bold ${isActive ? "text-brand-600 dark:text-brand-300" : "text-gray-600 dark:text-gray-400"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
      {total > 0 && (
        <span className="text-[10px] text-gray-400 ml-1">{total} reactions</span>
      )}
    </div>
  );
}
