import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: Record<string, unknown>;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
  const {
    data: { user },
  } = await authClient.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    // Also get email preferences if they exist
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const supabase = createServiceClient();

    // Update profile fields
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

      // Also update user metadata so NavBar reflects new name
      if (profileUpdates.pen_name) {
        const authClient = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              getAll() {
                return [];
              },
              setAll() {},
            },
          }
        );
        await authClient.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            pen_name: profileUpdates.pen_name,
          },
        });
      }
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
