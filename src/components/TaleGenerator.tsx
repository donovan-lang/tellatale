"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronDown,
  Check,
  Wand2,
} from "lucide-react";
import { STORY_CATEGORIES } from "@/lib/demo-data";
import { GENRE_EMOJI, getGenreIconPath } from "@/lib/genre-theme";

const TONES = [
  { value: "dark", label: "Dark" },
  { value: "lighthearted", label: "Lighthearted" },
  { value: "humorous", label: "Humorous" },
  { value: "epic", label: "Epic" },
  { value: "mysterious", label: "Mysterious" },
  { value: "romantic", label: "Romantic" },
  { value: "tense", label: "Tense" },
  { value: "whimsical", label: "Whimsical" },
  { value: "gritty", label: "Gritty" },
  { value: "dreamlike", label: "Dreamlike" },
] as const;

interface GeneratedTale {
  title: string;
  content: string;
  tags: string[];
}

interface TaleGeneratorProps {
  onGenerated: (tale: GeneratedTale) => void;
}

export default function TaleGenerator({ onGenerated }: TaleGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("");
  const [tone, setTone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<GeneratedTale | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setGenerated(null);

    try {
      const res = await fetch("/api/generate-tale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          genre: genre || undefined,
          tone: tone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }

      setGenerated(data);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function useGenerated() {
    if (generated) {
      onGenerated(generated);
    }
  }

  function regenerate() {
    setGenerated(null);
    generate();
  }

  return (
    <div className="space-y-4">
      {/* Prompt input */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">
          Describe your story idea
        </label>
        <textarea
          placeholder='e.g. "A detective in a cyberpunk city discovers their partner is an AI" or "A child finds a door in their closet that leads to a world where time runs backwards"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="input-field min-h-[80px] resize-y"
          maxLength={500}
          disabled={loading}
        />
        <p
          className={`text-right text-[10px] mt-1 tabular-nums ${
            prompt.length > 450 ? "text-amber-400" : "text-gray-500"
          }`}
        >
          {prompt.length}/500
        </p>
      </div>

      {/* Genre quick picks */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">
          Genre <span className="text-gray-400 dark:text-gray-600">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STORY_CATEGORIES.map((cat) => {
            const active = genre === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setGenre(active ? "" : cat)}
                disabled={loading}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-300 dark:border-brand-500/40"
                    : "bg-gray-100 dark:bg-gray-800/70 text-gray-500 border border-gray-300 dark:border-gray-700/50 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                } disabled:opacity-50`}
              >
                <img src={getGenreIconPath(cat)} alt="" width={14} height={14} className="rounded-sm inline-block" /> {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced: Tone */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
        >
          <ChevronDown
            size={12}
            className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
          Tone & mood
        </button>
        {showAdvanced && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {TONES.map((t) => {
              const active = tone === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(active ? "" : t.value)}
                  disabled={loading}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40"
                      : "bg-gray-100 dark:bg-gray-800/70 text-gray-500 border border-gray-300 dark:border-gray-700/50 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                  } disabled:opacity-50`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate button */}
      {!generated && (
        <button
          type="button"
          onClick={generate}
          disabled={!prompt.trim() || loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating your tale...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate Tale
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Generated preview */}
      {generated && (
        <div className="border-2 border-purple-300 dark:border-purple-700 rounded-xl overflow-hidden">
          <div className="bg-purple-50 dark:bg-purple-950/30 px-4 py-3 border-b border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 size={13} />
                Generated Tale
              </span>
              <div className="flex gap-1.5">
                {generated.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200/60 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300"
                  >
                    <img src={getGenreIconPath(tag)} alt="" width={10} height={10} className="rounded-sm inline-block" /> {tag}
                  </span>
                ))}
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">
              {generated.title}
            </h3>
          </div>

          <div className="px-4 py-4 bg-white dark:bg-gray-900 max-h-[300px] overflow-y-auto">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {generated.content}
            </p>
          </div>

          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-purple-200 dark:border-purple-800 flex gap-2">
            <button
              type="button"
              onClick={useGenerated}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-colors shadow-sm"
            >
              <Check size={16} />
              Use This — Edit & Publish
            </button>
            <button
              type="button"
              onClick={regenerate}
              disabled={loading}
              className="flex items-center gap-2 py-2.5 px-4 rounded-lg font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
