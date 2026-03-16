export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase-server";
import { getGenreIconPath, GENRE_ICON_SLUG, GENRE_COLORS } from "@/lib/genre-theme";
import StoryCard from "@/components/StoryCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Story } from "@/types";
import Link from "next/link";

/* ── slug <-> genre name mapping ── */

const SLUG_TO_GENRE: Record<string, string> = Object.fromEntries(
  Object.entries(GENRE_ICON_SLUG).map(([genre, slug]) => [slug, genre]),
);

const GENRE_DESCRIPTIONS: Record<string, string> = {
  Fantasy:
    "Venture into enchanted realms of magic, mythical creatures, and epic quests. These tales weave worlds where the impossible becomes reality.",
  "Sci-Fi":
    "Explore the frontiers of technology, space, and the future of humanity. These stories push the boundaries of science and imagination.",
  Horror:
    "Dare to read tales of terror, the supernatural, and the unknown. These stories will keep you on the edge of your seat long after dark.",
  Mystery:
    "Unravel puzzles, follow clues, and piece together the truth. These tales of intrigue and suspense keep you guessing until the very end.",
  Romance:
    "Fall into stories of love, passion, and connection. From first sparks to grand gestures, these tales explore the many facets of the heart.",
  Adventure:
    "Embark on thrilling journeys filled with danger, discovery, and daring feats. These stories take you on unforgettable expeditions.",
  Thriller:
    "Heart-pounding suspense and relentless tension await. These stories deliver twists, stakes, and adrenaline from start to finish.",
  Comedy:
    "Laugh out loud with stories full of wit, absurdity, and humor. These lighthearted tales prove that laughter truly is the best medicine.",
  Drama:
    "Powerful character-driven stories that explore the depth of human emotion, conflict, and resilience in the face of life's challenges.",
  Surreal:
    "Step into the strange and dreamlike. These tales bend reality, blur boundaries, and take you on a journey through the wonderfully bizarre.",
  Historical:
    "Travel back in time through stories set against the backdrop of real historical events, cultures, and eras brought vividly to life.",
  Dystopia:
    "Peer into dark futures and broken societies. These cautionary tales explore what happens when power, technology, or nature goes wrong.",
};

/* ── data fetching ── */

async function getGenreStories(genre: string): Promise<Story[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("stories")
    .select("*")
    .is("parent_id", null)
    .eq("is_hidden", false)
    .contains("tags", [genre])
    .order("upvotes", { ascending: false })
    .limit(100);
  return (data as Story[]) || [];
}

/* ── metadata ── */

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const genre = SLUG_TO_GENRE[params.slug];
  if (!genre) return { title: "Genre Not Found | MakeATale" };

  const description =
    GENRE_DESCRIPTIONS[genre] ||
    `Browse ${genre} stories on MakeATale. Read, branch, and create your own.`;

  return {
    title: `${genre} Stories | MakeATale`,
    description,
    openGraph: {
      title: `${genre} Stories | MakeATale`,
      description,
      siteName: "MakeATale",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${genre} Stories | MakeATale`,
      description,
    },
  };
}

/* ── page ── */

export default async function GenrePage({
  params,
}: {
  params: { slug: string };
}) {
  const genre = SLUG_TO_GENRE[params.slug];
  if (!genre) return notFound();

  const stories = await getGenreStories(genre);
  const theme = GENRE_COLORS[genre] || {
    light: "bg-gray-50",
    dark: "dark:bg-gray-800",
    border: "border-gray-200 dark:border-gray-700",
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8">
      {/* Hero */}
      <section className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <img
            src={getGenreIconPath(genre)}
            alt={genre}
            width={80}
            height={80}
            className="rounded-xl"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {genre} Stories
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {stories.length} {stories.length === 1 ? "story" : "stories"}
        </p>
        <p className="mt-4 max-w-xl mx-auto text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          {GENRE_DESCRIPTIONS[genre]}
        </p>
      </section>

      {/* CTA */}
      <div className="flex justify-center mb-10">
        <Link
          href="/submit"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
        >
          <img
            src={getGenreIconPath(genre)}
            alt=""
            width={18}
            height={18}
            className="rounded-sm"
          />
          Generate a {genre} Tale
        </Link>
      </div>

      {/* Story grid */}
      {stories.length > 0 ? (
        <div className="space-y-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <img
            src={getGenreIconPath(genre)}
            alt=""
            width={48}
            height={48}
            className="mx-auto mb-4 rounded-lg opacity-40"
          />
          <p className="text-gray-500 mb-4">
            No {genre} stories yet. Be the first to write one!
          </p>
          <Link href="/submit" className="btn-primary inline-block text-sm">
            Plant a {genre} Seed
          </Link>
        </div>
      )}

      {/* Browse other genres link */}
      <div className="mt-12 text-center">
        <Link
          href="/genre"
          className="text-sm text-gray-500 hover:text-brand-400 transition-colors"
        >
          Browse all genres &rarr;
        </Link>
      </div>
    </div>
  );
}
