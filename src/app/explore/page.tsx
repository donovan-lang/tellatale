import { TrendingUp, Clock, Feather } from "lucide-react";
import StoryCard from "@/components/StoryCard";
import { DEMO_STORIES, isDemo } from "@/lib/demo-data";
import type { Story } from "@/types";

export const metadata = {
  title: "Explore Stories — MakeATale",
  description: "Browse trending and new story seeds. Read branches, vote on paths, and add your own.",
};

async function getStories(): Promise<Story[]> {
  try {
    if (isDemo()) return DEMO_STORIES;

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("stories")
      .select("*, children_count:stories(count)")
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch {
    return DEMO_STORIES;
  }
}

export default async function ExplorePage() {
  const stories = await getStories();
  const topStories = [...stories].sort(
    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  );
  const newStories = [...stories].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="section-heading">Explore Stories</h1>
          <p className="mt-2 text-gray-500">
            Discover story seeds, read branches, vote on the best paths, or
            plant your own.
          </p>
        </div>
        <a
          href="/submit"
          className="btn-primary inline-flex items-center gap-2 shrink-0"
        >
          <Feather size={16} />
          Plant a Seed
        </a>
      </div>

      {/* Trending */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-brand-400" />
          Trending
        </h2>
        {topStories.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {topStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">
            <p className="text-lg">No stories yet. Be the first.</p>
            <a href="/submit" className="btn-primary mt-4 inline-block">
              Plant the first seed
            </a>
          </div>
        )}
      </section>

      {/* Fresh Seeds */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock size={18} className="text-brand-400" />
          Fresh Seeds
        </h2>
        {newStories.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {newStories.map((story) => (
              <StoryCard key={`new-${story.id}`} story={story} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600 py-8 text-center">
            Nothing here yet — be the first to plant a story seed.
          </p>
        )}
      </section>
    </div>
  );
}
