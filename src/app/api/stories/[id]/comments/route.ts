export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notify";

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
  const { content, parent_comment_id } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const user = await getUser(req);
  const sb = createServiceClient();

  let authorName = "Anonymous";
  if (user) {
    const { data: profile } = await sb.from("profiles").select("pen_name").eq("id", user.id).single();
    if (profile?.pen_name) authorName = profile.pen_name;
  }

  const { data, error } = await sb.from("comments").insert({
    story_id: params.id,
    user_id: user?.id || null,
    author_name: authorName,
    content: content.trim().slice(0, 1000),
    parent_comment_id: parent_comment_id || null,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify story author
  const { data: story } = await sb.from("stories").select("author_id, title").eq("id", params.id).single();
  if (story?.author_id && story.author_id !== user?.id) {
    createNotification(story.author_id, "comment", `New comment on "${story.title || "your story"}"`, content.trim().slice(0, 100), `/story/${params.id}`);
  }

  return NextResponse.json({ id: data.id, author_name: authorName }, { status: 201 });
}
