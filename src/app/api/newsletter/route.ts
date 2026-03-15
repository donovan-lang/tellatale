import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source, user_id, notify_branch, notify_votes, notify_tips, newsletter } = body;

    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const cleanEmail = email.trim().toLowerCase();

    // Always add to newsletter subscribers
    await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email: cleanEmail, source: source || "homepage" },
        { onConflict: "email" }
      );

    // If this is a signup with preferences, also save email_preferences
    if (user_id) {
      await supabase
        .from("email_preferences")
        .upsert(
          {
            user_id,
            email: cleanEmail,
            notify_branch: notify_branch ?? true,
            notify_votes: notify_votes ?? true,
            notify_tips: notify_tips ?? true,
            newsletter: newsletter ?? true,
            marketing: newsletter ?? true,
          },
          { onConflict: "email" }
        );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
