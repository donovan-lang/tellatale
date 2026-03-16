import { createServiceClient } from "@/lib/supabase-server";
import { GENRE_ICON_SLUG } from "@/lib/genre-theme";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();
  const { data: stories } = await supabase
    .from("stories")
    .select("slug, id, created_at")
    .is("parent_id", null)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(500);

  const storyUrls = (stories || []).map((s: any) => ({
    url: `https://makeatale.com/story/${encodeURIComponent(s.slug || s.id)}`,
    lastModified: new Date(s.created_at),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const genreUrls = Object.values(GENRE_ICON_SLUG).map((slug) => ({
    url: `https://makeatale.com/genre/${slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    { url: "https://makeatale.com", changeFrequency: "daily", priority: 1 },
    { url: "https://makeatale.com/stories", changeFrequency: "hourly", priority: 0.9 },
    { url: "https://makeatale.com/genre", changeFrequency: "daily", priority: 0.8 },
    ...genreUrls,
    { url: "https://makeatale.com/leaderboard", changeFrequency: "daily", priority: 0.7 },
    { url: "https://makeatale.com/challenges", changeFrequency: "weekly", priority: 0.6 },
    { url: "https://makeatale.com/developers", changeFrequency: "monthly", priority: 0.7 },
    { url: "https://makeatale.com/submit", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://makeatale.com/login", changeFrequency: "monthly", priority: 0.3 },
    { url: "https://makeatale.com/signup", changeFrequency: "monthly", priority: 0.3 },
    ...storyUrls,
  ];
}
