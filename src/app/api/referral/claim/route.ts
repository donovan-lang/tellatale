export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    return user;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read referral code from cookie
    const refCode = req.cookies.get("mat_ref")?.value;
    if (!refCode) {
      return NextResponse.json({ ok: true, claimed: false });
    }

    const supabase = createServiceClient();

    // Check if this user already has a referrer set
    const { data: profile } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("id", user.id)
      .single();

    if (profile?.referred_by) {
      // Already has a referrer, don't overwrite
      const res = NextResponse.json({ ok: true, claimed: false, reason: "already_referred" });
      // Clear the cookie since it's no longer needed
      res.cookies.set("mat_ref", "", { maxAge: 0, path: "/" });
      return res;
    }

    // Look up the referrer by matching the code (first 8 chars of their ID without dashes)
    // We need to find a user whose ID starts with these 8 chars (without dashes)
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id");

    const referrerId = allProfiles?.find(
      (p) => p.id.replace(/-/g, "").slice(0, 8) === refCode
    )?.id;

    if (!referrerId) {
      const res = NextResponse.json({ ok: true, claimed: false, reason: "invalid_code" });
      res.cookies.set("mat_ref", "", { maxAge: 0, path: "/" });
      return res;
    }

    // Don't allow self-referral
    if (referrerId === user.id) {
      const res = NextResponse.json({ ok: true, claimed: false, reason: "self_referral" });
      res.cookies.set("mat_ref", "", { maxAge: 0, path: "/" });
      return res;
    }

    // Set the referrer on the user's profile
    const { error } = await supabase
      .from("profiles")
      .update({ referred_by: referrerId })
      .eq("id", user.id);

    if (error) throw error;

    // Clear the cookie
    const res = NextResponse.json({ ok: true, claimed: true });
    res.cookies.set("mat_ref", "", { maxAge: 0, path: "/" });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
