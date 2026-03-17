"use client";

import { useState, useEffect } from "react";
import { BookOpen, X } from "lucide-react";

interface ReadingProgress {
  root_story_id: string;
  current_story_id: string;
  updated_at: string;
  root_story: {
    id: string;
    title: string;
    content: string;
    teaser: string;
    author_name: string;
    depth: number;
    tags: string[];
    image_url: string | null;
  } | null;
  current_story: {
    id: string;
    title: string;
    content: string;
    teaser: string;
    author_name: string;
    depth: number;
    tags: string[];
    image_url: string | null;
  } | null;
}

const DISMISS_KEY = "mat_continue_reading_dismissed";

export default function ContinueReading() {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true);
      return;
    }

    fetch("/api/reading-progress")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const recent = data[0] as ReadingProgress;
        // Only show if within last 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (new Date(recent.updated_at).getTime() < thirtyDaysAgo) return;
        if (!recent.root_story) return;
        setProgress(recent);
      })
      .catch(() => {});
  }, []);

  if (dismissed || !progress) return null;

  const story = progress.root_story!;
  const current = progress.current_story;
  const depth = current?.depth ?? 0;
  const storyTitle = story.title || story.teaser || story.content.slice(0, 60) + "...";
  const linkId = current?.id || story.id;
  const ago = formatTimeAgo(progress.updated_at);

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 mb-2">
      <a
        href={`/story/${linkId}`}
        className="block rounded-xl bg-gray-100/60 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-800/50 border-l-4 border-l-brand-500 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors group relative"
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDismiss();
          }}
          className="absolute top-2 right-2 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Dismiss"
        >
          <X size={14} />
        </button>
        <div className="flex items-center gap-3 pr-6">
          <BookOpen size={16} className="text-brand-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              Continue reading:{" "}
              <span className="text-brand-400 group-hover:text-brand-300 transition-colors">
                {storyTitle}
              </span>
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {depth > 0 && (
                <span>Depth {depth} &middot; </span>
              )}
              Last read {ago}
            </p>
          </div>
        </div>
      </a>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
