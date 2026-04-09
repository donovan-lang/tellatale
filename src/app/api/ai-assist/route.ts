import { NextRequest, NextResponse } from "next/server";
import { useCredit } from "@/lib/credits";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are a skilled creative writing assistant for MakeATale, a collaborative choose-your-own-adventure platform.

Your job is to help writers improve their stories. Follow these principles:
- Match the EXACT tone, genre, and voice of the existing content
- Be vivid and specific — use concrete sensory details, not vague abstractions
- Avoid cliches ("a chill ran down her spine", "little did they know", "the air was thick with tension")
- Vary sentence structure — mix short punchy sentences with longer flowing ones
- Show don't tell — convey emotion through action and detail, not labels
- Never break character or add meta-commentary
- Write at a professional fiction level, not a generic AI level`;

const ACTION_PROMPTS: Record<string, (content: string, title: string) => string> = {
  next_sentence: (content) =>
    `Continue this story with exactly ONE sentence. The sentence should be vivid and specific — use a concrete image, action, or sensory detail that advances the plot or deepens the scene. Avoid generic statements. Match the existing tone precisely.\n\n"${content}"\n\nRespond with only the sentence, no quotes or explanation.`,

  directions: (content) =>
    `Given this story so far:\n\n"${content}"\n\nSuggest exactly 3 SURPRISING and specific directions this story could take. Don't suggest obvious next steps — think of unexpected twists, genre-appropriate complications, or character revelations. Each should be a vivid, concrete sentence. Format as:\n1. ...\n2. ...\n3. ...`,

  grammar: (content) =>
    `Fix any grammar, spelling, and punctuation errors in this text. Preserve the author's voice and style exactly. Return ONLY the corrected text, nothing else:\n\n"${content}"`,

  polish: (content) =>
    `Polish this creative writing. Replace weak verbs with strong ones. Cut unnecessary adverbs. Tighten flabby phrases. Replace cliches with fresh language. Improve rhythm by varying sentence lengths. Keep the same meaning, approximate length, and tone. Return ONLY the polished text:\n\n"${content}"`,

  shorten: (content) =>
    `Condense this text to about 70% of its length. Cut filler words, redundant descriptions, and anything that doesn't advance the story. Keep the strongest images and the core emotional beat. Return ONLY the shortened text:\n\n"${content}"`,

  stronger_ending: (content) =>
    `Rewrite ONLY the final sentence of this text. The new sentence should land with impact — a surprising image, an unanswered question, a visceral detail, or an emotional gut-punch. Avoid generic "dramatic" endings. Be specific to this story's world. Return ONLY the new final sentence:\n\n"${content}"`,

  expand: (content) =>
    `Add 1-2 sentences that enrich this passage with specific sensory detail — what does the character see, hear, smell, or feel? Ground the scene in concrete physical reality. Don't summarize or explain emotion — show it through action or detail. Return ONLY the new sentences to append:\n\n"${content}"`,

  generate_teaser: (content) =>
    `Write a compelling "choice line" for this story branch — the 1-2 sentences readers see BEFORE clicking, like a choose-your-own-adventure option. It should be intriguing, slightly mysterious, and make the reader want to choose this path. Hint at what happens without spoiling it. Use a directive or present-tense voice (e.g. "Follow the stranger into the alley" or "She opens the letter and reads the truth").\n\nBranch content:\n"${content}"\n\nRespond with only the choice line (1-2 sentences), no quotes, no explanation.`,
};

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_KEY) {
      return NextResponse.json(
        { error: "AI assist not configured" },
        { status: 503 }
      );
    }

    const { action, content, title } = await req.json();

    // Credit gate (check after parsing body so we know the action for logging)
    const credit = await useCredit(req, "ai-assist", action);
    if (!credit.allowed) {
      return NextResponse.json(
        { error: credit.reason, credits_remaining: 0 },
        { status: 402 }
      );
    }

    if (!action || !content?.trim()) {
      return NextResponse.json(
        { error: "action and content required" },
        { status: 400 }
      );
    }

    const promptFn = ACTION_PROMPTS[action];
    if (!promptFn) {
      return NextResponse.json(
        { error: "Unknown action" },
        { status: 400 }
      );
    }

    const userPrompt = promptFn(content.trim(), title?.trim() || "");

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: action === "grammar" ? 0.1 : 0.8,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini error:", err);
      return NextResponse.json(
        { error: "AI service error" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!text) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("AI assist error:", err);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
