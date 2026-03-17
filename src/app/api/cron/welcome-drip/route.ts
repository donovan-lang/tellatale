import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendEmail, wrapEmailTemplate } from "@/lib/email";

const SITE_URL = "https://makeatale.com";
const DISCORD_URL = "https://discord.gg/TJn25WNRVv";

// ── Email content builders ───────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildWelcomeEmail(name: string): string {
  const greeting = name ? `Hey ${escapeHtml(name)},` : "Hey there,";
  return wrapEmailTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#f3f4f6;">
      Welcome to MakeATale!
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;">
      ${greeting}
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
      You just joined a community of collaborative storytellers.
      On MakeATale, every story can branch into new directions &mdash;
      and <strong style="color:#c4b5fd;">you</strong> decide where it goes.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
      Here&rsquo;s how it works:
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#d1d5db;line-height:1.8;">
      <li><strong style="color:#c4b5fd;">Read</strong> stories from other authors</li>
      <li><strong style="color:#c4b5fd;">Branch</strong> them in your own direction</li>
      <li><strong style="color:#c4b5fd;">Create</strong> your own story for others to branch</li>
    </ul>
    <p style="margin:0 0 24px;font-size:15px;color:#d1d5db;line-height:1.6;">
      Ready to write your first tale?
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#9333ea;border-radius:8px;padding:12px 28px;">
          <a href="${SITE_URL}/generate" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
            Generate Your First Story
          </a>
        </td>
      </tr>
    </table>
  `);
}

function buildEngagementEmail(name: string): string {
  const greeting = name ? `Hey ${escapeHtml(name)},` : "Hey there,";
  return wrapEmailTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#f3f4f6;">
      Stories are branching!
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;">
      ${greeting}
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
      Since you joined, our storytellers have been busy. New branches are
      sprouting on stories across the platform &mdash; and the best tales
      are the ones with <strong style="color:#c4b5fd;">unexpected twists</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
      Check out what&rsquo;s trending and add your own spin. Every branch
      you write earns upvotes and builds your author profile.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#9333ea;border-radius:8px;padding:12px 28px;">
          <a href="${SITE_URL}/stories?sort=trending" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
            Explore Trending Stories
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
      Tip: Find a story you love and hit &ldquo;Branch&rdquo; to write
      what happens next.
    </p>
  `);
}

function buildCommunityEmail(name: string): string {
  const greeting = name ? `Hey ${escapeHtml(name)},` : "Hey there,";
  return wrapEmailTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#f3f4f6;">
      Join the community
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;">
      ${greeting}
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
      MakeATale is more than a platform &mdash; it&rsquo;s a community of
      writers who love collaborative storytelling. Here are some ways to
      dive deeper:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#d1d5db;line-height:1.8;">
      <li><strong style="color:#c4b5fd;">Discord</strong> &mdash; Chat with other writers, share ideas, get feedback</li>
      <li><strong style="color:#c4b5fd;">Challenges</strong> &mdash; Weekly writing prompts with community voting</li>
      <li><strong style="color:#c4b5fd;">Leaderboard</strong> &mdash; Climb the ranks and earn your spot as a top storyteller</li>
    </ul>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#9333ea;border-radius:8px;padding:12px 28px;">
          <a href="${DISCORD_URL}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
            Join Our Discord
          </a>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin:0;">
      <tr>
        <td style="background-color:transparent;border:1px solid #9333ea;border-radius:8px;padding:12px 28px;">
          <a href="${SITE_URL}/leaderboard" style="color:#c4b5fd;text-decoration:none;font-size:14px;font-weight:600;">
            View Leaderboard
          </a>
        </td>
      </tr>
    </table>
  `);
}

// ── Drip step definitions ────────────────────────────────────────────

interface DripStep {
  day: number;
  subject: string;
  buildHtml: (name: string) => string;
}

const DRIP_STEPS: DripStep[] = [
  {
    day: 0,
    subject: "Welcome to MakeATale!",
    buildHtml: buildWelcomeEmail,
  },
  {
    day: 2,
    subject: "Stories are branching — come explore",
    buildHtml: buildEngagementEmail,
  },
  {
    day: 5,
    subject: "Join the MakeATale community",
    buildHtml: buildCommunityEmail,
  },
];

// ── Cron handler ─────────────────────────────────────────────────────

/**
 * POST /api/cron/welcome-drip
 *
 * Sends a 3-email welcome drip sequence to newsletter subscribers.
 * Run once daily. Each run processes exact day-offsets from signup,
 * so no duplicate emails are sent across runs.
 *
 * Requires: Authorization: Bearer CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createServiceClient();
  const now = new Date();
  const results: { step: number; sent: number; errors: number }[] = [];

  for (const step of DRIP_STEPS) {
    // Calculate the target signup date for this drip step.
    // e.g. day 2 → subscribers who signed up exactly 2 days ago.
    const targetDate = new Date(now);
    targetDate.setUTCDate(targetDate.getUTCDate() - step.day);
    const dayStart = targetDate.toISOString().slice(0, 10) + "T00:00:00.000Z";
    const dayEnd = targetDate.toISOString().slice(0, 10) + "T23:59:59.999Z";

    const { data: subscribers, error: queryError } = await sb
      .from("newsletter_subscribers")
      .select("email, name")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd);

    if (queryError) {
      console.error(
        `Welcome drip: failed to query subscribers for day ${step.day}:`,
        queryError.message
      );
      results.push({ step: step.day, sent: 0, errors: 1 });
      continue;
    }

    if (!subscribers || subscribers.length === 0) {
      results.push({ step: step.day, sent: 0, errors: 0 });
      continue;
    }

    let sent = 0;
    let errors = 0;

    for (const sub of subscribers) {
      try {
        const html = step.buildHtml(sub.name || "");
        await sendEmail(sub.email, step.subject, html);
        sent++;
      } catch {
        errors++;
      }
    }

    results.push({ step: step.day, sent, errors });
  }

  const totalSent = results.reduce((sum, r) => sum + r.sent, 0);

  return NextResponse.json({
    ok: true,
    emails_sent: totalSent,
    steps: results,
  });
}
