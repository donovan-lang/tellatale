import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { generateChoiceAwareBranches, getStoryWithContext } from "@/lib/story_engine";

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

/**
 * POST /api/branches/generate
 * Generate choice-aware branches for a given story with full narrative context.
 *
 * Request body:
 * {
 *   "story_id": "uuid",
 *   "auto_insert": boolean (optional, default: true - whether to save branches to DB)
 * }
 *
 * Returns:
 * {
 *   "branches": [
 *     { "teaser": "...", "content": "..." },
 *     { "teaser": "...", "content": "..." }
 *   ],
 *   "story_context": {
 *     "path_length": number,
 *     "choices_made": string[],
 *     "root_title": string
 *   },
 *   "inserted_ids": ["uuid", "uuid"] (if auto_insert: true)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { story_id, auto_insert = true } = await req.json();

    if (!story_id) {
      return NextResponse.json(
        { error: "story_id is required" },
        { status: 400 }
      );
    }

    const sb = createServiceClient();

    // Validate story exists
    const { data: story, error: storyError } = await sb
      .from("stories")
      .select("id, title, content, tags, author_name, story_type, depth")
      .eq("id", story_id)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Guard: if auto_insert requested, check if AI branches already exist
    if (auto_insert) {
      const { count: existingAI } = await sb
        .from("stories")
        .select("id", { count: "exact", head: true })
        .eq("parent_id", story_id)
        .eq("author_name", "TaleBot");

      if ((existingAI ?? 0) >= 2) {
        return NextResponse.json(
          { error: "AI branches already exist for this story" },
          { status: 409 }
        );
      }
    }

    // Get story context with full path
    let storyWithContext;
    try {
      storyWithContext = await getStoryWithContext(story_id);
    } catch (err) {
      console.error("Failed to get story context:", err);
      return NextResponse.json(
        { error: "Failed to load story context" },
        { status: 500 }
      );
    }

    // Generate branches with choice awareness
    let branches;
    try {
      branches = await generateChoiceAwareBranches(story_id, SYSTEM_PROMPT);
    } catch (err) {
      console.error("Failed to generate branches:", err);
      return NextResponse.json(
        { error: "Failed to generate branches", details: String(err) },
        { status: 502 }
      );
    }

    if (!Array.isArray(branches) || branches.length === 0) {
      return NextResponse.json(
        { error: "No branches generated" },
        { status: 502 }
      );
    }

    // Optionally insert branches into database
    let inserted_ids: string[] = [];

    if (auto_insert) {
      for (const branch of branches.slice(0, 2)) {
        if (!branch.teaser?.trim() || !branch.content?.trim()) continue;

        const { data: inserted, error: insertError } = await sb
          .from("stories")
          .insert({
            parent_id: story_id,
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
              generated_by: "api-branches-generate",
              model: "gemini-2.5-flash",
              choice_aware: true,
              narrative_context_included: true,
            },
          })
          .select("id")
          .single();

        if (!insertError && inserted) {
          inserted_ids.push(inserted.id);
        }
      }
    }

    return NextResponse.json({
      branches,
      story_context: {
        path_length: storyWithContext.path.nodes.length,
        choices_made: storyWithContext.path.choices_made,
        root_title: storyWithContext.path.nodes[0]?.title,
      },
      inserted_ids: auto_insert ? inserted_ids : undefined,
    });
  } catch (err: any) {
    console.error("Generate branches error:", err);
    return NextResponse.json(
      { error: "An error occurred", details: err.message },
      { status: 500 }
    );
  }
}
