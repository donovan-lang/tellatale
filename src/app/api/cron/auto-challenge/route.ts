import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_NEW_STORIES;
const SITE_URL = "https://makeatale.com";

const SYSTEM_PROMPT = `Generate a creative writing challenge for MakeATale, a collaborative storytelling platform. The challenge should be fun, specific, and inspire branching narratives.

You MUST respond with valid JSON only. No markdown, no code fences, no explanation.`;

function buildChallengePrompt(): string {
  return `Create a unique weekly writing challenge for a collaborative choose-your-own-adventure storytelling platform.

Requirements:
- "title": A catchy challenge title, under 60 characters. Should feel like an event name.
- "description": 1-2 sentences describing the challenge theme and what makes it interesting.
- "prompt": The actual writing prompt, 1-3 sentences. Make it evocative and open-ended so writers can take it in many directions and create branching paths.

Avoid generic prompts. Be specific with settings, constraints, or twists that spark creativity. Think unusual genres, mashups, constraints (e.g. "no dialogue", "told in reverse"), or vivid scenario hooks.

Respond with ONLY this JSON (no markdown fences):
{
  "title": "...",
  "description": "...",
  "prompt": "..."
}`;
}

interface ChallengeOutput {
  title: string;
  description: string;
  prompt: string;
}

async function postChallengeToDiscord(challenge: {
  title: string;
  description: string;
  prompt: string;
  end_date: string;
}): Promise<void> {
  if (!WEBHOOK_URL) return;

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "MakeATale",
        avatar_url: `${SITE_URL}/logos/icon-128.png`,
        embeds: [
          {
            title: `\uD83C\uDFC6 New Challenge: ${challenge.title}`,
            url: `${SITE_URL}/challenges`,
            description: challenge.description,
            color: 0xf59e0b, // gold
            fields: [
              {
                name: "Writing Prompt",
                value: `*\u201C${challenge.prompt}\u201D*`,
                inline: false,
              },
              {
                name: "Deadline",
                value: `<t:${Math.floor(new Date(challenge.end_date).getTime() / 1000)}:R>`,
                inline: true,
              },
            ],
            footer: {
              text: "MakeATale \u2022 Weekly Writing Challenge",
              icon_url: `${SITE_URL}/logos/icon-32.png`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    // Non-critical — don't break challenge creation
  }
}

/**
 * POST /api/cron/auto-challenge
 * Generates a weekly writing challenge using Gemini AI.
 * Skips if an active challenge already exists (end_date > now).
 *
 * Cron: Every Monday at 8 AM CST (14:00 UTC)
 * 0 14 * * 1 curl -s -X POST https://makeatale.com/api/cron/auto-challenge -H "Authorization: Bearer CRON_SECRET"
 *
 * Requires: Authorization: Bearer CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!GEMINI_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 503 }
    );
  }

  const sb = createServiceClient();

  // Check if there's already an active challenge
  const { data: activeChallenge } = await sb
    .from("challenges")
    .select("id, title, end_date")
    .gt("end_date", new Date().toISOString())
    .order("end_date", { ascending: false })
    .limit(1)
    .single();

  if (activeChallenge) {
    return NextResponse.json({
      ok: true,
      skipped: "active challenge exists",
      active: {
        id: activeChallenge.id,
        title: activeChallenge.title,
        end_date: activeChallenge.end_date,
      },
    });
  }

  // Call Gemini to generate a challenge
  let challenge: ChallengeOutput;
  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            parts: [{ text: buildChallengePrompt() }],
          },
        ],
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", errText);
      return NextResponse.json(
        { error: "Gemini API failed", detail: errText },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Empty response from Gemini" },
        { status: 502 }
      );
    }

    challenge = JSON.parse(rawText);

    if (!challenge.title || !challenge.prompt) {
      return NextResponse.json(
        { error: "Invalid challenge structure from Gemini", raw: rawText },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Failed to generate challenge:", err);
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }

  // Insert into challenges table — 7 days from now
  const now = new Date();
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { error: insertError } = await sb.from("challenges").insert({
    title: challenge.title.slice(0, 60),
    description: challenge.description || null,
    prompt: challenge.prompt,
    end_date: endDate.toISOString(),
    created_at: now.toISOString(),
  });

  if (insertError) {
    console.error("Failed to insert challenge:", insertError.message);
    return NextResponse.json(
      { error: "Failed to save challenge", detail: insertError.message },
      { status: 500 }
    );
  }

  // Post to Discord (non-blocking)
  postChallengeToDiscord({
    title: challenge.title.slice(0, 60),
    description: challenge.description || "",
    prompt: challenge.prompt,
    end_date: endDate.toISOString(),
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    challenge: {
      title: challenge.title.slice(0, 60),
      prompt: challenge.prompt,
      end_date: endDate.toISOString(),
    },
  });
}
