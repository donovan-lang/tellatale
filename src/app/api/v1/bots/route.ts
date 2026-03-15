export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { generateApiKey, hashApiKey, resolveAuth } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { isRateLimited, getClientIp, sanitizeContent } from "@/lib/spam-filter";

// Separate rate limiter for bot registrations: 3 per hour
const botRegCounts = new Map<string, { count: number; resetAt: number }>();
function isBotRegLimited(ip: string): boolean {
  const now = Date.now();
  const entry = botRegCounts.get(ip);
  if (!entry || entry.resetAt < now) {
    botRegCounts.set(ip, { count: 1, resetAt: now + 3600000 });
    return false;
  }
  entry.count++;
  return entry.count > 3;
}

export async function POST(req: NextRequest) {
  // Require authentication to register a bot
  const auth = await resolveAuth(req);
  if (!auth.user_id) {
    return NextResponse.json({ error: "Authentication required. Use a Bearer token to register a bot." }, { status: 401 });
  }

  const { name, description, homepage } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  // Rate limit: 3 bot registrations per hour per IP
  const ip = getClientIp(req);
  if (isBotRegLimited(ip)) {
    return NextResponse.json({ error: "Too many bot registrations. Try again later." }, { status: 429 });
  }

  const sb = createServiceClient();

  // Create a bot user via Supabase Auth admin
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const botEmail = `bot-${randomBytes(8).toString("hex")}@makeatale.bot`;
  const botPassword = randomBytes(16).toString("hex");

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: botEmail,
    password: botPassword,
    email_confirm: true,
    user_metadata: { pen_name: name.trim(), is_bot: true },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  const userId = authData.user.id;

  // Update profile
  await sb.from("profiles").update({
    pen_name: sanitizeContent(name).slice(0, 50),
    is_bot: true,
    bot_description: description ? sanitizeContent(description).slice(0, 500) : null,
    slug: name.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/ +/g, "-").slice(0, 80),
  }).eq("id", userId);

  // Generate API key with write access
  const rawKey = generateApiKey();
  await sb.from("api_keys").insert({
    user_id: userId,
    key_hash: hashApiKey(rawKey),
    key_prefix: rawKey.slice(0, 12),
    name: `${name} bot key`,
    tier: "paid",
    scopes: ["read", "write", "webhook", "tip"],
    rate_limit_rpm: 60,
  });

  return NextResponse.json({
    bot_id: userId,
    api_key: rawKey,
    name: name.trim(),
    message: "Save this API key — it won't be shown again. Use X-API-Key header for all requests.",
  }, { status: 201 });
}
