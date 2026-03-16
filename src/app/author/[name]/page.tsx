export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase-server";
import { toAuthorSlug } from "@/lib/utils";
import StoryCard from "@/components/StoryCard";
import DonateButton from "@/components/DonateButton";
import FollowButton from "@/components/FollowButton";
import {
  ChevronUp,
  Calendar,
  Wallet,
  Sprout,
  GitFork,
  ThumbsUp,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { Story } from "@/types";
import SimilarWriters from "@/components/SimilarWriters";
import AchievementBadges from "@/components/AchievementBadges";
import { getGenreIconPath, GENRE_EMOJI } from "@/lib/genre-theme";

interface AuthorData {
  profileId: string | null;
  name: string;
  bio: string | null;
  wallet_address: string | null;
  joined: string | null;
  seeds: Story[];
  contributions: Story[];
  allStories: Story[];
  stats: { total_seeds: number; total_branches: number; total_votes: number };
}

async function getAuthorBySlug(slug: string): Promise<AuthorData | null> {
  try {
    const supabase = createServiceClient();

    // 1. Try registered profile first
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", slug)
      .single();

    if (profile) {
      const { data: stories } = await supabase
        .from("stories")
        .select("*")
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false });

      const all = stories || [];
      const seeds = all.filter((s: any) => s.story_type === "seed");
      const contributions = all.filter((s: any) => s.story_type === "branch");
      const totalVotes = all.reduce(
        (sum: number, s: any) => sum + (s.upvotes || 0),
        0
      );

      return {
        profileId: profile.id,
        name: profile.pen_name,
        bio: profile.bio,
        wallet_address: profile.wallet_address,
        joined: profile.created_at,
        seeds,
        contributions,
        allStories: all,
        stats: {
          total_seeds: seeds.length,
          total_branches: contributions.length,
          total_votes: totalVotes,
        },
      };
    }

    // 2. No profile — find stories by author_name matching the slug
    const { data: allStories } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });

    // Match stories where slugified author_name equals the slug
    const authorStories = (allStories || []).filter(
      (s: any) => toAuthorSlug(s.author_name) === slug
    );

    if (authorStories.length === 0) return null;

    const authorName = authorStories[0].author_name;
    const seeds = authorStories.filter((s: any) => s.story_type === "seed");
    const contributions = authorStories.filter(
      (s: any) => s.story_type === "branch"
    );
    const totalVotes = authorStories.reduce(
      (sum: number, s: any) => sum + (s.upvotes || 0),
      0
    );
    const earliest = authorStories[authorStories.length - 1]?.created_at;

    return {
      profileId: null,
      name: authorName,
      bio: null,
      wallet_address: null,
      joined: earliest,
      seeds,
      contributions,
      allStories: authorStories,
      stats: {
        total_seeds: seeds.length,
        total_branches: contributions.length,
        total_votes: totalVotes,
      },
    };
  } catch {
    return null;
  }
}

/** Build a genre frequency map from all stories' tags */
function buildGenreBreakdown(stories: Story[]): { genre: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const s of stories) {
    if (s.tags && s.tags.length > 0) {
      for (const tag of s.tags) {
        map[tag] = (map[tag] || 0) + 1;
      }
    }
  }
  return Object.entries(map)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
}

export async function generateMetadata({
  params,
}: {
  params: { name: string };
}) {
  const data = await getAuthorBySlug(params.name);
  if (!data) return { title: "Author Not Found — MakeATale" };
  return {
    title: `${data.name} — MakeATale Author`,
    description:
      data.bio || `Read stories by ${data.name} on MakeATale.`,
  };
}

export default async function AuthorPage({
  params,
}: {
  params: { name: string };
}) {
  const data = await getAuthorBySlug(params.name);

  if (!data) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-400">Author not found</h1>
        <p className="mt-2 text-gray-600">
          No stories found for this author.
        </p>
        <a href="/stories" className="btn-primary mt-4 inline-block">
          Explore stories
        </a>
      </div>
    );
  }

  const { profileId, name, bio, wallet_address, joined, seeds, contributions, allStories, stats } =
    data;

  const genreBreakdown = buildGenreBreakdown(allStories);
  const maxGenreCount = genreBreakdown.length > 0 ? genreBreakdown[0].count : 1;

  // Top stories: seeds sorted by net votes (descending), top 5
  const topStories = [...seeds]
    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
    .slice(0, 5);

  // Recent activity: last 5 stories (seeds + branches) by date
  const recentActivity = [...allStories].slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ── Hero Header ── */}
      <div className="card p-0 mb-6 overflow-hidden">
        {/* Gradient banner */}
        <div className="h-32 bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </div>

        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex items-end gap-5">
            {/* Large avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 via-purple-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shrink-0 ring-4 ring-white dark:ring-gray-900 shadow-lg">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold tracking-tight">{name}</h1>
                {profileId && <FollowButton authorId={profileId} />}
              </div>
              {bio && (
                <p className="text-sm text-gray-400 mt-1 max-w-lg">{bio}</p>
              )}
            </div>
          </div>

          {/* Meta info row */}
          <div className="flex items-center gap-5 mt-4 text-xs text-gray-500 flex-wrap">
            {joined && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                Member since {format(new Date(joined), "MMM yyyy")}
              </span>
            )}
            {wallet_address && (
              <span className="flex items-center gap-1.5">
                <Wallet size={13} />
                Tips enabled
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <BarChart3 size={13} />
              {allStories.length} total {allStories.length === 1 ? "story" : "stories"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-500/10 mb-2">
            <Sprout size={20} className="text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-brand-400">{stats.total_seeds}</p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">Seeds Planted</p>
        </div>
        <div className="card p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/10 mb-2">
            <GitFork size={20} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400">{stats.total_branches}</p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">Branches Written</p>
        </div>
        <div className="card p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 mb-2">
            <ThumbsUp size={20} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.total_votes}</p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">Votes Earned</p>
        </div>
        <div className="card p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 mb-2">
            <Calendar size={20} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {joined ? format(new Date(joined), "yyyy") : "--"}
          </p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">Member Since</p>
        </div>
      </div>

      {/* ── Achievement Badges ── */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Achievements</h2>
        <AchievementBadges stats={{ seeds: stats.total_seeds, branches: stats.total_branches, votes: stats.total_votes, maxVotes: seeds.length > 0 ? Math.max(...seeds.map((s: any) => s.upvotes - s.downvotes)) : 0 }} />
      </div>

      {/* ── Two Column: Genre Breakdown + Recent Activity ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Genre Breakdown */}
        {genreBreakdown.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <BarChart3 size={14} />
              Genre Breakdown
            </h2>
            <div className="space-y-2.5">
              {genreBreakdown.slice(0, 8).map(({ genre, count }) => (
                <div key={genre} className="flex items-center gap-3">
                  <img
                    src={getGenreIconPath(genre)}
                    alt={genre}
                    width={20}
                    height={20}
                    className="rounded-sm shrink-0"
                  />
                  <span className="text-sm font-medium w-20 shrink-0">{genre}</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${(count / maxGenreCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <Clock size={14} />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentActivity.map((story) => (
                <a
                  key={story.id}
                  href={`/story/${story.slug || story.id}`}
                  className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <span className="text-base shrink-0 mt-0.5">
                    {story.story_type === "seed" ? "\uD83C\uDF31" : "\uD83C\uDF3F"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1 group-hover:text-brand-400 transition-colors">
                      {story.title || "Untitled Branch"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                      <span>{story.story_type === "seed" ? "Seed" : `Branch (depth ${story.depth})`}</span>
                      <span>&middot;</span>
                      <span>{formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}</span>
                      <span>&middot;</span>
                      <span className="flex items-center gap-0.5">
                        <ChevronUp size={10} />
                        {story.upvotes - story.downvotes}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Top Stories ── */}
      {topStories.length > 0 && topStories[0].upvotes - topStories[0].downvotes > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-400" />
            Top Stories
            <span className="text-sm font-normal text-gray-500">
              by votes
            </span>
          </h2>
          <div className="space-y-3">
            {topStories
              .filter((s) => s.upvotes - s.downvotes > 0)
              .map((story, idx) => (
                <div key={story.id} className="relative">
                  {idx < 3 && (
                    <span className={`absolute -left-2 -top-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow ${
                      idx === 0 ? "bg-yellow-400 text-yellow-900" :
                      idx === 1 ? "bg-gray-300 text-gray-700" :
                      "bg-amber-600 text-amber-100"
                    }`}>
                      {idx + 1}
                    </span>
                  )}
                  <StoryCard story={story} />
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ── Tip author ── */}
      {wallet_address && seeds.length > 0 && (
        <div className="card p-5 mb-6 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">Support {name}&apos;s writing</p>
            <p className="text-xs text-gray-500 mt-0.5">Send a tip to show appreciation</p>
          </div>
          <DonateButton storyId={seeds[0].id} />
        </div>
      )}

      {/* ── All Seeds ── */}
      {seeds.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            {"\u{1F331}"} Their Seeds
            <span className="text-sm font-normal text-gray-500">
              {seeds.length}
            </span>
          </h2>
          <div className="space-y-3">
            {seeds.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}

      {/* ── Contributions ── */}
      {contributions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            {"\u{1F33F}"} Contributions
            <span className="text-sm font-normal text-gray-500">
              {contributions.length}
            </span>
          </h2>
          <div className="space-y-3">
            {contributions.map((story) => (
              <a
                key={story.id}
                href={`/story/${story.slug || story.id}`}
                className="card flex items-start gap-3 hover:border-purple-500/30 p-3"
              >
                <span className="text-lg shrink-0 mt-0.5">{"\u{1F33F}"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {story.teaser || story.content}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                    <span>Depth {story.depth}</span>
                    <span className="flex items-center gap-0.5">
                      <ChevronUp size={10} />
                      {story.upvotes - story.downvotes}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Similar Writers */}
      {seeds.length > 0 && seeds[0].tags && seeds[0].tags.length > 0 && (
        <SimilarWriters tag={seeds[0].tags[0]} currentAuthor={name} />
      )}

      {seeds.length === 0 && contributions.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {name} hasn&apos;t written any stories yet.
          </p>
        </div>
      )}
    </div>
  );
}
