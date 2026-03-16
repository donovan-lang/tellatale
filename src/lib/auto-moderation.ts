import { createServiceClient } from "./supabase-server";
import { createNotification } from "./notify";

/**
 * Auto-moderation system — runs after every downvote.
 *
 * Abuse protections:
 * 1. Only counts "trusted" votes (real authenticated users, not anon fingerprints)
 * 2. Only counts votes from accounts created >24h ago (prevents sock puppets)
 * 3. Requires a minimum number of unique downvoters (prevents 1-2 trolls gaming it)
 * 4. Uses downvote ratio, not raw count (a story with 50 up / 10 down is fine)
 * 5. Two-tier escalation: flag for review first, auto-hide only at a higher bar
 * 6. Author is notified at each tier and can appeal
 * 7. Already-hidden or already-flagged stories skip re-processing
 */

// Tier 1: Flag for mod review
const FLAG_NET_SCORE = -4;
const FLAG_DOWN_RATIO = 0.7;
const FLAG_MIN_DOWNVOTERS = 5;

// Tier 2: Auto-hide
const HIDE_NET_SCORE = -8;
const HIDE_DOWN_RATIO = 0.8;
const HIDE_MIN_DOWNVOTERS = 8;

// Minimum account age to count as a trusted voter (hours)
const MIN_ACCOUNT_AGE_HOURS = 24;

interface ModerationResult {
  action: "none" | "flagged" | "hidden";
  reason?: string;
}

export async function checkAutoModeration(
  storyId: string
): Promise<ModerationResult> {
  const sb = createServiceClient();

  // Get the story — skip if already hidden
  const { data: story } = await sb
    .from("stories")
    .select("id, author_id, author_name, title, slug, is_hidden, hidden_reason")
    .eq("id", storyId)
    .single();

  if (!story) return { action: "none" };
  if (story.is_hidden) return { action: "none" };

  // Get all votes for this story
  const { data: votes } = await sb
    .from("votes")
    .select("user_id, vote")
    .eq("story_id", storyId);

  if (!votes || votes.length === 0) return { action: "none" };

  // Filter to trusted votes only:
  // - Must be a real user ID (not anon_ fingerprint)
  // - Must not be the story author (can't downvote your own into hiding)
  const realVotes = votes.filter(
    (v) => !v.user_id.startsWith("anon_") && v.user_id !== story.author_id
  );

  if (realVotes.length === 0) return { action: "none" };

  // Get account creation dates for all real voters to filter by age
  const voterIds = Array.from(new Set(realVotes.map((v) => v.user_id)));

  // Query profiles for creation dates (profiles.created_at tracks account age)
  const { data: profiles } = await sb
    .from("profiles")
    .select("id, created_at")
    .in("id", voterIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, new Date(p.created_at)])
  );

  const cutoff = new Date(Date.now() - MIN_ACCOUNT_AGE_HOURS * 60 * 60 * 1000);

  // Only count votes from accounts older than the cutoff
  const trustedVotes = realVotes.filter((v) => {
    const created = profileMap.get(v.user_id);
    return created && created < cutoff;
  });

  if (trustedVotes.length === 0) return { action: "none" };

  // Calculate trusted metrics
  const trustedUp = trustedVotes.filter((v) => v.vote === 1).length;
  const trustedDown = trustedVotes.filter((v) => v.vote === -1).length;
  const trustedNet = trustedUp - trustedDown;
  const trustedTotal = trustedUp + trustedDown;
  const downRatio = trustedTotal > 0 ? trustedDown / trustedTotal : 0;

  // Count unique trusted downvoters
  const uniqueDownvoterSet = new Set(
    trustedVotes.filter((v) => v.vote === -1).map((v) => v.user_id)
  );
  const uniqueDownvoters = uniqueDownvoterSet.size;

  // Tier 2: Auto-hide (checked first since it's the higher bar)
  if (
    trustedNet <= HIDE_NET_SCORE &&
    downRatio >= HIDE_DOWN_RATIO &&
    uniqueDownvoters >= HIDE_MIN_DOWNVOTERS
  ) {
    const reason = `Auto-hidden: ${uniqueDownvoters} users downvoted (score ${trustedNet}, ${Math.round(downRatio * 100)}% negative)`;

    await sb
      .from("stories")
      .update({ is_hidden: true, hidden_reason: reason })
      .eq("id", storyId);

    // Create a report for mod visibility
    try {
      await sb.from("reports").insert({
        story_id: storyId,
        reporter_id: "system",
        reason: reason,
        status: "actioned",
        admin_note: "Auto-moderation: story hidden due to sustained downvoting from trusted accounts.",
      });
    } catch {}

    // Notify the author
    if (story.author_id) {
      createNotification(
        story.author_id,
        "moderation",
        "Your story was auto-hidden",
        `"${story.title || "Your story"}" was hidden after receiving significant downvotes from multiple users. If you believe this is an error, contact support.`,
        `/story/${story.slug || story.id}`
      );
    }

    return { action: "hidden", reason };
  }

  // Tier 1: Flag for review
  if (
    trustedNet <= FLAG_NET_SCORE &&
    downRatio >= FLAG_DOWN_RATIO &&
    uniqueDownvoters >= FLAG_MIN_DOWNVOTERS
  ) {
    // Check if already flagged (avoid duplicate reports)
    const { count: existingFlags } = await sb
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("reporter_id", "system")
      .eq("status", "pending");

    if (existingFlags && existingFlags > 0) {
      return { action: "none" }; // Already flagged, don't spam
    }

    const reason = `Auto-flagged: ${uniqueDownvoters} users downvoted (score ${trustedNet}, ${Math.round(downRatio * 100)}% negative)`;

    try {
      await sb.from("reports").insert({
        story_id: storyId,
        reporter_id: "system",
        reason: reason,
        status: "pending",
        admin_note: "Auto-moderation: flagged for review due to downvote pattern from trusted accounts.",
      });
    } catch {}

    // Notify the author as a heads-up
    if (story.author_id) {
      createNotification(
        story.author_id,
        "moderation",
        "Your story has been flagged for review",
        `"${story.title || "Your story"}" is receiving significant downvotes. If this continues, it may be hidden. Consider revising or contacting support if you think this is unfair.`,
        `/story/${story.slug || story.id}`
      );
    }

    return { action: "flagged", reason };
  }

  return { action: "none" };
}
