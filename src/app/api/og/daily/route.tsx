import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase-server";
import type { Story } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

/* ── Story-of-the-Day OG card ──
 * Picks the highest-scoring seed story from the last 7 days.
 * Returns a 1200x630 social card. Cached for 1 hour.
 *
 * Use case: drop into manual sharing (X, LinkedIn, blog headers).
 * Endpoint: /api/og/daily
 */

export async function GET() {
  const supabase = createServiceClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let story: Story | null = null;
  try {
    const { data } = await supabase
      .from("stories")
      .select("*")
      .is("parent_id", null)
      .eq("is_hidden", false)
      .gte("created_at", sevenDaysAgo)
      .order("upvotes", { ascending: false })
      .limit(1)
      .single();
    story = data as Story | null;
  } catch {
    /* fall through */
  }

  // Fallback: top of all time if no recent stories
  if (!story) {
    try {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .is("parent_id", null)
        .eq("is_hidden", false)
        .order("upvotes", { ascending: false })
        .limit(1)
        .single();
      story = data as Story | null;
    } catch {
      /* fall through */
    }
  }

  const title = story?.title || "A Tale on MakeATale";
  const author = story?.author_name || "Anonymous";
  const votes = story?.upvotes ?? 0;
  const firstTag = story?.tags?.[0] || null;
  const teaser = (story?.content || "").slice(0, 140) + ((story?.content || "").length > 140 ? "..." : "");
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a0533 0%, #0a0a23 50%, #1a0533 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            left: "50%",
            width: "900px",
            height: "900px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(217,70,239,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top label */}
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#e879f9",
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: "8px",
            display: "flex",
          }}
        >
          Story of the Day
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "#9ca3af",
            marginBottom: "32px",
            display: "flex",
          }}
        >
          {today}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? "44px" : "56px",
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            maxWidth: "1000px",
            lineHeight: 1.15,
            marginBottom: "20px",
            display: "flex",
          }}
        >
          {title.length > 90 ? title.slice(0, 87) + "..." : title}
        </div>

        {/* Teaser */}
        <div
          style={{
            fontSize: "20px",
            color: "#9ca3af",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.4,
            marginBottom: "32px",
            fontStyle: "italic",
            display: "flex",
          }}
        >
          &ldquo;{teaser}&rdquo;
        </div>

        {/* Author + meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              color: "#d8b4fe",
              display: "flex",
            }}
          >
            by {author}
          </div>
          {firstTag && (
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#e879f9",
                background: "rgba(217,70,239,0.15)",
                border: "1px solid rgba(217,70,239,0.4)",
                borderRadius: "9999px",
                padding: "5px 18px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              {firstTag}
            </div>
          )}
          <div
            style={{
              fontSize: "16px",
              color: "#9ca3af",
              display: "flex",
            }}
          >
            ★ {votes} votes
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            fontSize: "16px",
            color: "#6b7280",
            display: "flex",
          }}
        >
          makeatale.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
