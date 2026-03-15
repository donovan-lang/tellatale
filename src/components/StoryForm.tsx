"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Send,
  Flag,
  Wand2,
  Sparkles,
  Compass,
  CheckCheck,
  PenLine,
  Lightbulb,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { STORY_CATEGORIES } from "@/lib/demo-data";
import { useToast } from "./Toast";

type AiAction =
  | "next_sentence"
  | "directions"
  | "grammar"
  | "polish"
  | "shorten"
  | "stronger_ending"
  | "expand";

interface AiSuggestion {
  action: AiAction;
  label: string;
  text: string;
}

// Placeholder responses until the AI API is hooked up
const PLACEHOLDER_RESPONSES: Record<AiAction, (content: string) => string> = {
  next_sentence: (c) =>
    c.length > 20
      ? "The silence that followed was heavier than anything that had come before."
      : "Something stirred in the darkness, just beyond the edge of sight.",
  directions: () =>
    "1. The protagonist discovers the truth is worse than they imagined\n2. An unexpected ally appears with a warning\n3. The world shifts — literally — and nothing is where it was",
  grammar: (c) => c, // Would return corrected text
  polish: (c) => c, // Would return polished text
  shorten: (c) =>
    c.length > 100 ? c.slice(0, Math.floor(c.length * 0.7)) + "..." : c,
  stronger_ending: () =>
    "And in that moment, she understood: the door had never been locked from the outside.",
  expand: (c) => c + " The air grew thick with anticipation. Every shadow seemed to lean closer, listening.",
};

export default function StoryForm({ parentId }: { parentId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const isBranch = !!parentId;
  const maxContent = isBranch ? 5000 : 3000;
  const maxTeaser = 300;

  const [title, setTitle] = useState("");
  const [teaser, setTeaser] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isEnding, setIsEnding] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Anti-spam: honeypot + timestamp
  const [honeypot, setHoneypot] = useState("");
  const [formLoadedAt] = useState(Date.now());

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 3
        ? [...prev, tag]
        : prev
    );
  }

  // AI assist state
  const [aiOpen, setAiOpen] = useState(true);
  const [aiLoading, setAiLoading] = useState<AiAction | null>(null);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [showMore, setShowMore] = useState(false);

  async function callAi(action: AiAction, label: string) {
    if (aiLoading) return;
    setAiLoading(action);
    setSuggestion(null);

    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content, title, parent_id: parentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Fallback to placeholder if AI not configured
        await new Promise((r) => setTimeout(r, 400));
        const fallback = PLACEHOLDER_RESPONSES[action](content);
        setSuggestion({ action, label, text: data.error === "AI assist not configured" ? fallback + "\n\n(AI not connected — placeholder response)" : data.error || "Something went wrong" });
      } else {
        setSuggestion({ action, label, text: data.text });
      }
    } catch {
      setSuggestion({
        action,
        label,
        text: "AI assist is not connected yet. Hook up the /api/ai-assist endpoint to enable this.",
      });
    }
    setAiLoading(null);
  }

  function applySuggestion() {
    if (!suggestion) return;

    const { action, text } = suggestion;
    if (action === "grammar" || action === "polish" || action === "shorten") {
      // Replace content
      setContent(text.slice(0, maxContent));
    } else if (action === "next_sentence" || action === "expand") {
      // Append
      const appended = content + (content.endsWith(" ") ? "" : " ") + text;
      setContent(appended.slice(0, maxContent));
    } else if (action === "stronger_ending") {
      // Replace last sentence or append
      const sentences = content.split(/(?<=[.!?])\s+/);
      if (sentences.length > 1) {
        sentences[sentences.length - 1] = text;
        setContent(sentences.join(" ").slice(0, maxContent));
      } else {
        setContent(text.slice(0, maxContent));
      }
    }
    // directions doesn't auto-apply — it's just for inspiration
    setSuggestion(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!isBranch && !title.trim()) || !content.trim() || (isBranch && !teaser.trim()) || submitting) return;

    // Client-side honeypot check
    if (honeypot) return;
    // Client-side timing check
    if (Date.now() - formLoadedAt < 2000) {
      alert("Please take a moment before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: isBranch ? null : title.trim(),
          teaser: isBranch ? teaser.trim() : null,
          content: content.trim(),
          author_name: authorName.trim() || "Anonymous",
          image_url: null,
          image_prompt: null,
          parent_id: parentId || null,
          is_ending: isBranch ? isEnding : false,
          tags: !isBranch && selectedTags.length > 0 ? selectedTags : null,
          _hp: honeypot,
          _ts: formLoadedAt,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }
      const { id } = await res.json();
      toast(isBranch ? "Choice added! Others can now vote on it." : "Story planted! The community can start branching.");
      router.push(isBranch ? `/story/${parentId}` : `/story/${id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to submit. Try again.");
    }
    setSubmitting(false);
  }

  const QUICK_ACTIONS: {
    action: AiAction;
    label: string;
    icon: typeof Wand2;
    description: string;
  }[] = [
    {
      action: "next_sentence",
      label: "Next Sentence",
      icon: ArrowRight,
      description: "Suggest what comes next",
    },
    {
      action: "directions",
      label: "Story Directions",
      icon: Compass,
      description: "3 ways this could go",
    },
    {
      action: "grammar",
      label: "Grammar Pass",
      icon: CheckCheck,
      description: "Fix grammar & spelling",
    },
    {
      action: "polish",
      label: "Polish",
      icon: Sparkles,
      description: "Tighten prose & flow",
    },
  ];

  const MORE_ACTIONS: typeof QUICK_ACTIONS = [
    {
      action: "shorten",
      label: "Shorten",
      icon: PenLine,
      description: "Make it more concise",
    },
    {
      action: "stronger_ending",
      label: "Stronger Ending",
      icon: Lightbulb,
      description: "Rewrite the last line",
    },
    {
      action: "expand",
      label: "Expand",
      icon: Wand2,
      description: "Add detail & atmosphere",
    },
  ];

  const hasContent = content.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot field — hidden from humans, bots fill it */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      {isBranch ? (
        <>
          <p className="text-sm text-brand-400">What happens next?</p>
          {/* Teaser: the choice line readers see */}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
              Choice line <span className="text-gray-600">(what readers see before clicking)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. She opens the door and steps into the darkness..."
              value={teaser}
              onChange={(e) => setTeaser(e.target.value)}
              className="input-field"
              maxLength={maxTeaser}
              required
            />
            <p className="text-right text-xs text-gray-400 dark:text-gray-500 mt-1">
              {teaser.length}/{maxTeaser}
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="input-field py-2"
              maxLength={50}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Story title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-lg font-semibold"
              maxLength={200}
              required
            />
          </div>
        </>
      )}

      {/* Category tags (seeds only) */}
      {!isBranch && (
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Categories{" "}
            <span className="text-gray-400 dark:text-gray-500">(pick up to 3)</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {STORY_CATEGORIES.map((cat) => {
              const active = selectedTags.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleTag(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-300 dark:border-brand-500/40"
                      : "bg-gray-100 dark:bg-gray-800/70 text-gray-500 border border-gray-300 dark:border-gray-700/50 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content textarea */}
      <div>
        {isBranch && (
          <label className="text-xs text-gray-500 mb-1 block">
            Your story <span className="text-gray-600">(the full content readers see after choosing)</span>
          </label>
        )}
        <textarea
          placeholder={
            isBranch
              ? "Write the full story continuation... What happens when the reader picks this choice? End with a new question or decision point to keep the chain going."
              : "Write a short story seed that ends with a question or a choice... (the community will branch it)"
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`input-field resize-y ${
            isBranch ? "min-h-[160px]" : "min-h-[120px]"
          }`}
          maxLength={maxContent}
          required
        />
        <div className="flex justify-between items-center mt-1.5">
          <span className="text-[10px] text-gray-600">
            {isBranch ? "Full story content" : "Story seed"}
          </span>
          <span className={`text-[10px] tabular-nums ${
            content.length > maxContent * 0.9 ? "text-amber-400" : "text-gray-600"
          }`}>
            {content.length.toLocaleString()}/{maxContent.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ====== AI ASSIST ====== */}
      <div className="border-2 border-purple-200 dark:border-purple-900/50 rounded-xl overflow-hidden shadow-sm">
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setAiOpen(!aiOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-brand-600 text-white hover:from-purple-500 hover:to-brand-500 transition-all"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Wand2 size={16} />
            AI Writing Assist
            <span className="text-[10px] text-white/70 font-normal">&mdash; try it!</span>
          </span>
          {aiOpen ? (
            <ChevronUp size={14} className="text-white/70" />
          ) : (
            <ChevronDown size={14} className="text-white/70" />
          )}
        </button>

        {aiOpen && (
          <div className="px-4 py-4 space-y-3 bg-white dark:bg-gray-900">
            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.action}
                  type="button"
                  disabled={!hasContent || !!aiLoading}
                  onClick={() => callAi(a.action, a.label)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md hover:shadow-purple-100 dark:hover:shadow-none transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-600 dark:bg-purple-500 flex items-center justify-center shrink-0 group-hover:bg-purple-500 dark:group-hover:bg-purple-400 transition-colors shadow-sm">
                    {aiLoading === a.action ? (
                      <Loader2 size={15} className="animate-spin text-white" />
                    ) : (
                      <a.icon size={15} className="text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {a.label}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                      {a.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* More tools */}
            {showMore && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MORE_ACTIONS.map((a) => (
                  <button
                    key={a.action}
                    type="button"
                    disabled={!hasContent || !!aiLoading}
                    onClick={() => callAi(a.action, a.label)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed group"
                  >
                    {aiLoading === a.action ? (
                      <Loader2 size={14} className="animate-spin text-purple-600 dark:text-purple-400 shrink-0" />
                    ) : (
                      <a.icon size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {a.label}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                        {a.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              {showMore ? "Less tools" : "More tools"}
              {showMore ? (
                <ChevronUp size={10} />
              ) : (
                <ChevronDown size={10} />
              )}
            </button>

            {!hasContent && (
              <p className="text-xs text-gray-500 italic">
                Start writing to unlock AI tools.
              </p>
            )}

            {/* Suggestion output box */}
            {suggestion && (
              <div className="bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider">
                    {suggestion.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSuggestion(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {suggestion.text}
                </p>
                <div className="flex gap-2 pt-1">
                  {suggestion.action !== "directions" && (
                    <button
                      type="button"
                      onClick={applySuggestion}
                      className="text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCheck size={13} />
                      {suggestion.action === "grammar" ||
                      suggestion.action === "polish" ||
                      suggestion.action === "shorten" ||
                      suggestion.action === "stronger_ending"
                        ? "Apply"
                        : "Insert"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSuggestion(null)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-4 py-2 rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isBranch && (
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={isEnding}
            onChange={(e) => setIsEnding(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-brand-500 focus:ring-brand-500"
          />
          <Flag size={14} className="text-amber-400" />
          This is an ending
        </label>
      )}

      <button
        type="submit"
        disabled={(!isBranch && !title.trim()) || !content.trim() || (isBranch && !teaser.trim()) || submitting}
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
