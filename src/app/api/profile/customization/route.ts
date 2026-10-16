export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getRequestUser } from "@/lib/request-user";
import { sanitizeCustomization } from "@/lib/profile-theme";

// The 20261016 profile_customization migration hasn't been applied: Postgres undefined_column on
// select, PostgREST "column not in schema cache" on update.
const isMissingColumn = (code?: string) => code === "42703" || code === "PGRST204";
const NOT_READY = "Profile customization isn't set up on this server yet. Apply the profile_customization migration.";

/** GET /api/profile/customization: the signed-in writer's saved look and pinned tale. */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Sign in to customize your profile." }, { status: 401 });

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("profiles")
    .select("customization, pinned_story_id")
    .eq("id", user.id)
    .single();

  if (isMissingColumn(error?.code)) {
    return NextResponse.json({ customization: null, pinned_story_id: null, ready: false });
  }
  if (error || !data) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  return NextResponse.json({
    customization: sanitizeCustomization(data.customization),
    pinned_story_id: data.pinned_story_id,
    ready: true,
  });
}

/**
 * PUT /api/profile/customization
 * Body: { customization, pinned_story_id? } — customization is whitelisted before saving;
 * pinned_story_id must be a visible seed this writer authored (null clears it).
 */
export async function PUT(req: NextRequest) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Sign in to customize your profile." }, { status: 401 });

  let body: { customization?: unknown; pinned_story_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send the profile settings as JSON." }, { status: 400 });
  }

  const sb = createServiceClient();
  const updates: Record<string, unknown> = { customization: sanitizeCustomization(body.customization) };

  if (body.pinned_story_id !== undefined) {
    if (body.pinned_story_id === null || body.pinned_story_id === "") {
      updates.pinned_story_id = null;
    } else if (typeof body.pinned_story_id === "string") {
      const { data: story } = await sb
        .from("stories")
        .select("id")
        .eq("id", body.pinned_story_id)
        .eq("author_id", user.id)
        .eq("story_type", "seed")
        .eq("is_hidden", false)
        .maybeSingle();
      if (!story) return NextResponse.json({ error: "You can only pin a seed you wrote." }, { status: 400 });
      updates.pinned_story_id = story.id;
    } else {
      return NextResponse.json({ error: "pinned_story_id must be a story id or null." }, { status: 400 });
    }
  }

  const { data, error } = await sb
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("customization, pinned_story_id")
    .single();

  if (isMissingColumn(error?.code)) return NextResponse.json({ error: NOT_READY }, { status: 503 });
  if (error || !data) return NextResponse.json({ error: "Couldn't save your profile. Try again." }, { status: 500 });

  return NextResponse.json({ customization: data.customization, pinned_story_id: data.pinned_story_id, ready: true });
}
