"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Flag, User, Star } from "lucide-react";
import type { Story } from "@/types";
import BranchCard from "./BranchCard";
import StoryForm from "./StoryForm";

export default function StoryReader({
  story,
  branches,
  chainAuthors,
}: {
  story: Story;
  branches: Story[];
  chainAuthors?: string[]; // author_ids from the ancestor chain
}) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);

  const topBranches = showAll ? branches : branches.slice(0, 5);
  const hasMore = branches.length > 5 && !showAll;

  // Authors who contributed earlier in this story thread get a badge
  const threadAuthorIds = new Set(chainAuthors || []);

  // Sort branches: thread authors first, then by votes
  const sortedBranches = [...topBranches].sort((a, b) => {
    const aThread = a.author_id && threadAuthorIds.has(a.author_id) ? 1 : 0;
    const bThread = b.author_id && threadAuthorIds.has(b.author_id) ? 1 : 0;
    if (bThread !== aThread) return bThread - aThread;
    return b.upvotes - b.downvotes - (a.upvotes - a.downvotes);
  });

  return (
    <div>
      {/* Author info card (prominent for branches) */}
      {story.story_type === "branch" && (
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-brand-600 flex items-center justify-center text-sm font-bold shrink-0">
            {story.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200">
              {story.author_name}
            </p>
            <p className="text-[11px] text-gray-500">
              Depth {story.depth} &middot; Branch author
            </p>
          </div>
        </div>
      )}

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
            <span className="font-medium">
              This path has reached its ending.
            </span>
          </div>
        )}

        {/* Seed author info (below content) */}
        {story.story_type === "seed" && (
          <div className="mt-4 flex items-center gap-3 pt-3 border-t border-gray-800/60">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
              {story.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">
                {story.author_name}
              </p>
              <p className="text-[10px] text-gray-500">Seed author</p>
            </div>
            {story.tags && story.tags.length > 0 && (
              <div className="flex gap-1 ml-auto">
                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Branches section */}
      {!story.is_ending && (
        <div className="mt-6">
          {branches.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-3 text-gray-300">
                What happens next?
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {branches.length} choice
                  {branches.length !== 1 ? "s" : ""}
                </span>
              </h2>

              <div className="space-y-2">
                {sortedBranches.map((branch, i) => (
                  <div key={branch.id} className="relative">
                    {/* Thread author indicator */}
                    {branch.author_id &&
                      threadAuthorIds.has(branch.author_id) && (
                        <div className="absolute -left-2 top-3 z-10" title="Author from this story thread">
                          <Star
                            size={12}
                            className="text-yellow-500 fill-yellow-500"
                          />
                        </div>
                      )}
                    <BranchCard
                      story={branch}
                      rank={i}
                      onClick={() => router.push(`/story/${branch.id}`)}
                    />
                  </div>
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
              {branches.length > 0
                ? "Add your choice..."
                : "Be the first to decide what happens next..."}
            </h2>
            <StoryForm parentId={story.id} />
          </div>
        </div>
      )}
    </div>
  );
}
