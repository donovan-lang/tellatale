export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notify";
import {
  isSpamContent,
  isHoneypotFilled,
  isSubmittedTooFast,
  isRateLimited,
  getClientIp,
  sanitizeContent,
} from "@/lib/spam-filter";

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user } } = await sb.auth.getUser(auth.slice(7));
  return user;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createServiceClient();
  const { data } = await sb
    .from("comments")
    .select("*")
    .eq("story_id", params.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { content, parent_comment_id, _hp, _ts } = body;
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  // Require authentication — no anonymous comments
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to comment" }, { status: 401 });
  }

  // Spam protection
  if (isHoneypotFilled(_hp)) return NextResponse.json({ error: "Submission rejected" }, { status: 400 });
  if (_ts && isSubmittedTooFast(_ts)) return NextResponse.json({ error: "Please wait a moment" }, { status: 400 });
  const ip = getClientIp(req);
  if (isRateLimited(ip, 5)) return NextResponse.json({ error: "Too many comments. Please slow down." }, { status: 429 });
  if (isSpamContent(content)) return NextResponse.json({ error: "Comment flagged as spam." }, { status: 400 });

  const sb = createServiceClient();

  // Check if user is banned
  const { data: profile } = await sb.from("profiles").select("pen_name, is_banned").eq("id", user.id).single();
  if (profile?.is_banned) return NextResponse.json({ error: "Your account has been suspended" }, { status: 403 });

  const authorName = profile?.pen_name || user.email?.split("@")[0] || "User";

  const { data, error } = await sb.from("comments").insert({
    story_id: params.id,
    user_id: user.id,
    author_name: sanitizeContent(authorName).slice(0, 50),
    content: sanitizeContent(content).slice(0, 2000),
    parent_comment_id: parent_comment_id || null,
  }).select("id").single();

  if (error) return NextResponse.json({ error: "An error occurred" }, { status: 500 });

  // Notify story author
  const { data: story } = await sb.from("stories").select("author_id, title").eq("id", params.id).single();
  if (story?.author_id && story.author_id !== user.id) {
    createNotification(story.author_id, "comment", `${authorName} commented on "${story.title || "your story"}"`, content.trim().slice(0, 100), `/story/${params.id}`);
  }

  // Notify parent comment author if this is a reply
  if (parent_comment_id) {
    const { data: parentComment } = await sb.from("comments").select("user_id, author_name").eq("id", parent_comment_id).single();
    if (parentComment?.user_id && parentComment.user_id !== user.id) {
      createNotification(parentComment.user_id, "reply", `${authorName} replied to your comment`, content.trim().slice(0, 100), `/story/${params.id}`);
    }
  }

  return NextResponse.json({ id: data.id, author_name: authorName, user_id: user.id }, { status: 201 });
}

// PATCH: vote on a comment
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { comment_id, vote } = await req.json();
  if (!comment_id || ![1, -1, 0].includes(vote)) {
    return NextResponse.json({ error: "comment_id and vote (1, -1, 0) required" }, { status: 400 });
  }

  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Login required to vote" }, { status: 401 });

  const sb = createServiceClient();

  if (vote === 0) {
    await sb.from("comment_votes").delete().eq("comment_id", comment_id).eq("user_id", user.id);
  } else {
    await sb.from("comment_votes").upsert(
      { comment_id, user_id: user.id, vote },
      { onConflict: "comment_id,user_id" }
    );
  }

  // Recalculate
  const { count: up } = await sb.from("comment_votes").select("*", { count: "exact", head: true }).eq("comment_id", comment_id).eq("vote", 1);
  const { count: down } = await sb.from("comment_votes").select("*", { count: "exact", head: true }).eq("comment_id", comment_id).eq("vote", -1);
  await sb.from("comments").update({ upvotes: up || 0, downvotes: down || 0 }).eq("id", comment_id);

  return NextResponse.json({ ok: true, upvotes: up || 0, downvotes: down || 0 });
}
