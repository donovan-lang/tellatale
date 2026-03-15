import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Image generation not configured" },
        { status: 503 }
      );
    }

    const replicate = new Replicate({ auth: token });

    // Using Flux Schnell — fast, high quality, free tier friendly
    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: `Illustration for a story: ${prompt.trim().slice(0, 400)}. Cinematic, detailed, atmospheric, digital art style.`,
        num_outputs: 1,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 80,
      },
    });

    // Flux returns an array of URLs
    const urls = output as string[];
    if (!urls?.length) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    return NextResponse.json({ url: urls[0] });
  } catch (err: any) {
    console.error("Image gen error:", err);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
