"use client";
import { useEffect, useState } from "react";
import { Award, ChevronRight } from "lucide-react";

export default function BestPath({ rootId }: { rootId: string }) {
  const [path, setPath] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/stories/${rootId}/tree`)
      .then(r => r.json())
      .then((stories: any[]) => {
        if (!Array.isArray(stories) || stories.length === 0) return;
        // Walk the tree following highest-voted branch at each level
        const byParent = new Map<string, any[]>();
        stories.forEach(s => {
          const pid = s.parent_id || "root";
          if (!byParent.has(pid)) byParent.set(pid, []);
          byParent.get(pid)!.push(s);
        });

        const bestPath: any[] = [];
        let current = stories.find(s => !s.parent_id);
        while (current) {
          bestPath.push(current);
          const children = byParent.get(current.id) || [];
          if (children.length === 0) break;
          current = children.sort((a: any, b: any) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))[0];
        }
        if (bestPath.length > 1) setPath(bestPath);
      })
      .catch(() => {});
  }, [rootId]);

  if (path.length < 2) return null;

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5 mb-2">
        <Award size={13} /> Best Path ({path.length} steps)
      </h3>
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
        {path.map((s, i) => (
          <a key={s.id} href={`/story/${s.slug || s.id}?path=true`} className="flex items-center gap-1 shrink-0">
            {i > 0 && <ChevronRight size={10} className="text-gray-400" />}
            <span className="text-[10px] px-2 py-1 rounded bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors truncate max-w-[120px]">
              {s.title || s.teaser?.slice(0, 30) || "..."}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
