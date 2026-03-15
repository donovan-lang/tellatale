"use client";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { toAuthorSlug } from "@/lib/utils";
import type { Story } from "@/types";

export default function SimilarWriters({ tag, currentAuthor }: { tag: string; currentAuthor: string }) {
  const [writers, setWriters] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/v1/stories?per_page=20&story_type=seed&tag=${tag}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          const nameSet = new Set<string>(data.data.map((s: Story) => s.author_name));
          const names = Array.from(nameSet)
            .filter((n: string) => n !== currentAuthor)
            .slice(0, 5);
          setWriters(names);
        }
      })
      .catch(() => {});
  }, [tag, currentAuthor]);

  if (writers.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Users size={18} className="text-brand-400" />
        Similar Writers
      </h2>
      <div className="space-y-2">
        {writers.map((name, i) => (
          <a key={name} href={`/author/${toAuthorSlug(name)}`} className="card p-3 flex items-center gap-3 hover:border-brand-500/30">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `hsl(${(i * 47 + 270) % 360}, 50%, 40%)` }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</p>
              <p className="text-[10px] text-gray-500">Also writes {tag}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
