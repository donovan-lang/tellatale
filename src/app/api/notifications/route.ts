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

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";
  let query = sb.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (unreadOnly) query = query.eq("is_read", false);
  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json();
  const sb = createServiceClient();
  if (ids === "all") {
    await sb.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  } else if (Array.isArray(ids)) {
    await sb.from("notifications").update({ is_read: true }).in("id", ids).eq("user_id", user.id);
  }
  return NextResponse.json({ ok: true });
}
