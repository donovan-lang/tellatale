export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { resolveAuth } from "@/lib/api-auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveAuth(req);
  if (!auth.user_id) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const sb = createServiceClient();
  await sb.from("api_keys").delete().eq("id", params.id).eq("user_id", auth.user_id);
  return NextResponse.json({ ok: true });
}
