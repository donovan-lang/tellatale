"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  BookOpen,
  Bookmark,
  ScrollText,
  Trash2,
  Play,
  ArrowRight,
  Loader2,
  MapPin,
  Award,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ReadingProgress, Bookmark as BookmarkType, Chronicle } from "@/types";
import { Suspense } from "react";

type Tab = "progress" | "bookmarks" | "chronicles";

function ReadContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "progress";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    Promise.all([
      fetch("/api/reading-progress").then((r) => r.json()).catch(() => []),
      fetch("/api/bookmarks").then((r) => r.json()).catch(() => []),
      fetch("/api/chronicles").then((r) => r.json()).catch(() => []),
    ]).then(([p, b, c]) => {
      if (Array.isArray(p)) setProgress(p);
      if (Array.isArray(b)) setBookmarks(b);
      if (Array.isArray(c)) setChronicles(c);
    }).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function deleteBookmark(id: string) {
    await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  async function deleteChronicle(id: string) {
    await fetch(`/api/chronicles/${id}`, { method: "DELETE" });
    setChronicles((prev) => prev.filter((c) => c.id !== id));
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) return null;

  const TABS: { id: Tab; label: string; icon: typeof BookOpen; count: number }[] = [
    { id: "progress", label: "\u{1F4D6} Reading", icon: BookOpen, count: progress.length },
    { id: "bookmarks", label: "\u{1F516} Bookmarks", icon: Bookmark, count: bookmarks.length },
    { id: "chronicles", label: "\u{1F4DC} Chronicles", icon: ScrollText, count: chronicles.length },
  ];

  // Group bookmarks by root story
  const bookmarksByRoot = new Map<string, BookmarkType[]>();
  for (const b of bookmarks) {
    const key = b.root_story_id;
    if (!bookmarksByRoot.has(key)) bookmarksByRoot.set(key, []);
    bookmarksByRoot.get(key)!.push(b);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BookOpen size={24} className="text-brand-400" />
          Your Library
        </h1>
        <a href="/read/stats" className="btn-ghost text-xs flex items-center gap-1 ml-auto"><Award size={14} /> My Stats</a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800 pb-px overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium shrink-0 transition-colors ${
              tab === t.id
                ? "text-brand-400 border-b-2 border-brand-400 -mb-px"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <t.icon size={15} />
            {t.label}
            {t.count > 0 && (
              <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===== IN PROGRESS ===== */}
      {tab === "progress" && (
        <div className="space-y-3">
          {progress.length > 0 ? (
            progress.map((p) => (
              <a
                key={p.root_story_id}
                href={`/story/${p.current_story_id}`}
                className="card flex items-center gap-4 hover:border-brand-500/30"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {(p as any).root_story?.title || "Untitled story"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>
                      Depth {(p as any).current_story?.depth || 0}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                    </span>
                    {(p as any).root_story?.tags?.length > 0 && (
                      <span className="text-gray-600">
                        {(p as any).root_story.tags.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-brand-400 text-sm">
                  Continue <ArrowRight size={14} />
                </div>
              </a>
            ))
          ) : (
            <div className="card text-center py-12">
              <BookOpen size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500 mb-4">
                No stories in progress yet. Start reading to track your journey.
              </p>
              <a href="/stories" className="btn-primary inline-block">
                Explore Stories
              </a>
            </div>
          )}
        </div>
      )}

      {/* ===== BOOKMARKS ===== */}
      {tab === "bookmarks" && (
        <div className="space-y-5">
          {bookmarksByRoot.size > 0 ? (
            Array.from(bookmarksByRoot.entries()).map(([rootId, bmarks]) => (
              <div key={rootId} className="card p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Bookmark size={14} className="text-brand-400" />
                  {bmarks[0]?.root_story?.title || "Untitled story"}
                </h3>
                <div className="space-y-2">
                  {bmarks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3"
                    >
                      <MapPin size={14} className="text-purple-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={`/story/${b.story_id}`}
                          className="text-sm text-gray-700 dark:text-gray-300 hover:text-brand-400 transition-colors line-clamp-2"
                        >
                          {b.story?.teaser || b.story?.content?.slice(0, 100) || "Bookmarked node"}
                        </a>
                        {b.note && (
                          <p className="text-[10px] text-purple-400 mt-1 italic">
                            {b.note}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-600 mt-1">
                          Depth {b.story?.depth || 0} &middot; by {b.story?.author_name || "Unknown"} &middot;{" "}
                          {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteBookmark(b.id)}
                        className="shrink-0 p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <Bookmark size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500 mb-4">
                No bookmarks yet. Bookmark decision points while reading to find them later.
              </p>
              <a href="/stories" className="btn-primary inline-block">
                Explore Stories
              </a>
            </div>
          )}
        </div>
      )}

      {/* ===== CHRONICLES ===== */}
      {tab === "chronicles" && (
        <div className="space-y-3">
          {chronicles.length > 0 ? (
            chronicles.map((c) => (
              <div key={c.id} className="card flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">{c.title}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {c.story_path.length} step{c.story_path.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <a
                  href={`/chronicles/${c.id}`}
                  className="p-2 rounded-lg text-brand-400 hover:bg-brand-400/10 transition-colors"
                >
                  <Play size={16} />
                </a>
                <button
                  onClick={() => deleteChronicle(c.id)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <ScrollText size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500">
                Chronicles are saved complete journeys through a story tree. Coming soon.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-500" /></div>}>
      <ReadContent />
    </Suspense>
  );
}
