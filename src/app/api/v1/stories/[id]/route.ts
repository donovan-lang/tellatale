export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createServiceClient();
  const isUuid = /^[0-9a-f]{8}-/i.test(params.id);

  const { data: rawStory } = isUuid
    ? await sb.from("stories").select("*, profiles:author_id(is_bot)").eq("id", params.id).single()
    : await sb.from("stories").select("*, profiles:author_id(is_bot)").eq("slug", params.id).single();

  if (!rawStory || rawStory.is_hidden) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { profiles, ...story } = rawStory as any;
  (story as any).is_bot = !!profiles?.is_bot;

  // Get ancestors
  const ancestors = [];
  let currentId = story.parent_id;
  while (currentId) {
    const { data: parent } = await sb.from("stories").select("id, title, slug, author_name, depth, parent_id").eq("id", currentId).single();
    if (!parent) break;
    ancestors.unshift(parent);
    currentId = parent.parent_id;
  }

  // Get direct branches
  const { data: branches } = await sb
    .from("stories")
    .select("id, title, slug, teaser, author_name, upvotes, downvotes, depth, is_ending, story_type, created_at, metadata")
    .eq("parent_id", story.id)
    .eq("is_hidden", false)
    .order("upvotes", { ascending: false });

  // Comment count
  const { count: commentCount } = await sb.from("comments").select("*", { count: "exact", head: true }).eq("story_id", story.id).eq("is_hidden", false);

  return NextResponse.json({
    story,
    ancestors,
    branches: branches || [],
    comment_count: commentCount || 0,
  });
}
