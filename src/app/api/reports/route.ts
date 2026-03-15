export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isRateLimited, getClientIp, sanitizeContent } from "@/lib/spam-filter";

export async function POST(req: NextRequest) {
  try {
    const { story_id, reason } = await req.json();
    if (!story_id || !reason?.trim()) {
      return NextResponse.json(
        { error: "story_id and reason required" },
        { status: 400 }
      );
    }

    // Rate limit: 5 reports per minute per IP
    const ip = getClientIp(req);
    if (isRateLimited(ip, 5)) {
      return NextResponse.json({ error: "Too many reports. Please slow down." }, { status: 429 });
    }

    // Get reporter ID
    let reporterId: string = "anon";
    try {
      const cookieStore = cookies();
      const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(c: any[]) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
          },
        }
      );
      const { data: { user } } = await authClient.auth.getUser();
      if (user) reporterId = user.id;
    } catch {}

    if (reporterId === "anon") {
      const forwarded = req.headers.get("x-forwarded-for");
      reporterId = `anon_${forwarded?.split(",")[0]?.trim() || "unknown"}`;
    }

    const sb = createServiceClient();

    // Check for duplicate
    const { data: existing } = await sb
      .from("reports")
      .select("id")
      .eq("story_id", story_id)
      .eq("reporter_id", reporterId)
      .single();

    if (existing) {
      return NextResponse.json({ ok: true, message: "Already reported" });
    }

    await sb.from("reports").insert({
      story_id,
      reporter_id: reporterId,
      reason: sanitizeContent(reason).slice(0, 500),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
