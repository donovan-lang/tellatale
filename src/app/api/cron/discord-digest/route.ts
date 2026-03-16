import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { postTrendingDigest } from "@/lib/discord";

/**
 * POST /api/cron/discord-digest
 * Call this via cron (daily or weekly) to post trending stories to Discord.
 * Requires: Authorization: Bearer CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createServiceClient();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: stories } = await sb
    .from("stories")
    .select("id, title, slug, upvotes, downvotes, author_name, tags")
    .is("parent_id", null)
    .eq("is_hidden", false)
    .gte("created_at", oneWeekAgo)
    .order("upvotes", { ascending: false })
    .limit(10);

  if (!stories || stories.length === 0) {
    return NextResponse.json({ ok: true, posted: false, reason: "no stories" });
  }

  const formatted = stories.map((s) => ({
    ...s,
    score: s.upvotes - s.downvotes,
  }));

  await postTrendingDigest(formatted);

  return NextResponse.json({ ok: true, posted: true, count: formatted.length });
}
