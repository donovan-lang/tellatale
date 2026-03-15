"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Flag } from "lucide-react";

export default function StoryForm({ parentId }: { parentId?: string }) {
  const router = useRouter();
  const isBranch = !!parentId;
  const maxContent = isBranch ? 200 : 500;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isEnding, setIsEnding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!isBranch && !title.trim()) || !content.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: isBranch ? null : title.trim(),
          content: content.trim(),
          author_name: authorName.trim() || "Anonymous",
          image_url: null,
          image_prompt: null,
          parent_id: parentId || null,
          is_ending: isBranch ? isEnding : false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }
      const { id } = await res.json();
      router.push(`/story/${id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to submit. Try again.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {isBranch ? (
        <p className="text-sm text-brand-400">What happens next?</p>
      ) : (
        <>
          <div>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-500"
              maxLength={50}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Story title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-lg font-semibold focus:outline-none focus:border-brand-500"
              maxLength={200}
              required
            />
          </div>
        </>
      )}

      <div>
        <textarea
          placeholder={
            isBranch
              ? "Write a 1-2 sentence choice... (the community votes on the best ones)"
              : "Write a short story seed that ends with a question or a choice... (the community will branch it)"
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:border-brand-500 ${
            isBranch ? "min-h-[80px]" : "min-h-[120px]"
          }`}
          maxLength={maxContent}
          required
        />
        <p className="text-right text-xs text-gray-600 mt-1">
          {content.length}/{maxContent}
        </p>
      </div>

      {isBranch && (
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={isEnding}
            onChange={(e) => setIsEnding(e.target.checked)}
            className="rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
          />
          <Flag size={14} className="text-amber-400" />
          This is an ending
        </label>
      )}

      <button
        type="submit"
        disabled={(!isBranch && !title.trim()) || !content.trim() || submitting}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {isBranch ? "Add Choice" : "Plant Story Seed"}
      </button>
    </form>
  );
}
