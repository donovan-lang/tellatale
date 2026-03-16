import { createServiceClient } from "./supabase-server";
import { notifyBranch, notifyUpvote, notifyTip } from "./email-notifications";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string | null,
  link: string | null
) {
  try {
    const supabase = createServiceClient();

    // Insert in-app notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body,
      link,
    });

    // Fire-and-forget email notification for supported types.
    // Look up the user's profile name for the email greeting.
    sendEmailForType(supabase, userId, type, title, body, link).catch(() => {});
  } catch {
    // Non-critical — don't break the parent operation
  }
}

/**
 * Resolve the user's display name and email, then dispatch to the
 * appropriate email notification function based on notification type.
 */
async function sendEmailForType(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  type: string,
  title: string,
  body: string | null,
  link: string | null
): Promise<void> {
  // Only send emails for types that have dedicated templates
  if (!["branch", "vote", "tip"].includes(type)) return;

  // Get user's display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("pen_name")
    .eq("id", userId)
    .single();

  const authorName = profile?.pen_name || "Writer";
  const storyUrl = link || "/stories";

  if (type === "branch") {
    // Parse brancher name and story title from the notification title.
    // Format: '{brancherName} branched "{storyTitle}"'
    const branchMatch = title.match(/^(.+?) branched "(.+)"$/);
    const brancherName = branchMatch?.[1] || "Someone";
    const storyTitle = branchMatch?.[2] || "your story";
    notifyBranch(userId, authorName, brancherName, storyTitle, storyUrl);
  } else if (type === "vote") {
    // Parse story title from body or title.
    // Title format: 'Your story got an upvote!'
    // body is the story title
    const storyTitle = body || "your story";

    // Fetch current upvote count from the story
    let voteCount = 0;
    if (link) {
      // link is like /story/{slug-or-id}
      const slugOrId = link.split("/story/")[1];
      if (slugOrId) {
        const { data: story } = await supabase
          .from("stories")
          .select("upvotes")
          .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
          .single();
        voteCount = story?.upvotes || 0;
      }
    }

    notifyUpvote(userId, authorName, storyTitle, voteCount, storyUrl);
  } else if (type === "tip") {
    // Parse amount from body.
    // body format: 'Transaction: {sig}...'
    // title format: 'Someone tipped "{storyTitle}"!'
    const tipMatch = title.match(/tipped "(.+?)"/);
    const storyTitle = tipMatch?.[1] || "your story";
    const amount = body || "a tip";
    notifyTip(userId, authorName, amount, storyTitle, storyUrl);
  }
}
