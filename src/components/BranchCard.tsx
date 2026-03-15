"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Flag } from "lucide-react";
import type { Story } from "@/types";

const RANK_COLORS = [
  "border-l-yellow-500",   // gold
  "border-l-gray-400",     // silver
  "border-l-amber-700",    // bronze
  "border-l-brand-500",
  "border-l-brand-700",
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
  const borderColor = rank < RANK_COLORS.length ? RANK_COLORS[rank] : "border-l-gray-700";

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
      await fetch(`/api/stories/${story.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: newVote }),
      });
    } catch {
      setVotes({ up: story.upvotes, down: story.downvotes });
      setUserVote(0);
    }
    setVoting(false);
  }

  return (
    <div
      onClick={onClick}
      className={`border-l-4 ${borderColor} bg-gray-900/50 hover:bg-gray-800/70 rounded-r-lg px-4 py-3 cursor-pointer transition-colors flex items-center gap-3`}
    >
      {/* Inline vote */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={(e) => handleVote(e, 1)}
          className={`p-0.5 rounded transition-colors ${
            userVote === 1 ? "text-brand-400" : "text-gray-600 hover:text-brand-400"
          }`}
        >
          <ChevronUp size={16} />
        </button>
        <span
          className={`text-xs font-bold tabular-nums min-w-[1.5rem] text-center ${
            score > 0 ? "text-brand-400" : score < 0 ? "text-red-400" : "text-gray-600"
          }`}
        >
          {score}
        </span>
        <button
          onClick={(e) => handleVote(e, -1)}
          className={`p-0.5 rounded transition-colors ${
            userVote === -1 ? "text-red-400" : "text-gray-600 hover:text-red-400"
          }`}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-300 flex-1 line-clamp-2">{story.content}</p>

      {/* Ending badge */}
      {story.is_ending && (
        <span className="shrink-0 flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
          <Flag size={10} />
          Ending
        </span>
      )}
    </div>
  );
}
