export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServiceClient();

    // Find profile by slug
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", params.slug)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: "Author not found" },
        { status: 404 }
      );
    }

    // Fetch their stories
    const { data: stories } = await supabase
      .from("stories")
      .select("*")
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false });

    const allStories = stories || [];
    const seeds = allStories.filter((s: any) => s.story_type === "seed");
    const contributions = allStories.filter(
      (s: any) => s.story_type === "branch"
    );

    // Stats
    const totalVotes = allStories.reduce(
      (sum: number, s: any) => sum + (s.upvotes || 0),
      0
    );

    return NextResponse.json({
      profile,
      seeds,
      contributions,
      stats: {
        total_seeds: seeds.length,
        total_branches: contributions.length,
        total_votes: totalVotes,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
