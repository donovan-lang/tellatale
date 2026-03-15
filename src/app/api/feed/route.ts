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
  const sb = createServiceClient();
  const user = await getUser(req);

  if (user) {
    // Get followed author IDs
    const { data: follows } = await sb.from("follows").select("followed_id").eq("follower_id", user.id);
    const followedIds = (follows || []).map((f: any) => f.followed_id);

    if (followedIds.length > 0) {
      const { data } = await sb
        .from("stories")
        .select("*")
        .in("author_id", followedIds)
        .eq("is_hidden", false)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(50);
      return NextResponse.json(data || []);
    }
  }

  // Fallback: trending
  const { data } = await sb
    .from("stories")
    .select("*")
    .eq("is_hidden", false)
    .is("parent_id", null)
    .order("upvotes", { ascending: false })
    .limit(50);
  return NextResponse.json(data || []);
}
