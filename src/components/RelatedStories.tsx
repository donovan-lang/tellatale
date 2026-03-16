"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Story } from "@/types";

export default function RelatedStories({ tags, currentId }: { tags: string[] | null; currentId: string }) {
  const [related, setRelated] = useState<Story[]>([]);

  useEffect(() => {
    if (!tags || tags.length === 0) return;
    fetch(`/api/v1/stories?per_page=10&story_type=seed&tag=${tags[0]}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setRelated(data.data.filter((s: Story) => s.id !== currentId).slice(0, 3));
        }
      })
      .catch(() => {});
  }, [tags, currentId]);

  if (related.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-amber-200/60 dark:border-gray-800/60">
      <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Sparkles size={16} className="text-brand-400" />
        Related Stories
      </h2>
      <div className="space-y-2">
        {related.map(s => (
          <a key={s.id} href={`/story/${s.slug || s.id}`} className="card p-3 flex items-center gap-3 hover:border-brand-500/30">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{s.title || "Untitled"}</p>
              <p className="text-[10px] text-gray-500 mt-0.5"><span className="hover:text-brand-400 transition-colors cursor-pointer">{s.author_name}</span> · {s.upvotes - s.downvotes} votes</p>
            </div>
            {s.tags && s.tags.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 shrink-0">{s.tags[0]}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
