export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createServiceClient();

  // Find root story
  let rootId = params.id;
  const isUuid = /^[0-9a-f]{8}-/i.test(rootId);
  if (!isUuid) {
    const { data: s } = await sb.from("stories").select("id").eq("slug", rootId).single();
    if (s) rootId = s.id;
  }

  // Get all descendants using recursive CTE via the ancestor function in reverse
  // Simpler: just fetch all stories and filter by walking the tree from root
  const { data: allStories } = await sb
    .from("stories")
    .select("id, parent_id, title, teaser, content, author_name, story_type, depth, upvotes, downvotes, is_ending, slug")
    .eq("is_hidden", false)
    .order("upvotes", { ascending: false });

  if (!allStories) return NextResponse.json([]);

  // Build tree from root
  const storyMap = new Map(allStories.map((s: any) => [s.id, s]));
  const tree: any[] = [];
  const queue = [rootId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const story = storyMap.get(id);
    if (story) {
      tree.push(story);
      // Find children
      allStories.forEach((s: any) => {
        if (s.parent_id === id && !visited.has(s.id)) queue.push(s.id);
      });
    }
  }

  return NextResponse.json(tree);
}
