# Make A Tale — Lessons Learned

## Patterns & Gotchas
- Browser Supabase client (`supabase-browser.ts`) stores the session in localStorage, NOT cookies. Any client fetch to a credit-gated API must send `authJsonHeaders()` or the server sees an anonymous user ("Sign in to use AI features").
- Gemini models get retired per-key (2.5-flash 404'd in 2026-09). Model name lives in `GEMINI_MODEL` in `src/lib/gemini.ts` — change it there only. Fallback model kicks in on 429/503.
- The Supabase project (eaadogrkpxjjnmvzeffl) pauses when idle and was missing migrations: credits + social tables had to be applied by hand; comments/reactions/challenges/tips/api_keys/email_preferences/newsletter_subscribers have NO migration in the repo.
- makeatale.com is served from a Linode nginx box (173.255.204.127), not Vercel.

## What Worked

## What Didn't
