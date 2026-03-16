import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase-server";
import type { Story } from "@/types";

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
          background: "linear-gradient(135deg, #030712 0%, #1a0a2e 50%, #030712 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            left: "50%",
            width: "800px",
            height: "800px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Logo text */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#a78bfa",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "40px",
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
            marginBottom: "24px",
            display: "flex",
          }}
        >
          {title.length > 90 ? title.slice(0, 87) + "..." : title}
        </div>

        {/* Author */}
        <div
          style={{
            fontSize: "22px",
            color: "#9ca3af",
            marginBottom: "28px",
            display: "flex",
          }}
        >
          by {author}
        </div>

        {/* Tag + vote row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {firstTag && (
            <div
              style={{
                fontSize: "16px",
                color: "#c4b5fd",
                background: "rgba(139,92,246,0.2)",
                border: "1px solid rgba(139,92,246,0.4)",
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
