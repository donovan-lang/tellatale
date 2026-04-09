import { createServiceClient } from "@/lib/supabase-server";
import { toAuthorSlug } from "@/lib/utils";
import { NextResponse } from "next/server";

/* ── Author Atom Feed ──
 * /author/[slug]/feed.xml — RSS/Atom feed of an author's latest stories.
 * Lets writers share a personal feed link, and helps SEO via discoverability.
 */

export async function GET(
  _req: Request,
  { params }: { params: { name: string } }
) {
  const supabase = createServiceClient();

  // Find all stories by this author (matching slugified name)
  const { data: stories } = await supabase
    .from("stories")
    .select("id, title, content, author_name, slug, created_at, tags, story_type")
    .is("parent_id", null)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(200);

  const authorStories = (stories || []).filter(
    (s: any) => toAuthorSlug(s.author_name) === params.name
  );

  if (authorStories.length === 0) {
    return new NextResponse("Author not found", { status: 404 });
  }

  const authorName = authorStories[0].author_name;
  const recent = authorStories.slice(0, 50);
  const feedUrl = `https://makeatale.com/author/${params.name}/feed.xml`;
  const profileUrl = `https://makeatale.com/author/${params.name}`;

  const entries = recent
    .map(
      (s: any) => `
    <entry>
      <title>${escXml(s.title || "Untitled")}</title>
      <link href="https://makeatale.com/story/${escXml(s.slug || s.id)}" />
      <id>https://makeatale.com/story/${s.id}</id>
      <updated>${new Date(s.created_at).toISOString()}</updated>
      <author><name>${escXml(authorName)}</name></author>
      <summary>${escXml((s.content || "").slice(0, 280))}</summary>
      ${(s.tags || []).map((t: string) => `<category term="${escXml(t)}" />`).join("")}
    </entry>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escXml(authorName)} on MakeATale</title>
  <subtitle>Stories by ${escXml(authorName)} on MakeATale</subtitle>
  <link href="${feedUrl}" rel="self" />
  <link href="${profileUrl}" />
  <id>${profileUrl}</id>
  <updated>${new Date().toISOString()}</updated>
  <author><name>${escXml(authorName)}</name></author>
  ${entries}
</feed>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
