export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET() {
  const sb = createServiceClient();
  const { data } = await sb.from("challenges").select("*").order("created_at", { ascending: false }).limit(20);
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Admin only" }, { status: 401 });
  const { title, description, prompt, end_date } = await req.json();
  if (!title || !prompt || !end_date) return NextResponse.json({ error: "title, prompt, end_date required" }, { status: 400 });
  const sb = createServiceClient();
  const { data, error } = await sb.from("challenges").insert({ title, description, prompt, end_date }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
