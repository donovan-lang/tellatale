export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q?.trim()) return NextResponse.json({ error: "q parameter required" }, { status: 400 });

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const perPage = Math.min(50, parseInt(req.nextUrl.searchParams.get("per_page") || "20"));
  const tag = req.nextUrl.searchParams.get("tag");

  const sb = createServiceClient();

  // Use the search_stories RPC
  const { data, error } = await sb.rpc("search_stories", {
    query: q.trim(),
    lim: perPage,
    off_set: (page - 1) * perPage,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let results = data || [];
  if (tag) results = results.filter((s: any) => s.tags && s.tags.includes(tag));

  return NextResponse.json({
    query: q,
    data: results,
    pagination: { page, per_page: perPage, count: results.length },
  });
}
