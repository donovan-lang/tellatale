/**
 * Specific email notification functions for MakeATale events.
 *
 * Each function checks the user's email_preferences before sending.
 * All calls are fire-and-forget — they never throw or block the caller.
 */

import { createServiceClient } from "./supabase-server";
import { sendEmail, wrapEmailTemplate } from "./email";

const SITE_URL = "https://makeatale.com";

// ── Preference check ───────────────────────────────────────────────

type PrefColumn = "notify_branch" | "notify_votes" | "notify_tips";

async function isEmailEnabled(
  userId: string,
  column: PrefColumn
): Promise<{ enabled: boolean; email: string | null }> {
  try {
    const sb = createServiceClient();

    // Get the user's email from Supabase Auth
    const { data: authData } = await sb.auth.admin.getUserById(userId);
    const email = authData?.user?.email || null;
    if (!email) return { enabled: false, email: null };

    // Check email_preferences table — select all notify columns
    const { data: prefs } = await sb
      .from("email_preferences")
      .select("notify_branch, notify_votes, notify_tips")
      .eq("user_id", userId)
      .single();

    // Default to enabled if no row exists (opt-out model)
    const enabled = prefs
      ? !!(prefs as Record<string, boolean>)[column]
      : true;

    return { enabled, email };
  } catch {
    return { enabled: false, email: null };
  }
}

// ── Notification: Branch ───────────────────────────────────────────

export async function notifyBranch(
  authorId: string,
  authorName: string,
  brancherName: string,
  storyTitle: string,
  storyUrl: string
): Promise<void> {
  try {
    const { enabled, email } = await isEmailEnabled(authorId, "notify_branch");
    if (!enabled || !email) return;

    const fullUrl = storyUrl.startsWith("http") ? storyUrl : `${SITE_URL}${storyUrl}`;

    const html = wrapEmailTemplate(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#f3f4f6;">
        Someone branched your story!
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;">
        Hey ${escapeHtml(authorName)},
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
        <strong style="color:#c4b5fd;">${escapeHtml(brancherName)}</strong> just branched your story
        <strong style="color:#f3f4f6;">"${escapeHtml(storyTitle)}"</strong>.
        Your world is growing!
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td style="background-color:#9333ea;border-radius:8px;padding:12px 28px;">
            <a href="${fullUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
              Read the Branch
            </a>
          </td>
        </tr>
      </table>
    `);

    sendEmail(email, `${brancherName} branched your story "${storyTitle}"`, html);
  } catch {
    // Non-critical
  }
}

// ── Notification: Upvote ───────────────────────────────────────────

export async function notifyUpvote(
  authorId: string,
  authorName: string,
  storyTitle: string,
  voteCount: number,
  storyUrl: string
): Promise<void> {
  try {
    const { enabled, email } = await isEmailEnabled(authorId, "notify_votes");
    if (!enabled || !email) return;

    const fullUrl = storyUrl.startsWith("http") ? storyUrl : `${SITE_URL}${storyUrl}`;

    const html = wrapEmailTemplate(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#f3f4f6;">
        Your story got upvoted!
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;">
        Hey ${escapeHtml(authorName)},
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
        <strong style="color:#f3f4f6;">"${escapeHtml(storyTitle)}"</strong> just got an upvote
        and now has <strong style="color:#c4b5fd;">${voteCount}</strong> total vote${voteCount !== 1 ? "s" : ""}.
        Readers are loving it!
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td style="background-color:#9333ea;border-radius:8px;padding:12px 28px;">
            <a href="${fullUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
              View Your Story
            </a>
          </td>
        </tr>
      </table>
    `);

    sendEmail(email, `Your story "${storyTitle}" got upvoted! (${voteCount} votes)`, html);
  } catch {
    // Non-critical
  }
}

// ── Notification: Tip ──────────────────────────────────────────────

export async function notifyTip(
  authorId: string,
  authorName: string,
  amount: string,
  storyTitle: string,
  storyUrl: string
): Promise<void> {
  try {
    const { enabled, email } = await isEmailEnabled(authorId, "notify_tips");
    if (!enabled || !email) return;

    const fullUrl = storyUrl.startsWith("http") ? storyUrl : `${SITE_URL}${storyUrl}`;

    const html = wrapEmailTemplate(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#f3f4f6;">
        You received a tip!
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;">
        Hey ${escapeHtml(authorName)},
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
        Someone tipped <strong style="color:#c4b5fd;">${escapeHtml(amount)}</strong> on your story
        <strong style="color:#f3f4f6;">"${escapeHtml(storyTitle)}"</strong>.
        Your writing is paying off!
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td style="background-color:#9333ea;border-radius:8px;padding:12px 28px;">
            <a href="${fullUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
              View Story
            </a>
          </td>
        </tr>
      </table>
    `);

    sendEmail(email, `You received a ${amount} tip on "${storyTitle}"!`, html);
  } catch {
    // Non-critical
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
