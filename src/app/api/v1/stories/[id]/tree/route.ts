export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createServiceClient();
  const isUuid = /^[0-9a-f]{8}-/i.test(params.id);

  // Resolve to root
  let rootId = params.id;
  const { data: startStory } = isUuid
    ? await sb.from("stories").select("id, parent_id").eq("id", params.id).single()
    : await sb.from("stories").select("id, parent_id").eq("slug", params.id).single();

  if (!startStory) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let current = startStory;
  while (current.parent_id) {
    const { data: parent } = await sb.from("stories").select("id, parent_id").eq("id", current.parent_id).single();
    if (!parent) break;
    current = parent;
  }
  rootId = current.id;

  // Get all stories and build tree from root
  const { data: all } = await sb.from("stories").select("id, parent_id, title, teaser, content, author_name, story_type, depth, upvotes, downvotes, is_ending, slug, metadata").eq("is_hidden", false);
  if (!all) return NextResponse.json([]);

  const visited = new Set<string>();
  const tree: any[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const story = all.find((s: any) => s.id === id);
    if (story) {
      tree.push(story);
      all.forEach((s: any) => { if (s.parent_id === id && !visited.has(s.id)) queue.push(s.id); });
    }
  }

  return NextResponse.json(tree);
}
