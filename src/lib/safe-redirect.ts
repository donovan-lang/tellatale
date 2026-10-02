/**
 * Only allow same-site paths as post-auth destinations ("/stories", "/story/abc?x=1").
 * Resolves the value the way the browser will (which strips tabs/newlines, so "/\t/evil.com"
 * becomes "//evil.com") and rejects anything that lands on another origin.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/stories"): string {
  if (!value || !value.startsWith("/")) return fallback;
  try {
    const base = "https://makeatale.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

/** Google sign-in is off in Supabase until NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true. */
export const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
