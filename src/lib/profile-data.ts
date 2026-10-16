// Pure helpers that turn a writer's stories into the numbers and milestones their profile shows.
// Shared by the server-rendered /author page and the editor's live preview.
import type { Story } from "@/types";

export interface ProfileStats {
  seeds: number;
  branches: number;
  endings: number;
  votes: number;
  maxVotes: number;
  maxDepth: number;
}

/** Everything a profile view needs about its writer. */
export interface ProfileAuthor {
  profileId: string | null;
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  joined: string | null;
  pinnedStoryId: string | null;
  seeds: Story[];
  contributions: Story[];
  allStories: Story[];
}

const net = (s: Story) => (s.upvotes || 0) - (s.downvotes || 0);
const byDate = (a: Story, b: Story) => a.created_at.localeCompare(b.created_at);

export function splitStories(all: Story[]) {
  const sorted = [...all].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return {
    allStories: sorted,
    seeds: sorted.filter((s) => s.story_type === "seed"),
    contributions: sorted.filter((s) => s.story_type !== "seed"),
  };
}

export function computeStats(a: Pick<ProfileAuthor, "seeds" | "contributions" | "allStories">): ProfileStats {
  return {
    seeds: a.seeds.length,
    branches: a.contributions.length,
    endings: a.allStories.filter((s) => s.is_ending).length,
    votes: a.allStories.reduce((sum, s) => sum + (s.upvotes || 0), 0),
    maxVotes: a.seeds.length ? Math.max(...a.seeds.map(net)) : 0,
    maxDepth: a.allStories.length ? Math.max(...a.allStories.map((s) => s.depth || 0)) : 0,
  };
}

export function genreBreakdown(stories: Story[]): { genre: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const s of stories) for (const tag of s.tags || []) map[tag] = (map[tag] || 0) + 1;
  return Object.entries(map)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
}

/** The pinned seed if it still belongs to the writer, else their most-upvoted seed. */
export function featuredStory(a: Pick<ProfileAuthor, "seeds" | "pinnedStoryId">): { story: Story; pinned: boolean } | null {
  const pinned = a.pinnedStoryId ? a.seeds.find((s) => s.id === a.pinnedStoryId) : undefined;
  if (pinned) return { story: pinned, pinned: true };
  const best = [...a.seeds].sort((x, y) => net(y) - net(x))[0];
  return best ? { story: best, pinned: false } : null;
}

export interface Chapter {
  date: string | null;
  title: string;
  detail: string;
  href?: string;
}

const storyHref = (s: Story) => `/story/${s.slug || s.id}`;
const label = (s: Story) => s.title || s.teaser || "an untitled branch";

/** The writer's journey as dated milestones, oldest first, ending with where they are now. */
export function computeChapters(a: ProfileAuthor, status = ""): Chapter[] {
  const chapters: Chapter[] = [];
  const asc = [...a.allStories].sort(byDate);
  const seeds = asc.filter((s) => s.story_type === "seed");
  const branches = asc.filter((s) => s.story_type !== "seed");

  if (a.joined) chapters.push({ date: a.joined, title: "Arrived", detail: `${a.name} opened their first page on MakeATale.` });
  if (seeds[0]) chapters.push({ date: seeds[0].created_at, title: "The first seed", detail: `Planted “${label(seeds[0])}”.`, href: storyHref(seeds[0]) });
  if (branches[0]) chapters.push({ date: branches[0].created_at, title: "The first branch", detail: `Took a story somewhere new: “${label(branches[0])}”.`, href: storyHref(branches[0]) });

  const firstEnding = asc.find((s) => s.is_ending);
  if (firstEnding) chapters.push({ date: firstEnding.created_at, title: "The first ending", detail: `Brought a path to its close: “${label(firstEnding)}”.`, href: storyHref(firstEnding) });

  for (const n of [5, 25, 100]) {
    if (seeds[n - 1]) chapters.push({ date: seeds[n - 1].created_at, title: `${n} seeds`, detail: `A garden of ${n} stories, the latest “${label(seeds[n - 1])}”.`, href: storyHref(seeds[n - 1]) });
  }
  for (const n of [10, 50, 250]) {
    if (branches[n - 1]) chapters.push({ date: branches[n - 1].created_at, title: `${n} branches`, detail: `${n} turns written in other people's tales.`, href: storyHref(branches[n - 1]) });
  }

  const deepest = [...branches].sort((x, y) => (y.depth || 0) - (x.depth || 0))[0];
  if (deepest && (deepest.depth || 0) >= 5) {
    chapters.push({ date: deepest.created_at, title: "Into the deep", detail: `Wrote ${deepest.depth} choices down a single path.`, href: storyHref(deepest) });
  }

  chapters.sort((x, y) => (x.date || "").localeCompare(y.date || ""));

  const stats = computeStats(a);
  const topGenre = genreBreakdown(a.allStories)[0]?.genre;
  const now = [
    `${stats.seeds} ${stats.seeds === 1 ? "seed" : "seeds"}`,
    `${stats.branches} ${stats.branches === 1 ? "branch" : "branches"}`,
    `${stats.votes} ${stats.votes === 1 ? "vote" : "votes"} earned`,
  ].join(", ");
  chapters.push({
    date: null,
    title: "The story so far",
    detail: `${status ? `${status}. ` : ""}${now}${topGenre ? `, most at home in ${topGenre}` : ""}.`,
  });
  return chapters;
}
