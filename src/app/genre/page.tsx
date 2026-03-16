export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase-server";
import { getGenreIconPath, GENRE_ICON_SLUG } from "@/lib/genre-theme";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Genres | MakeATale",
  description:
    "Explore stories by genre on MakeATale. Fantasy, Sci-Fi, Horror, Mystery, Romance, Adventure, and more.",
  openGraph: {
    title: "Browse Genres | MakeATale",
    description:
      "Explore stories by genre on MakeATale. Fantasy, Sci-Fi, Horror, Mystery, Romance, Adventure, and more.",
    siteName: "MakeATale",
    type: "website",
  },
};

const GENRE_SHORT_DESC: Record<string, string> = {
  Fantasy: "Magic, quests & mythical worlds",
  "Sci-Fi": "Space, tech & the future",
  Horror: "Terror, dread & the unknown",
  Mystery: "Clues, puzzles & suspense",
  Romance: "Love, passion & the heart",
  Adventure: "Journeys, danger & discovery",
  Thriller: "Twists, tension & stakes",
  Comedy: "Wit, absurdity & laughs",
  Drama: "Emotion, conflict & resilience",
  Surreal: "Dreamlike, strange & bizarre",
  Historical: "Past eras brought to life",
  Dystopia: "Dark futures & broken worlds",
};

async function getGenreCounts(): Promise<Record<string, number>> {
  const supabase = createServiceClient();
  const { data: stories } = await supabase
    .from("stories")
    .select("tags")
    .is("parent_id", null)
    .eq("is_hidden", false);

  const counts: Record<string, number> = {};
  for (const s of stories || []) {
    if (s.tags && Array.isArray(s.tags)) {
      for (const tag of s.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
  }
  return counts;
}

export default async function GenreIndexPage() {
  const counts = await getGenreCounts();

  // All genres from GENRE_ICON_SLUG, sorted by story count desc
  const genres = Object.entries(GENRE_ICON_SLUG)
    .map(([name, slug]) => ({
      name,
      slug,
      count: counts[name] || 0,
      desc: GENRE_SHORT_DESC[name] || "",
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Browse by Genre
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
          Discover tales across {genres.length} genres
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {genres.map((g) => (
          <Link
            key={g.slug}
            href={`/genre/${g.slug}`}
            className="card flex flex-col items-center text-center p-5 hover:border-brand-500/30 transition-all duration-200 group"
          >
            <img
              src={getGenreIconPath(g.name)}
              alt={g.name}
              width={48}
              height={48}
              className="rounded-lg mb-3 group-hover:scale-110 transition-transform duration-200"
            />
            <h2 className="text-sm font-semibold group-hover:text-brand-400 transition-colors">
              {g.name}
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
              {g.desc}
            </p>
            <span className="mt-2 text-[10px] text-gray-600 dark:text-gray-500 tabular-nums">
              {g.count} {g.count === 1 ? "story" : "stories"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
