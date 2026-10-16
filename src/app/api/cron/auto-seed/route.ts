import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { postNewStoryToDiscord } from "@/lib/discord";
import { TEXT_MODEL, isTextGenConfigured } from "@/lib/gemini";
import { generateSeed, generateSeedIdea, TONES, VALID_TAGS } from "@/lib/seed-gen";
import { ensureStoryBible, type StoryNode } from "@/lib/story_engine";
import { toStorySlug } from "@/lib/utils";

// How far back genre rotation looks when picking the least-covered genre.
const ROTATION_DAYS = 14;
// Recent TaleBot titles passed to the idea prompt so premises don't repeat.
const AVOID_TITLE_COUNT = 30;

/**
 * POST /api/cron/auto-seed
 * TaleBot plants new seed stories so the library keeps growing on its own.
 * Each seed: invent an idea (least-covered genre lately, random tone), write the seed with
 * the same prompt as the Generate tab, insert it, then build its story bible.
 * Query: ?count=<seeds, default 1, max 3>
 * Requires: Authorization: Bearer CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isTextGenConfigured()) {
    return NextResponse.json(
      { error: "No AI provider configured (RUPERT_API_KEY or GEMINI_API_KEY)" },
      { status: 503 }
    );
  }

  const rawCount = parseInt(req.nextUrl.searchParams.get("count") || "", 10);
  const count = Number.isFinite(rawCount) ? Math.min(3, Math.max(1, rawCount)) : 1;

  const sb = createServiceClient();
  const since = new Date(Date.now() - ROTATION_DAYS * 86_400_000).toISOString();
  const [{ data: recentSeeds }, { data: botSeeds }] = await Promise.all([
    sb.from("stories").select("tags").is("parent_id", null).gte("created_at", since),
    sb
      .from("stories")
      .select("title")
      .is("parent_id", null)
      .eq("author_name", "TaleBot")
      .order("created_at", { ascending: false })
      .limit(AVOID_TITLE_COUNT),
  ]);

  const genreCounts = new Map(VALID_TAGS.map((g) => [g, 0]));
  for (const s of recentSeeds || []) {
    for (const t of s.tags || []) if (genreCounts.has(t)) genreCounts.set(t, genreCounts.get(t)! + 1);
  }
  const avoidTitles = (botSeeds || []).map((s) => s.title).filter(Boolean) as string[];

  const created: { id: string; title: string; genre: string; idea: string }[] = [];
  const errors: string[] = [];

  for (let i = 0; i < count; i++) {
    // Least-covered genre; ties broken randomly so equal genres don't always go in list order.
    const min = Math.min(...Array.from(genreCounts.values()));
    const choices = VALID_TAGS.filter((g) => genreCounts.get(g) === min);
    const genre = choices[Math.floor(Math.random() * choices.length)];
    const tone = TONES[Math.floor(Math.random() * TONES.length)];

    try {
      const idea = await generateSeedIdea({ genre, tone, avoidTitles });
      const seed = await generateSeed({ idea, genre, tone });
      const tags = seed.tags.length ? seed.tags : [genre];
      const seedInput = { idea, genre, tone };

      const { data: inserted, error } = await sb
        .from("stories")
        .insert({
          parent_id: null,
          author_name: "TaleBot",
          story_type: "seed",
          depth: 0,
          title: seed.title,
          slug: toStorySlug(seed.title),
          content: seed.content,
          teaser: null,
          is_ending: false,
          tags,
          upvotes: 0,
          downvotes: 0,
          metadata: { generated_by: "auto-seed", model: TEXT_MODEL, seed_input: seedInput },
        })
        .select("id, slug")
        .single();
      if (error || !inserted) throw new Error(error?.message || "insert failed");

      // Build the bible now so the first branches already have it.
      await ensureStoryBible({
        id: inserted.id,
        title: seed.title,
        content: seed.content,
        teaser: null,
        parent_id: null,
        tags,
        author_name: "TaleBot",
        story_type: "seed",
        metadata: { generated_by: "auto-seed", model: TEXT_MODEL, seed_input: seedInput },
      } as StoryNode);

      postNewStoryToDiscord({
        id: inserted.id,
        title: seed.title,
        content: seed.content.slice(0, 300),
        author_name: "TaleBot",
        tags,
        slug: inserted.slug,
        story_type: "seed",
        teaser: null,
      }).catch(() => {});

      created.push({ id: inserted.id, title: seed.title, genre, idea });
      genreCounts.set(genre, genreCounts.get(genre)! + 1);
      avoidTitles.unshift(seed.title);
    } catch (err) {
      console.error(`[auto-seed] ${genre}/${tone} failed:`, err);
      errors.push(`${genre}: ${err instanceof Error ? err.message : String(err)}`.slice(0, 200));
    }
  }

  return NextResponse.json({ ok: errors.length === 0, seeds_created: created.length, seeds: created, errors });
}
