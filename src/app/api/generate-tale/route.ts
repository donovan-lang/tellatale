import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const TONES = [
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

const SYSTEM_PROMPT = `You are the tale generation engine for MakeATale, a collaborative choose-your-own-adventure platform. Your job is to create compelling story seeds that hook readers and invite branching.

Rules:
- Generate a story seed: an opening that sets a scene, introduces tension, and ends with a clear question, choice, or cliffhanger that begs for multiple continuations.
- The content must be 400-800 words. Rich enough to establish world/character/conflict, short enough to leave room for the community to branch.
- End with a moment of decision — a fork in the road. Make it obvious there are multiple paths forward.
- Match the requested genre and tone precisely.
- Write in second person ("you") OR third person — pick whichever fits the genre better.
- No meta-commentary, no author notes, no "what do you do?" prompts. Just end at the decision point naturally.
- Be vivid, atmospheric, and specific. No generic fantasy/sci-fi cliches unless the user asks for them.

Respond in EXACTLY this JSON format (no markdown fences, no extra text):
{"title":"Story Title Here","content":"The full story seed text here...","tags":["Genre1","Genre2"]}

The tags array should contain 1-3 genre tags from this list ONLY: Fantasy, Sci-Fi, Horror, Mystery, Romance, Adventure, Thriller, Comedy, Drama, Surreal, Historical, Dystopia, Steampunk, Cyberpunk, Mythology, Noir, Gothic, Cosmic Horror, Slice-of-Life, Alternate History.`;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_KEY) {
      return NextResponse.json(
        { error: "AI not configured" },
        { status: 503 }
      );
    }

    const { prompt, genre, tone } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "A story idea is required" },
        { status: 400 }
      );
    }

    if (prompt.trim().length > 500) {
      return NextResponse.json(
        { error: "Story idea must be 500 characters or fewer" },
        { status: 400 }
      );
    }

    // Build the generation prompt
    let userPrompt = `Generate a story seed based on this idea:\n\n"${prompt.trim()}"`;

    if (genre) {
      userPrompt += `\n\nGenre: ${genre}`;
    }

    if (tone && TONES.includes(tone)) {
      userPrompt += `\nTone: ${tone}`;
    }

    userPrompt +=
      "\n\nRemember: respond with ONLY the JSON object, no markdown fences.";

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
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
    const raw =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!raw) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 502 }
      );
    }

    // Parse JSON from response (strip markdown fences if present)
    let parsed: { title: string; content: string; tags: string[] };
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 502 }
      );
    }

    // Validate
    if (!parsed.title || !parsed.content) {
      return NextResponse.json(
        { error: "AI generated an incomplete story" },
        { status: 502 }
      );
    }

    // Enforce limits
    const VALID_TAGS = [
      "Fantasy", "Sci-Fi", "Horror", "Mystery", "Romance", "Adventure",
      "Thriller", "Comedy", "Drama", "Surreal", "Historical", "Dystopia",
      "Steampunk", "Cyberpunk", "Mythology", "Noir", "Gothic",
      "Cosmic Horror", "Slice-of-Life", "Alternate History",
    ];

    return NextResponse.json({
      title: parsed.title.slice(0, 200),
      content: parsed.content.slice(0, 3000),
      tags: (parsed.tags || []).filter((t: string) => VALID_TAGS.includes(t)).slice(0, 3),
    });
  } catch (err: any) {
    console.error("Generate tale error:", err);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
