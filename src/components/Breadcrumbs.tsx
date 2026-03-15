"use client";

import { ChevronRight, BookOpen } from "lucide-react";
import type { Story } from "@/types";

export default function Breadcrumbs({ ancestors }: { ancestors: Story[] }) {
  if (ancestors.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2 mb-4 text-sm">
      {ancestors.map((story, i) => (
        <span key={story.id} className="flex items-center gap-1 shrink-0">
          {i > 0 && <ChevronRight size={14} className="text-gray-600" />}
          {i === ancestors.length - 1 ? (
            <span className="text-brand-400 font-medium flex items-center gap-1">
              <BookOpen size={14} />
              {story.title || `Branch ${i}`}
            </span>
          ) : (
            <a
              href={`/story/${story.slug || story.id}`}
              className="text-gray-500 hover:text-gray-300 transition-colors truncate max-w-[150px]"
            >
              {story.title || `Branch ${i}`}
            </a>
          )}
        </span>
      ))}
    </nav>
  );
}
