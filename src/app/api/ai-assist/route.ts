import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are a creative writing assistant for MakeATale, a collaborative choose-your-own-adventure platform. Users write short story seeds (max 500 chars) that end with a question or choice, and the community branches them with 1-2 sentence responses.

Your job is to help writers improve their stories. Be concise, atmospheric, and genre-appropriate. Match the tone and style of the existing content. Never break character or add meta-commentary.`;

const ACTION_PROMPTS: Record<string, (content: string, title: string) => string> = {
  next_sentence: (content) =>
    `Continue this story with exactly ONE evocative sentence that raises tension or introduces a new element:\n\n"${content}"\n\nRespond with only the sentence, no quotes or explanation.`,

  directions: (content) =>
    `Given this story so far:\n\n"${content}"\n\nSuggest exactly 3 different directions this story could take. Each should be a single compelling sentence. Format as:\n1. ...\n2. ...\n3. ...`,

  grammar: (content) =>
    `Fix any grammar, spelling, and punctuation errors in this text. Preserve the author's voice and style. Return ONLY the corrected text, nothing else:\n\n"${content}"`,

  polish: (content) =>
    `Polish this creative writing for better flow, stronger word choices, and tighter prose. Keep the same meaning, length, and tone. Return ONLY the polished text:\n\n"${content}"`,

  shorten: (content) =>
    `Condense this text to about 70% of its length while keeping the core impact and atmosphere. Return ONLY the shortened text:\n\n"${content}"`,

  stronger_ending: (content) =>
    `Rewrite ONLY the final sentence of this text to be more impactful, surprising, or emotionally resonant. Return ONLY the new final sentence:\n\n"${content}"`,

  expand: (content) =>
    `Add 1-2 sentences of atmospheric detail or tension to continue this passage naturally. Return ONLY the new sentences to append:\n\n"${content}"`,
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
      { error: err.message },
      { status: 500 }
    );
  }
}
