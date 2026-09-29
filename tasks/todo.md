
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
