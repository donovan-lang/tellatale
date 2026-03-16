/**
 * MakeATale Discord Agent — Autonomous content curator
 *
 * Runs alongside bot.js. Proactively:
 *   - Posts a "Story of the Day" spotlight every morning
 *   - Shares daily writing prompts
 *   - Highlights stories that need branches (orphans)
 *   - Posts weekly stats recap
 *   - Engages with stories that are gaining traction
 *
 * Writes status to makeatale_agent_status.json for Command HQ dashboard
 *
 * PM2: pm2 start discord-bot/agent.js --name makeatale-agent
 */

const fs = require("fs");
const path = require("path");

const API = process.env.MAKEATALE_API_URL || "https://makeatale.com/api/v1";
const SITE = "https://makeatale.com";
const WH_STORIES = process.env.DISCORD_WEBHOOK_NEW_STORIES;
const WH_TRENDING = process.env.DISCORD_WEBHOOK_TRENDING;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || "1483185775100035093";
const STATUS_FILE = process.env.AGENT_STATUS_FILE ||
  path.join(__dirname, "agent_status.json");

// Channel IDs
const CHANNELS = {
  newStories: "1483188784156774440",
  trending: "1483188785759129701",
  prompts: "1483188788581761147",
  general: "1483188790276391084",
};

const GENRE_COLOR = {
  Fantasy: 0x9333ea, "Sci-Fi": 0x3b82f6, Horror: 0xef4444,
  Mystery: 0xf59e0b, Romance: 0xec4899, Adventure: 0x10b981,
  Thriller: 0xf97316, Comedy: 0xeab308, Drama: 0x6366f1,
  Surreal: 0x8b5cf6, Historical: 0x78716c, Dystopia: 0x64748b,
};

// ── State ────────────────────────────────────────────────────────
let state = {
  lastSpotlight: null,
  lastPrompt: null,
  lastOrphans: null,
  lastStats: null,
  storiesPosted: 0,
  promptsPosted: 0,
  orphanAlerts: 0,
  errors: 0,
  startedAt: new Date().toISOString(),
};

// ── Helpers ──────────────────────────────────────────────────────
async function apiFetch(path) {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function postToChannel(channelId, payload) {
  try {
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch { return false; }
}

async function postWebhook(webhookUrl, payload) {
  if (!webhookUrl) return false;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "MakeATale",
        avatar_url: `${SITE}/logos/icon-128.png`,
        ...payload,
      }),
    });
    return true;
  } catch { return false; }
}

function truncate(s, n) { return s && s.length > n ? s.slice(0, n - 1) + "\u2026" : s || ""; }

function writeStatus(task) {
  const status = {
    name: "MakeATale Discord Agent",
    status: "running",
    current_task: task,
    last_update: new Date().toISOString(),
    started_at: state.startedAt,
    guild_id: GUILD_ID,
    invite: "https://discord.gg/TJn25WNRVv",
    metrics: {
      stories_spotlighted: state.storiesPosted,
      prompts_posted: state.promptsPosted,
      orphan_alerts: state.orphanAlerts,
      errors: state.errors,
    },
    schedule: {
      spotlight: state.lastSpotlight,
      prompt: state.lastPrompt,
      orphans: state.lastOrphans,
      stats: state.lastStats,
    },
    website: {
      url: SITE,
      api: API,
      status: "linked",
    },
  };

  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (e) {
    // If running on server, write locally instead
    try {
      fs.writeFileSync(path.join(__dirname, "agent_status.json"), JSON.stringify(status, null, 2));
    } catch {}
  }
}

// ── Tasks ────────────────────────────────────────────────────────

/** Post Story of the Day — the top-voted story from the last 24h */
async function storyOfTheDay() {
  writeStatus("Selecting Story of the Day");
  const data = await apiFetch("/stories?sort=popular&story_type=seed&per_page=10");
  if (!data?.data?.length) return;

  // Pick the top story
  const story = data.data[0];
  const url = `${SITE}/story/${story.slug || story.id}`;
  const color = (story.tags?.[0] && GENRE_COLOR[story.tags[0]]) || 0xd946ef;
  const score = (story.upvotes || 0) - (story.downvotes || 0);

  const ok = await postToChannel(CHANNELS.general, {
    embeds: [{
      title: `\u2b50 Story of the Day: ${truncate(story.title || "Untitled", 200)}`,
      url,
      description: truncate(story.content, 400),
      color,
      author: { name: story.author_name },
      fields: [
        { name: "Votes", value: `${score}`, inline: true },
        { name: "Branches", value: `${story.children_count || 0}`, inline: true },
        { name: "Genre", value: story.tags?.join(", ") || "General", inline: true },
      ],
      thumbnail: story.tags?.[0]
        ? { url: `${SITE}/genres/${story.tags[0].toLowerCase().replace(/\s+/g, "-")}-128.png` }
        : undefined,
      footer: { text: "MakeATale \u2022 Story of the Day", icon_url: `${SITE}/logos/icon-32.png` },
      timestamp: new Date().toISOString(),
    }],
  });

  if (ok) {
    state.storiesPosted++;
    state.lastSpotlight = new Date().toISOString();
  }
}

/** Post a writing prompt */
async function writingPrompt() {
  writeStatus("Generating writing prompt");

  const prompts = [
    "A stranger knocks on your door at 3 AM and says your name before you introduce yourself.",
    "You discover the last email ever sent. What does it say?",
    "The AI that runs the city goes silent for exactly 7 minutes. When it comes back, everything is different.",
    "Write a story where the villain wins, but the reader is glad they did.",
    "A lighthouse keeper notices the light is attracting something from the deep.",
    "The world's last bookstore is closing. What story does the owner tell?",
    "You inherit a house with a room that doesn't appear on any blueprint.",
    "Two astronauts discover that Mars was already inhabited \u2014 by something that remembers Earth.",
    "A musician plays a chord that makes everyone in the room remember their first love.",
    "The trees start walking south. Nobody knows why, but everyone follows.",
    "You find a phone on the bus. It has tomorrow's news on it.",
    "A detective in 2090 investigates a crime committed with a technology that no longer exists.",
    "Write a love story where the characters never meet.",
    "The last human translator in a world of AI gets one final assignment.",
    "Every mirror in the city starts showing a different version of reality.",
    "A child's imaginary friend turns out to be real \u2014 and in trouble.",
    "You're hired to write the history of a country that doesn't exist yet.",
    "The rain hasn't stopped in 40 days. Today, someone walks out of the ocean.",
    "A letter arrives 200 years late. It changes everything.",
    "You wake up and everyone remembers a version of you that you don't recognize.",
  ];

  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  const ok = await postToChannel(CHANNELS.prompts, {
    embeds: [{
      title: "\u{1f4dd} Daily Writing Prompt",
      description: `> *${prompt}*\n\n**Think you can turn this into a story?**\nHead to [MakeATale](${SITE}/submit) and plant your seed!`,
      color: 0xd946ef,
      footer: { text: "MakeATale \u2022 Write, branch, grow", icon_url: `${SITE}/logos/icon-32.png` },
      timestamp: new Date().toISOString(),
    }],
  });

  if (ok) {
    state.promptsPosted++;
    state.lastPrompt = new Date().toISOString();
  }
}

/** Find stories that need branches (have votes but 0 branches) */
async function orphanStories() {
  writeStatus("Finding stories that need branches");
  const data = await apiFetch("/stories?sort=popular&story_type=seed&per_page=50");
  if (!data?.data?.length) return;

  // Find stories with votes but no branches
  const orphans = data.data.filter(
    (s) => (s.upvotes - s.downvotes) >= 2 && (s.children_count || 0) === 0
  ).slice(0, 3);

  if (orphans.length === 0) return;

  const lines = orphans.map((s) => {
    const url = `${SITE}/story/${s.slug || s.id}`;
    const score = s.upvotes - s.downvotes;
    return `\u{1f331} [**${truncate(s.title || "Untitled", 60)}**](${url}) by ${s.author_name} \u2022 ${score} votes, **0 branches**`;
  });

  const ok = await postToChannel(CHANNELS.general, {
    embeds: [{
      title: "\u{1f6a8} Stories Waiting for Branches",
      description: `These stories have votes but nobody has continued them yet!\n\n${lines.join("\n\n")}\n\n**Be the first to decide what happens next \u2192** [Browse Stories](${SITE}/stories)`,
      color: 0xf59e0b,
      footer: { text: "MakeATale \u2022 Every story deserves a continuation", icon_url: `${SITE}/logos/icon-32.png` },
    }],
  });

  if (ok) {
    state.orphanAlerts++;
    state.lastOrphans = new Date().toISOString();
  }
}

/** Weekly platform stats */
async function weeklyStats() {
  writeStatus("Compiling weekly stats");

  const recent = await apiFetch("/stories?sort=recent&per_page=100&story_type=seed");
  const branches = await apiFetch("/stories?sort=recent&per_page=100&story_type=branch");
  const popular = await apiFetch("/stories?sort=popular&per_page=1&story_type=seed");

  const seedCount = recent?.pagination?.total || 0;
  const branchCount = branches?.pagination?.total || 0;
  const topStory = popular?.data?.[0];

  const ok = await postToChannel(CHANNELS.general, {
    embeds: [{
      title: "\u{1f4ca} Weekly MakeATale Recap",
      description: [
        `**${seedCount}** story seeds planted`,
        `**${branchCount}** branches grown`,
        topStory ? `\u{1f3c6} **Top Story:** [${truncate(topStory.title || "Untitled", 50)}](${SITE}/story/${topStory.slug || topStory.id}) by ${topStory.author_name} (${topStory.upvotes - topStory.downvotes} votes)` : "",
        "",
        `**Join the community \u2192** [makeatale.com](${SITE})`,
      ].filter(Boolean).join("\n"),
      color: 0xd946ef,
      footer: { text: "MakeATale \u2022 Weekly Recap", icon_url: `${SITE}/logos/icon-32.png` },
      timestamp: new Date().toISOString(),
    }],
  });

  if (ok) state.lastStats = new Date().toISOString();
}

// ── Scheduler ────────────────────────────────────────────────────
function hourOfDay() { return new Date().getUTCHours(); }
function dayOfWeek() { return new Date().getUTCDay(); }

let lastRunHour = -1;
let lastRunDay = -1;

async function tick() {
  const h = hourOfDay();
  const d = dayOfWeek();

  // Only run each task once per scheduled time
  if (h === lastRunHour) return;

  try {
    // 14:00 UTC (9 AM CST) — Story of the Day
    if (h === 14 && lastRunHour < 14) {
      await storyOfTheDay();
    }

    // 15:00 UTC (10 AM CST) — Writing Prompt
    if (h === 15 && lastRunHour < 15) {
      await writingPrompt();
    }

    // 18:00 UTC (1 PM CST) — Orphan stories (Tue/Thu/Sat)
    if (h === 18 && [2, 4, 6].includes(d) && lastRunHour < 18) {
      await orphanStories();
    }

    // 16:00 UTC Monday (11 AM CST) — Weekly stats
    if (h === 16 && d === 1 && lastRunHour < 16) {
      await weeklyStats();
    }

    lastRunHour = h;
    if (d !== lastRunDay) lastRunDay = d;
  } catch (e) {
    state.errors++;
    console.error("Agent tick error:", e.message);
  }

  writeStatus("Idle — waiting for next scheduled task");
}

// ── Main ─────────────────────────────────────────────────────────
console.log("MakeATale Discord Agent starting...");
console.log(`API: ${API}`);
console.log(`Status file: ${STATUS_FILE}`);

writeStatus("Starting up");

// Run tick every 5 minutes
setInterval(tick, 5 * 60 * 1000);

// Run once immediately
tick();

// Keep alive
process.on("SIGINT", () => {
  writeStatus("Shutting down");
  process.exit(0);
});
