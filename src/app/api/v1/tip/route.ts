export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { resolveAuth, hasScope } from "@/lib/api-auth";
import { createNotification } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const auth = await resolveAuth(req);
  if (!hasScope(auth, "tip") && !hasScope(auth, "write")) {
    return NextResponse.json({ error: "Tip access required" }, { status: 403 });
  }

  const { story_id, tx_signature, sender_wallet } = await req.json();
  if (!story_id || !tx_signature || !sender_wallet) {
    return NextResponse.json({ error: "story_id, tx_signature, sender_wallet required" }, { status: 400 });
  }

  const sb = createServiceClient();

  // Check for replay
  const { data: existing } = await sb.from("tips").select("id").eq("tx_signature", tx_signature).single();
  if (existing) return NextResponse.json({ error: "Transaction already recorded" }, { status: 409 });

  // Get story author's wallet
  const { data: story } = await sb.from("stories").select("author_id, title, slug, id").eq("id", story_id).single();
  if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });

  let recipientWallet = "";
  if (story.author_id) {
    const { data: profile } = await sb.from("profiles").select("wallet_address").eq("id", story.author_id).single();
    recipientWallet = profile?.wallet_address || "";
  }

  // Record tip (verification can be done async later)
  const { data: tip, error } = await sb.from("tips").insert({
    story_id,
    sender_wallet,
    recipient_wallet: recipientWallet,
    amount_lamports: 0, // Will be filled by verification
    tx_signature,
    verified: false,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify author
  if (story.author_id) {
    createNotification(
      story.author_id,
      "tip",
      `Someone tipped "${story.title || "your story"}"!`,
      `Transaction: ${tx_signature.slice(0, 16)}...`,
      `/story/${story.slug || story.id}`
    );
  }

  return NextResponse.json({ id: tip.id, status: "recorded", message: "Tip recorded. On-chain verification pending." }, { status: 201 });
}
