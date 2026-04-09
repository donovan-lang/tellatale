import { GENRE_ICON_SLUG } from "@/lib/genre-theme";
import { NextResponse } from "next/server";

/* ── Sitemap Index ──
 * /sitemap-index.xml — index of all sitemaps (main + per-genre).
 * Submit this URL to Google Search Console for better crawl management.
 */

export async function GET() {
  const now = new Date().toISOString();

  const genreSitemaps = Object.values(GENRE_ICON_SLUG).map((slug) => ({
    loc: `https://makeatale.com/sitemap-genre/${slug}/sitemap.xml`,
    lastmod: now,
  }));

  const allSitemaps = [
    { loc: "https://makeatale.com/sitemap.xml", lastmod: now },
    ...genreSitemaps,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allSitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
