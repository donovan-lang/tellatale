import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createServiceClient();
  const hidden = req.nextUrl.searchParams.get("hidden") === "true";
  const search = req.nextUrl.searchParams.get("search") || "";

  let query = sb
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (hidden) query = query.eq("is_hidden", true);
  if (search) query = query.or(`title.ilike.%${search}%,author_name.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, reason } = await req.json();
  const sb = createServiceClient();

  if (action === "hide") {
    await sb
      .from("stories")
      .update({ is_hidden: true, hidden_reason: reason || "Moderation" })
      .eq("id", id);
  } else if (action === "unhide") {
    await sb
      .from("stories")
      .update({ is_hidden: false, hidden_reason: null })
      .eq("id", id);
  } else if (action === "delete") {
    await sb.from("stories").delete().eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
