"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ChevronUp, ChevronDown, GitFork, MessageSquare } from "lucide-react";
import type { Story } from "@/types";
import { toAuthorSlug } from "@/lib/utils";
import DonateButton from "./DonateButton";

export default function StoryCard({ story }: { story: Story }) {
  const [votes, setVotes] = useState({ up: story.upvotes, down: story.downvotes });
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [voting, setVoting] = useState(false);

  // Load user's existing vote
  useEffect(() => {
    fetch(`/api/stories/${story.id}/vote`)
      .then((r) => r.json())
      .then((d) => { if (d.vote) setUserVote(d.vote); })
      .catch(() => {});
  }, [story.id]);

  const score = votes.up - votes.down;
  const displayTitle = story.title || "Untitled Branch";

  async function handleVote(direction: 1 | -1) {
    if (voting) return;
    setVoting(true);

    const newVote = userVote === direction ? 0 : direction;

    setVotes((prev) => ({
      up:
        prev.up +
        (newVote === 1 ? 1 : 0) -
        (userVote === 1 ? 1 : 0),
      down:
        prev.down +
        (newVote === -1 ? 1 : 0) -
        (userVote === -1 ? 1 : 0),
    }));
    setUserVote(newVote as 1 | -1 | 0);

    try {
      const res = await fetch(`/api/stories/${story.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: newVote }),
      });
      const data = await res.json();
      if (data.ok) {
        setVotes({ up: data.upvotes, down: data.downvotes });
      }
    } catch {
      setVotes({ up: story.upvotes, down: story.downvotes });
      setUserVote(0);
    }
    setVoting(false);
  }

  return (
    <article className="card flex gap-3">
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <button
          onClick={() => handleVote(1)}
          className={`p-1 rounded transition-colors ${
            userVote === 1 ? "text-brand-400" : "text-gray-500 hover:text-brand-400"
          }`}
        >
          <ChevronUp size={20} />
        </button>
        <span
          className={`text-sm font-bold tabular-nums ${
            score > 0 ? "text-brand-400" : score < 0 ? "text-red-400" : "text-gray-500"
          }`}
        >
          {score}
        </span>
        <button
          onClick={() => handleVote(-1)}
          className={`p-1 rounded transition-colors ${
            userVote === -1 ? "text-red-400" : "text-gray-500 hover:text-red-400"
          }`}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <a href={`/story/${story.slug || story.id}`} className="block group">
          <h2 className="text-lg font-semibold group-hover:text-brand-400 transition-colors truncate">
            {displayTitle}
          </h2>
        </a>

        <p className="mt-1 text-sm text-gray-400 line-clamp-3">{story.content}</p>

        {story.image_url && (
          <div className="mt-3 relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-800">
            <Image
              src={story.image_url}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
            />
          </div>
        )}

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="mt-2 flex gap-1.5">
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

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          {story.author_id ? (
            <a href={`/author/${toAuthorSlug(story.author_name)}`} className="hover:text-brand-400 transition-colors">
              {story.author_name}
            </a>
          ) : (
            <span>{story.author_name}</span>
          )}
          <span>{formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}</span>
          {story.depth > 0 && (
            <span className="flex items-center gap-1">
              <GitFork size={12} /> Branch depth {story.depth}
            </span>
          )}
          {story.children_count !== undefined && story.children_count > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={12} /> {story.children_count} branches
            </span>
          )}
          <DonateButton storyId={story.id} />
        </div>
      </div>
    </article>
  );
}
