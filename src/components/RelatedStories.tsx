"use client";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { getGenreIconPath } from "@/lib/genre-theme";
import type { Story } from "@/types";

export default function RelatedStories({ tags, currentId }: { tags: string[] | null; currentId: string }) {
  const [related, setRelated] = useState<Story[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results: Story[] = [];
      const seenIds = new Set<string>([currentId]);

      // 1. Try tag-based matches first
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          if (results.length >= 4) break;
          try {
            const res = await fetch(`/api/v1/stories?per_page=10&story_type=seed&tag=${tag}`);
            const data = await res.json();
            if (data.data) {
              for (const s of data.data as Story[]) {
                if (!seenIds.has(s.id) && results.length < 4) {
                  seenIds.add(s.id);
                  results.push(s);
                }
              }
            }
          } catch {
            // skip this tag
          }
        }
      }

      // 2. Fall back to recent popular stories if we don't have 4 yet
      if (results.length < 4) {
        try {
          const res = await fetch(`/api/v1/stories?per_page=10&story_type=seed&sort=popular`);
          const data = await res.json();
          if (data.data) {
            for (const s of data.data as Story[]) {
              if (!seenIds.has(s.id) && results.length < 4) {
                seenIds.add(s.id);
                results.push(s);
              }
            }
          }
        } catch {
          // ignore
        }
      }

      if (!cancelled) setRelated(results);
    }

    load();
    return () => { cancelled = true; };
  }, [tags, currentId]);

  if (related.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-amber-200/60 dark:border-gray-800/60">
      <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Sparkles size={16} className="text-brand-400" />
        More Like This
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {related.map(s => {
          const voteCount = s.upvotes - s.downvotes;
          const firstTag = s.tags && s.tags.length > 0 ? s.tags[0] : null;
          return (
            <a
              key={s.id}
              href={`/story/${s.slug || s.id}`}
              className="card p-3 flex items-start gap-3 hover:border-brand-500/30 transition-colors group"
            >
              {/* Genre icon */}
              <div className="shrink-0 mt-0.5">
                <img
                  src={getGenreIconPath(firstTag || "")}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-md opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-brand-500 transition-colors">
                  {s.title || "Untitled"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {s.author_name}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-600 flex items-center gap-0.5">
                    <ThumbsUp size={9} />
                    {voteCount}
                  </span>
                  {firstTag && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 dark:text-brand-300 shrink-0">
                      {firstTag}
                    </span>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Discover more link */}
      <div className="mt-4 text-center">
        <Link
          href="/stories"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-400 transition-colors"
        >
          Discover more
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
