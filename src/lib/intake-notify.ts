/**
 * Notify Donovan via the shared indie.io media intake (the same Slack-DM route the
 * Codexery contact form uses). Server-side only.
 *
 * The intake lives at /codexery-intake/* rather than /api/* because Cloudflare intercepts
 * /api/* on the alienbiomes host upstream of our nginx. When MakeATale runs on the same box
 * as the intake, set INTAKE_URL=http://127.0.0.1:8177/codexery-intake/contact to skip the hop.
 *
 * Best effort: never throws, never blocks the user's request for longer than the timeout.
 */
const INTAKE_URL =
  process.env.INTAKE_URL || "https://www.alienbiomes.com/codexery-intake/contact";

export interface IntakeMessage {
  topic: string; // short label, intake truncates at 40 chars
  url?: string; // page the message is about
  email?: string; // reply-to, if the visitor gave one
  message: string;
}

export async function notifyDonovan(m: IntakeMessage): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(INTAKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site: "MakeATale",
        topic: m.topic.slice(0, 40),
        url: (m.url || "").slice(0, 300),
        email: (m.email || "").slice(0, 120),
        // The intake's Slack header is codexery-generic, so tag the body with the site.
        message: `[MakeATale] ${m.message}`.slice(0, 2800),
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}
