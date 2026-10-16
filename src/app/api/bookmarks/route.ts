export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getRequestUser } from "@/lib/request-user";

const getUser = getRequestUser;

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Enrich with story data
    const storyIds = Array.from(new Set((data || []).flatMap((b: any) => [b.story_id, b.root_story_id])));
    const { data: stories } = await supabase.from("stories").select("id, title, content, teaser, author_name, depth, tags").in("id", storyIds);

    const storyMap = new Map((stories || []).map((s: any) => [s.id, s]));
    const enriched = (data || []).map((b: any) => ({
      ...b,
      story: storyMap.get(b.story_id) || null,
      root_story: storyMap.get(b.root_story_id) || null,
    }));

    return NextResponse.json(enriched);
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { story_id, root_story_id, note } = await req.json();
    if (!story_id || !root_story_id) {
      return NextResponse.json({ error: "story_id and root_story_id required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("bookmarks")
      .upsert({ user_id: user.id, story_id, root_story_id, note: note || null }, { onConflict: "user_id,story_id" })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
