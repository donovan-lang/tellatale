import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendEmail, wrapEmailTemplate } from "@/lib/email";

const SITE_URL = "https://makeatale.com";
const DISCORD_URL = "https://discord.gg/TJn25WNRVv";

// ── Helpers ──────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface TopStory {
  id: string;
  title: string | null;
  slug: string | null;
  author_name: string;
  upvotes: number;
  downvotes: number;
}

function storyUrl(story: TopStory): string {
  return `${SITE_URL}/story/${story.slug || story.id}`;
}

function buildDigestEmail(stories: TopStory[]): string {
  const storyListHtml = stories
    .map((s, i) => {
      const score = s.upvotes - s.downvotes;
      const title = escapeHtml(s.title || "Untitled");
      const author = escapeHtml(s.author_name || "Anonymous");
      const url = storyUrl(s);

      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #374151;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="vertical-align:top;width:28px;padding-right:12px;">
                <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background-color:#9333ea;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">${i + 1}</span>
              </td>
              <td style="vertical-align:top;">
                <a href="${url}" style="font-size:15px;font-weight:600;color:#f3f4f6;text-decoration:none;">${title}</a>
                <br/>
                <span style="font-size:13px;color:#9ca3af;">by ${author}</span>
                <span style="font-size:13px;color:#6b7280;padding-left:8px;">&uarr; ${score} votes</span>
              </td>
              <td style="vertical-align:middle;text-align:right;white-space:nowrap;">
                <a href="${url}" style="font-size:13px;color:#c4b5fd;text-decoration:none;font-weight:600;">Read &rarr;</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");

  return wrapEmailTemplate(`
    <h2 style="margin:0 0 4px;font-size:20px;color:#f3f4f6;">
      This Week&rsquo;s Top Stories
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;">
      The most upvoted tales from the past 7 days.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%">
      ${storyListHtml}
    </table>

    <table cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="background-color:#9333ea;border-radius:8px;padding:12px 28px;">
          <a href="${SITE_URL}/stories?sort=trending" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
            Browse All Stories
          </a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" style="margin:12px 0 0;">
      <tr>
        <td style="background-color:transparent;border:1px solid #9333ea;border-radius:8px;padding:12px 28px;">
          <a href="${DISCORD_URL}" style="color:#c4b5fd;text-decoration:none;font-size:14px;font-weight:600;">
            Join Our Discord
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:20px 0 0;font-size:12px;color:#6b7280;">
      Want to stop receiving these digests?
      <a href="${SITE_URL}/account" style="color:#6b7280;text-decoration:underline;">Manage preferences</a>
    </p>
  `);
}

// ── Cron handler ─────────────────────────────────────────────────────

/**
 * POST /api/cron/weekly-digest
 *
 * Sends a branded weekly email digest with the top 5 stories from
 * the past 7 days to all newsletter subscribers.
 *
 * Requires: Authorization: Bearer CRON_SECRET
 *
 * Suggested cron (Mondays 10 AM CST / 16:00 UTC):
 *   0 16 * * 1 curl -s -X POST https://makeatale.com/api/cron/weekly-digest \
 *     -H "Authorization: Bearer CRON_SECRET"
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createServiceClient();
  const oneWeekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // ── Fetch top 5 stories by net score ────────────────────────────
  const { data: stories, error: storiesError } = await sb
    .from("stories")
    .select("id, title, slug, upvotes, downvotes, author_name")
    .is("parent_id", null)
    .eq("is_hidden", false)
    .gte("created_at", oneWeekAgo)
    .order("upvotes", { ascending: false })
    .limit(20); // fetch extras so we can re-sort by net score

  if (storiesError) {
    console.error("Weekly digest: failed to query stories:", storiesError.message);
    return NextResponse.json(
      { ok: false, error: "Failed to query stories" },
      { status: 500 }
    );
  }

  // Re-sort by net score (upvotes - downvotes) and take top 5
  const topStories = (stories || [])
    .sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes))
    .slice(0, 5);

  if (topStories.length === 0) {
    return NextResponse.json({
      ok: true,
      subscribers: 0,
      stories: 0,
      skipped: "no stories this week",
    });
  }

  // ── Fetch all newsletter subscribers ────────────────────────────
  const { data: subscribers, error: subError } = await sb
    .from("newsletter_subscribers")
    .select("email");

  if (subError) {
    console.error("Weekly digest: failed to query subscribers:", subError.message);
    return NextResponse.json(
      { ok: false, error: "Failed to query subscribers" },
      { status: 500 }
    );
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({
      ok: true,
      subscribers: 0,
      stories: topStories.length,
      skipped: "no subscribers",
    });
  }

  // ── Build & send ───────────────────────────────────────────────
  const html = buildDigestEmail(topStories);
  const subject = "This Week on MakeATale — Top Stories";

  let sent = 0;
  for (const sub of subscribers) {
    try {
      await sendEmail(sub.email, subject, html);
      sent++;
    } catch {
      // individual failures logged by sendEmail; keep going
    }
  }

  return NextResponse.json({
    ok: true,
    subscribers: sent,
    stories: topStories.length,
  });
}
