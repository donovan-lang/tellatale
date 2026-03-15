"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

export default function StoryForm({ parentId }: { parentId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          author_name: authorName.trim() || "Anonymous",
          image_url: null,
          image_prompt: null,
          parent_id: parentId || null,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      const { id } = await res.json();
      router.push(`/story/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to submit story. Try again.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {parentId && (
        <p className="text-sm text-brand-400">
          Branching from an existing story...
        </p>
      )}

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

      <div>
        <textarea
          placeholder="Write your story seed... (the community will branch it)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm min-h-[160px] resize-y focus:outline-none focus:border-brand-500"
          maxLength={5000}
          required
        />
        <p className="text-right text-xs text-gray-600 mt-1">
          {content.length}/5000
        </p>
      </div>

      <button
        type="submit"
        disabled={!title.trim() || !content.trim() || submitting}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {parentId ? "Add Branch" : "Plant Story Seed"}
      </button>
    </form>
  );
}
