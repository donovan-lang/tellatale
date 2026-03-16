/**
 * Discord webhook integration.
 * Posts story events to Discord channels via webhooks.
 *
 * Env vars:
 *   DISCORD_WEBHOOK_NEW_STORIES — webhook URL for #new-stories channel
 *   DISCORD_WEBHOOK_TRENDING    — webhook URL for #trending channel (optional)
 */

const WEBHOOK_NEW = process.env.DISCORD_WEBHOOK_NEW_STORIES;
const WEBHOOK_TRENDING = process.env.DISCORD_WEBHOOK_TRENDING;
const SITE_URL = "https://makeatale.com";

interface StoryPayload {
  id: string;
  title: string | null;
  content: string;
  author_name: string;
  tags: string[] | null;
  slug: string | null;
  story_type: "seed" | "branch";
  teaser: string | null;
  parent_title?: string | null;
}

const GENRE_COLOR: Record<string, number> = {
  Fantasy: 0x9333ea,
  "Sci-Fi": 0x3b82f6,
  Horror: 0xef4444,
  Mystery: 0xf59e0b,
  Romance: 0xec4899,
  Adventure: 0x10b981,
  Thriller: 0xf97316,
  Comedy: 0xeab308,
  Drama: 0x6366f1,
  Surreal: 0x8b5cf6,
  Historical: 0x78716c,
  Dystopia: 0x64748b,
};

function getColor(tags: string[] | null): number {
  if (tags && tags[0] && GENRE_COLOR[tags[0]]) return GENRE_COLOR[tags[0]];
  return 0xd946ef; // brand magenta
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

/** Post a new story seed to the #new-stories Discord channel */
export async function postNewStoryToDiscord(story: StoryPayload): Promise<void> {
  if (!WEBHOOK_NEW) return;

  const url = `${SITE_URL}/story/${story.slug || story.id}`;
  const genreIcons = story.tags?.length
    ? story.tags.map((t) => `\`${t}\``).join(" ")
    : "";

  const embed: Record<string, unknown> = {
    title: truncate(story.title || "New Branch", 256),
    url,
    description: truncate(story.content, 300),
    color: getColor(story.tags),
    author: {
      name: story.author_name,
      url: `${SITE_URL}/author/${encodeURIComponent(story.author_name.toLowerCase().replace(/\s+/g, "-"))}`,
    },
    footer: {
      text: `MakeATale ${story.story_type === "seed" ? "Story Seed" : "Branch"}${genreIcons ? " \u2022 " + genreIcons : ""}`,
      icon_url: `${SITE_URL}/logos/icon-32.png`,
    },
    timestamp: new Date().toISOString(),
  };

  if (story.story_type === "seed" && story.tags?.length) {
    embed.thumbnail = {
      url: `${SITE_URL}/genres/${story.tags[0].toLowerCase().replace(/\s+/g, "-")}-128.png`,
    };
  }

  if (story.story_type === "branch" && story.teaser) {
    embed.fields = [
      { name: "Choice", value: truncate(story.teaser, 100), inline: false },
    ];
    if (story.parent_title) {
      embed.fields = [
        { name: "Branching from", value: truncate(story.parent_title, 100), inline: true },
        { name: "Choice", value: truncate(story.teaser, 100), inline: false },
      ];
    }
  }

  try {
    await fetch(WEBHOOK_NEW, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "MakeATale",
        avatar_url: `${SITE_URL}/logos/icon-128.png`,
        embeds: [embed],
      }),
    });
  } catch {
    // Non-critical — don't break story creation
  }
}

/** Post a trending digest to Discord */
export async function postTrendingDigest(
  stories: { title: string; slug: string; id: string; score: number; author_name: string; tags: string[] | null }[]
): Promise<void> {
  if (!WEBHOOK_TRENDING || stories.length === 0) return;

  const lines = stories.slice(0, 10).map((s, i) => {
    const medal = i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `**${i + 1}.**`;
    const url = `${SITE_URL}/story/${s.slug || s.id}`;
    const tags = s.tags?.length ? ` \u2022 ${s.tags.map((t) => `\`${t}\``).join(" ")}` : "";
    return `${medal} [${truncate(s.title || "Untitled", 60)}](${url}) by **${s.author_name}** (${s.score} votes)${tags}`;
  });

  try {
    await fetch(WEBHOOK_TRENDING, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "MakeATale",
        avatar_url: `${SITE_URL}/logos/icon-128.png`,
        embeds: [
          {
            title: "\u{1F525} Trending Stories This Week",
            description: lines.join("\n\n"),
            color: 0xd946ef,
            footer: {
              text: "MakeATale \u2022 makeatale.com",
              icon_url: `${SITE_URL}/logos/icon-32.png`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {}
}
