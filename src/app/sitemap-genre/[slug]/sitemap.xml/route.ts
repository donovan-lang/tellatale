import { createServiceClient } from "@/lib/supabase-server";
import { GENRE_ICON_SLUG } from "@/lib/genre-theme";
import { NextResponse } from "next/server";

/* ── Per-Genre Sitemap ──
 * /sitemap-genre/[slug]/sitemap.xml — paginated story sitemap for one genre.
 * Helps search engines crawl genre-specific story sets more efficiently.
 */

const SLUG_TO_GENRE: Record<string, string> = Object.fromEntries(
  Object.entries(GENRE_ICON_SLUG).map(([genre, slug]) => [slug, genre])
);

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const genre = SLUG_TO_GENRE[params.slug];
  if (!genre) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = createServiceClient();
  const { data: stories } = await supabase
    .from("stories")
    .select("slug, id, created_at")
    .is("parent_id", null)
    .eq("is_hidden", false)
    .contains("tags", [genre])
    .order("created_at", { ascending: false })
    .limit(5000);

  const urlEntries = (stories || [])
    .map((s: any) => {
      const url = `https://makeatale.com/story/${escXml(s.slug || s.id)}`;
      const lastmod = new Date(s.created_at).toISOString();
      return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://makeatale.com/genre/${escXml(params.slug)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${urlEntries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
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
