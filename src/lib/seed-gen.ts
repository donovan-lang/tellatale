import { callGemini, parseGeminiJSON } from "./gemini";
import { buildGenreCraftBlock } from "./genre-craft";
import { formatParagraphs } from "./utils";

// Shared seed generation: used by /api/generate-tale (people) and /api/cron/auto-seed (TaleBot).

export const VALID_TAGS = [
  "Fantasy", "Sci-Fi", "Horror", "Mystery", "Romance", "Adventure",
  "Thriller", "Comedy", "Drama", "Surreal", "Historical", "Dystopia",
  "Steampunk", "Cyberpunk", "Mythology", "Noir", "Gothic",
  "Cosmic Horror", "Slice-of-Life", "Alternate History",
];

export const TONES = [
  "dark",
  "lighthearted",
  "humorous",
  "epic",
  "mysterious",
  "romantic",
  "tense",
  "whimsical",
  "gritty",
  "dreamlike",
] as const;

export type Tone = (typeof TONES)[number];

const SYSTEM_PROMPT = `You are the tale generation engine for MakeATale, a collaborative choose-your-own-adventure platform. Your job is to create compelling story seeds that hook readers and invite branching.

Rules:
- Generate a story seed: an opening that sets a scene, introduces tension, and ends with a clear question, choice, or cliffhanger that begs for multiple continuations.
- The content must be 400-800 words. Rich enough to establish world/character/conflict, short enough to leave room for the community to branch.
- End with a moment of decision — a fork in the road. Make it obvious there are multiple paths forward.
- Match the requested genre and tone precisely.
- Write in second person ("you") OR third person — pick whichever fits the genre better.
- No meta-commentary, no author notes, no "what do you do?" prompts. Just end at the decision point naturally.
- Be vivid, atmospheric, and specific. No generic fantasy/sci-fi cliches unless the user asks for them.
- Format for easy reading: short paragraphs of 1-4 sentences separated by a blank line (a "\\n\\n" escape in the JSON string). Every line of dialogue starts its own paragraph. Never return one unbroken block of text.

Respond in EXACTLY this JSON format (no markdown fences, no extra text):
{"title":"Story Title Here","content":"The full story seed text here...","tags":["Genre1","Genre2"]}

The tags array should contain 1-3 genre tags from this list ONLY: Fantasy, Sci-Fi, Horror, Mystery, Romance, Adventure, Thriller, Comedy, Drama, Surreal, Historical, Dystopia, Steampunk, Cyberpunk, Mythology, Noir, Gothic, Cosmic Horror, Slice-of-Life, Alternate History.`;

const SEED_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    content: { type: "STRING" },
    tags: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "content", "tags"],
};

export interface GeneratedSeed {
  title: string;
  content: string;
  tags: string[];
}

/** Thrown when the model answered but the result was unusable; message is safe to show. */
export class SeedGenError extends Error {}

/**
 * Generates a story seed from an idea. Provider errors propagate as-is; unparseable or
 * incomplete output throws SeedGenError. Output is trimmed and tags filtered to VALID_TAGS.
 */
export async function generateSeed(input: { idea: string; genre?: string; tone?: string }): Promise<GeneratedSeed> {
  let userPrompt = `Generate a story seed based on this idea:\n\n"${input.idea.trim()}"`;
  if (input.genre) userPrompt += `\n\nGenre: ${input.genre}`;
  if (input.tone && (TONES as readonly string[]).includes(input.tone)) userPrompt += `\nTone: ${input.tone}`;
  userPrompt += "\n\nRemember: respond with ONLY the JSON object, no markdown fences.";

  // Anchor the model to a concrete genre voice/style sample rather than
  // relying on the generic rules alone.
  const genreCraft = input.genre && VALID_TAGS.includes(input.genre) ? buildGenreCraftBlock(input.genre) : "";

  const raw = await callGemini({
    systemPrompt: SYSTEM_PROMPT + genreCraft,
    userPrompt,
    temperature: 0.9,
    maxOutputTokens: 2048,
    responseSchema: SEED_SCHEMA,
  });

  let parsed: { title?: string; content?: string; tags?: string[] };
  try {
    parsed = parseGeminiJSON(raw);
  } catch {
    throw new SeedGenError("Failed to parse AI response");
  }
  if (!parsed.title || !parsed.content) throw new SeedGenError("AI generated an incomplete story");

  return {
    title: parsed.title.slice(0, 200),
    content: formatParagraphs(parsed.content).slice(0, 3000),
    tags: (parsed.tags || []).filter((t) => VALID_TAGS.includes(t)).slice(0, 3),
  };
}

/**
 * Comes up with a fresh one-sentence story idea for TaleBot's daily seeds, in the style a
 * person would type into the Generate tab. `avoidTitles` are recent seeds not to echo.
 */
export async function generateSeedIdea(input: { genre: string; tone: string; avoidTitles: string[] }): Promise<string> {
  const raw = await callGemini({
    systemPrompt:
      "You pitch premises for an interactive-fiction site. Write ONE specific, surprising story idea in 1-2 sentences " +
      "(under 300 characters): a named protagonist, a concrete situation, and a hook with built-in tension. " +
      "Avoid stock openings (chosen ones, waking with amnesia, mysterious strangers) and anything resembling the titles you're told to avoid.",
    userPrompt:
      `Genre: ${input.genre}\nTone: ${input.tone}\n` +
      (input.avoidTitles.length ? `\nRecent stories on the site (don't repeat their premises):\n${input.avoidTitles.map((t) => `- ${t}`).join("\n")}\n` : ""),
    temperature: 1.0,
    maxOutputTokens: 400,
    responseSchema: { type: "OBJECT", properties: { idea: { type: "STRING" } }, required: ["idea"] },
  });
  const idea = parseGeminiJSON<{ idea?: string }>(raw).idea?.trim();
  if (!idea) throw new SeedGenError("AI generated an empty idea");
  return idea.slice(0, 500);
}
