export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase-server";
import { toAuthorSlug } from "@/lib/utils";
import StoryCard from "@/components/StoryCard";
import DonateButton from "@/components/DonateButton";
import FollowButton from "@/components/FollowButton";
import {
  Feather,
  GitFork,
  ChevronUp,
  Calendar,
  Wallet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Story } from "@/types";

interface AuthorData {
  profileId: string | null;
  name: string;
  bio: string | null;
  wallet_address: string | null;
  joined: string | null;
  seeds: Story[];
  contributions: Story[];
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
        <a href="/explore" className="btn-primary mt-4 inline-block">
          Explore stories
        </a>
      </div>
    );
  }

  const { profileId, name, bio, wallet_address, joined, seeds, contributions, stats } =
    data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-2xl font-bold shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{name}</h1>
              {profileId && <FollowButton authorId={profileId} />}
            </div>
            {bio && (
              <p className="text-sm text-gray-400 mt-1">{bio}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {joined && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  First story{" "}
                  {formatDistanceToNow(new Date(joined), {
                    addSuffix: true,
                  })}
                </span>
              )}
              {wallet_address && (
                <span className="flex items-center gap-1">
                  <Wallet size={12} />
                  Tips enabled
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-800/60">
          <div className="text-center">
            <p className="text-xl font-bold text-brand-400">
              {stats.total_seeds}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Seeds
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{stats.total_branches}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Contributions
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-green-400">
              {stats.total_votes}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Votes received
            </p>
          </div>
        </div>

        {/* Tip */}
        {wallet_address && seeds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800/60 flex items-center gap-3">
            <p className="text-sm text-gray-400 flex-1">
              Support {name}&apos;s writing
            </p>
            <DonateButton storyId={seeds[0].id} />
          </div>
        )}
      </div>

      {/* Seeds */}
      {seeds.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Feather size={18} className="text-brand-400" />
            Their Seeds
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

      {/* Contributions */}
      {contributions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <GitFork size={18} className="text-purple-400" />
            Contributions
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
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <GitFork size={14} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 line-clamp-2">
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
