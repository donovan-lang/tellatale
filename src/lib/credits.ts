/**
 * MakeATale Credit System
 *
 * Free tier: 5 AI generations per day (resets midnight UTC)
 * Purchased credits: persist forever, used after daily credits exhausted
 *
 * Usage in API routes:
 *   const result = await useCredit(req, "generate-tale");
 *   if (!result.allowed) return NextResponse.json({ error: result.reason }, { status: 402 });
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "./supabase-server";

const FREE_DAILY_CREDITS = 50;

export interface CreditResult {
  allowed: boolean;
  reason?: string;
  user_id?: string;
  credits_remaining?: number;
  used_daily?: boolean;
}

export interface CreditBalance {
  purchased_credits: number;
  daily_credits_remaining: number;
  total_available: number;
}

/**
 * Get user ID from the request (Bearer token auth).
 * Returns null for unauthenticated requests.
 */
async function getUserFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await client.auth.getUser(token);
  return user?.id || null;
}

/**
 * Try to get user from cookie-based session (for browser requests)
 * or from Bearer token (for API requests).
 */
async function resolveUser(req: NextRequest): Promise<string | null> {
  // Try Bearer token first
  const fromBearer = await getUserFromRequest(req);
  if (fromBearer) return fromBearer;

  // Try cookie-based session
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  // Parse the Supabase auth tokens from cookies
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );

  // Supabase stores auth in sb-{ref}-auth-token cookie
  const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").match(/\/\/([^.]+)/)?.[1];
  const tokenCookie = cookies[`sb-${ref}-auth-token`];
  if (!tokenCookie) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(tokenCookie));
    const accessToken = parsed?.[0] || parsed?.access_token;
    if (!accessToken) return null;

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await client.auth.getUser(accessToken);
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Ensure a user_credits row exists for the user.
 */
async function ensureCreditRow(sb: ReturnType<typeof createServiceClient>, userId: string) {
  const { data } = await sb
    .from("user_credits")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  if (!data) {
    await sb.from("user_credits").insert({ user_id: userId });
  }
}

/**
 * Check if the daily credits need resetting (new UTC day).
 */
function needsDailyReset(resetAt: string): boolean {
  const now = new Date();
  const last = new Date(resetAt);
  return now.getUTCFullYear() !== last.getUTCFullYear()
    || now.getUTCMonth() !== last.getUTCMonth()
    || now.getUTCDate() !== last.getUTCDate();
}

/**
 * Check credit availability and deduct 1 credit.
 * Call this at the top of any AI endpoint.
 *
 * Priority: daily free credits first, then purchased credits.
 */
export async function useCredit(
  req: NextRequest,
  endpoint: string,
  action?: string
): Promise<CreditResult> {
  const userId = await resolveUser(req);

  if (!userId) {
    return { allowed: false, reason: "Sign in to use AI features" };
  }

  const sb = createServiceClient();
  await ensureCreditRow(sb, userId);

  // Fetch current credit state
  const { data: credits } = await sb
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!credits) {
    return { allowed: false, reason: "Credit system error" };
  }

  // Reset daily credits if new UTC day
  let dailyUsed = credits.daily_credits_used;
  if (needsDailyReset(credits.daily_reset_at)) {
    dailyUsed = 0;
    await sb
      .from("user_credits")
      .update({ daily_credits_used: 0, daily_reset_at: new Date().toISOString() })
      .eq("user_id", userId);
  }

  // Try daily credits first
  if (dailyUsed < FREE_DAILY_CREDITS) {
    await sb
      .from("user_credits")
      .update({
        daily_credits_used: dailyUsed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Log usage
    await sb.from("generation_log").insert({
      user_id: userId,
      endpoint,
      action: action || null,
      credit_cost: 0,
    });

    const dailyRemaining = FREE_DAILY_CREDITS - dailyUsed - 1;
    return {
      allowed: true,
      user_id: userId,
      credits_remaining: dailyRemaining + credits.purchased_credits,
      used_daily: true,
    };
  }

  // Try purchased credits (atomic deduction)
  const { data: deducted } = await sb.rpc("deduct_purchased_credit", { uid: userId });

  if (!deducted) {
    return {
      allowed: false,
      reason: "No credits remaining. Purchase more or wait for daily reset at midnight UTC.",
    };
  }

  // Log transaction
  await sb.from("credit_transactions").insert({
    user_id: userId,
    amount: -1,
    type: "spend",
    description: `${endpoint}${action ? ": " + action : ""}`,
  });

  // Log usage
  await sb.from("generation_log").insert({
    user_id: userId,
    endpoint,
    action: action || null,
    credit_cost: 1,
  });

  // Fetch updated balance
  const { data: updated } = await sb
    .from("user_credits")
    .select("purchased_credits")
    .eq("user_id", userId)
    .single();

  return {
    allowed: true,
    user_id: userId,
    credits_remaining: updated?.purchased_credits || 0,
    used_daily: false,
  };
}

/**
 * Get credit balance for a user (for display in UI).
 */
export async function getBalance(userId: string): Promise<CreditBalance> {
  const sb = createServiceClient();
  await ensureCreditRow(sb, userId);

  const { data } = await sb
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) {
    return { purchased_credits: 0, daily_credits_remaining: FREE_DAILY_CREDITS, total_available: FREE_DAILY_CREDITS };
  }

  let dailyUsed = data.daily_credits_used;
  if (needsDailyReset(data.daily_reset_at)) {
    dailyUsed = 0;
  }

  const dailyRemaining = Math.max(0, FREE_DAILY_CREDITS - dailyUsed);

  return {
    purchased_credits: data.purchased_credits,
    daily_credits_remaining: dailyRemaining,
    total_available: dailyRemaining + data.purchased_credits,
  };
}

/**
 * Add purchased credits to a user's balance.
 */
export async function addCredits(
  userId: string,
  amount: number,
  stripeSessionId?: string
): Promise<number> {
  const sb = createServiceClient();

  // Atomic upsert+increment via RPC
  const { data: newBalance } = await sb.rpc("add_purchased_credits", {
    uid: userId,
    amount,
  });

  // Log transaction
  await sb.from("credit_transactions").insert({
    user_id: userId,
    amount,
    type: "purchase",
    description: `Purchased ${amount} credits`,
    stripe_session_id: stripeSessionId || null,
  });

  return newBalance || 0;
}
