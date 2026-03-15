export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { resolveAuth, hasScope } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createServiceClient();
  const { data } = await sb.from("comments").select("*").eq("story_id", params.id).eq("is_hidden", false).order("created_at", { ascending: true });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveAuth(req);
  if (!hasScope(auth, "write")) return NextResponse.json({ error: "Write access required" }, { status: 403 });

  const { content, parent_comment_id } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  const sb = createServiceClient();
  const { data, error } = await sb.from("comments").insert({
    story_id: params.id,
    user_id: auth.user_id,
    author_name: auth.author_name,
    content: content.trim().slice(0, 1000),
    parent_comment_id: parent_comment_id || null,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, author_name: auth.author_name }, { status: 201 });
}
