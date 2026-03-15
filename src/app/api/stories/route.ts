export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createNotification } from "@/lib/notify";
import {
  isSpamContent,
  isHoneypotFilled,
  isSubmittedTooFast,
  isRateLimited,
  getClientIp,
  sanitizeContent,
} from "@/lib/spam-filter";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const authorId = req.nextUrl.searchParams.get("author_id");

    let query = supabase.from("stories").select("*").eq("is_hidden", false);

    if (authorId) {
      query = query.eq("author_id", authorId);
    } else {
      query = query.is("parent_id", null);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      content,
      teaser,
      author_name,
      image_url,
      image_prompt,
      parent_id,
      is_ending,
      tags,
      _hp,
      _ts,
    } = body;

    // ── Spam protection ──────────────────────────────────────────
    // Honeypot: bots fill hidden fields
    if (isHoneypotFilled(_hp)) {
      return NextResponse.json({ error: "Submission rejected" }, { status: 400 });
    }
    // Timing: reject instant submissions (bots)
    if (_ts && isSubmittedTooFast(_ts)) {
      return NextResponse.json({ error: "Please wait a moment before submitting" }, { status: 400 });
    }
    // Rate limit: 10 stories per minute per IP
    const ip = getClientIp(req);
    if (isRateLimited(ip, 10)) {
      return NextResponse.json({ error: "Too many submissions. Please slow down." }, { status: 429 });
    }
    // Content spam checks
    if (content && isSpamContent(content)) {
      return NextResponse.json({ error: "Your content was flagged as spam. Remove any URLs or suspicious patterns and try again." }, { status: 400 });
    }
    if (title && isSpamContent(title)) {
      return NextResponse.json({ error: "Your title was flagged as spam." }, { status: 400 });
    }
    if (teaser && isSpamContent(teaser)) {
      return NextResponse.json({ error: "Your choice line was flagged as spam." }, { status: 400 });
    }

    const isBranch = !!parent_id;
    const maxContent = isBranch ? 5000 : 3000;
    const maxTeaser = 300;

    // Seed requires title; branch does not
    if (!isBranch && !title?.trim()) {
      return NextResponse.json(
        { error: "Title is required for story seeds" },
        { status: 400 }
      );
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.trim().length > maxContent) {
      return NextResponse.json(
        { error: `Content must be ${maxContent} characters or fewer` },
        { status: 400 }
      );
    }

    // Branches need a teaser (the choice line readers see before clicking)
    if (isBranch && !teaser?.trim()) {
      return NextResponse.json(
        { error: "A choice line is required for branches" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Try to get the authenticated user's session for author attribution
    let authorId: string | null = null;
    let resolvedAuthorName = (author_name || "Anonymous").slice(0, 50);

    try {
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
              } catch {
                // Read-only in Route Handlers depending on context
              }
            },
          },
        }
      );

      const {
        data: { user },
      } = await authClient.auth.getUser();

      if (user) {
        authorId = user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("pen_name")
          .eq("id", user.id)
          .single();

        if (profile?.pen_name) {
          resolvedAuthorName = profile.pen_name;
        }
      }
    } catch {
      // No auth session — post anonymously
    }

    // Calculate depth from parent
    let depth = 0;
    if (parent_id) {
      const { data: parent } = await supabase
        .from("stories")
        .select("depth")
        .eq("id", parent_id)
        .single();

      if (parent) depth = parent.depth + 1;
    }

    // Generate slug for seeds
    let slug: string | null = null;
    if (!isBranch && title) {
      slug = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/ +/g, "-")
        .slice(0, 80);
      // Append random suffix to avoid collisions
      slug += "-" + Math.random().toString(36).slice(2, 6);
    }

    // Base row (sanitize all user text)
    const row: Record<string, unknown> = {
      title: isBranch ? null : sanitizeContent(title).slice(0, 200),
      slug,
      content: sanitizeContent(content).slice(0, maxContent),
      teaser: isBranch && teaser ? sanitizeContent(teaser).slice(0, maxTeaser) : null,
      author_id: authorId,
      author_name: sanitizeContent(resolvedAuthorName).slice(0, 50),
      image_url: image_url || null,
      image_prompt: image_prompt?.slice(0, 500) || null,
      parent_id: parent_id || null,
      depth,
      upvotes: 0,
      downvotes: 0,
    };

    // Try insert with CYOA columns (story_type, is_ending, tags)
    // Falls back to base columns if migration hasn't run yet
    const cyoaRow = {
      ...row,
      story_type: isBranch ? "branch" : "seed",
      is_ending: isBranch ? !!is_ending : false,
      tags: Array.isArray(tags) ? tags.slice(0, 5) : null,
    };

    let result = await supabase
      .from("stories")
      .insert(cyoaRow)
      .select("id")
      .single();

    // If schema error (columns don't exist yet), retry without them
    if (result.error?.message?.includes("schema cache")) {
      result = await supabase
        .from("stories")
        .insert(row)
        .select("id")
        .single();
    }

    if (result.error) throw result.error;

    // Notify parent story author when someone branches their story
    if (isBranch && parent_id) {
      const { data: parentStory } = await supabase
        .from("stories")
        .select("author_id, title, slug, id")
        .eq("id", parent_id)
        .single();
      if (parentStory?.author_id && parentStory.author_id !== authorId) {
        createNotification(
          parentStory.author_id,
          "branch",
          `${resolvedAuthorName} branched "${parentStory.title || "your story"}"`,
          teaser?.trim()?.slice(0, 100) || content.trim().slice(0, 100),
          `/story/${parentStory.slug || parentStory.id}`
        );
      }
    }

    return NextResponse.json({ id: result.data.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
