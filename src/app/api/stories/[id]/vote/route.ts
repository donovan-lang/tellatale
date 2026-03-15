import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { vote } = await req.json();
    const storyId = params.id;

    if (![1, -1, 0].includes(vote)) {
      return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // For MVP, just increment/decrement counters directly.
    // Full implementation would track per-user votes in a votes table.
    if (vote === 1) {
      await supabase.rpc("increment_upvote", { story_id: storyId });
    } else if (vote === -1) {
      await supabase.rpc("increment_downvote", { story_id: storyId });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
