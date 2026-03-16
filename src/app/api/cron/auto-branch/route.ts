import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { postNewStoryToDiscord } from "@/lib/discord";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are TaleBot, a creative AI storyteller for MakeATale — a collaborative choose-your-own-adventure platform.

Your job is to generate compelling branch options for popular stories that have no branches yet.

Rules:
- Match the tone, genre, and voice of the original story exactly
- Be vivid and specific — use concrete sensory details, not vague abstractions
- Avoid cliches ("a chill ran down her spine", "little did they know")
- Each branch should take the story in a genuinely DIFFERENT direction
- Branches should feel like real choices — not just slight variations
- Show don't tell — convey emotion through action and detail

You MUST respond with valid JSON only. No markdown, no code fences, no explanation.`;

function buildBranchPrompt(title: string, content: string, tags: string[] | null): string {
  const genre = tags?.length ? `Genre: ${tags.join(", ")}` : "";
  return `Story title: "${title}"
${genre}

Story content:
"""
${content}
"""

Generate exactly 2 branch options for this story. Each branch should take the story in a distinctly different direction, giving readers a meaningful choice.

For each branch provide:
- "teaser": A 1-2 sentence choice line that readers see BEFORE clicking (like "Open the mysterious door" or "Follow the stranger into the alley"). This should be compelling and hint at what's ahead without spoiling it.
- "content": A 200-400 word continuation of the story from that choice point. Write it as the next scene, picking up seamlessly from where the original left off.

Respond with ONLY this JSON (no markdown fences):
{
  "branches": [
    { "teaser": "...", "content": "..." },
    { "teaser": "...", "content": "..." }
  ]
}`;
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

  if (!GEMINI_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 503 }
    );
  }

  const sb = createServiceClient();

  // Find seed stories with upvotes >= 2, ordered by popularity
  const { data: candidates, error: queryError } = await sb
    .from("stories")
    .select("id, title, content, tags, depth, slug, author_name")
    .is("parent_id", null)
    .eq("is_hidden", false)
    .gte("upvotes", 2)
    .order("upvotes", { ascending: false })
    .limit(5);

  if (queryError) {
    return NextResponse.json(
      { error: "Failed to query stories", detail: queryError.message },
      { status: 500 }
    );
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({
      ok: true,
      branches_created: 0,
      reason: "no eligible stories",
    });
  }

  let totalBranchesCreated = 0;
  const results: { story_id: string; title: string | null; branches: number }[] = [];

  for (const story of candidates) {
    // Check if story already has branches
    const { count } = await sb
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", story.id);

    if (count && count > 0) {
      continue; // Already has branches, skip
    }

    // Call Gemini to generate 2 branches
    let branches: BranchOutput[];
    try {
      const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              parts: [
                {
                  text: buildBranchPrompt(
                    story.title || "Untitled",
                    story.content,
                    story.tags
                  ),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error(`Gemini error for story ${story.id}:`, errText);
        continue;
      }

      const geminiData = await geminiRes.json();
      const rawText =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (!rawText) {
        console.error(`Empty Gemini response for story ${story.id}`);
        continue;
      }

      const parsed: GeminiResponse = JSON.parse(rawText);
      branches = parsed.branches;

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
            model: "gemini-2.5-flash",
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
