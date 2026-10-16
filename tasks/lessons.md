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
- PROD = branch `selfhost/linode`, NOT master. makeatale.com is a self-hosted Supabase + pm2 app on Linode root@173.255.204.127 (app :3002, gateway :8000). Deploy = merge master into selfhost/linode, then `bash deploy/push-build.sh` (builds locally, uploads, `deploy/finalize-release.sh` on the box). Needs `.env.production.local` (anon-key placeholder) and SSH key `~/.ssh/claudebot-key` (Donovan's; not on Kiana's PC as of 2026-10-16).
- Prod DB is the box's own Postgres, NOT the cloud project in .env.local. Migrations applied in the Supabase dashboard don't reach prod; run them on the box.
- Crons on prod come from `deploy/makeatale.cron` → /etc/cron.d/makeatale (strip CRLF before installing). vercel.json crons are dead.
- Deploy from this PC: `SKIP_BUILD=1 bash deploy/push-build.sh` after `npm run build` in the deploy worktree (key ~/.ssh/claudebot-key = Kiana's, added by Donovan 2026-10-16). Prod DB: `docker exec -i supabase-db-1 psql -U postgres -d postgres`, then `NOTIFY pgrst, 'reload schema';`. The box is shared with other apps and the disk is ~95% full.
- Windows checkouts made deploy/*.sh CRLF, which broke finalize ("set: pipefail: invalid option"). .gitattributes now forces LF for *.sh/*.cron.
