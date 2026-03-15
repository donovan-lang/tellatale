"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Flag } from "lucide-react";
import type { Story } from "@/types";
import BranchCard from "./BranchCard";
import StoryForm from "./StoryForm";

export default function StoryReader({
  story,
  branches,
}: {
  story: Story;
  branches: Story[];
}) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);

  const topBranches = showAll ? branches : branches.slice(0, 5);
  const hasMore = branches.length > 5 && !showAll;

  return (
    <div>
      {/* Story content */}
      <div className="card">
        {story.title && (
          <h1 className="text-2xl font-bold mb-3">{story.title}</h1>
        )}
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {story.content}
        </p>

        {story.is_ending && (
          <div className="mt-4 flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg text-sm">
            <Flag size={16} />
            <span className="font-medium">This path has reached its ending.</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span>{story.author_name}</span>
          <span>Depth {story.depth}</span>
          {story.story_type === "seed" && (
            <span className="text-brand-400">Seed</span>
          )}
        </div>
      </div>

      {/* Branches section */}
      {!story.is_ending && (
        <div className="mt-6">
          {branches.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-3 text-gray-300">
                What happens next?
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {branches.length} choice{branches.length !== 1 ? "s" : ""}
                </span>
              </h2>

              <div className="space-y-2">
                {topBranches.map((branch, i) => (
                  <BranchCard
                    key={branch.id}
                    story={branch}
                    rank={i}
                    onClick={() => router.push(`/story/${branch.id}`)}
                  />
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={() => setShowAll(true)}
                  className="mt-2 text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                >
                  <ChevronDown size={14} />
                  Show {branches.length - 5} more
                </button>
              )}
            </>
          )}

          {/* Add choice form */}
          <div className="mt-6">
            <h2 className="text-base font-semibold mb-3 text-gray-400">
              {branches.length > 0 ? "Add your choice..." : "Be the first to decide what happens next..."}
            </h2>
            <StoryForm parentId={story.id} />
          </div>
        </div>
      )}
    </div>
  );
}
