"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  ChevronDown,
  ChevronUp,
  Flag,
  Star,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import type { Story } from "@/types";
import { toAuthorSlug } from "@/lib/utils";
import BranchCard from "./BranchCard";
import StoryForm from "./StoryForm";

export default function StoryReader({
  story,
  branches,
  chainAuthors,
  rootStoryId,
}: {
  story: Story;
  branches: Story[];
  chainAuthors?: string[];
  rootStoryId: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [votes, setVotes] = useState({ up: story.upvotes, down: story.downvotes });
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [voting, setVoting] = useState(false);

  // Auto-track reading progress
  useEffect(() => {
    if (!user) return;
    fetch("/api/reading-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        root_story_id: rootStoryId,
        current_story_id: story.id,
      }),
    }).catch(() => {});
  }, [story.id, rootStoryId, user]);

  // Load existing vote
  useEffect(() => {
    fetch(`/api/stories/${story.id}/vote`)
      .then((r) => r.json())
      .then((d) => { if (d.vote) setUserVote(d.vote); })
      .catch(() => {});
  }, [story.id]);

  async function handleVote(direction: 1 | -1) {
    if (voting) return;
    setVoting(true);
    const newVote = userVote === direction ? 0 : direction;
    setVotes((prev) => ({
      up: prev.up + (newVote === 1 ? 1 : 0) - (userVote === 1 ? 1 : 0),
      down: prev.down + (newVote === -1 ? 1 : 0) - (userVote === -1 ? 1 : 0),
    }));
    setUserVote(newVote as 1 | -1 | 0);
    try {
      const res = await fetch(`/api/stories/${story.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: newVote }),
      });
      const data = await res.json();
      if (data.ok) setVotes({ up: data.upvotes, down: data.downvotes });
    } catch {
      setVotes({ up: story.upvotes, down: story.downvotes });
      setUserVote(0);
    }
    setVoting(false);
  }

  const score = votes.up - votes.down;

  // Check if bookmarked
  useEffect(() => {
    if (!user) return;
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const existing = data.find((b: any) => b.story_id === story.id);
          if (existing) {
            setBookmarked(true);
            setBookmarkId(existing.id);
          }
        }
      })
      .catch(() => {});
  }, [story.id, user]);

  async function toggleBookmark() {
    if (!user) return;
    if (bookmarked && bookmarkId) {
      await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });
      setBookmarked(false);
      setBookmarkId(null);
    } else {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_id: story.id,
          root_story_id: rootStoryId,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setBookmarked(true);
        setBookmarkId(data.id);
      }
    }
  }

  const topBranches = showAll ? branches : branches.slice(0, 5);
  const hasMore = branches.length > 5 && !showAll;
  const threadAuthorIds = new Set(chainAuthors || []);

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
            {story.author_id ? (
              <a href={`/author/${toAuthorSlug(story.author_name)}`} className="text-sm font-semibold text-gray-200 hover:text-brand-400 transition-colors">
                {story.author_name}
              </a>
            ) : (
              <p className="text-sm font-semibold text-gray-200">{story.author_name}</p>
            )}
            <p className="text-[11px] text-gray-500">
              Depth {story.depth} &middot; Branch author
            </p>
          </div>
        </div>
      )}

      {/* Story content */}
      <div className="card relative">
        {/* Bookmark button */}
        {user && (
          <button
            onClick={toggleBookmark}
            className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${
              bookmarked
                ? "text-brand-400 bg-brand-400/10"
                : "text-gray-600 hover:text-gray-400 hover:bg-gray-800"
            }`}
            title={bookmarked ? "Remove bookmark" : "Bookmark this point"}
          >
            {bookmarked ? (
              <BookmarkCheck size={18} />
            ) : (
              <Bookmark size={18} />
            )}
          </button>
        )}

        {story.title && (
          <h1 className="text-2xl font-bold mb-3 pr-10">{story.title}</h1>
        )}

        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {story.content}
        </p>

        {/* Vote bar */}
        <div className="mt-4 flex items-center gap-3 pt-3 border-t border-gray-800/60">
          <button
            onClick={() => handleVote(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              userVote === 1
                ? "bg-brand-500/20 text-brand-400"
                : "text-gray-500 hover:text-brand-400 hover:bg-gray-800"
            }`}
          >
            <ChevronUp size={18} />
            Upvote
          </button>
          <span
            className={`text-sm font-bold tabular-nums ${
              score > 0
                ? "text-brand-400"
                : score < 0
                ? "text-red-400"
                : "text-gray-500"
            }`}
          >
            {score}
          </span>
          <button
            onClick={() => handleVote(-1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              userVote === -1
                ? "bg-red-500/20 text-red-400"
                : "text-gray-500 hover:text-red-400 hover:bg-gray-800"
            }`}
          >
            <ChevronDown size={18} />
            Downvote
          </button>
        </div>

        {story.is_ending && (
          <div className="mt-4 flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg text-sm">
            <Flag size={16} />
            <span className="font-medium">
              This path has reached its ending.
            </span>
          </div>
        )}

        {/* Seed author info */}
        {story.story_type === "seed" && (
          <div className="mt-4 flex items-center gap-3 pt-3 border-t border-gray-800/60">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
              {story.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              {story.author_id ? (
                <a href={`/author/${toAuthorSlug(story.author_name)}`} className="text-sm font-medium text-gray-300 hover:text-brand-400 transition-colors">
                  {story.author_name}
                </a>
              ) : (
                <p className="text-sm font-medium text-gray-300">{story.author_name}</p>
              )}
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
                    {branch.author_id &&
                      threadAuthorIds.has(branch.author_id) && (
                        <div
                          className="absolute -left-2 top-3 z-10"
                          title="Author from this story thread"
                        >
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
