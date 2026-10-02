
- [x] Outline core tale generation logic. (assigned 2026-03-15 08:24 via HQ)
- [x] Build /api/generate-tale engine (Gemini 2.5 Flash, prompt+genre+tone → title+content+tags)
- [x] Build TaleGenerator UI component (prompt, genre picker, tone selector, preview, regenerate)
- [x] Integrate into submit page with Write/Generate tabs
- [x] Update homepage copy to reflect AI generation as primary feature
- [x] Update meta tags, footer, onboarding overlay, explore page CTAs

- [x] In `src/lib/story_engine.ts`, implement branching narrative generation where reader choices feed back into Gemini prompt context (completed 2026-03-23)

- [x] Add "Generate AI Paths" button to StoryReader for branchless stories (completed 2026-03-23)
- [x] Fix auto-branch cron to also grow deep leaf nodes, not just seeds (completed 2026-03-23)
- [x] Add AI teaser generator (Wand2 "AI suggest" button) to branch choice line field (completed 2026-03-23)
- [x] Guard /api/branches/generate against duplicate AI branch spam (409 if ≥2 TaleBot branches exist) (completed 2026-03-23)

## Story generation improvements (2026-09-11)
- [x] Extract shared `src/lib/gemini.ts` (retry/backoff on 429/5xx + JSON parsing helper); wired into story_engine, generate-tale, ai-assist
- [x] Fix unbounded narrative-context growth in `buildNarrativeContext` — deep trees were sending full content of every ancestor node to Gemini. Now caps full detail to last 3 nodes, condenses older ones to a teaser trail + 2-sentence opening summary
- [ ] Consider: validate branch length/tone before insert (README's own "Future Enhancements" item, still open)
- [x] Dedup check so the 2 generated branches per story aren't too similar to each other (completed 2026-09-22): word-shingle Jaccard similarity on teaser+content, retries once with a stronger differentiation instruction if similarity ≥0.5
- [x] Apply retry treatment to `/api/cron/auto-challenge` via shared `gemini.ts` (completed 2026-09-22; no narrative context there, so context-cap didn't apply)
- [x] Add genre-specific craft directives + micro-exemplars (`src/lib/genre-craft.ts`), wired into both `generate-tale` (seed) and `story_engine.buildBranchPromptWithContext` (branches) — anchors the model to a concrete genre voice instead of generic "be vivid" instructions
- [ ] Next quality lever discussed with Donovan: draft-then-revise pass (2x cost/latency) — not started, needs his go-ahead given credit-system cost impact
- [ ] Also discussed: swapping generation model from gemini-2.5-flash to a higher-quality model — cost/latency tradeoff, needs Donovan's call

## Story gen rescope — DreamGen-style, staying on Gemini (started 2026-09-29)
Goal: generation (esp. background/branch gen) follows what the person fed it. DreamGen's structure: a persistent
scenario card (plot, characters, style) + per-turn instruction, re-sent every generation. Ours currently loses the
person's original idea entirely after the seed is saved, and deep branches only see the first 2 sentences of the opening.
- [x] Phase 0 (done 2026-09-29, applied in Supabase): add `stories.metadata jsonb` migration — branch routes write `metadata` but the column never existed, so AI branch inserts fail
- [x] Phase 1 (done 2026-09-29, ce42e5d): persist the person's input on the seed (idea, genre, tone) + generate a story bible (characters, setting, conflict, POV/tense, style) → root `metadata`
- [x] Phase 2 (done 2026-09-29, ce42e5d): feed the bible into every branch prompt (replaces the 2-sentence opening summary); keep last 3 nodes in full
- [x] Phase 3 (done 2026-09-29, code only — steering adherence not yet measured): optional reader steering on "Generate AI Paths" ("where should it go?") → one branch follows it, the other contrasts
- [ ] Phase 4: Gemini eval harness — word-range hit rate, prompt-detail adherence, character consistency across branches, steering adherence; baseline before Phase 1, re-run after each phase
- [ ] Known quality gap from baseline: seeds undershoot the 400–800 word target (~280–400w)
- [ ] BLOCKER for prod scale: GEMINI_API_KEY is on Google's FREE tier (5 RPM gemini-3.6-flash, 15 RPM flash-lite, per project). A few concurrent users + auto-branch cron will 429. Needs billing enabled on the Google Cloud project — Donovan's call.
- Eval result (2026-09-29, depth 8, 5 cases, Gemini judge): bible vs no bible — idea fidelity 3.6→4.6, consistency 4.0→4.6, contradictions 4→1, branches in 200–400w 24/40→34/40. Small n, single run; re-run to confirm. Without bible: Comedy drifted into a "cat syndicate" plot, Noir changed how the brother died.
- [ ] Next: measure steering adherence (Phase 3); fix seed length undershoot (target 400–800w, getting ~300–450)

## Account data / drafts fix (started 2026-09-29)
Root cause: browser session lives in localStorage, but /api/stories POST, bookmarks, chronicles, reading-progress, reports, vote only read cookies → logged-in users post as anonymous (author_id null), and bookmarks/progress/chronicles 401.
- [x] Shared `getRequestUser()` (Bearer, then cookies) in src/lib/request-user.ts; swap into all cookie-only routes
- [x] Client fetches to those routes send `authJsonHeaders()`
- [x] StoryForm drafts: don't clobber AI-generated content with an old draft; autosave tags/name too; hide name field when signed in
- [x] /stories "Your Stories" sidebar pulls the user's own stories, not the global 50
- [x] Backfill orphaned stories — not needed: all 45 stories are demo seeds, only 1 real profile (checked 2026-09-29)
- [ ] Verify in Edge: sign in → plant a seed → it shows under Your Stories on /submit and /stories; bookmark + reading list load on /read
- [x] Drafts saved to account: `story_drafts` table + /api/drafts (GET/PUT/DELETE), StoryForm syncs (newest of local/account wins), "Discard" on restored drafts, "Your Drafts" list on /account → Story Settings
- [x] story_drafts migration applied in Supabase (verified 2026-10-02)
- [ ] Later: "Post as Anonymous by default" + "mature content" toggles on /account don't persist anywhere

## Sign-in audit (started 2026-10-02)
Report: "sign in feature is broken". Known so far: Supabase auth healthy; Kiana's account confirmed (last sign-in 2026-09-28); Google provider DISABLED in Supabase but UI shows Google button.
- [x] Browser repro: local break was a corrupted .next (Claude ran a 2nd `next dev` in the same folder); prod password login fine, Google = raw JSON error
- [x] Code audit: signup fake success, /auth/callback could never work (implicit flow), no reset page, Google dead, credits read wrong project's token, branch delete 401, login ignored ?redirect
- [x] Rupert review (only qwen3.5-9b still live): kept open-redirect hardening
- [x] Fixed + 17/17 Playwright checks pass signed-out (scratch: %TEMP%\claude\pwerify.js)
- [x] (done 2026-10-02) Kiana: Supabase → Authentication → URL Configuration: Site URL https://makeatale.com; redirect URLs https://makeatale.com/auth/callback and http://localhost:3000/auth/callback
- [x] (done 2026-10-02) Kiana turned on custom SMTP. Confirm delivery via the reset-password round trip
- [ ] Kiana: signed-in check in Edge (sign in, drafts save, reset password email round trip)
- [ ] Deploy to Linode — none of 06556ad..HEAD is live yet (Kiana owns launch calls now; Donovan only for system breaks)

## Writer profiles, MySpace-style (logged 2026-10-02, Kiana; not started)
Idea: writers customize their own profile page (custom background, images, look and feel) and each profile should tell a story.
- Starting point: existing public page `src/app/author/[name]/page.tsx` (+ feed.xml)
- [ ] Spec it: which customization (background image/color, banner, avatar, fonts, accent colors, music?), what "tells a story" means (bio as a story? pinned tale? a timeline of their tales?)
- [ ] Storage for uploads (Supabase Storage bucket), size/type limits, moderation for images
- [ ] Security: no raw user HTML/CSS (XSS). Give curated theme controls/presets instead, sanitized on save
- [ ] Profile settings editor on /account + live preview

## Move all text generation to Rupert (logged 2026-10-02, from Donovan; not started)
Donovan: all text gen should go through Rupert (indie.io's LLM, https://rupert.indieio.dev) because it's free for us, instead of Gemini/Anthropic.
- All gen goes through `src/lib/gemini.ts` → ai-assist, branches/generate, cron/auto-branch, cron/auto-challenge, generate-tale, story_engine (+ scripts/eval-branches, compare-models). Swap is mostly one file: add a Rupert client with the same interface.
- [x] (2026-10-02) Code: `src/lib/rupert.ts` (Open WebUI /api/v1/chat/completions); `callGemini` now tries Rupert first when RUPERT_API_KEY is set, falls back to Gemini on failure. Routes check `isTextGenConfigured()`; metadata uses `TEXT_MODEL`
- [x] Prompt check via MCP: seed = valid JSON, ~750 words (in 400-800 range), strong; branches JSON shape correct
- [x] (2026-10-02) RUPERT_API_KEY in .env.local (Kiana's personal key, browser login is rupert.indie.io). Smoke test through src/lib code: seed 793 words in 55s, bible JSON 17s, no Gemini fallback
- [ ] Kiana: restart dev server so :3000 picks up the key, then a signed-in Generate in Edge
- [ ] Prod: use a dedicated/service Rupert key, not a personal one; add to Linode env
- [ ] Prod: qwen3.8:27b took 55s for a seed in testing; check nginx proxy_read_timeout on Linode (default 60s) before deploy
- [ ] Pick model: qwen3.8:27b default; deepseek-v4-flash for quality-heavy gen if latency is OK
- [ ] Check JSON-output reliability (generate-tale + bible extraction parse JSON) and rate limits/uptime
- [ ] Re-run scripts/eval-branches.ts Rupert vs Gemini before switching; keep Gemini as fallback?
- Would remove the Gemini free-tier 429 BLOCKER above
