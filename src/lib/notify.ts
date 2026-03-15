import { createServiceClient } from "./supabase-server";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string | null,
  link: string | null
) {
  try {
    const supabase = createServiceClient();
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body,
      link,
    });
  } catch {
    // Non-critical — don't break the parent operation
  }
}
