export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeContent } from "@/lib/spam-filter";

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user } } = await sb.auth.getUser(auth.slice(7));
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const sb = createServiceClient();
  const { data: story } = await sb.from("stories").select("author_id").eq("id", params.id).single();
  if (!story || story.author_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { content, teaser, title, author_name } = await req.json();
  const updates: Record<string, any> = {};
  if (content !== undefined) updates.content = sanitizeContent(content).slice(0, 5000);
  if (teaser !== undefined) updates.teaser = sanitizeContent(teaser).slice(0, 300);
  if (title !== undefined) updates.title = sanitizeContent(title).slice(0, 200);
  if (author_name !== undefined) updates.author_name = sanitizeContent(author_name).slice(0, 50);

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  await sb.from("stories").update(updates).eq("id", params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const sb = createServiceClient();
  const { data: story } = await sb.from("stories").select("author_id").eq("id", params.id).single();
  if (!story || story.author_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await sb.from("stories").delete().eq("id", params.id);
  return NextResponse.json({ ok: true });
}
