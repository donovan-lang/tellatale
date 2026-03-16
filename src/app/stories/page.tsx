"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import StoryCard from "@/components/StoryCard";
import {
  TrendingUp,
  Clock,
  Sparkles,
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
  X,
} from "lucide-react";
import { STORY_CATEGORIES } from "@/lib/demo-data";
import { GENRE_EMOJI } from "@/lib/genre-theme";
import { toAuthorSlug } from "@/lib/utils";
import type { Story } from "@/types";
import OnboardingOverlay from "@/components/OnboardingOverlay";

type FeedTab = "trending" | "new" | "foryou" | "reading" | "bookmarks";
type TrendingPeriod = "day" | "week" | "month" | "all";

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
  const [trendingPeriod, setTrendingPeriod] = useState<TrendingPeriod>("week");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [continueStory, setContinueStory] = useState<any>(null);
  const [readingList, setReadingList] = useState<any[]>([]);
  const [bookmarkList, setBookmarkList] = useState<any[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);

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

  // Fetch reading progress + bookmarks for integrated tabs
  useEffect(() => {
    if (!user) return;
    fetch("/api/reading-progress")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReadingList(data);
          if (data.length > 0) setContinueStory(data[0]);
        }
      })
      .catch(() => {});
    fetch("/api/bookmarks")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBookmarkList(data); })
      .catch(() => {});
  }, [user]);

  // Fetch active challenge
  useEffect(() => {
    fetch("/api/challenges")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const active = data.find((c: any) => new Date(c.end_date) > new Date());
          if (active) setActiveChallenge(active);
        }
      })
      .catch(() => {});
  }, []);

  // Filter stories by trending period
  const periodCutoff = (() => {
    const now = Date.now();
    if (trendingPeriod === "day") return now - 24 * 60 * 60 * 1000;
    if (trendingPeriod === "week") return now - 7 * 24 * 60 * 60 * 1000;
    if (trendingPeriod === "month") return now - 30 * 24 * 60 * 60 * 1000;
    return 0; // "all" — no cutoff
  })();

  const trendingPool = stories.filter(
    (s) => new Date(s.created_at).getTime() >= periodCutoff
  );
  const trending = [...trendingPool].sort(
    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  );
  const newest = [...stories].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  // "For you" is just a shuffle for now — personalization later
  const forYou = [...stories].sort(() => 0.5 - Math.random());

  const sorted =
    tab === "trending" ? trending : tab === "new" ? newest : forYou;

  const feed = filterTag
    ? sorted.filter((s) => s.tags && s.tags.includes(filterTag))
    : sorted;

  // Tag counts from stories
  const tagCounts: Record<string, number> = {};
  for (const s of stories) {
    if (s.tags) {
      for (const t of s.tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
  }

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
    { id: "trending", label: "🔥 Trending", icon: TrendingUp },
    { id: "new", label: "✨ New", icon: Clock },
    { id: "foryou", label: "💜 For You", icon: Sparkles },
    ...(user ? [
      { id: "reading" as FeedTab, label: "📖 Reading", icon: BookOpen },
      { id: "bookmarks" as FeedTab, label: "🔖 Saved", icon: BookMarked },
    ] : []),
  ];

  const TRENDING_PERIODS: { id: TrendingPeriod; label: string }[] = [
    { id: "day", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "all", label: "All Time" },
  ];

  const COLLECTIONS = [
    { name: "Epic Adventures", tags: ["Adventure", "Fantasy"], emoji: "\u{2694}\u{FE0F}\u{1F409}" },
    { name: "Dark & Twisted", tags: ["Horror", "Thriller"], emoji: "\u{1F47B}\u{1F52A}" },
    { name: "Love Stories", tags: ["Romance", "Drama"], emoji: "\u{1F495}\u{1F3AD}" },
  ];

  const NAV_LINKS = [
    { href: "/stories", label: "Stories", icon: Flame, active: true },
    { href: "/submit", label: "Write", icon: Pen },
    ...(user
      ? [{ href: "/account", label: "Settings", icon: Settings }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <OnboardingOverlay />
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
                  Generate tales with AI, write branches, vote, and save stories.
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
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      : "text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50"
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
              📖🌱 Plant a Seed
            </a>

            {/* Surprise Me */}
            <a
              href="/surprise"
              className="btn-ghost w-full flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              {"\u{1F3B2}"} Surprise Me
            </a>

            {/* Quick stats */}
            <div className="card p-4 space-y-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
{"\u{1F4CA}"} Platform Stats
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

            {/* Your Activity (logged in only) */}
            {user && (
              <div className="card p-4 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-500 font-semibold uppercase tracking-wider">
{"\u{2728}"} Your Activity
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Stories</span>
                    <span className="font-bold text-brand-400">
                      {stories.filter(s => s.author_id === user.id).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Votes earned</span>
                    <span className="font-bold text-green-500 dark:text-green-400">
                      {stories.filter(s => s.author_id === user.id).reduce((sum, s) => sum + s.upvotes, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ====== MAIN FEED ====== */}
        <main className="flex-1 min-w-0">
          {/* Continue Reading */}
          {continueStory && continueStory.root_story && (
            <a
              href={`/story/${continueStory.current_story_id}`}
              className="card mb-5 flex items-center gap-4 hover:border-brand-500/30 bg-gradient-to-r from-brand-500/5 to-transparent dark:from-brand-500/5"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">Continue Reading</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mt-0.5">
                  {continueStory.root_story?.title || "Untitled story"}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-400 shrink-0" />
            </a>
          )}

          {/* Story of the Week spotlight */}
          {trending.length > 0 && tab === "trending" && trendingPeriod === "week" && (
            <div className="card mb-5 p-5 border-2 border-yellow-400/30 dark:border-yellow-400/20 bg-gradient-to-r from-yellow-50 dark:from-yellow-500/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-400/20 flex items-center justify-center shrink-0">
                  <Trophy size={20} className="text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wider">Story of the Week</p>
                  <a href={`/story/${trending[0].slug || trending[0].id}`} className="text-base font-bold text-gray-900 dark:text-white hover:text-brand-500 transition-colors line-clamp-1 mt-1 block">
                    {trending[0].title || "Untitled"}
                  </a>
                  <p className="text-xs text-gray-500 mt-1">by {trending[0].author_name} &middot; {trending[0].upvotes - trending[0].downvotes} votes</p>
                </div>
              </div>
            </div>
          )}

          {/* Daily prompt banner */}
          <div className="card mb-5 bg-gradient-to-r from-brand-500/5 to-purple-500/5 border-brand-500/20">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">{"\u{270D}\u{FE0F}"}</span>
              <div className="flex-1">
                <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1">
                  Daily Writing Prompt
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
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
          <div className="flex items-center gap-1 mb-5 border-b border-gray-200 dark:border-gray-800 pb-px flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "text-brand-400 border-b-2 border-brand-400 -mb-px"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
            {/* Trending period pills */}
            {tab === "trending" && (
              <div className="flex items-center gap-1 ml-auto">
                {TRENDING_PERIODS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setTrendingPeriod(p.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                      trendingPeriod === p.id
                        ? "bg-brand-500/20 text-brand-300 border border-brand-500/40"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active filter badge (mobile — tag cloud is in right sidebar on xl) */}
          {filterTag && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">Filtered:</span>
              <span className="text-xs bg-brand-500/20 text-brand-300 px-2.5 py-1 rounded-full border border-brand-500/40">
                {filterTag}
              </span>
              <button
                onClick={() => setFilterTag(null)}
                className="text-xs text-gray-600 hover:text-gray-400"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Stories / Reading / Bookmarks */}
          {tab === "reading" ? (
            <div className="space-y-3">
              {readingList.length > 0 ? readingList.map((p: any) => (
                <a key={p.root_story_id} href={`/story/${p.current_story_id}`} className="card flex items-center gap-4 hover:border-brand-500/30">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">📖</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm">{p.root_story?.title || "Untitled story"}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Depth {p.current_story?.depth || 0} · {p.root_story?.tags?.join(", ") || ""}</p>
                  </div>
                  <span className="text-xs text-brand-400 shrink-0">Continue →</span>
                </a>
              )) : (
                <div className="text-center py-16">
                  <p className="text-2xl mb-2">📖</p>
                  <p className="text-gray-500 text-sm">No stories in progress yet.</p>
                  <p className="text-gray-400 text-xs mt-1">Start reading any story — your progress saves automatically.</p>
                </div>
              )}
            </div>
          ) : tab === "bookmarks" ? (
            <div className="space-y-3">
              {bookmarkList.length > 0 ? bookmarkList.map((b: any) => (
                <a key={b.id} href={`/story/${b.story_id}`} className="card flex items-center gap-4 hover:border-brand-500/30">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">🔖</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm">{b.root_story?.title || "Untitled"}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{b.story?.teaser || b.story?.content?.slice(0, 80) || "Saved point"}</p>
                    {b.note && <p className="text-[10px] text-purple-400 mt-0.5 italic">{b.note}</p>}
                  </div>
                </a>
              )) : (
                <div className="text-center py-16">
                  <p className="text-2xl mb-2">🔖</p>
                  <p className="text-gray-500 text-sm">No bookmarks yet.</p>
                  <p className="text-gray-400 text-xs mt-1">Bookmark decision points while reading to find them later.</p>
                </div>
              )}
            </div>
          ) : loading ? (
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
              <p className="text-2xl mb-3">📚</p>
              <p className="text-gray-500 mb-4">
                No stories yet. Be the first to plant a seed.
              </p>
              <a href="/submit" className="btn-primary inline-block">
                📖🌱 Plant the first seed
              </a>
            </div>
          )}
        </main>

        {/* ====== RIGHT SIDEBAR ====== */}
        <aside className="hidden xl:block w-[260px] shrink-0">
          <div className="sticky top-20 space-y-5">
            {/* Curated Collections */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <BookMarked size={15} className="text-brand-400" />
                Collections
              </h3>
              <div className="space-y-2">
                {COLLECTIONS.map((col) => (
                  <button
                    key={col.name}
                    onClick={() => setFilterTag(col.tags[0])}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <span className="text-lg">{col.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-brand-400 transition-colors">
                        {col.name}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        {col.tags.join(" + ")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Challenge */}
            {activeChallenge && (
              <div className="card p-4 border-2 border-yellow-300/30 dark:border-yellow-500/20">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Trophy size={15} className="text-yellow-500" />
                  Daily Challenge
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 italic mb-2">&ldquo;{activeChallenge.prompt}&rdquo;</p>
                <a href="/challenges" className="text-[10px] text-brand-500 hover:text-brand-400 font-medium">Enter Challenge &rarr;</a>
              </div>
            )}

            {/* Tag Cloud */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold mb-3">Browse by Genre</h3>
              <div className="flex flex-wrap gap-1.5">
                {STORY_CATEGORIES.map((cat) => {
                  const count = tagCounts[cat] || 0;
                  const active = filterTag === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() =>
                        setFilterTag(active ? null : cat)
                      }
                      className={`px-2 py-1 rounded-full transition-colors ${
                        active
                          ? "bg-brand-500/20 text-brand-300 border border-brand-500/40 text-xs font-medium"
                          : count > 0
                          ? "bg-gray-100 dark:bg-gray-800/70 text-gray-400 border border-gray-300 dark:border-gray-700/50 hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600 text-xs"
                          : "bg-gray-50 dark:bg-gray-800/30 text-gray-600 border border-gray-200 dark:border-gray-800/50 text-xs"
                      }`}
                    >
                      {GENRE_EMOJI[cat] || ""} {cat}
                      {count > 0 && (
                        <span className="ml-1 text-gray-600">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {filterTag && (
                <button
                  onClick={() => setFilterTag(null)}
                  className="mt-2 text-[11px] text-gray-500 hover:text-gray-400"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Active Writers */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Users size={15} className="text-brand-400" />
                Active Writers
              </h3>
              {activeWriters.length > 0 ? (
                <div className="space-y-2.5">
                  {activeWriters.map((name, i) => (
                    <a
                      key={name}
                      href={`/author/${toAuthorSlug(name)}`}
                      className="flex items-center gap-2.5 group"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: `hsl(${(i * 47 + 270) % 360}, 60%, 35%)`,
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-brand-400 transition-colors">
                        {name}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 ml-auto" />
                    </a>
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
                          <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-brand-400 transition-colors truncate">
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
                <p className="text-sm font-semibold mb-2">Start creating</p>
                <p className="text-xs text-gray-500 mb-3">
                  Generate tales with AI, branch stories, save chronicles, and
                  earn tips.
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
