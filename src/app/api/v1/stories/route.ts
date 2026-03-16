export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { resolveAuth, hasScope } from "@/lib/api-auth";
import { createNotification } from "@/lib/notify";
import {
  isSpamContent,
  containsUrl,
  isRateLimited,
  getClientIp,
  sanitizeContent,
} from "@/lib/spam-filter";

export async function GET(req: NextRequest) {
  const sb = createServiceClient();
  const p = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(p.get("page") || "1"));
  const perPage = Math.min(100, Math.max(1, parseInt(p.get("per_page") || "20")));
  const sort = p.get("sort") || "recent";
  const tag = p.get("tag");
  const storyType = p.get("story_type");
  const author = p.get("author");
  const since = p.get("since");

  let query = sb.from("stories").select("*, profiles:author_id(is_bot)", { count: "exact" }).eq("is_hidden", false);

  if (storyType === "seed") query = query.is("parent_id", null);
  else if (storyType === "branch") query = query.not("parent_id", "is", null);
  if (tag) query = query.contains("tags", [tag]);
  if (author) query = query.ilike("author_name", `%${author}%`);
  if (since) query = query.gte("created_at", since);

  if (sort === "popular") query = query.order("upvotes", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, count, error } = await query.range((page - 1) * perPage, page * perPage - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten is_bot from joined profiles into each story
  const stories = (data || []).map((s: any) => {
    const { profiles, ...story } = s;
    return { ...story, is_bot: !!profiles?.is_bot };
  });

  return NextResponse.json({
    data: stories,
    pagination: {
      page,
      per_page: perPage,
      total: count || 0,
      has_more: (count || 0) > page * perPage,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await resolveAuth(req);
  if (!hasScope(auth, "write")) {
    return NextResponse.json({ error: "Write access required. Use a paid API key or Bearer token." }, { status: 403 });
  }
  if (auth.rate_limited) {
    return NextResponse.json({ error: "API key rate limit exceeded." }, { status: 429 });
  }

  const body = await req.json();
  const { title, teaser, content, parent_id, tags, is_ending, metadata } = body;

  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });
  if (!parent_id && !title?.trim()) return NextResponse.json({ error: "title required for seeds" }, { status: 400 });
  if (parent_id && !teaser?.trim()) return NextResponse.json({ error: "teaser required for branches" }, { status: 400 });

  // ── Spam protection (API key rate limit) ───────────────────────
  const ip = getClientIp(req);
  if (isRateLimited(ip, 10)) {
    return NextResponse.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429 });
  }
  // Bot accounts (authenticated via API key) can include URLs; others cannot
  const isBotAccount = auth.auth_method === "api_key";
  if (!isBotAccount && content && isSpamContent(content)) {
    return NextResponse.json({ error: "Content flagged as spam." }, { status: 400 });
  }
  if (title && isSpamContent(title)) {
    return NextResponse.json({ error: "Title flagged as spam." }, { status: 400 });
  }
  if (teaser && isSpamContent(teaser)) {
    return NextResponse.json({ error: "Teaser flagged as spam." }, { status: 400 });
  }

  const sb = createServiceClient();
  const isBranch = !!parent_id;

  let depth = 0;
  if (parent_id) {
    const { data: parent } = await sb.from("stories").select("depth").eq("id", parent_id).single();
    if (parent) depth = parent.depth + 1;
  }

  let slug: string | null = null;
  if (!isBranch && title) {
    slug = title.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/ +/g, "-").slice(0, 80) + "-" + Math.random().toString(36).slice(2, 6);
  }

  const { data, error } = await sb.from("stories").insert({
    title: isBranch ? null : sanitizeContent(title).slice(0, 200),
    slug,
    teaser: isBranch && teaser ? sanitizeContent(teaser).slice(0, 300) : null,
    content: sanitizeContent(content).slice(0, isBranch ? 5000 : 3000),
    story_type: isBranch ? "branch" : "seed",
    is_ending: !!is_ending,
    tags: Array.isArray(tags) ? tags.slice(0, 5) : null,
    metadata: metadata || null,
    author_id: auth.user_id,
    author_name: sanitizeContent(auth.author_name).slice(0, 50),
    parent_id: parent_id || null,
    depth,
    upvotes: 0,
    downvotes: 0,
  }).select("id, slug").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify parent author
  if (isBranch && parent_id) {
    const { data: ps } = await sb.from("stories").select("author_id, title, slug, id").eq("id", parent_id).single();
    if (ps?.author_id && ps.author_id !== auth.user_id) {
      createNotification(ps.author_id, "branch", `${auth.author_name} branched "${ps.title || "your story"}"`, teaser?.slice(0, 100), `/story/${ps.slug || ps.id}`);
    }
  }

  return NextResponse.json({ id: data.id, slug: data.slug }, { status: 201 });
}
