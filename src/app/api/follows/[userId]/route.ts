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

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ following: false });
  const sb = createServiceClient();
  const { data } = await sb.from("follows").select("follower_id").eq("follower_id", user.id).eq("followed_id", params.userId).single();
  return NextResponse.json({ following: !!data });
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  await sb.from("follows").delete().eq("follower_id", user.id).eq("followed_id", params.userId);
  return NextResponse.json({ ok: true });
}
