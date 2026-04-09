
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
