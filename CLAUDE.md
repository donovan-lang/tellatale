# Make A Tale — Project Context for Claude

## Owner
Donovan Duncan (CEO, indie.io) — CST timezone, morning person, short bursts.

## Communication Rules
- **Act autonomously** — do NOT ask "should I proceed?" or "is this okay?"
- Keep responses short and direct, no fluff
- If 70%+ confident, just do it. Donovan prefers fixing mistakes over constant interruptions
- After EVERY code edit: run `git diff` to verify changes landed
- Before complex multi-step work: write state to `tasks/todo.md`

## What is this
Make A Tale project

## Tech Stack
node

## Key Files
- `.env.local`
- `.env.local.example`
- `.gitignore`
- `.next`
- `.vercel`
- `ASSETS.md`
- `AUDIT.md`
- `CLAUDE.md`
- `README.md`
- `next-env.d.ts`
- `next.config.js`
- `package-lock.json`

## How to Run
```bash
npm run dev
```

## Architecture
- **Frontend**: Next.js + React with PostCSS styling, static assets in `/public`
- **Backend**: Node.js API routes handling story creation, reactions, and branch management
- **Database**: SQL-based persistence with seed scripts for structured story/branch/reaction data
- **AI Integration**: Python migration and seeding tools for LLM-powered narrative generation and content enrichment
- **Deployment**: Vercel-hosted serverless architecture with environment configuration and build optimization

## Task Tracking
- **Tasks**: `tasks/todo.md` — check on startup, mark items as you go
- **Lessons**: `tasks/lessons.md` — update after corrections, check on startup

## Session Recovery
1. Read `tasks/todo.md` for where we left off
2. Read `tasks/lessons.md` for project-specific gotchas
3. `git log --oneline -10` and `git status` to see what's been done
4. Resume from last incomplete checkbox
