"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronRight, Flag } from "lucide-react";
import { toAuthorSlug } from "@/lib/utils";
import type { Story } from "@/types";
import BranchCard from "./BranchCard";
import { useRouter } from "next/navigation";

interface FullPathData {
  story: Story;
  ancestors: Partial<Story>[];
  branches: Story[];
}

export default function FullPathReader({
  storyId,
  rootStoryId,
}: {
  storyId: string;
  rootStoryId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chain, setChain] = useState<Story[]>([]);
  const [branches, setBranches] = useState<Story[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/v1/stories/${storyId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load story");
        return r.json();
      })
      .then((data: FullPathData) => {
        // Build the full chain: ancestors + current story
        // ancestors from the API are partial, so we need to fetch full content
        // For now, use ancestors array and append the current story
        const fullChain = [...(data.ancestors as Story[]), data.story];
        setChain(fullChain);
        setBranches(data.branches || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [storyId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Story chain */}
      {chain.map((story, i) => {
        const isLast = i === chain.length - 1;
        const isRoot = i === 0;

        return (
          <div key={story.id} className="relative">
            {/* Connector line */}
            {i > 0 && (
              <div className="flex items-center justify-center py-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="h-px w-8 bg-gray-300 dark:bg-gray-700" />
                  <ChevronRight size={12} />
                  <div className="h-px w-8 bg-gray-300 dark:bg-gray-700" />
                </div>
              </div>
            )}

            <div
              className={`card relative ${
                isLast
                  ? "border-brand-500/30 bg-brand-500/5"
                  : "opacity-90"
              }`}
            >
              {/* Depth badge */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isRoot
                      ? "bg-brand-500/20 text-brand-400"
                      : isLast
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  {isRoot ? "Seed" : `Depth ${story.depth}`}
                </span>
                {story.title && (
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {story.title}
                  </span>
                )}
              </div>

              {/* Content */}
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                {story.content}
              </p>

              {/* Author line */}
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-gray-200/40 dark:border-gray-800/40">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {story.author_name?.charAt(0).toUpperCase() || "?"}
                </div>
                {story.author_id ? (
                  <a
                    href={`/author/${toAuthorSlug(story.author_name)}`}
                    className="text-xs text-gray-500 hover:text-brand-400 transition-colors font-medium"
                  >
                    {story.author_name}
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 font-medium">
                    {story.author_name}
                  </span>
                )}
                <span className="text-[10px] text-gray-600 ml-auto">
                  {new Date(story.created_at).toLocaleDateString()}
                </span>
              </div>

              {story.is_ending && (
                <div className="mt-3 flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg text-sm">
                  <Flag size={14} />
                  <span className="font-medium text-xs">This path has reached its ending.</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Branches at the bottom */}
      {branches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-base font-semibold mb-3 text-gray-400">
            Continue the story...
            <span className="text-sm font-normal text-gray-600 ml-2">
              {branches.length} choice{branches.length !== 1 ? "s" : ""}
            </span>
          </h3>
          <div className="space-y-2">
            {branches.map((branch, i) => (
              <BranchCard
                key={branch.id}
                story={branch}
                rank={i}
                onClick={() => router.push(`/story/${branch.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
