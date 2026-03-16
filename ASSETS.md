# MakeATale — Visual Asset Map

Guide for AI/LLM image generation. Replace any asset by providing the file at the specified path in the exact format described.

---

## Logo

**Current:** Pure CSS — gradient box with letter "M" + styled text "MakeATale"
**Rendered in:** `src/components/NavBar.tsx`, `src/app/layout.tsx` (footer)

| Size | Context | Format | Path to replace |
|------|---------|--------|-----------------|
| 32x32 | NavBar logo box | SVG or PNG | `public/logo-32.png` |
| 128x128 | Social/embed | PNG | `public/logo-128.png` |
| 512x512 | High-res/print | PNG or SVG | `public/logo-512.png` |

**Visual identity:**
- Gradient: magenta (#d946ef) → purple (#7c3aed)
- Shape: rounded square (border-radius: 8px)
- Letter "M" centered, white, extra bold
- Glow effect: magenta shadow on hover

**Brand text:** "Make" (magenta) + "A" (white/black) + "Tale" (magenta)

---

## PWA / Favicon Icons (MISSING — need to create)

| File | Size | Format | Notes |
|------|------|--------|-------|
| `public/favicon.ico` | 32x32 | ICO | Browser tab icon |
| `public/icon-192.png` | 192x192 | PNG | PWA manifest (already referenced) |
| `public/icon-512.png` | 512x512 | PNG | PWA manifest (already referenced) |
| `public/apple-touch-icon.png` | 180x180 | PNG | iOS home screen |

**Style:** Same as logo — magenta-to-purple gradient square with white "M"

---

## OpenGraph / Social Share Images (MISSING — need to create)

| File | Size | Format | Usage |
|------|------|--------|-------|
| `public/og-default.png` | 1200x630 | PNG | Default social share image |
| `public/og-story.png` | 1200x630 | PNG | Template for story shares |

**Style guide:**
- Background: dark (#030712) with subtle purple radial gradient
- Logo in top-left corner
- Title text: white, bold
- Tagline: "AI-powered collaborative fiction" in gray
- Brand color accent bar or glow

---

## Genre Emoji Map

Used as inline visual identifiers for story categories. Defined in `src/lib/genre-theme.ts`.

| Genre | Emoji | Unicode | Color Theme |
|-------|-------|---------|-------------|
| Fantasy | 🐉 | U+1F409 | purple |
| Sci-Fi | 🚀 | U+1F680 | blue |
| Horror | 👻 | U+1F47B | red |
| Mystery | 🔍 | U+1F50D | amber |
| Romance | 💕 | U+1F495 | pink |
| Adventure | ⚔️ | U+2694 FE0F | emerald |
| Thriller | 🔪 | U+1F52A | orange |
| Comedy | 😂 | U+1F602 | yellow |
| Drama | 🎭 | U+1F3AD | indigo |
| Surreal | 🌀 | U+1F300 | violet |
| Historical | 🏛️ | U+1F3DB FE0F | stone |
| Dystopia | ⚡ | U+26A1 | slate |
| **Fallback** | 📖 | U+1F4D6 | amber |

**To replace with custom icons:** Create 24x24 PNG or SVG files at `public/genres/{genre-slug}.png` and update `src/lib/genre-theme.ts` to reference image paths instead of emoji.

---

## Navigation Emoji

| Location | Emoji | Unicode | Purpose |
|----------|-------|---------|---------|
| NavBar + MobileNav | 📚 | U+1F4DA | "Stories" link |
| NavBar + MobileNav | ✍️ | U+270D FE0F | "Write" link |
| Submit page header | 🌱 | U+1F331 | "Plant a Story Seed" |

**To replace:** Update `src/components/NavBar.tsx`, `src/components/MobileNav.tsx`, and `src/app/submit/page.tsx` — swap emoji strings with `<Image>` or `<img>` tags.

---

## Lucide Icons (48 unique)

All imported from `lucide-react`. These are SVG-based and render inline.

### Core UI
| Icon | Size | Where |
|------|------|-------|
| `Menu` | 20px | Mobile nav hamburger |
| `X` | 14-20px | Close/dismiss buttons |
| `ChevronUp` | 18px | Upvote button |
| `ChevronDown` | 18px | Downvote / expand |
| `ChevronRight` | 16px | Navigation arrows |
| `ArrowLeft` | — | Back navigation |
| `ArrowRight` | — | Forward / "Next Sentence" AI tool |
| `Loader2` | 16-24px | Loading spinner (animated) |
| `Check` | 13px | Success confirmation |
| `Search` | — | Search input |

### Story System
| Icon | Size | Where |
|------|------|-------|
| `GitFork` | 10-18px | Branch count indicators |
| `Flag` | 10-16px | Ending badge, report button |
| `Star` | 12px | Thread author highlight |
| `Bookmark` / `BookmarkCheck` | 18px | Bookmark toggle |
| `Layers` | 13-14px | Full path reader toggle |
| `MessageSquare` / `MessageCircle` | 9-14px | Comment indicators |
| `Trophy` | 20px | Story of the week |

### Author & Social
| Icon | Size | Where |
|------|------|-------|
| `User` / `UserPlus` / `UserCheck` | 15px | Profile, follow |
| `Share2` | 13-14px | Share button |
| `Link2` | 13px | Copy link |
| `ExternalLink` | 14px | External link indicator |
| `Heart` | 12px | Tip/donate |
| `Bot` | 7-8px | AI bot badge on stories |

### AI & Writing
| Icon | Size | Where |
|------|------|-------|
| `Wand2` | 16px | AI Writing Assist header |
| `Sparkles` | 15-20px | AI generate, "New" tab |
| `Compass` | — | Story Directions AI tool |
| `CheckCheck` | — | Grammar Pass AI tool |
| `PenLine` | — | Shorten AI tool |
| `Lightbulb` | — | Stronger Ending AI tool |
| `Feather` | 16px | Plant seed CTA, feature icon |
| `PenTool` | — | Writing/onboarding |
| `Pencil` | 9px | Edit branch button |

### Settings & Admin
| Icon | Size | Where |
|------|------|-------|
| `Bell` / `BellOff` | 15-16px | Notifications |
| `Mail` | 16px | Email settings |
| `Pen` | 15-16px | Display name |
| `Settings` | 16px | Story settings |
| `Shield` / `ShieldAlert` / `ShieldCheck` | 16px | Account security |
| `CreditCard` | 16-32px | Payment tab |
| `Wallet` | 16px | Solana wallet |
| `Save` | 16px | Save button |
| `FileText` | 16px | Bio section |
| `Trash2` | 9-12px | Delete actions |
| `RefreshCw` | 15px | Regenerate button |
| `AlertCircle` | 18px | Warning banner |

### Navigation & Layout
| Icon | Size | Where |
|------|------|-------|
| `BookOpen` | 14-18px | Stories stat, reading |
| `Moon` / `Sun` | 16px | Theme toggle |
| `LogOut` | 15px | Sign out |
| `Code2` | 16-20px | Developer page |
| `Zap` | 20px | Developer capabilities |
| `Key` | 20px | Developer quick start |
| `ThumbsUp` | 20px | Vote feature card |
| `Users` | — | Community/writers stat |
| `TrendingUp` | 14px | Trending filter |
| `Clock` | 10-14px | Time/recency |
| `ListOrdered` | 11px | Top sort |
| `Eye` / `EyeOff` | — | Show/hide |
| `Copy` | — | Copy action |
| `Calendar` | — | Date display |
| `Award` | — | Badges |
| `Lock` | — | Restricted |

**To replace with custom icons:** Create SVGs at `public/icons/{name}.svg` and swap `<IconName>` JSX with `<Image src="/icons/{name}.svg">` or a custom icon component.

---

## CSS Gradients & Effects

### Hero Background (`globals.css` → `.hero-gradient`)
```
radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168,85,247,0.12), transparent)
radial-gradient(ellipse 60% 40% at 80% 50%, rgba(217,70,239,0.06), transparent)
radial-gradient(ellipse 60% 40% at 20% 60%, rgba(139,92,246,0.06), transparent)
```

### Card Border Glow (`.gradient-border`)
```
linear-gradient(135deg, rgba(217,70,239,0.3), rgba(139,92,246,0.15), rgba(217,70,239,0.3))
```

### Text Glow (`.glow-brand`)
```
text-shadow: 0 0 40px rgba(217,70,239,0.3)
```

### Loading Shimmer (`.skeleton`)
```
linear-gradient(90deg, #f5f0e6 0px, #fffaf0 50%, #f5f0e6 100%)
```

### Branch Tree Line (`.tree-line::before`)
```
linear-gradient(to bottom, rgb(168,85,247), transparent)
```

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-400` | `#e879f9` | Light accent, links |
| `brand-500` | `#d946ef` | Primary brand (magenta) |
| `brand-600` | `#c026d3` | Buttons, CTAs |
| `purple-500` | `#a855f7` | AI features, branches |
| `purple-700` | `#7c3aed` | Logo gradient end |
| `amber-50` | `#fffbeb` | Light mode background |
| `gray-950` | `#030712` | Dark mode background |

---

## User Avatar

**Current:** CSS-generated circle with gradient + first letter of pen_name
```
w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-700
text-xs font-bold text-white
```

**To replace with uploaded avatars:** The `profiles` table has an `avatar_url` column already. Add `<Image>` rendering where the gradient circle currently is.

---

## What's Missing (Opportunities)

1. **Favicon** — No favicon.ico exists
2. **PWA icons** — icon-192.png and icon-512.png referenced but not created
3. **OG images** — No social share images configured
4. **Custom genre icons** — Using emoji, could be custom illustrations
5. **Custom navigation icons** — Using emoji, could be branded SVGs
6. **Story cover images** — `image_url` field exists but no generation pipeline
7. **Avatar uploads** — `avatar_url` column exists but no upload UI
