export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { resolveAuth, hasScope } from "@/lib/api-auth";
import { checkAutoModeration } from "@/lib/auto-moderation";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveAuth(req);
  if (!hasScope(auth, "write")) return NextResponse.json({ error: "Write access required" }, { status: 403 });
  if (!auth.user_id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { vote } = await req.json();
  if (![1, -1, 0].includes(vote)) return NextResponse.json({ error: "vote must be 1, -1, or 0" }, { status: 400 });

  const sb = createServiceClient();
  if (vote === 0) {
    await sb.from("votes").delete().eq("story_id", params.id).eq("user_id", auth.user_id);
  } else {
    await sb.from("votes").upsert({ story_id: params.id, user_id: auth.user_id, vote }, { onConflict: "story_id,user_id" });
  }

  const { count: up } = await sb.from("votes").select("*", { count: "exact", head: true }).eq("story_id", params.id).eq("vote", 1);
  const { count: down } = await sb.from("votes").select("*", { count: "exact", head: true }).eq("story_id", params.id).eq("vote", -1);
  await sb.from("stories").update({ upvotes: up || 0, downvotes: down || 0 }).eq("id", params.id);

  // Auto-moderation check on downvotes (non-blocking)
  if (vote === -1) {
    checkAutoModeration(params.id).catch(() => {});
  }

  return NextResponse.json({ ok: true, upvotes: up || 0, downvotes: down || 0, your_vote: vote });
}
