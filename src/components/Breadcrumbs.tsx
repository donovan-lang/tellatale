"use client";

import { ChevronRight, BookOpen } from "lucide-react";
import type { Story } from "@/types";

export default function Breadcrumbs({ ancestors }: { ancestors: Story[] }) {
  if (ancestors.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-3 mb-4 text-sm">
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
              className="text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-md hover:bg-gray-800/50 truncate max-w-[160px]"
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
