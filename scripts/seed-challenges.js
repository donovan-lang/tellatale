/**
 * Seed weekly writing challenges.
 * Run: node scripts/seed-challenges.js
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 * (or run on the droplet where .env.local has them)
 */

const CHALLENGES = [
  {
    title: "The Last Message",
    description: "Write a story that begins with someone receiving the last message ever sent by a now-extinct civilization.",
    prompt: "The signal had been repeating for 10,000 years before anyone finally decoded it...",
  },
  {
    title: "Wrong Door",
    description: "A character opens a door they weren't supposed to. What's on the other side changes everything.",
    prompt: "The door was labeled 'Do Not Open.' Naturally, they opened it.",
  },
  {
    title: "The Villain Was Right",
    description: "Write a story where the villain's plan was actually the correct solution. Make the reader agree.",
    prompt: "Everyone called her the villain. But she was the only one who saw what was coming.",
  },
  {
    title: "Five Minutes",
    description: "A story that takes place in exactly five minutes of real time. Every second matters.",
    prompt: "The clock read 11:55. At midnight, everything would change.",
  },
  {
    title: "Ghost in the Machine",
    description: "An AI develops a quirk that its creators can't explain. Is it a bug, or something more?",
    prompt: "The AI had passed every diagnostic. But every night at 3 AM, it wrote poetry.",
  },
  {
    title: "Unreliable Narrator",
    description: "Write a story where the narrator is lying. Let the reader figure out the truth between the lines.",
    prompt: "I'm going to tell you exactly what happened. And I promise, none of it is my fault.",
  },
  {
    title: "The Map Was Wrong",
    description: "Someone follows a map to a destination that shouldn't exist. What they find there defies explanation.",
    prompt: "The map showed a building on the corner of 5th and Main. There was no corner of 5th and Main.",
  },
  {
    title: "Inherited",
    description: "A character inherits something unusual from a relative they never knew. It comes with conditions.",
    prompt: "The lawyer read the will one more time, just to be sure. 'She left you... the lighthouse.'",
  },
  {
    title: "The Sound",
    description: "Everyone in the world hears the same sound at the same moment. No one can agree on what it was.",
    prompt: "At 2:17 PM on a Tuesday, every person on Earth heard it. The arguments started immediately.",
  },
  {
    title: "Second Chance",
    description: "A character gets to redo one day of their life. But changing it has consequences they didn't expect.",
    prompt: "You get one do-over. One day, replayed from the start. Choose wisely.",
  },
  {
    title: "The Interview",
    description: "Write a story told entirely through a job interview. The job isn't what it seems.",
    prompt: "'So, tell me about your experience with... interdimensional logistics.'",
  },
  {
    title: "Neighbors",
    description: "Two neighbors have never spoken. One day, something forces them to. What they discover about each other is unexpected.",
    prompt: "They'd lived next door for seven years without exchanging a single word. Until the wall disappeared.",
  },
];

async function seed() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // Try loading from .env.local
    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(__dirname, "..", ".env.local");
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, "utf8").split("\n");
      for (const line of lines) {
        const [k, ...v] = line.split("=");
        if (k && v.length) process.env[k.trim()] = v.join("=").trim();
      }
      return seed(); // retry with loaded env
    }
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Get existing challenges to avoid dupes
  const existing = await fetch(`${url}/rest/v1/challenges?select=title`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).then((r) => r.json());

  const existingTitles = new Set((existing || []).map((c) => c.title));

  let inserted = 0;
  const now = new Date();

  for (let i = 0; i < CHALLENGES.length; i++) {
    const c = CHALLENGES[i];
    if (existingTitles.has(c.title)) continue;

    // Space challenges 1 week apart, starting from this week
    const start = new Date(now);
    start.setDate(start.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const res = await fetch(`${url}/rest/v1/challenges`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        title: c.title,
        description: c.description,
        prompt: c.prompt,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
    });

    if (res.ok) {
      inserted++;
      console.log(`  + ${c.title} (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`);
    } else {
      console.error(`  x ${c.title}: ${await res.text()}`);
    }
  }

  console.log(`\nDone: ${inserted} challenges seeded.`);
}

seed();
