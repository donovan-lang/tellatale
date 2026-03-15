"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import StoryCard from "@/components/StoryCard";
import {
  TrendingUp,
  Clock,
  Sparkles,
  Feather,
  BookOpen,
  BookMarked,
  Settings,
  User,
  Users,
  Trophy,
  Flame,
  Pen,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Story } from "@/types";

type FeedTab = "trending" | "new" | "foryou";

// Writing prompts that rotate
const PROMPTS = [
  "A stranger knocks on your door at 3 AM and says your name...",
  "The last email ever sent reads...",
  "You discover your reflection moves on its own...",
  "An extinct animal is spotted in downtown...",
  "The moon disappears for exactly one hour...",
  "A child's drawing comes to life overnight...",
  "The ocean recedes and doesn't come back...",
];

export default function ExplorePage() {
  const { user, loading: authLoading } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FeedTab>("trending");

  const penName =
    user?.user_metadata?.pen_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Writer";

  const prompt = PROMPTS[new Date().getDay() % PROMPTS.length];

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStories(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const trending = [...stories].sort(
    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  );
  const newest = [...stories].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  // "For you" is just a shuffle for now — personalization later
  const forYou = [...stories].sort(() => 0.5 - Math.random());

  const feed =
    tab === "trending" ? trending : tab === "new" ? newest : forYou;

  // Fake "active writers" from story author names
  const activeWriters = Array.from(
    new Map(stories.map((s) => [s.author_name, s])).values()
  )
    .slice(0, 8)
    .map((s) => s.author_name);

  // Top writers by net votes
  const topWriters = [...stories]
    .sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes))
    .slice(0, 5);

  const TABS: { id: FeedTab; label: string; icon: typeof TrendingUp }[] = [
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "new", label: "New", icon: Clock },
    { id: "foryou", label: "For You", icon: Sparkles },
  ];

  const NAV_LINKS = [
    { href: "/explore", label: "Feed", icon: Flame, active: true },
    { href: "/submit", label: "Write", icon: Pen },
    ...(user
      ? [
          { href: "/chronicles", label: "My Chronicles", icon: BookMarked },
          { href: "/account", label: "Settings", icon: Settings },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="flex gap-6">
        {/* ====== LEFT SIDEBAR ====== */}
        <aside className="hidden lg:block w-[220px] shrink-0">
          <div className="sticky top-20 space-y-5">
            {/* User card */}
            {user ? (
              <a href="/account" className="block card hover:border-brand-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {penName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{penName}</p>
                    <p className="text-xs text-gray-500">View profile</p>
                  </div>
                </div>
              </a>
            ) : (
              <div className="card p-4 space-y-3">
                <p className="text-sm text-gray-400">
                  Join the community to write, vote, and save stories.
                </p>
                <a
                  href="/signup"
                  className="btn-primary w-full text-center text-sm block"
                >
                  Sign Up Free
                </a>
                <a
                  href="/login"
                  className="btn-ghost w-full text-center text-sm block"
                >
                  Log In
                </a>
              </div>
            )}

            {/* Nav */}
            <nav className="space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    link.active
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Plant a seed CTA */}
            <a
              href="/submit"
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold"
            >
              <Feather size={16} />
              Plant a Seed
            </a>

            {/* Quick stats */}
            <div className="card p-4 space-y-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Community
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-brand-400">
                    {stories.length}
                  </p>
                  <p className="text-[10px] text-gray-500">Stories</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {stories.reduce(
                      (sum, s) => sum + (s.children_count || 0),
                      0
                    )}
                  </p>
                  <p className="text-[10px] text-gray-500">Branches</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ====== MAIN FEED ====== */}
        <main className="flex-1 min-w-0">
          {/* Daily prompt banner */}
          <div className="card mb-5 bg-gradient-to-r from-brand-500/5 to-purple-500/5 border-brand-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={16} className="text-brand-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1">
                  Daily Writing Prompt
                </p>
                <p className="text-sm text-gray-300 italic">
                  &ldquo;{prompt}&rdquo;
                </p>
              </div>
              <a
                href="/submit"
                className="btn-ghost text-xs text-brand-400 hover:text-brand-300 shrink-0 flex items-center gap-1"
              >
                Write <ChevronRight size={12} />
              </a>
            </div>
          </div>

          {/* Feed tabs */}
          <div className="flex items-center gap-1 mb-5 border-b border-gray-800 pb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "text-brand-400 border-b-2 border-brand-400 -mb-px"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Stories */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={24} className="animate-spin text-gray-500" />
            </div>
          ) : feed.length > 0 ? (
            <div className="space-y-4">
              {feed.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen size={40} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500 mb-4">
                No stories yet. Be the first to plant a seed.
              </p>
              <a href="/submit" className="btn-primary inline-block">
                Plant the first seed
              </a>
            </div>
          )}
        </main>

        {/* ====== RIGHT SIDEBAR ====== */}
        <aside className="hidden xl:block w-[260px] shrink-0">
          <div className="sticky top-20 space-y-5">
            {/* Active Writers */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Users size={15} className="text-brand-400" />
                Active Writers
              </h3>
              {activeWriters.length > 0 ? (
                <div className="space-y-2.5">
                  {activeWriters.map((name, i) => (
                    <div key={name} className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: `hsl(${(i * 47 + 270) % 360}, 60%, 35%)`,
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-300 truncate">
                        {name}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">No writers yet.</p>
              )}
            </div>

            {/* Leaderboard */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Trophy size={15} className="text-yellow-500" />
                Top Stories
              </h3>
              {topWriters.length > 0 ? (
                <div className="space-y-2.5">
                  {topWriters.map((story, i) => {
                    const medals = ["text-yellow-500", "text-gray-400", "text-amber-700"];
                    return (
                      <a
                        key={story.id}
                        href={`/story/${story.id}`}
                        className="flex items-start gap-2.5 group"
                      >
                        <span
                          className={`text-xs font-bold w-4 shrink-0 mt-0.5 ${
                            i < 3 ? medals[i] : "text-gray-600"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-300 group-hover:text-brand-400 transition-colors truncate">
                            {story.title || "Untitled"}
                          </p>
                          <p className="text-[10px] text-gray-600">
                            {story.upvotes - story.downvotes} votes &middot;{" "}
                            {story.author_name}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-600">No stories yet.</p>
              )}
            </div>

            {/* Your Stories (logged in only) */}
            {user && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <BookOpen size={15} className="text-brand-400" />
                  Your Stories
                </h3>
                {stories.filter((s) => s.author_id === user.id).length > 0 ? (
                  <div className="space-y-2">
                    {stories
                      .filter((s) => s.author_id === user.id)
                      .slice(0, 3)
                      .map((story) => (
                        <a
                          key={story.id}
                          href={`/story/${story.id}`}
                          className="block text-sm text-gray-400 hover:text-brand-400 truncate transition-colors"
                        >
                          {story.title || "Untitled branch"}
                        </a>
                      ))}
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-600 mb-2">
                      You haven&apos;t written anything yet.
                    </p>
                    <a
                      href="/submit"
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      Plant your first seed <ChevronRight size={10} />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Join CTA (logged out) */}
            {!user && !authLoading && (
              <div className="card p-4 bg-gradient-to-br from-brand-500/5 to-purple-500/5 border-brand-500/20">
                <p className="text-sm font-semibold mb-2">Start writing</p>
                <p className="text-xs text-gray-500 mb-3">
                  Create an account to plant seeds, save chronicles, and earn
                  tips.
                </p>
                <a
                  href="/signup"
                  className="btn-primary w-full text-center text-sm block"
                >
                  Sign Up Free
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
