"use client";

import { ChevronRight, BookOpen, GitFork } from "lucide-react";
import type { Story } from "@/types";

export default function Breadcrumbs({ ancestors }: { ancestors: Story[] }) {
  if (ancestors.length <= 1) return null;

  const rootSlug = ancestors[0]?.slug || ancestors[0]?.id;

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-3 mb-4 text-sm">
      <a
        href={`/story/${rootSlug}/tree`}
        className="shrink-0 p-1.5 rounded-md text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all duration-200 mr-1"
        title="View story tree"
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
                {story.title || `Branch ${i}`}
              </span>
            </span>
          ) : (
            <a
              href={`/story/${story.slug || story.id}`}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/50 truncate max-w-[160px]"
              title={story.title || undefined}
            >
              {story.title || `Branch ${i}`}
            </a>
          )}
        </span>
      ))}
    </nav>
  );
}
