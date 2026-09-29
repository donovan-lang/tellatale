export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getRequestUser } from "@/lib/request-user";
import { sanitizeContent } from "@/lib/spam-filter";

const DRAFT_KEY = /^(seed|branch:[0-9a-f-]{36})$/i;
const MAX_DRAFTS = 50;

function clean(v: unknown, max: number): string | null {
  return typeof v === "string" ? sanitizeContent(v).slice(0, max) : null;
}

/** GET ?key=seed → that draft (or null). GET with no key → the user's drafts, newest first. */
export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServiceClient();
    const key = req.nextUrl.searchParams.get("key");

    if (key) {
      if (!DRAFT_KEY.test(key)) return NextResponse.json({ error: "Invalid draft key" }, { status: 400 });
      const { data, error } = await supabase
        .from("story_drafts")
        .select("*")
        .eq("user_id", user.id)
        .eq("draft_key", key)
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from("story_drafts")
      .select("draft_key, title, teaser, content, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(MAX_DRAFTS);
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

/** PUT { key, title, teaser, content, tags, seed_input } → upsert the draft */
export async function PUT(req: NextRequest) {
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const key = body?.key;
    if (typeof key !== "string" || !DRAFT_KEY.test(key)) {
      return NextResponse.json({ error: "Invalid draft key" }, { status: 400 });
    }

    const seedInput =
      body.seed_input && typeof body.seed_input.idea === "string"
        ? {
            idea: body.seed_input.idea.slice(0, 500),
            genre: typeof body.seed_input.genre === "string" ? body.seed_input.genre.slice(0, 40) : undefined,
            tone: typeof body.seed_input.tone === "string" ? body.seed_input.tone.slice(0, 40) : undefined,
          }
        : null;

    const updatedAt = new Date().toISOString();
    const supabase = createServiceClient();
    const { error } = await supabase.from("story_drafts").upsert({
      user_id: user.id,
      draft_key: key,
      title: clean(body.title, 200),
      teaser: clean(body.teaser, 300),
      content: clean(body.content, 5000),
      tags: Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === "string").slice(0, 5) : null,
      seed_input: seedInput,
      updated_at: updatedAt,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, updated_at: updatedAt });
  } catch {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

/** DELETE ?key=seed → remove the draft (after publishing or discarding) */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const key = req.nextUrl.searchParams.get("key");
    if (!key || !DRAFT_KEY.test(key)) return NextResponse.json({ error: "Invalid draft key" }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase.from("story_drafts").delete().eq("user_id", user.id).eq("draft_key", key);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
