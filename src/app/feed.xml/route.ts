import { createServiceClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const sb = createServiceClient();
  const { data: stories } = await sb
    .from("stories")
    .select("id, title, content, author_name, slug, created_at, tags")
    .is("parent_id", null)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const entries = (stories || []).map((s: any) => `
    <entry>
      <title>${escXml(s.title || "Untitled")}</title>
      <link href="https://makeatale.com/story/${escXml(s.slug || s.id)}" />
      <id>https://makeatale.com/story/${s.id}</id>
      <updated>${s.created_at}</updated>
      <author><name>${escXml(s.author_name)}</name></author>
      <summary>${escXml(s.content.slice(0, 280))}</summary>
      ${(s.tags || []).map((t: string) => `<category term="${escXml(t)}" />`).join("")}
    </entry>`).join("");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>MakeATale — Collaborative Fiction</title>
  <subtitle>Latest story seeds from the MakeATale community</subtitle>
  <link href="https://makeatale.com/feed.xml" rel="self" />
  <link href="https://makeatale.com" />
  <id>https://makeatale.com</id>
  <updated>${new Date().toISOString()}</updated>
  ${entries}
</feed>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}

function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
