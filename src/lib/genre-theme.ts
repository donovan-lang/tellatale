export const GENRE_EMOJI: Record<string, string> = {
  Fantasy: "\u{1F409}",
  "Sci-Fi": "\u{1F680}",
  Horror: "\u{1F47B}",
  Mystery: "\u{1F50D}",
  Romance: "\u{1F495}",
  Adventure: "\u{2694}\u{FE0F}",
  Thriller: "\u{1F52A}",
  Comedy: "\u{1F602}",
  Drama: "\u{1F3AD}",
  Surreal: "\u{1F300}",
  Historical: "\u{1F3DB}\u{FE0F}",
  Dystopia: "\u{26A1}",
  Steampunk: "\u{2699}\u{FE0F}",
  Cyberpunk: "\u{1F310}",
  Mythology: "\u{1F531}",
  Noir: "\u{1F3A9}",
  Gothic: "\u{1F987}",
  "Cosmic Horror": "\u{1F30C}",
  "Slice-of-Life": "\u{2615}",
  "Alternate History": "\u{1F500}",
};

export const GENRE_ICON_SLUG: Record<string, string> = {
  Fantasy: "fantasy",
  "Sci-Fi": "sci-fi",
  Horror: "horror",
  Mystery: "mystery",
  Romance: "romance",
  Adventure: "adventure",
  Thriller: "thriller",
  Comedy: "comedy",
  Drama: "drama",
  Surreal: "surreal",
  Historical: "historical",
  Dystopia: "dystopia",
  Steampunk: "steampunk",
  Cyberpunk: "cyberpunk",
  Mythology: "mythology",
  Noir: "noir",
  Gothic: "gothic",
  "Cosmic Horror": "cosmic-horror",
  "Slice-of-Life": "slice-of-life",
  "Alternate History": "alternate-history",
};

export const GENRE_COLORS: Record<string, { light: string; dark: string; border: string }> = {
  Fantasy: { light: "bg-purple-50", dark: "dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20" },
  "Sci-Fi": { light: "bg-blue-50", dark: "dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20" },
  Horror: { light: "bg-red-50", dark: "dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" },
  Mystery: { light: "bg-amber-50", dark: "dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" },
  Romance: { light: "bg-pink-50", dark: "dark:bg-pink-500/10", border: "border-pink-200 dark:border-pink-500/20" },
  Adventure: { light: "bg-emerald-50", dark: "dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" },
  Thriller: { light: "bg-orange-50", dark: "dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20" },
  Comedy: { light: "bg-yellow-50", dark: "dark:bg-yellow-500/10", border: "border-yellow-200 dark:border-yellow-500/20" },
  Drama: { light: "bg-indigo-50", dark: "dark:bg-indigo-500/10", border: "border-indigo-200 dark:border-indigo-500/20" },
  Surreal: { light: "bg-violet-50", dark: "dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/20" },
  Historical: { light: "bg-stone-50", dark: "dark:bg-stone-500/10", border: "border-stone-200 dark:border-stone-500/20" },
  Dystopia: { light: "bg-slate-50", dark: "dark:bg-slate-500/10", border: "border-slate-200 dark:border-slate-500/20" },
  Steampunk: { light: "bg-teal-50", dark: "dark:bg-teal-500/10", border: "border-teal-200 dark:border-teal-500/20" },
  Cyberpunk: { light: "bg-cyan-50", dark: "dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-500/20" },
  Mythology: { light: "bg-lime-50", dark: "dark:bg-lime-500/10", border: "border-lime-200 dark:border-lime-500/20" },
  Noir: { light: "bg-zinc-50", dark: "dark:bg-zinc-500/10", border: "border-zinc-200 dark:border-zinc-500/20" },
  Gothic: { light: "bg-fuchsia-50", dark: "dark:bg-fuchsia-500/10", border: "border-fuchsia-200 dark:border-fuchsia-500/20" },
  "Cosmic Horror": { light: "bg-rose-50", dark: "dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/20" },
  "Slice-of-Life": { light: "bg-sky-50", dark: "dark:bg-sky-500/10", border: "border-sky-200 dark:border-sky-500/20" },
  "Alternate History": { light: "bg-neutral-50", dark: "dark:bg-neutral-500/10", border: "border-neutral-200 dark:border-neutral-500/20" },
};

export function getGenreEmoji(tags: string[] | null | undefined): string {
  if (!tags || tags.length === 0) return "\u{1F4D6}";
  return GENRE_EMOJI[tags[0]] || "\u{1F4D6}";
}

/** Returns the path to the genre icon image (128px version) */
export function getGenreIconPath(genre: string): string {
  const slug = GENRE_ICON_SLUG[genre];
  return slug ? `/genres/${slug}-128.png` : "/genres/default-128.png";
}

/** Returns the path for the first tag or default */
export function getGenreIcon(tags: string[] | null | undefined): string {
  if (!tags || tags.length === 0) return "/genres/default-128.png";
  return getGenreIconPath(tags[0]);
}

export function getGenreTheme(tags: string[] | null | undefined): { light: string; dark: string; border: string } {
  if (!tags || tags.length === 0) return { light: "bg-amber-50", dark: "dark:bg-gray-800", border: "border-amber-200 dark:border-gray-700" };
  return GENRE_COLORS[tags[0]] || { light: "bg-amber-50", dark: "dark:bg-gray-800", border: "border-amber-200 dark:border-gray-700" };
}
