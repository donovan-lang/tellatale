"use client";
import { useState } from "react";

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

  function handleReact(emoji: string) {
    if (reacted === emoji) {
      setCounts(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 0) - 1) }));
      setReacted(null);
    } else {
      if (reacted) setCounts(prev => ({ ...prev, [reacted]: Math.max(0, (prev[reacted] || 0) - 1) }));
      setCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      setReacted(emoji);
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {REACTIONS.map(r => (
        <button
          key={r.emoji}
          onClick={() => handleReact(r.emoji)}
          title={r.label}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
            reacted === r.emoji
              ? "bg-brand-100 dark:bg-brand-500/20 border-2 border-brand-400 scale-110"
              : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:scale-105"
          }`}
        >
          <span>{r.emoji}</span>
          {(counts[r.emoji] || 0) > 0 && <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{counts[r.emoji]}</span>}
        </button>
      ))}
    </div>
  );
}
