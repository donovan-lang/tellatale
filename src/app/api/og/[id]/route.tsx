import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase-server";
import type { Story } from "@/types";

/* ── Genre-themed gradient + accent color mapping ── */
const GENRE_THEMES: Record<
  string,
  { bg: [string, string]; glow: string; accent: string; accentBg: string; accentBorder: string }
> = {
  Fantasy:    { bg: ["#1a0533", "#1e1b4b"], glow: "rgba(139,92,246,0.18)",  accent: "#c4b5fd", accentBg: "rgba(139,92,246,0.25)",  accentBorder: "rgba(139,92,246,0.5)" },
  "Sci-Fi":   { bg: ["#041420", "#0c1445"], glow: "rgba(56,189,248,0.18)",  accent: "#7dd3fc", accentBg: "rgba(56,189,248,0.25)",  accentBorder: "rgba(56,189,248,0.5)" },
  Horror:     { bg: ["#1a0505", "#0a0a0a"], glow: "rgba(239,68,68,0.18)",   accent: "#fca5a5", accentBg: "rgba(239,68,68,0.25)",   accentBorder: "rgba(239,68,68,0.5)" },
  Mystery:    { bg: ["#0a0f1a", "#111827"], glow: "rgba(99,102,241,0.18)",  accent: "#a5b4fc", accentBg: "rgba(99,102,241,0.25)",  accentBorder: "rgba(99,102,241,0.5)" },
  Romance:    { bg: ["#1a050f", "#1a0533"], glow: "rgba(244,114,182,0.18)", accent: "#f9a8d4", accentBg: "rgba(244,114,182,0.25)", accentBorder: "rgba(244,114,182,0.5)" },
  Adventure:  { bg: ["#1a1005", "#1a0f05"], glow: "rgba(251,191,36,0.18)",  accent: "#fcd34d", accentBg: "rgba(251,191,36,0.25)",  accentBorder: "rgba(251,191,36,0.5)" },
  Thriller:   { bg: ["#111111", "#1a0505"], glow: "rgba(220,38,38,0.18)",   accent: "#fca5a5", accentBg: "rgba(220,38,38,0.25)",   accentBorder: "rgba(220,38,38,0.5)" },
  Comedy:     { bg: ["#1a1505", "#1a0f05"], glow: "rgba(250,204,21,0.18)",  accent: "#fde68a", accentBg: "rgba(250,204,21,0.25)",  accentBorder: "rgba(250,204,21,0.5)" },
  Drama:      { bg: ["#0f111a", "#1a0533"], glow: "rgba(168,85,247,0.18)",  accent: "#d8b4fe", accentBg: "rgba(168,85,247,0.25)",  accentBorder: "rgba(168,85,247,0.5)" },
  Surreal:    { bg: ["#1a051a", "#051a1a"], glow: "rgba(217,70,239,0.18)",  accent: "#e879f9", accentBg: "rgba(217,70,239,0.25)",  accentBorder: "rgba(217,70,239,0.5)" },
  Historical: { bg: ["#1a1510", "#151005"], glow: "rgba(180,160,120,0.18)", accent: "#d6c9a8", accentBg: "rgba(180,160,120,0.25)", accentBorder: "rgba(180,160,120,0.5)" },
  Dystopia:   { bg: ["#051a0a", "#111111"], glow: "rgba(74,222,128,0.18)",  accent: "#86efac", accentBg: "rgba(74,222,128,0.25)",  accentBorder: "rgba(74,222,128,0.5)" },
};

const DEFAULT_THEME = {
  bg: ["#030712", "#1a0a2e"] as [string, string],
  glow: "rgba(139,92,246,0.15)",
  accent: "#c4b5fd",
  accentBg: "rgba(139,92,246,0.2)",
  accentBorder: "rgba(139,92,246,0.4)",
};

function resolveTheme(tag: string | null) {
  if (!tag) return DEFAULT_THEME;
  // Case-insensitive match against genre keys
  const key = Object.keys(GENRE_THEMES).find(
    (k) => k.toLowerCase() === tag.toLowerCase()
  );
  return key ? GENRE_THEMES[key] : DEFAULT_THEME;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // Fetch story from Supabase
  let story: Story | null = null;
  try {
    const supabase = createServiceClient();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );
    const { data } = isUuid
      ? await supabase.from("stories").select("*").eq("id", id).single()
      : await supabase.from("stories").select("*").eq("slug", id).single();
    story = data;
  } catch {
    /* fall through to fallback */
  }

  const title = story?.title || "A Tale on MakeATale";
  const author = story?.author_name || "Anonymous";
  const votes = story?.upvotes ?? 0;
  const firstTag =
    story?.tags && story.tags.length > 0 ? story.tags[0] : null;

  // Build a teaser from the dedicated field or fall back to content
  const rawTeaser = story?.teaser || story?.content || "";
  const teaser =
    rawTeaser.length > 120 ? rawTeaser.slice(0, 117) + "..." : rawTeaser;

  // Resolve genre-specific theme
  const theme = resolveTheme(firstTag);

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
          background: `linear-gradient(135deg, ${theme.bg[0]} 0%, ${theme.bg[1]} 50%, ${theme.bg[0]} 100%)`,
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow — tinted per genre */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            left: "50%",
            width: "800px",
            height: "800px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* Logo text */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: theme.accent,
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "32px",
            display: "flex",
          }}
        >
          MakeATale
        </div>

        {/* Story title */}
        <div
          style={{
            fontSize: title.length > 60 ? "36px" : "48px",
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.2,
            marginBottom: "16px",
            display: "flex",
          }}
        >
          {title.length > 90 ? title.slice(0, 87) + "..." : title}
        </div>

        {/* Teaser / snippet */}
        {teaser && (
          <div
            style={{
              fontSize: "18px",
              color: "#6b7280",
              textAlign: "center",
              maxWidth: "820px",
              lineHeight: 1.4,
              marginBottom: "20px",
              fontStyle: "italic",
              display: "flex",
            }}
          >
            &ldquo;{teaser}&rdquo;
          </div>
        )}

        {/* Author */}
        <div
          style={{
            fontSize: "22px",
            color: "#9ca3af",
            marginBottom: "24px",
            display: "flex",
          }}
        >
          by {author}
        </div>

        {/* Genre badge + tag pill + vote row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Genre badge — prominent, only if tag matches a known genre */}
          {firstTag && GENRE_THEMES[Object.keys(GENRE_THEMES).find(
            (k) => k.toLowerCase() === firstTag.toLowerCase()
          ) || ""] && (
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: theme.accent,
                background: theme.accentBg,
                border: `2px solid ${theme.accentBorder}`,
                borderRadius: "9999px",
                padding: "6px 22px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              {firstTag}
            </div>
          )}

          {/* Additional tag pill (shown when firstTag is NOT a known genre) */}
          {firstTag && !GENRE_THEMES[Object.keys(GENRE_THEMES).find(
            (k) => k.toLowerCase() === firstTag.toLowerCase()
          ) || ""] && (
            <div
              style={{
                fontSize: "16px",
                color: theme.accent,
                background: theme.accentBg,
                border: `1px solid ${theme.accentBorder}`,
                borderRadius: "9999px",
                padding: "6px 20px",
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
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 10v12" />
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
            </svg>
            {votes} votes
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
