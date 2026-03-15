import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createServiceClient();

  const [stories, hidden, profiles, banned, pendingReports, votes] =
    await Promise.all([
      sb.from("stories").select("*", { count: "exact", head: true }),
      sb.from("stories").select("*", { count: "exact", head: true }).eq("is_hidden", true),
      sb.from("profiles").select("*", { count: "exact", head: true }),
      sb.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
      sb.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("votes").select("*", { count: "exact", head: true }),
    ]);

  return NextResponse.json({
    total_stories: stories.count || 0,
    hidden_stories: hidden.count || 0,
    total_users: profiles.count || 0,
    banned_users: banned.count || 0,
    pending_reports: pendingReports.count || 0,
    total_votes: votes.count || 0,
  });
}
