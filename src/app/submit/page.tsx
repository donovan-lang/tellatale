"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import StoryForm from "@/components/StoryForm";
import {
  Feather,
  BookOpen,
  GitFork,
  ChevronUp,
  Clock,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Story } from "@/types";

export default function SubmitPage() {
  const { user, loading: authLoading } = useAuth();
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main form */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Feather size={20} className="text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Plant a Story Seed</h1>
              <p className="text-sm text-gray-500">
                Write the beginning — the community decides what happens next.
              </p>
            </div>
          </div>

          <StoryForm />
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
                  Writing Tips
                </h3>
                <ul className="text-xs text-gray-500 space-y-1.5">
                  <li>End your seed with a question or choice</li>
                  <li>Keep it short — leave room for imagination</li>
                  <li>Set a scene, introduce tension, ask &ldquo;what if?&rdquo;</li>
                  <li>Pick 1-3 categories to help readers find you</li>
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
