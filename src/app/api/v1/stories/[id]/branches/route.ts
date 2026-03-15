export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createServiceClient();
  const p = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(p.get("page") || "1"));
  const perPage = Math.min(100, parseInt(p.get("per_page") || "20"));

  const { data, count } = await sb
    .from("stories")
    .select("*", { count: "exact" })
    .eq("parent_id", params.id)
    .eq("is_hidden", false)
    .order("upvotes", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  return NextResponse.json({
    data: data || [],
    pagination: { page, per_page: perPage, total: count || 0, has_more: (count || 0) > page * perPage },
  });
}
