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

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  const { data } = await sb.from("follows").select("*").eq("follower_id", user.id);
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { followed_id } = await req.json();
  if (!followed_id) return NextResponse.json({ error: "followed_id required" }, { status: 400 });
  const sb = createServiceClient();
  await sb.from("follows").upsert({ follower_id: user.id, followed_id }, { onConflict: "follower_id,followed_id" });

  // Notify the followed user
  if (user) {
    const { data: profile } = await sb.from("profiles").select("pen_name").eq("id", user.id).single();
    const name = profile?.pen_name || "Someone";
    createNotification(followed_id, "follow", `${name} started following you`, null, "/stories");
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
