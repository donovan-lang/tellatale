"use client";

import { ChevronRight, BookOpen, GitFork, Layers } from "lucide-react";
import type { Story } from "@/types";

export default function Breadcrumbs({ ancestors }: { ancestors: Story[] }) {
  if (ancestors.length <= 1) return null;

  const rootSlug = ancestors[0]?.slug || ancestors[0]?.id;
  const depth = ancestors.length - 1;

  return (
    <div className="mb-4 space-y-2">
      {/* Depth progress bar */}
      <div className="flex items-center gap-2">
        <Layers size={12} className="text-purple-400 shrink-0" />
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (depth / Math.max(depth, 5)) * 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-500 shrink-0 tabular-nums">
          Depth {depth}
        </span>
      </div>

      {/* Breadcrumb trail */}
      <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide text-sm">
        <a
          href={`/story/${rootSlug}/tree`}
          className="shrink-0 p-1.5 rounded-md text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all duration-200 mr-1"
          title="View full story tree"
        >
          <GitFork size={14} />
        </a>
        {ancestors.map((story, i) => (
          <span key={story.id} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <ChevronRight size={12} className="text-gray-700" />}
            {i === ancestors.length - 1 ? (
              <span className="text-brand-400 font-medium flex items-center gap-1.5 bg-brand-500/10 px-2.5 py-1 rounded-md">
                <BookOpen size={13} />
                <span className="max-w-[160px] truncate">
                  {story.title || story.teaser?.slice(0, 30) || `Branch ${i}`}
                </span>
              </span>
            ) : (
              <a
                href={`/story/${story.slug || story.id}`}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/50 truncate max-w-[160px]"
                title={story.title || story.teaser || undefined}
              >
                {story.title || story.teaser?.slice(0, 25) || `Branch ${i}`}
              </a>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
