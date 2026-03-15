/**
 * Spam protection utilities: honeypot, timing, content filtering, rate limiting.
 */

// ── URL detection ──────────────────────────────────────────────────
export function containsUrl(text: string): boolean {
  const urlPattern = /https?:\/\/|www\.|\.com\/|\.net\/|\.org\/|\.io\/|bit\.ly|t\.co/i;
  return urlPattern.test(text);
}

// ── Spam pattern detection ─────────────────────────────────────────
export function isSpamContent(text: string): boolean {
  if (containsUrl(text)) return true;

  // Repeated characters (aaaaaaa)
  if (/(.)\1{7,}/.test(text)) return true;

  // All caps (more than 80% uppercase in text > 20 chars)
  if (
    text.length > 20 &&
    text.replace(/[^A-Z]/g, "").length / text.replace(/\s/g, "").length > 0.8
  )
    return true;

  // Common spam phrases
  const spamPhrases = [
    "buy now",
    "click here",
    "free money",
    "make money",
    "earn cash",
    "viagra",
    "casino",
    "crypto pump",
    "airdrop claim",
    "send sol to",
  ];
  if (spamPhrases.some((p) => text.toLowerCase().includes(p))) return true;

  // Too short for real content (less than 10 chars of actual content)
  if (text.replace(/\s/g, "").length < 10) return true;

  return false;
}

// ── Honeypot check ─────────────────────────────────────────────────
export function isHoneypotFilled(value: string | undefined | null): boolean {
  return !!value && value.trim().length > 0;
}

// ── Timestamp check ────────────────────────────────────────────────
export function isSubmittedTooFast(
  loadedAt: number,
  minSeconds: number = 2
): boolean {
  return Date.now() - loadedAt < minSeconds * 1000;
}

// ── In-memory rate limiter ─────────────────────────────────────────
const ipCounts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(
  ip: string,
  maxPerMinute: number = 10
): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || entry.resetAt < now) {
    ipCounts.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  entry.count++;
  return entry.count > maxPerMinute;
}

export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

// ── Content sanitization ───────────────────────────────────────────
export function sanitizeContent(text: string): string {
  // Strip any HTML tags
  return text.replace(/<[^>]*>/g, "").trim();
}
