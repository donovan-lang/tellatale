import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createServiceClient();
  const status = req.nextUrl.searchParams.get("status") || "pending";

  let query = sb
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);

  const { data: reports } = await query;

  // Enrich with story data
  const storyIds = Array.from(new Set((reports || []).map((r: any) => r.story_id)));
  const { data: stories } = storyIds.length > 0
    ? await sb.from("stories").select("id, title, author_name, content, is_hidden").in("id", storyIds)
    : { data: [] };

  const storyMap = new Map((stories || []).map((s: any) => [s.id, s]));
  const enriched = (reports || []).map((r: any) => ({
    ...r,
    story: storyMap.get(r.story_id) || null,
  }));

  return NextResponse.json(enriched);
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, admin_note } = await req.json();
  const sb = createServiceClient();

  await sb
    .from("reports")
    .update({
      status,
      admin_note: admin_note || null,
      resolved_at: ["actioned", "dismissed"].includes(status) ? new Date().toISOString() : null,
    })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
