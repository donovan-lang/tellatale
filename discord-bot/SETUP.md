# MakeATale Discord Setup

## 1. Create the Discord Server

Create a new server called **MakeATale** and set up these channels:

### Categories & Channels
```
WELCOME
  #welcome          — Rules, about the platform, links
  #introductions    — New members introduce themselves

STORIES
  #new-stories      — Auto-posts when stories are planted (webhook)
  #trending         — Weekly trending digest (webhook)
  #share-your-story — Members share links to their stories
  #writing-prompts  — Daily prompts (bot posts)

COMMUNITY
  #general          — General chat
  #feedback         — Site feedback and suggestions
  #bug-reports      — Bug reports

DEVELOPERS
  #bot-showcase     — Show off your MakeATale bots
  #api-help         — Help with the API
```

### Roles
- **@Admin** — Server owner
- **@Moderator** — Channel moderation
- **@Writer** — Has written at least 1 story (can be auto-assigned by bot later)
- **@Bot Developer** — Using the MakeATale API
- **@MakeATale Bot** — The bot role

## 2. Create Webhooks

Go to each channel → Settings → Integrations → Webhooks:

1. **#new-stories** — Create webhook, copy URL → set as `DISCORD_WEBHOOK_NEW_STORIES` env var
2. **#trending** — Create webhook, copy URL → set as `DISCORD_WEBHOOK_TRENDING` env var

## 3. Create the Bot Application

1. Go to https://discord.com/developers/applications
2. Click "New Application" → name it "MakeATale"
3. Go to **Bot** tab:
   - Click "Reset Token" → copy the token
   - Enable "Message Content Intent" under Privileged Gateway Intents
4. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
   - Copy the generated URL and open it to invite the bot to your server

## 4. Set Environment Variables

### On the droplet (.env.local):
```bash
# Discord webhooks
DISCORD_WEBHOOK_NEW_STORIES=https://discord.com/api/webhooks/XXXX/YYYY
DISCORD_WEBHOOK_TRENDING=https://discord.com/api/webhooks/XXXX/YYYY

# Discord bot
DISCORD_BOT_TOKEN=your_bot_token_here

# Discord invite (shown on site)
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/your-invite-code

# Cron secret for digest endpoint
CRON_SECRET=some_random_secret_here
```

## 5. Deploy the Bot

On the server:
```bash
cd /var/www/makeatale

# Install discord.js on server
npm install discord.js

# Start the bot with PM2
pm2 start discord-bot/bot.js --name makeatale-bot \
  --env DISCORD_BOT_TOKEN=your_token \
  --env MAKEATALE_API_URL=https://makeatale.com/api/v1

pm2 save
```

## 6. Set Up the Trending Digest Cron

```bash
# Post trending digest every Monday at 9am CST
crontab -e
# Add:
0 15 * * 1 curl -s -X POST https://makeatale.com/api/cron/discord-digest -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 7. Rebuild the Site

```bash
cd /var/www/makeatale
npm run build
pm2 restart makeatale
```

## Bot Slash Commands

| Command | Description |
|---------|-------------|
| `/story <id>` | Show a story embed with votes, genre, link |
| `/random` | Random story from the platform |
| `/trending` | Top 5 trending stories |
| `/latest` | 5 most recent stories |
| `/generate <idea>` | Link to generate a tale from an idea |

## What Happens Automatically

- **New story posted on site** → embed appears in #new-stories
- **New branch posted** → embed appears in #new-stories (shows parent + choice)
- **Monday 9am CST** → trending digest in #trending
- **Bot slash commands** → work in any channel
