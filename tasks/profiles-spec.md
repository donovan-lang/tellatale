# Writer Profiles, MySpace-style (spec, 2026-10-16, Kiana)

Goal: a writer's page at /author/[name] is theirs to decorate, and it tells the story of them as a writer.

## Decisions (Kiana)
- Story elements: **pinned featured tale**, **chapters timeline**, **writer's map**
- Customization: **full MySpace freedom**, built as structured controls (no raw HTML/CSS, which would allow XSS)
- Extras: **Top 8 writers**, **guestbook**, **badges**

## Data
- `profiles.customization jsonb` (validated server-side against a whitelist, see below)
- `profiles.pinned_story_id uuid` (must be a seed the writer authored)
- `profile_top8 (profile_id, position 1-8, writer_id)`, picked from writers they follow
- `guestbook_entries (id, profile_id, author_id, body ≤ 500, created_at, is_hidden)`: signed-in only, spam-filtered and rate-limited, the owner can hide entries, anyone can report
- Badges and chapters are **computed** from stories, votes and follows, so they need no table

### customization schema (everything optional, unknown keys dropped)
```
theme:      preset id (storybook | gothic | cozy | cyberpunk | noir | fairy | ocean | parchment)
colors:     { bg, surface, text, accent, link }   hex only
font:       { heading, body }                      from a curated Google Fonts list
background: { kind: solid | gradient | pattern, value }  patterns from a built-in set (stars, paper, grid, waves...)
banner:     { kind: gradient | pattern | image, value }  image = Rupert-generated (Phase 4) or upload once Storage exists
layout:     [{ block, visible }] ordered; block ∈ header, featured, chapters, map, badges, top8, guestbook, stories
cursor/sparkle effects: optional fun toggles (reduced-motion respected)
status:     "currently writing…" line (≤ 80 chars)
```

## Phases
1. **Foundation.** Migration, validated `PUT /api/profile/customization`, a theme engine (CSS variables from presets plus overrides), block-based profile rendering, header, featured tale, chapters timeline, badges and stories blocks, and a Profile editor on /account with live preview and drag-to-reorder blocks.
2. **Social.** Top 8 (choose and order from follows), guestbook (post, hide, report).
3. **Writer's map.** An SVG tree of every path the writer has contributed to, with their nodes highlighted.
4. **Images.** Either enable Supabase Storage on the Linode box (the gateway currently exposes only auth and rest) for banner and background uploads with size/type limits, or have Rupert generate banners with klein-4b from a prompt.

## Not doing
Raw HTML/CSS/JS, embeds from arbitrary URLs, hotlinked images.
