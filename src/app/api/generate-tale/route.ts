import { NextRequest, NextResponse } from "next/server";
import { useCredit } from "@/lib/credits";
import { isTextGenConfigured } from "@/lib/gemini";
import { generateSeed, SeedGenError } from "@/lib/seed-gen";

export async function POST(req: NextRequest) {
  try {
    if (!isTextGenConfigured()) {
      return NextResponse.json(
        { error: "AI not configured" },
        { status: 503 }
      );
    }

    // Credit gate
    const credit = await useCredit(req, "generate-tale");
    if (!credit.allowed) {
      return NextResponse.json(
        { error: credit.reason, credits_remaining: 0 },
        { status: 402 }
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

    try {
      return NextResponse.json(await generateSeed({ idea: prompt, genre, tone }));
    } catch (err) {
      if (err instanceof SeedGenError) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
      console.error("AI generation error:", err);
      return NextResponse.json(
        { error: "AI service error" },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("Generate tale error:", err);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
