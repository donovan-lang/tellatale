export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientIp, isHoneypotFilled } from "@/lib/spam-filter";
import { notifyDonovan } from "@/lib/intake-notify";

const TOPICS = new Set(["general", "support", "bug", "partnership", "press", "legal", "other"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, topic, message, website } = body || {};

    // Honeypot: bots fill the hidden "website" field. Pretend success.
    if (isHoneypotFilled(website)) return NextResponse.json({ ok: true });

    const msg = String(message || "").trim();
    const mail = String(email || "").trim();
    if (msg.length < 5) {
      return NextResponse.json({ error: "Please write a message." }, { status: 400 });
    }
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
    }

    const ip = getClientIp(req);
    if (isRateLimited(`contact_${ip}`, 3)) {
      return NextResponse.json({ error: "Too many messages. Please try again in a minute." }, { status: 429 });
    }

    const t = TOPICS.has(topic) ? topic : "other";
    const who = String(name || "").trim().slice(0, 80) || "(no name)";
    const ok = await notifyDonovan({
      topic: `makeatale-${t}`,
      url: "https://makeatale.com/contact",
      email: mail,
      message: `From: ${who}\n\n${msg.slice(0, 2600)}`,
    });

    if (!ok) {
      return NextResponse.json(
        { error: "Couldn't send right now. Please email support@indie.io." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
