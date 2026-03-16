import { createServiceClient } from "./supabase-server";

/**
 * Calculate writing streak for a user.
 * A streak = consecutive days with at least 1 story or branch posted.
 */
export async function getWritingStreak(authorId: string): Promise<{
  current: number;
  longest: number;
  totalDays: number;
}> {
  const sb = createServiceClient();

  const { data } = await sb
    .from("stories")
    .select("created_at")
    .eq("author_id", authorId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(365);

  if (!data || data.length === 0) {
    return { current: 0, longest: 0, totalDays: 0 };
  }

  // Get unique days (in UTC)
  const days = new Set<string>();
  for (const s of data) {
    days.add(new Date(s.created_at).toISOString().slice(0, 10));
  }

  const sortedDays = Array.from(days).sort().reverse();
  const totalDays = sortedDays.length;

  // Calculate current streak (from today backwards)
  let current = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Streak counts if they wrote today or yesterday
  let checkDate = sortedDays[0] === today || sortedDays[0] === yesterday
    ? new Date(sortedDays[0])
    : null;

  if (checkDate) {
    for (const day of sortedDays) {
      const expected = checkDate.toISOString().slice(0, 10);
      if (day === expected) {
        current++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else if (day < expected) {
        break;
      }
    }
  }

  // Calculate longest streak
  let longest = 0;
  let streak = 1;
  const ascending = Array.from(days).sort();
  for (let i = 1; i < ascending.length; i++) {
    const prev = new Date(ascending[i - 1]);
    const curr = new Date(ascending[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }
  longest = Math.max(longest, streak);

  return { current, longest, totalDays };
}
