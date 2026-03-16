export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { toAuthorSlug } from "@/lib/utils";

async function getUserFromRequest(req: NextRequest) {
  // Try Authorization header first (client passes session token)
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

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: emailPrefs } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      ...profile,
      email: user.email,
      provider: user.app_metadata?.provider || "email",
      email_prefs: emailPrefs || {
        notify_branch: true,
        notify_votes: true,
        notify_tips: true,
        newsletter: true,
        marketing: false,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const supabase = createServiceClient();

    const profileUpdates: Record<string, unknown> = {};
    if (body.pen_name !== undefined) {
      const name = body.pen_name.trim().slice(0, 50);
      if (!name) {
        return NextResponse.json(
          { error: "Display name cannot be empty" },
          { status: 400 }
        );
      }
      profileUpdates.pen_name = name;
      let slug = toAuthorSlug(name);
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", slug)
        .neq("id", user.id)
        .single();
      if (existing) slug += "-" + Math.random().toString(36).slice(2, 6);
      profileUpdates.slug = slug;
    }
    if (body.bio !== undefined) {
      profileUpdates.bio = (body.bio || "").slice(0, 300);
    }
    if (body.wallet_address !== undefined) {
      profileUpdates.wallet_address = body.wallet_address || null;
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user.id);

      if (error) throw error;

      // Update user metadata for NavBar
      if (profileUpdates.pen_name) {
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await adminClient.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            pen_name: profileUpdates.pen_name,
          },
        });
      }
    }

    // Bulk update author_name on all user's stories when pen_name changes
    if (profileUpdates.pen_name) {
      await supabase
        .from("stories")
        .update({ author_name: profileUpdates.pen_name as string })
        .eq("author_id", user.id);
    }

    // Update email preferences
    if (body.email_prefs) {
      const prefs = body.email_prefs;
      await supabase.from("email_preferences").upsert(
        {
          user_id: user.id,
          email: user.email,
          notify_branch: !!prefs.notify_branch,
          notify_votes: !!prefs.notify_votes,
          notify_tips: !!prefs.notify_tips,
          newsletter: !!prefs.newsletter,
          marketing: !!prefs.marketing,
        },
        { onConflict: "user_id" }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
