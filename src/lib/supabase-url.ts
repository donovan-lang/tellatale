// Server-side Supabase base URL.
//
// Self-hosted: the browser reaches auth/rest through the public site origin
// (NEXT_PUBLIC_SUPABASE_URL = https://makeatale.com/supabase, proxied by nginx), while server code
// on the same box talks to the local gateway (SUPABASE_INTERNAL_URL = http://127.0.0.1:8000) so a
// request never leaves the machine and works before DNS points here. Unset on Vercel/cloud
// Supabase, where both are the same URL.
export function supabaseServerUrl(): string {
  return process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
}
