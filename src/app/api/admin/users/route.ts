import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createServiceClient();
  const search = req.nextUrl.searchParams.get("search") || "";

  let query = sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) query = query.ilike("pen_name", `%${search}%`);

  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, reason } = await req.json();
  const sb = createServiceClient();

  if (action === "ban") {
    await sb
      .from("profiles")
      .update({ is_banned: true, ban_reason: reason || "Moderation" })
      .eq("id", id);
    // Hide all their stories
    await sb
      .from("stories")
      .update({ is_hidden: true, hidden_reason: "Author banned" })
      .eq("author_id", id);
  } else if (action === "unban") {
    await sb
      .from("profiles")
      .update({ is_banned: false, ban_reason: null })
      .eq("id", id);
    // Unhide their stories
    await sb
      .from("stories")
      .update({ is_hidden: false, hidden_reason: null })
      .eq("author_id", id)
      .eq("hidden_reason", "Author banned");
  }

  return NextResponse.json({ ok: true });
}
