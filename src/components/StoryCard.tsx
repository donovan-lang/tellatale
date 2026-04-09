"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ChevronUp, ChevronDown, GitFork, MessageSquare, Bot } from "lucide-react";
import type { Story } from "@/types";
import { toAuthorSlug } from "@/lib/utils";
import { getGenreEmoji, getGenreIcon, getGenreIconPath, GENRE_EMOJI } from "@/lib/genre-theme";
import DonateButton from "./DonateButton";
import ReportButton from "./ReportButton";

export default function StoryCard({ story }: { story: Story }) {
  const [votes, setVotes] = useState({ up: story.upvotes, down: story.downvotes });
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [voting, setVoting] = useState(false);

  const score = votes.up - votes.down;
  const displayTitle = story.title || "Untitled Branch";

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

  return (
    <article className="card flex gap-3 group/card">
      {/* Vote column */}
      <div className="flex flex-col items-center gap-0.5 pt-1">
        <button
          onClick={() => handleVote(1)}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            userVote === 1
              ? "text-brand-400 bg-brand-500/10"
              : "text-gray-600 hover:text-brand-400 hover:bg-brand-500/5"
          }`}
        >
          <ChevronUp size={18} />
        </button>
        <span
          className={`text-sm font-bold tabular-nums transition-colors duration-300 ${
            score > 0 ? "text-brand-400" : score < 0 ? "text-red-400" : "text-gray-600"
          }`}
        >
          {score}
        </span>
        <button
          onClick={() => handleVote(-1)}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            userVote === -1
              ? "text-red-400 bg-red-500/10"
              : "text-gray-600 hover:text-red-400 hover:bg-red-500/5"
          }`}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <a href={`/story/${story.slug || story.id}`} className="block group/link">
          <div className="flex items-center gap-2">
            <img src={getGenreIcon(story.tags)} alt={story.tags?.[0] ? `${story.tags[0]} genre icon` : "Story icon"} width={22} height={22} className="shrink-0 rounded" />
            <h2 className="text-base font-semibold group-hover/link:text-brand-400 transition-colors duration-200 line-clamp-1 flex-1">
              {displayTitle}
            </h2>
            {story.children_count !== undefined && story.children_count > 0 && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400">
                <GitFork size={10} />
                {story.children_count} {story.children_count === 1 ? "path" : "paths"}
              </span>
            )}
          </div>
        </a>

        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
          {story.content}
        </p>

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
          <div className="mt-2.5 flex gap-1.5">
            {story.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 flex items-center gap-1"
              >
                <img src={getGenreIconPath(tag)} alt="" width={12} height={12} className="rounded-sm" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="mt-2.5 flex items-center gap-3 text-xs text-gray-500">
          {story.author_id ? (
            <a href={`/author/${toAuthorSlug(story.author_name)}`} className="hover:text-brand-400 transition-colors font-medium flex items-center gap-1">
              {story.author_name}
              {story.is_bot && (
                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20" title="AI Bot">
                  <Bot size={8} />
                  bot
                </span>
              )}
            </a>
          ) : (
            <a href={`/author/${toAuthorSlug(story.author_name)}`} className="font-medium hover:text-brand-400 transition-colors">{story.author_name}</a>
          )}
          <span className="text-gray-700">&middot;</span>
          <span>{formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}</span>
          {story.children_count !== undefined && story.children_count > 0 && (
            <>
              <span className="text-gray-700">&middot;</span>
              <span className="flex items-center gap-1">
                <GitFork size={11} /> {story.children_count}
              </span>
            </>
          )}
          <span className="ml-auto flex items-center gap-2">
            <DonateButton storyId={story.id} />
            <ReportButton storyId={story.id} />
          </span>
        </div>
      </div>
    </article>
  );
}
