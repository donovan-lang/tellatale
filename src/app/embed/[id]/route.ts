export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createServiceClient();
  const isUuid = /^[0-9a-f]{8}-/i.test(params.id);
  const { data: story } = isUuid
    ? await sb.from("stories").select("*").eq("id", params.id).single()
    : await sb.from("stories").select("*").eq("slug", params.id).single();

  if (!story || story.is_hidden) {
    return new NextResponse("<p>Story not found</p>", { headers: { "Content-Type": "text/html" } });
  }

  const { data: branches } = await sb.from("stories").select("id, teaser, content, author_name, upvotes, downvotes, slug").eq("parent_id", story.id).eq("is_hidden", false).order("upvotes", { ascending: false }).limit(3);

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // Theme support: light or dark
  const theme = req.nextUrl.searchParams.get("theme") === "light" ? "light" : "dark";
  const palette = theme === "light"
    ? { bg: "#ffffff", text: "#0f172a", muted: "#64748b", soft: "#94a3b8", card: "#f8fafc", border: "#e5e7eb" }
    : { bg: "#0f172a", text: "#e2e8f0", muted: "#64748b", soft: "#94a3b8", card: "#1e293b", border: "#1f2937" };

  const branchHtml = (branches || []).map((b: any) =>
    `<a href="https://makeatale.com/story/${esc(b.slug || b.id)}" target="_blank" style="display:block;padding:10px 12px;background:${palette.card};border-left:3px solid #d946ef;border-radius:0 8px 8px 0;font-size:13px;color:${palette.soft};text-decoration:none;margin-bottom:6px;">${esc((b.teaser || b.content || "").slice(0, 120))}</a>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(story.title || "MakeATale")}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:${palette.bg};color:${palette.text};padding:20px;max-width:600px;line-height:1.5}a:hover{opacity:0.9}</style></head><body>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
      <div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#d946ef,#7c3aed);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:white">M</div>
      <span style="font-size:14px;font-weight:700;color:#e879f9">MakeATale</span>
    </div>
    ${story.title ? `<h1 style="font-size:20px;font-weight:700;margin-bottom:8px;color:${palette.text}">${esc(story.title)}</h1>` : ""}
    <p style="font-size:14px;color:${palette.soft};line-height:1.6;margin-bottom:16px">${esc(story.content.slice(0, 300))}${story.content.length > 300 ? "..." : ""}</p>
    <p style="font-size:12px;color:${palette.muted};margin-bottom:16px">by ${esc(story.author_name)} &middot; ${story.upvotes - story.downvotes} votes</p>
    ${branchHtml ? `<p style="font-size:12px;color:${palette.soft};margin-bottom:6px">What happens next?</p>${branchHtml}` : ""}
    <a href="https://makeatale.com/story/${esc(story.slug || story.id)}" target="_blank" style="display:block;text-align:center;margin-top:16px;padding:10px;background:#d946ef;color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">Continue on MakeATale &rarr;</a>
  </body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "ALLOWALL",
      "Content-Security-Policy": "frame-ancestors *",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    }
  });
}
