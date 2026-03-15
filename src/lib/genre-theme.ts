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
};

export function getGenreEmoji(tags: string[] | null | undefined): string {
  if (!tags || tags.length === 0) return "\u{1F4D6}";
  return GENRE_EMOJI[tags[0]] || "\u{1F4D6}";
}

export function getGenreTheme(tags: string[] | null | undefined): { light: string; dark: string; border: string } {
  if (!tags || tags.length === 0) return { light: "bg-amber-50", dark: "dark:bg-gray-800", border: "border-amber-200 dark:border-gray-700" };
  return GENRE_COLORS[tags[0]] || { light: "bg-amber-50", dark: "dark:bg-gray-800", border: "border-amber-200 dark:border-gray-700" };
}
