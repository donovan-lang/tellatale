export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createNotification } from "@/lib/notify";

async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: Record<string, unknown>;
            }[]
          ) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    const {
      data: { user },
    } = await authClient.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

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

    // Get user ID (auth) or use IP as fallback for anonymous
    let voterId = await getUserId();
    if (!voterId) {
      const forwarded = req.headers.get("x-forwarded-for");
      voterId = `anon_${forwarded?.split(",")[0]?.trim() || "unknown"}`;
    }

    const supabase = createServiceClient();

    if (vote === 0) {
      // Remove vote
      await supabase
        .from("votes")
        .delete()
        .eq("story_id", storyId)
        .eq("user_id", voterId);
    } else {
      // Upsert vote (insert or update)
      await supabase.from("votes").upsert(
        {
          story_id: storyId,
          user_id: voterId,
          vote,
        },
        { onConflict: "story_id,user_id" }
      );
    }

    // Recalculate totals from votes table
    const { data: upData } = await supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("vote", 1);

    const { data: downData } = await supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("vote", -1);

    // Use count from headers (Supabase returns count in response when head: true)
    // Simpler approach: just count rows
    const { count: upCount } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("vote", 1);

    const { count: downCount } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("vote", -1);

    // Update story counters
    await supabase
      .from("stories")
      .update({ upvotes: upCount || 0, downvotes: downCount || 0 })
      .eq("id", storyId);

    // Notify story author on upvote
    if (vote === 1) {
      const { data: story } = await supabase.from("stories").select("author_id, title, slug, id").eq("id", storyId).single();
      if (story?.author_id && story.author_id !== voterId) {
        createNotification(story.author_id, "vote", `Your story got an upvote!`, story.title || "Your branch", `/story/${story.slug || story.id}`);
      }
    }

    return NextResponse.json({
      ok: true,
      upvotes: upCount || 0,
      downvotes: downCount || 0,
      your_vote: vote,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: check current user's vote on a story
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let voterId = await getUserId();
    if (!voterId) {
      const forwarded = req.headers.get("x-forwarded-for");
      voterId = `anon_${forwarded?.split(",")[0]?.trim() || "unknown"}`;
    }

    const supabase = createServiceClient();
    const { data } = await supabase
      .from("votes")
      .select("vote")
      .eq("story_id", params.id)
      .eq("user_id", voterId)
      .single();

    return NextResponse.json({ vote: data?.vote || 0 });
  } catch {
    return NextResponse.json({ vote: 0 });
  }
}
