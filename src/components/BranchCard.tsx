"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Flag, MessageSquare } from "lucide-react";
import type { Story } from "@/types";
import { toAuthorSlug } from "@/lib/utils";
import DonateButton from "./DonateButton";

const RANK_BORDERS = [
  "border-l-yellow-500",
  "border-l-gray-400",
  "border-l-amber-600",
  "border-l-brand-400",
  "border-l-purple-400",
];

const RANK_BG = [
  "bg-yellow-50/50 dark:bg-yellow-500/5",
  "bg-gray-50 dark:bg-gray-500/5",
  "bg-amber-50/50 dark:bg-amber-500/5",
  "bg-purple-50/30 dark:bg-brand-500/5",
  "bg-purple-50/20 dark:bg-purple-500/5",
];

export default function BranchCard({
  story,
  rank,
  onClick,
}: {
  story: Story;
  rank: number;
  onClick?: () => void;
}) {
  const [votes, setVotes] = useState({ up: story.upvotes, down: story.downvotes });
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [voting, setVoting] = useState(false);

  const score = votes.up - votes.down;
  const borderColor = rank < RANK_BORDERS.length ? RANK_BORDERS[rank] : "border-l-gray-300 dark:border-l-gray-800";
  const bgColor = rank < RANK_BG.length ? RANK_BG[rank] : "bg-white dark:bg-gray-900/60";

  async function handleVote(e: React.MouseEvent, direction: 1 | -1) {
    e.stopPropagation();
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

  return (
    <div
      onClick={onClick}
      className={`border-l-4 ${borderColor} ${bgColor} hover:bg-amber-50 dark:hover:bg-gray-800/80 rounded-r-xl px-4 py-3.5 cursor-pointer transition-all duration-200 flex items-center gap-3 hover:shadow-md hover:shadow-amber-100/30 dark:hover:shadow-black/10 border border-transparent hover:border-amber-200/40 dark:hover:border-gray-700`}
    >
      {/* Inline vote */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => handleVote(e, 1)}
          className={`p-0.5 rounded transition-all duration-200 ${
            userVote === 1 ? "text-brand-500" : "text-gray-400 dark:text-gray-600 hover:text-brand-500"
          }`}
        >
          <ChevronUp size={16} />
        </button>
        <span
          className={`text-xs font-bold tabular-nums min-w-[1.5rem] text-center transition-colors duration-300 ${
            score > 0 ? "text-brand-500 dark:text-brand-400" : score < 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-600"
          }`}
        >
          {score}
        </span>
        <button
          onClick={(e) => handleVote(e, -1)}
          className={`p-0.5 rounded transition-all duration-200 ${
            userVote === -1 ? "text-red-500" : "text-gray-400 dark:text-gray-600 hover:text-red-500"
          }`}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {story.teaser || story.content}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {story.author_id ? (
            <a
              href={`/author/${toAuthorSlug(story.author_name)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-gray-500 hover:text-brand-500 transition-colors font-medium"
            >
              {story.author_name}
            </a>
          ) : (
            <a href={`/author/${toAuthorSlug(story.author_name)}`} onClick={(e) => e.stopPropagation()} className="text-[10px] text-gray-500 hover:text-brand-400 transition-colors font-medium">{story.author_name}</a>
          )}
          <span className="text-[10px] text-gray-400 dark:text-gray-600 flex items-center gap-0.5" title="Click to read and discuss">
            <MessageSquare size={9} />
          </span>
          <span onClick={(e) => e.stopPropagation()} className="text-[10px]">
            <DonateButton storyId={story.id} />
          </span>
        </div>
      </div>

      {/* Ending badge */}
      {story.is_ending && (
        <span className="shrink-0 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-400/20">
          <Flag size={10} />
          Ending
        </span>
      )}
    </div>
  );
}
