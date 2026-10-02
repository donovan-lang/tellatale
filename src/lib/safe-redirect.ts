/**
 * Only allow same-site paths as post-auth destinations ("/stories", "/story/abc?x=1").
 * Rejects absolute URLs, protocol-relative "//evil.com" and "/\evil.com".
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/stories"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

/** Google sign-in is off in Supabase until NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true. */
export const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
