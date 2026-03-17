"use client";

import { useState } from "react";
import { Share2, Copy, Check, X, Code2 } from "lucide-react";
import { useToast } from "./Toast";

export default function ShareCard({ story }: { story: { id: string; title: string | null; teaser: string | null; content: string; author_name: string; upvotes: number; downvotes: number; slug: string | null; tags: string[] | null } }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const url = typeof window !== "undefined" ? `${window.location.origin}/story/${story.slug || story.id}` : "";
  const title = story.title || story.teaser || story.content.slice(0, 80);
  const score = story.upvotes - story.downvotes;

  function shareTwitter() {
    const text = `"${title}..." — a story on MakeATale with ${score} votes`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank", "width=550,height=420");
  }

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm flex items-center gap-2">
        <Share2 size={14} /> Share Story
      </button>
    );
  }

  return (
    <div className="card p-5 mt-4 border-2 border-brand-300 dark:border-brand-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Share this story</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={14} /></button>
      </div>

      {/* Preview card */}
      <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-lg p-5 mb-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-[10px] font-black">M</div>
          <span className="text-xs text-purple-300 font-semibold">MakeATale</span>
        </div>
        <p className="text-lg font-bold line-clamp-3 leading-snug">{title}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-purple-300">
          <span>by {story.author_name}</span>
          <span className="text-green-400">&#9650; {score}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={shareTwitter} className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2">
          <Share2 size={14} /> Share on X
        </button>
        <button onClick={copyLink} className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
      <a
        href={process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/TJn25WNRVv"}
        target="_blank"
        rel="noopener"
        className="mt-2 block text-center text-xs text-gray-500 hover:text-brand-400 transition-colors"
      >
        Discuss on Discord
      </a>

      {/* Embed code */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <Code2 size={12} /> Embed on your site
        </p>
        <div className="relative">
          <code className="block text-[10px] bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-nowrap">
            {`<iframe src="${url.replace('/story/', '/embed/')}" width="100%" height="450" frameborder="0"></iframe>`}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`<iframe src="${url.replace('/story/', '/embed/')}" width="100%" height="450" frameborder="0"></iframe>`);
              toast("Embed code copied!");
            }}
            className="absolute top-2 right-2 p-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Copy size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
