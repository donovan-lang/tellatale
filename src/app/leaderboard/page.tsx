import { createServiceClient } from "@/lib/supabase-server";
import { getGenreIconPath } from "@/lib/genre-theme";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | MakeATale",
  description: "Top writers on MakeATale ranked by votes earned this week.",
};

interface Writer {
  author_name: string;
  author_id: string | null;
  total_votes: number;
  story_count: number;
}

async function getLeaderboard(period: string): Promise<Writer[]> {
  const sb = createServiceClient();
  let since: string | undefined;
  const now = new Date();
  if (period === "week") {
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (period === "month") {
    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  let query = sb
    .from("stories")
    .select("author_name, author_id, upvotes, downvotes")
    .eq("is_hidden", false);

  if (since) query = query.gte("created_at", since);

  const { data } = await query;
  if (!data) return [];

  // Aggregate by author
  const map = new Map<string, Writer>();
  for (const s of data) {
    const key = s.author_id || s.author_name;
    const existing = map.get(key);
    const net = (s.upvotes || 0) - (s.downvotes || 0);
    if (existing) {
      existing.total_votes += net;
      existing.story_count++;
    } else {
      map.set(key, {
        author_name: s.author_name,
        author_id: s.author_id,
        total_votes: net,
        story_count: 1,
      });
    }
  }

  return Array.from(map.values())
    .filter((w) => w.total_votes > 0)
    .sort((a, b) => b.total_votes - a.total_votes)
    .slice(0, 25);
}

export default async function LeaderboardPage() {
  const weekly = await getLeaderboard("week");
  const allTime = await getLeaderboard("all");

  const MEDALS = [
    "bg-yellow-400 text-yellow-900",
    "bg-gray-300 text-gray-700",
    "bg-amber-600 text-amber-100",
  ];

  function renderBoard(writers: Writer[], title: string) {
    return (
      <div className="card p-5">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        {writers.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No writers with votes yet. Be the first!
          </p>
        ) : (
          <div className="space-y-2">
            {writers.map((w, i) => (
              <div
                key={w.author_id || w.author_name}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  i < 3
                    ? "bg-gradient-to-r from-amber-50/50 dark:from-amber-500/5 to-transparent"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                } transition-colors`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i < 3 ? MEDALS[i] : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                <a
                  href={`/author/${encodeURIComponent(w.author_name.toLowerCase().replace(/\s+/g, "-"))}`}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-semibold truncate hover:text-brand-400 transition-colors">
                    {w.author_name}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {w.story_count} {w.story_count === 1 ? "story" : "stories"}
                  </p>
                </a>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand-400">
                    {w.total_votes}
                  </p>
                  <p className="text-[10px] text-gray-500">votes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold">Leaderboard</h1>
        <p className="text-sm text-gray-500 mt-2">
          Top writers ranked by votes earned.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {renderBoard(weekly, "This Week")}
        {renderBoard(allTime, "All Time")}
      </div>

      <div className="text-center mt-8">
        <a href="/submit" className="btn-primary inline-flex items-center gap-2">
          Start Writing to Join the Board
        </a>
      </div>
    </div>
  );
}
