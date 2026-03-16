export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getClientIp } from "@/lib/spam-filter";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createServiceClient();
  const { data } = await sb.from("reactions").select("emoji").eq("story_id", params.id);
  // Count per emoji
  const counts: Record<string, number> = {};
  (data || []).forEach((r: any) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
  return NextResponse.json(counts);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { emoji, user_id: clientUserId } = await req.json();
  if (!emoji) return NextResponse.json({ error: "emoji required" }, { status: 400 });

  // Use auth user or IP for anonymous
  let userId = clientUserId || `anon_${getClientIp(req)}`;

  const sb = createServiceClient();

  // Check existing reaction
  const { data: existing } = await sb.from("reactions").select("id, emoji").eq("story_id", params.id).eq("user_id", userId).single();

  if (existing) {
    if (existing.emoji === emoji) {
      // Same emoji — remove reaction
      await sb.from("reactions").delete().eq("id", existing.id);
    } else {
      // Different emoji — update
      await sb.from("reactions").update({ emoji }).eq("id", existing.id);
    }
  } else {
    // New reaction
    await sb.from("reactions").insert({ story_id: params.id, user_id: userId, emoji });
  }

  // Return updated counts
  const { data: all } = await sb.from("reactions").select("emoji").eq("story_id", params.id);
  const counts: Record<string, number> = {};
  (all || []).forEach((r: any) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
  return NextResponse.json(counts);
}
