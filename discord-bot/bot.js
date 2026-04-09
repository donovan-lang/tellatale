/**
 * MakeATale Discord Bot
 *
 * Slash commands:
 *   /story <id>     — Show a story embed
 *   /random         — Random story
 *   /trending       — Top 5 trending stories
 *   /generate <idea> — Generate a tale via the API
 *   /latest         — 5 most recent stories
 *
 * Setup:
 *   1. Create app at https://discord.com/developers/applications
 *   2. Bot tab → create bot, copy token
 *   3. OAuth2 → URL Generator → scopes: bot, applications.commands → permissions: Send Messages, Embed Links
 *   4. Invite bot to server with generated URL
 *   5. Set env vars: DISCORD_BOT_TOKEN, MAKEATALE_API_URL
 *   6. Run: node discord-bot/bot.js
 *   7. First run registers commands globally (takes ~1hr to propagate)
 *
 * PM2: pm2 start discord-bot/bot.js --name makeatale-bot
 */

const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const API = process.env.MAKEATALE_API_URL || "https://makeatale.com/api/v1";
const SITE = "https://makeatale.com";

if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN not set");
  process.exit(1);
}

// ── Slash command definitions ─────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName("story")
    .setDescription("Show a story from MakeATale")
    .addStringOption((opt) =>
      opt.setName("id").setDescription("Story ID or slug").setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("genre")
        .setDescription("Filter by genre")
        .setRequired(false)
        .addChoices(
          { name: "Fantasy", value: "Fantasy" },
          { name: "Sci-Fi", value: "Sci-Fi" },
          { name: "Horror", value: "Horror" },
          { name: "Mystery", value: "Mystery" }
        )
    ),
  new SlashCommandBuilder()
    .setName("random")
    .setDescription("Get a random story from MakeATale"),
  new SlashCommandBuilder()
    .setName("trending")
    .setDescription("Top 5 trending stories right now"),
  new SlashCommandBuilder()
    .setName("latest")
    .setDescription("5 most recently planted stories"),
  new SlashCommandBuilder()
    .setName("generate")
    .setDescription("Generate a story idea (shows a link to the generator)")
    .addStringOption((opt) =>
      opt.setName("idea").setDescription("Your story idea").setRequired(true)
    ),
].map((cmd) => cmd.toJSON());

// ── Register commands ─────────────────────────────────────────────
async function registerCommands() {
  const rest = new REST().setToken(TOKEN);
  const app = await rest.get(Routes.oauth2CurrentApplication());
  console.log(`Registering ${commands.length} commands for ${app.name}...`);
  await rest.put(Routes.applicationCommands(app.id), { body: commands });
  console.log("Commands registered.");
}

// ── Helpers ───────────────────────────────────────────────────────
const GENRE_COLOR = {
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

function storyEmbed(story) {
  const url = `${SITE}/story/${story.slug || story.id}`;
  const color = (story.tags?.[0] && GENRE_COLOR[story.tags[0]]) || 0xd946ef;
  const score = (story.upvotes || 0) - (story.downvotes || 0);

  const embed = new EmbedBuilder()
    .setTitle((story.title || story.teaser || "Untitled").slice(0, 256))
    .setURL(url)
    .setDescription(story.content.slice(0, 300) + (story.content.length > 300 ? "\u2026" : ""))
    .setColor(color)
    .setAuthor({ name: story.author_name })
    .setFooter({
      text: `${score} votes \u2022 depth ${story.depth || 0}${story.tags?.length ? " \u2022 " + story.tags.join(", ") : ""}`,
      iconURL: `${SITE}/logos/icon-32.png`,
    })
    .setTimestamp(new Date(story.created_at));

  if (story.tags?.[0]) {
    const slug = story.tags[0].toLowerCase().replace(/\s+/g, "-");
    embed.setThumbnail(`${SITE}/genres/${slug}-128.png`);
  }

  return embed;
}

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) return null;
  return res.json();
}

// ── Bot client ────────────────────────────────────────────────────
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", () => {
  console.log(`Bot online as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === "story") {
      await interaction.deferReply();
      const id = interaction.options.getString("id");
      const genre = interaction.options.getString("genre") || "Fantasy";

      // If ID provided, fetch specific story
      if (id) {
        const data = await apiFetch(`/stories/${id}`);
        if (!data?.story) {
          return interaction.editReply("Story not found.");
        }
        return interaction.editReply({ embeds: [storyEmbed(data.story)] });
      }

      // Otherwise, fetch random story of selected genre
      const data = await apiFetch(`/stories?story_type=seed&per_page=50&sort=popular`);
      if (!data?.data?.length) {
        return interaction.editReply("No stories found.");
      }

      // Filter by genre (based on tags)
      const genreStories = data.data.filter((s) => s.tags?.[0] === genre);
      const candidates = genreStories.length > 0 ? genreStories : data.data;
      const story = candidates[Math.floor(Math.random() * candidates.length)];

      return interaction.editReply({ embeds: [storyEmbed(story)] });
    }

    if (commandName === "random") {
      await interaction.deferReply();
      const data = await apiFetch("/stories?story_type=seed&per_page=50&sort=popular");
      if (!data?.data?.length) {
        return interaction.editReply("No stories found.");
      }
      const story = data.data[Math.floor(Math.random() * data.data.length)];
      return interaction.editReply({ embeds: [storyEmbed(story)] });
    }

    if (commandName === "trending") {
      await interaction.deferReply();
      const data = await apiFetch("/stories?story_type=seed&per_page=5&sort=popular");
      if (!data?.data?.length) {
        return interaction.editReply("No trending stories.");
      }
      const embeds = data.data.map((s) => storyEmbed(s));
      return interaction.editReply({
        content: "**\u{1F525} Trending on MakeATale**",
        embeds: embeds.slice(0, 5),
      });
    }

    if (commandName === "latest") {
      await interaction.deferReply();
      const data = await apiFetch("/stories?story_type=seed&per_page=5&sort=recent");
      if (!data?.data?.length) {
        return interaction.editReply("No stories yet.");
      }
      const embeds = data.data.map((s) => storyEmbed(s));
      return interaction.editReply({
        content: "**\u2728 Latest Stories on MakeATale**",
        embeds: embeds.slice(0, 5),
      });
    }

    if (commandName === "generate") {
      const idea = interaction.options.getString("idea");
      const encoded = encodeURIComponent(idea);
      return interaction.reply({
        content: `**\u2728 Story Idea:** "${idea}"\n\nGenerate this tale on MakeATale:\n${SITE}/submit\n\n*Go to the "Generate with AI" tab and paste your idea!*`,
      });
    }
  } catch (err) {
    console.error("Command error:", err);
    const reply = interaction.deferred ? interaction.editReply : interaction.reply;
    reply.call(interaction, "Something went wrong. Try again.").catch(() => {});
  }
});

// ── Start ─────────────────────────────────────────────────────────
(async () => {
  await registerCommands();
  await client.login(TOKEN);
})();
