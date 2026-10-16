import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { postNewStoryToDiscord } from "@/lib/discord";
import { generateChoiceAwareBranches } from "@/lib/story_engine";
import { TEXT_MODEL, isTextGenConfigured } from "@/lib/gemini";


const SYSTEM_PROMPT = `You are TaleBot, a creative AI storyteller for MakeATale — a collaborative choose-your-own-adventure platform.

Your job is to generate compelling branch options for stories in a branching narrative.

Rules:
- Match the tone, genre, and voice of the original story exactly
- Be vivid and specific — use concrete sensory details, not vague abstractions
- Avoid cliches ("a chill ran down her spine", "little did they know")
- Each branch should take the story in a genuinely DIFFERENT direction
- Branches should feel like real choices — not just slight variations
- Show don't tell — convey emotion through action and detail
- If previous choices are mentioned in the context, respect that history and build upon it

You MUST respond with valid JSON only. No markdown, no code fences, no explanation.`;

// Stories need at least this many upvotes before TaleBot grows them.
const MIN_UPVOTES = Number(process.env.AUTO_BRANCH_MIN_UPVOTES ?? 2);
// Paths stop growing automatically at this depth; readers and writers can still extend them.
const MAX_DEPTH = Number(process.env.AUTO_BRANCH_MAX_DEPTH ?? 10);
const DEFAULT_STORIES_PER_RUN = 3;
// Don't start a new story after this long; one story can still take ~2 min to finish.
const DEFAULT_BUDGET_SECONDS = 240;

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

interface BranchOutput {
  teaser: string;
  content: string;
}

interface GeminiResponse {
  branches: BranchOutput[];
}

/**
 * POST /api/cron/auto-branch
 * Finds popular stories with 0 branches and generates AI branch options.
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

  const sb = createServiceClient();

  // Grow the library: pick open nodes (seeds or leaves) that have no branches yet, most
  // upvoted first. Rupert takes 30-60s per call, so each run is capped by count and time.
  const params = req.nextUrl.searchParams;
  const maxStories = clampInt(params.get("limit"), DEFAULT_STORIES_PER_RUN, 1, 20);
  const budgetMs = clampInt(params.get("budget"), DEFAULT_BUDGET_SECONDS, 30, 900) * 1000;
  const startedAt = Date.now();

  const { data: pool, error: queryError } = await sb
    .from("stories")
    .select("id, title, content, tags, depth, slug, author_name")
    .eq("is_hidden", false)
    .eq("is_ending", false)
    .gte("upvotes", MIN_UPVOTES)
    .lt("depth", MAX_DEPTH)
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(100);

  if (queryError) {
    return NextResponse.json(
      { error: "Failed to query stories", detail: queryError.message },
      { status: 500 }
    );
  }

  const poolIds = (pool || []).map((s) => s.id);
  const { data: children } = poolIds.length
    ? await sb.from("stories").select("parent_id").in("parent_id", poolIds)
    : { data: [] as { parent_id: string }[] };
  const branched = new Set((children || []).map((c) => c.parent_id));
  const candidates = (pool || []).filter((s) => !branched.has(s.id)).slice(0, maxStories);

  if (candidates.length === 0) {
    return NextResponse.json({
      ok: true,
      branches_created: 0,
      reason: "no eligible stories",
    });
  }

  let totalBranchesCreated = 0;
  const results: { story_id: string; title: string | null; branches: number }[] = [];

  for (const story of candidates) {
    if (Date.now() - startedAt > budgetMs) break;

    // Generate branches with choice-aware context
    let branches: BranchOutput[];
    try {
      // Use the story engine to generate branches with full narrative context
      branches = await generateChoiceAwareBranches(story.id, SYSTEM_PROMPT);

      if (!Array.isArray(branches) || branches.length === 0) {
        console.error(`Invalid branch structure for story ${story.id}`);
        continue;
      }
    } catch (err) {
      console.error(`Failed to generate branches for story ${story.id}:`, err);
      continue;
    }

    // Insert each branch into the stories table
    let branchesCreated = 0;
    for (const branch of branches.slice(0, 2)) {
      if (!branch.teaser?.trim() || !branch.content?.trim()) continue;

      const { data: inserted, error: insertError } = await sb
        .from("stories")
        .insert({
          parent_id: story.id,
          author_name: "TaleBot",
          story_type: "branch",
          depth: (story.depth || 0) + 1,
          title: null,
          slug: null,
          teaser: branch.teaser.slice(0, 300),
          content: branch.content.slice(0, 5000),
          is_ending: false,
          tags: story.tags || null,
          upvotes: 0,
          downvotes: 0,
          metadata: {
            generated_by: "auto-brancher",
            model: TEXT_MODEL,
            choice_aware: true,
            narrative_context_included: true,
          },
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(
          `Failed to insert branch for story ${story.id}:`,
          insertError.message
        );
        continue;
      }

      branchesCreated++;
      totalBranchesCreated++;

      // Post to Discord (non-blocking)
      postNewStoryToDiscord({
        id: inserted.id,
        title: null,
        content: branch.content.slice(0, 300),
        author_name: "TaleBot",
        tags: story.tags || null,
        slug: null,
        story_type: "branch",
        teaser: branch.teaser.slice(0, 300),
        parent_title: story.title,
      }).catch(() => {});
    }

    results.push({
      story_id: story.id,
      title: story.title,
      branches: branchesCreated,
    });
  }

  return NextResponse.json({
    ok: true,
    branches_created: totalBranchesCreated,
    stories_processed: results,
  });
}
