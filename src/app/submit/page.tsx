"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import StoryForm from "@/components/StoryForm";
import TaleGenerator from "@/components/TaleGenerator";
import {
  BookOpen,
  GitFork,
  ChevronUp,
  Clock,
  Loader2,
  PenLine,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Story } from "@/types";

type Tab = "write" | "generate";

export default function SubmitPage() {
  const { user, loading: authLoading } = useAuth();
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);

  // Read ?idea= param from URL on mount
  const [initialIdea, setInitialIdea] = useState("");
  const [tab, setTab] = useState<Tab>("write");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const idea = params.get("idea") || "";
      if (idea) {
        setInitialIdea(idea);
        setTab("generate");
      }
    }
  }, []);

  // When AI generates a tale, switch to write tab with pre-filled values
  const [generatedTale, setGeneratedTale] = useState<{
    title: string;
    content: string;
    tags: string[];
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoadingStories(true);
    fetch(`/api/stories?author_id=${user.id}`)
      .then((r) => r.json())
      .then((data: Story[]) => {
        if (Array.isArray(data)) {
          setMyStories(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStories(false));
  }, [user]);

  function handleGenerated(tale: {
    title: string;
    content: string;
    tags: string[];
  }) {
    setGeneratedTale(tale);
    setTab("write");
  }

  // Reset generated tale when switching back to generate tab
  function switchTab(t: Tab) {
    if (t === "generate") {
      setGeneratedTale(null);
    }
    setTab(t);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main form */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{"\u{1F331}"}</span>
            <div>
              <h1 className="text-2xl font-bold">Plant a Story Seed</h1>
              <p className="text-sm text-gray-500">
                Write the beginning — the community decides what happens next.
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 mb-6 bg-gray-100 dark:bg-gray-800/70 rounded-xl">
            <button
              type="button"
              onClick={() => switchTab("write")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                tab === "write"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <PenLine size={15} />
              Write
            </button>
            <button
              type="button"
              onClick={() => switchTab("generate")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                tab === "generate"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Sparkles size={15} />
              Generate with AI
            </button>
          </div>

          {/* AI generated badge */}
          {tab === "write" && generatedTale && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-sm text-purple-700 dark:text-purple-300">
              <Sparkles size={14} />
              <span className="font-medium">AI-generated draft loaded.</span>
              <span className="text-purple-500 dark:text-purple-400">
                Edit it to make it yours, then publish.
              </span>
            </div>
          )}

          {tab === "write" ? (
            <StoryForm
              key={generatedTale ? `gen-${generatedTale.title}` : "manual"}
              initialTitle={generatedTale?.title}
              initialContent={generatedTale?.content}
              initialTags={generatedTale?.tags}
            />
          ) : (
            <TaleGenerator onGenerated={handleGenerated} initialPrompt={initialIdea} />
          )}
        </div>

        {/* Sidebar: Your Stories */}
        {user && (
          <aside className="lg:w-[280px] shrink-0">
            <div className="sticky top-20 space-y-4">
              <div className="card p-4">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <BookOpen size={16} className="text-brand-400" />
                  Your Stories
                </h2>

                {authLoading || loadingStories ? (
                  <div className="flex justify-center py-6">
                    <Loader2
                      size={18}
                      className="animate-spin text-gray-500"
                    />
                  </div>
                ) : myStories.length > 0 ? (
                  <div className="space-y-3">
                    {myStories.map((story) => (
                      <a
                        key={story.id}
                        href={`/story/${story.id}`}
                        className="block group"
                      >
                        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-brand-400 transition-colors truncate">
                            {story.title || "Untitled branch"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {story.content}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                            <span className="flex items-center gap-0.5">
                              <ChevronUp size={10} />
                              {story.upvotes - story.downvotes}
                            </span>
                            {story.children_count !== undefined &&
                              story.children_count > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <GitFork size={10} />
                                  {story.children_count}
                                </span>
                              )}
                            <span className="flex items-center gap-0.5">
                              <Clock size={10} />
                              {formatDistanceToNow(
                                new Date(story.created_at),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                          {story.tags && story.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {story.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-700/50 text-gray-500"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-gray-600">
                      No stories yet — plant your first seed!
                    </p>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="card p-4 bg-gray-100/50 dark:bg-gray-900/30 border-dashed border-gray-300 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-400 mb-2">
                  {tab === "generate" ? "AI Generation Tips" : "Writing Tips"}
                </h3>
                <ul className="text-xs text-gray-500 space-y-1.5">
                  {tab === "generate" ? (
                    <>
                      <li>Be specific — &ldquo;a noir detective in 1940s Mars colony&rdquo; beats &ldquo;a mystery story&rdquo;</li>
                      <li>Pick a genre and tone for focused results</li>
                      <li>Regenerate for different takes on the same idea</li>
                      <li>Always edit the AI draft — make it yours</li>
                    </>
                  ) : (
                    <>
                      <li>End your seed with a question or choice</li>
                      <li>Keep it short — leave room for imagination</li>
                      <li>Set a scene, introduce tension, ask &ldquo;what if?&rdquo;</li>
                      <li>Pick 1-3 categories to help readers find you</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
