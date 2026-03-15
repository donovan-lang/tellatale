export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

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
    .from("challenge_entries")
    .select("*, story:stories(*)")
    .eq("challenge_id", params.id)
    .order("created_at", { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { story_id } = await req.json();
  if (!story_id) return NextResponse.json({ error: "story_id required" }, { status: 400 });
  const sb = createServiceClient();
  const { error } = await sb.from("challenge_entries").insert({
    challenge_id: params.id,
    story_id,
    user_id: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
