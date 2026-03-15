export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { resolveAuth, generateApiKey, hashApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await resolveAuth(req);
  if (!auth.user_id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const sb = createServiceClient();
  const { data } = await sb.from("api_keys").select("id, key_prefix, name, tier, scopes, is_active, rate_limit_rpm, last_used_at, created_at").eq("user_id", auth.user_id);
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const auth = await resolveAuth(req);
  if (!auth.user_id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { name } = await req.json().catch(() => ({ name: "default" }));
  const rawKey = generateApiKey();
  const hash = hashApiKey(rawKey);
  const prefix = rawKey.slice(0, 12);

  const sb = createServiceClient();
  const { data, error } = await sb.from("api_keys").insert({
    user_id: auth.user_id,
    key_hash: hash,
    key_prefix: prefix,
    name: (name || "default").slice(0, 100),
    tier: "free",
    scopes: ["read"],
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    key: rawKey,
    prefix,
    message: "Save this key — it won't be shown again.",
  }, { status: 201 });
}
