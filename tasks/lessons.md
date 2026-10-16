# Make A Tale — Lessons Learned

## Patterns & Gotchas
- Server routes that need the signed-in user: call `getRequestUser()` (src/lib/request-user.ts, Bearer then cookies). Client side: `authFetch()` / `authJsonHeaders()`. Cookie-only `createServerClient` auth silently sees everyone as anonymous.
- Browser Supabase client (`supabase-browser.ts`) stores the session in localStorage, NOT cookies. Any client fetch to a credit-gated API must send `authJsonHeaders()` or the server sees an anonymous user ("Sign in to use AI features").
- Gemini models get retired per-key (2.5-flash 404'd in 2026-09). Model name lives in `GEMINI_MODEL` in `src/lib/gemini.ts` — change it there only. Fallback model kicks in on 429/503.
- The Supabase project (eaadogrkpxjjnmvzeffl) pauses when idle and was missing migrations: credits + social tables had to be applied by hand; comments/reactions/challenges/tips/api_keys/email_preferences/newsletter_subscribers have NO migration in the repo.
- makeatale.com is served from a Linode nginx box (173.255.204.127), not Vercel.

## What Worked

## What Didn't
- NEVER start a second `next dev` in this folder while Kiana's is running — both write `.next`, and killing one leaves empty chunk dirs: pages render but never hydrate (buttons dead, login does a native GET to `/login?website=`). Fix: stop server, delete `.next`, restart. Test against her server, or build to a separate distDir.
- Supabase browser client is implicit flow: email links come back with tokens in the #hash, so `/auth/callback` must be a client page (server route never sees the hash).
- Restarting Kiana's dev server: stop the `next dev` process tree on :3000, confirm the port is free, then `Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location C:\Users\Kiana\tellatale; npm run dev'` so she owns the window. Check that `_next/static` chunks return 200 afterwards.
- Rupert: the browser login is rupert.indie.io; the API is rupert.indieio.dev/api/v1. Generation routes need a signed-in user, so smoke-test via a tsx script importing src/lib.
