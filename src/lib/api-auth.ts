import { createHash, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { createServiceClient } from "./supabase-server";
import { createClient } from "@supabase/supabase-js";

export interface AuthResult {
  user_id: string | null;
  author_name: string;
  auth_method: "api_key" | "bearer" | "anonymous";
  scopes: string[];
  tier: string;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): string {
  return "mat_" + randomBytes(24).toString("base64url");
}

export async function resolveAuth(req: NextRequest): Promise<AuthResult> {
  const sb = createServiceClient();

  // 1. Check X-API-Key header
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const hash = hashApiKey(apiKey);
    const { data: keyRow } = await sb
      .from("api_keys")
      .select("user_id, scopes, tier, is_active")
      .eq("key_hash", hash)
      .single();

    if (keyRow && keyRow.is_active) {
      // Update last_used
      sb.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", hash).then(() => {});

      const { data: profile } = await sb.from("profiles").select("pen_name").eq("id", keyRow.user_id).single();
      return {
        user_id: keyRow.user_id,
        author_name: profile?.pen_name || "Bot",
        auth_method: "api_key",
        scopes: keyRow.scopes || ["read"],
        tier: keyRow.tier,
      };
    }
  }

  // 2. Check Bearer token
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await authClient.auth.getUser(token);
    if (user) {
      const { data: profile } = await sb.from("profiles").select("pen_name").eq("id", user.id).single();
      return {
        user_id: user.id,
        author_name: profile?.pen_name || user.email?.split("@")[0] || "User",
        auth_method: "bearer",
        scopes: ["read", "write", "webhook", "tip"],
        tier: "paid",
      };
    }
  }

  // 3. Anonymous
  return {
    user_id: null,
    author_name: "Anonymous",
    auth_method: "anonymous",
    scopes: ["read"],
    tier: "free",
  };
}

export function hasScope(auth: AuthResult, scope: string): boolean {
  return auth.scopes.includes(scope);
}
