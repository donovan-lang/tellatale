// Writer profile customization: theme presets, curated fonts, built-in patterns, and the
// whitelist sanitizer. Profiles never accept raw HTML/CSS; every value that reaches a style
// attribute comes from an enum here or a validated hex color.

export const THEME_IDS = [
  "storybook",
  "gothic",
  "cozy",
  "cyberpunk",
  "noir",
  "fairy",
  "ocean",
  "parchment",
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const COLOR_KEYS = ["bg", "surface", "text", "muted", "accent", "link"] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
export type ThemeColors = Record<ColorKey, string>;

export const PATTERN_IDS = ["none", "dots", "grid", "stars", "waves", "diamonds", "stripes", "paper", "plaid", "hearts"] as const;
export type PatternId = (typeof PATTERN_IDS)[number];

export const EFFECT_IDS = ["none", "sparkles", "scanlines", "rain", "glow"] as const;
export type EffectId = (typeof EFFECT_IDS)[number];

/** Blocks a profile can show, in the order a new profile gets them. The header is always first. */
export const BLOCK_IDS = ["featured", "chapters", "stats", "badges", "stories", "map", "top8", "guestbook"] as const;
export type BlockId = (typeof BLOCK_IDS)[number];
/** Blocks that render today; the rest are reserved for later phases. */
export const LIVE_BLOCKS: BlockId[] = ["featured", "chapters", "stats", "badges", "stories"];

export const BLOCK_LABELS: Record<BlockId, string> = {
  featured: "Featured tale",
  chapters: "Chapters",
  stats: "Stats and genres",
  badges: "Badges",
  stories: "Stories",
  map: "Writer's map",
  top8: "Top 8 writers",
  guestbook: "Guestbook",
};

export interface FontDef {
  label: string;
  /** CSS font-family value. */
  stack: string;
  /** Google Fonts css2 `family=` value. */
  query: string;
}

export const FONTS = {
  fredoka: { label: "Fredoka", stack: "'Fredoka', system-ui, sans-serif", query: "Fredoka:wght@400;600;700" },
  nunito: { label: "Nunito", stack: "'Nunito', system-ui, sans-serif", query: "Nunito:wght@400;700" },
  pirata: { label: "Pirata One", stack: "'Pirata One', Georgia, serif", query: "Pirata+One" },
  cormorant: { label: "Cormorant Garamond", stack: "'Cormorant Garamond', Georgia, serif", query: "Cormorant+Garamond:wght@400;600;700" },
  fraunces: { label: "Fraunces", stack: "'Fraunces', Georgia, serif", query: "Fraunces:wght@400;700;900" },
  lora: { label: "Lora", stack: "'Lora', Georgia, serif", query: "Lora:wght@400;700" },
  orbitron: { label: "Orbitron", stack: "'Orbitron', system-ui, sans-serif", query: "Orbitron:wght@500;700;900" },
  spacegrotesk: { label: "Space Grotesk", stack: "'Space Grotesk', system-ui, sans-serif", query: "Space+Grotesk:wght@400;700" },
  bebas: { label: "Bebas Neue", stack: "'Bebas Neue', Impact, sans-serif", query: "Bebas+Neue" },
  plexserif: { label: "IBM Plex Serif", stack: "'IBM Plex Serif', Georgia, serif", query: "IBM+Plex+Serif:wght@400;700" },
  cherryswash: { label: "Cherry Swash", stack: "'Cherry Swash', Georgia, serif", query: "Cherry+Swash:wght@400;700" },
  quicksand: { label: "Quicksand", stack: "'Quicksand', system-ui, sans-serif", query: "Quicksand:wght@400;700" },
  josefin: { label: "Josefin Sans", stack: "'Josefin Sans', system-ui, sans-serif", query: "Josefin+Sans:wght@400;700" },
  sourceserif: { label: "Source Serif", stack: "'Source Serif 4', Georgia, serif", query: "Source+Serif+4:wght@400;700" },
  imfell: { label: "IM Fell English", stack: "'IM Fell English', Georgia, serif", query: "IM+Fell+English" },
  garamond: { label: "EB Garamond", stack: "'EB Garamond', Georgia, serif", query: "EB+Garamond:wght@400;700" },
  pressstart: { label: "Press Start 2P", stack: "'Press Start 2P', monospace", query: "Press+Start+2P" },
  caveat: { label: "Caveat", stack: "'Caveat', cursive", query: "Caveat:wght@400;700" },
  abril: { label: "Abril Fatface", stack: "'Abril Fatface', Georgia, serif", query: "Abril+Fatface" },
  inter: { label: "Inter", stack: "'Inter', system-ui, sans-serif", query: "Inter:wght@400;700" },
} satisfies Record<string, FontDef>;
export type FontId = keyof typeof FONTS;
export const FONT_IDS = Object.keys(FONTS) as FontId[];

export interface ThemePreset {
  label: string;
  /** One line shown in the theme picker. */
  blurb: string;
  colors: ThemeColors;
  font: { heading: FontId; body: FontId };
  background: { kind: BackgroundKind; pattern: PatternId };
  banner: { kind: BannerKind; pattern: PatternId };
  effect: EffectId;
}

export const BACKGROUND_KINDS = ["solid", "gradient", "pattern"] as const;
export type BackgroundKind = (typeof BACKGROUND_KINDS)[number];
export const BANNER_KINDS = ["gradient", "pattern"] as const;
export type BannerKind = (typeof BANNER_KINDS)[number];

export const THEMES: Record<ThemeId, ThemePreset> = {
  storybook: {
    label: "Storybook",
    blurb: "Bright picture-book skies",
    colors: { bg: "#DCEBFF", surface: "#FFFFFF", text: "#1E2A4A", muted: "#5B6B8C", accent: "#F2A007", link: "#2F5BD3" },
    font: { heading: "fredoka", body: "nunito" },
    background: { kind: "pattern", pattern: "dots" },
    banner: { kind: "gradient", pattern: "stars" },
    effect: "none",
  },
  gothic: {
    label: "Gothic",
    blurb: "Candlelit crypt, velvet and blood",
    colors: { bg: "#120D14", surface: "#1E1620", text: "#EBDDEE", muted: "#A08AA6", accent: "#C0143F", link: "#CBA6DA" },
    font: { heading: "pirata", body: "cormorant" },
    background: { kind: "pattern", pattern: "diamonds" },
    banner: { kind: "pattern", pattern: "diamonds" },
    effect: "glow",
  },
  cozy: {
    label: "Cozy",
    blurb: "Knitted blanket by the fire",
    colors: { bg: "#E8DCCB", surface: "#FBF5EC", text: "#3A2E28", muted: "#7A6A5E", accent: "#6E8B3D", link: "#8A4F7D" },
    font: { heading: "fraunces", body: "lora" },
    background: { kind: "pattern", pattern: "plaid" },
    banner: { kind: "pattern", pattern: "plaid" },
    effect: "none",
  },
  cyberpunk: {
    label: "Cyberpunk",
    blurb: "Neon rain over a chrome city",
    colors: { bg: "#0A0420", surface: "#170B36", text: "#E6F7FF", muted: "#8E86B8", accent: "#FF2BD6", link: "#19F0FF" },
    font: { heading: "orbitron", body: "spacegrotesk" },
    background: { kind: "pattern", pattern: "grid" },
    banner: { kind: "gradient", pattern: "grid" },
    effect: "scanlines",
  },
  noir: {
    label: "Noir",
    blurb: "Venetian blinds and a desk lamp",
    colors: { bg: "#191919", surface: "#242424", text: "#EDEDED", muted: "#9C9C9C", accent: "#E8C547", link: "#D9D9D9" },
    font: { heading: "bebas", body: "plexserif" },
    background: { kind: "pattern", pattern: "stripes" },
    banner: { kind: "pattern", pattern: "stripes" },
    effect: "rain",
  },
  fairy: {
    label: "Fairy",
    blurb: "Glitter, petals, a little mischief",
    colors: { bg: "#F4ECFF", surface: "#FFFFFF", text: "#3D2558", muted: "#7E6A99", accent: "#E058A8", link: "#6A4BC4" },
    font: { heading: "cherryswash", body: "quicksand" },
    background: { kind: "pattern", pattern: "hearts" },
    banner: { kind: "gradient", pattern: "stars" },
    effect: "sparkles",
  },
  ocean: {
    label: "Ocean",
    blurb: "Deep water, bioluminescent glow",
    colors: { bg: "#062A3A", surface: "#0B3C52", text: "#DDF3F7", muted: "#86B3BF", accent: "#3FD0C9", link: "#FFC56B" },
    font: { heading: "josefin", body: "sourceserif" },
    background: { kind: "pattern", pattern: "waves" },
    banner: { kind: "pattern", pattern: "waves" },
    effect: "none",
  },
  parchment: {
    label: "Parchment",
    blurb: "Ink, quills, and old maps",
    colors: { bg: "#E6D7B8", surface: "#F3E9D2", text: "#2E2416", muted: "#6E5D44", accent: "#7A2E1F", link: "#2D4F6E" },
    font: { heading: "imfell", body: "garamond" },
    background: { kind: "pattern", pattern: "paper" },
    banner: { kind: "pattern", pattern: "paper" },
    effect: "none",
  },
};

export const DEFAULT_THEME: ThemeId = "storybook";

export interface LayoutItem {
  block: BlockId;
  visible: boolean;
}

/** What's stored in profiles.customization. Every field optional; the preset fills the gaps. */
export interface ProfileCustomization {
  theme?: ThemeId;
  colors?: Partial<ThemeColors>;
  font?: { heading?: FontId; body?: FontId };
  background?: { kind?: BackgroundKind; pattern?: PatternId };
  banner?: { kind?: BannerKind; pattern?: PatternId };
  effect?: EffectId;
  status?: string;
  layout?: LayoutItem[];
}

/** A customization with every field filled in, ready to render. */
export interface ResolvedTheme {
  theme: ThemeId;
  colors: ThemeColors;
  font: { heading: FontId; body: FontId };
  background: { kind: BackgroundKind; pattern: PatternId };
  banner: { kind: BannerKind; pattern: PatternId };
  effect: EffectId;
  status: string;
  layout: LayoutItem[];
}

export const STATUS_MAX = 80;
const HEX = /^#[0-9a-fA-F]{6}$/;

function oneOf<T extends string>(list: readonly T[], v: unknown): T | undefined {
  return typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : undefined;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Strips control characters and angle brackets, collapses whitespace, caps length. */
function cleanText(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
  return s || undefined;
}

/**
 * Whitelists a customization from untrusted input. Unknown keys and invalid values are dropped,
 * so the result is always safe to store and render.
 */
export function sanitizeCustomization(input: unknown): ProfileCustomization {
  if (!isObject(input)) return {};
  const out: ProfileCustomization = {};

  const theme = oneOf(THEME_IDS, input.theme);
  if (theme) out.theme = theme;

  if (isObject(input.colors)) {
    const colors: Partial<ThemeColors> = {};
    for (const key of COLOR_KEYS) {
      const v = input.colors[key];
      if (typeof v === "string" && HEX.test(v)) colors[key] = v.toUpperCase();
    }
    if (Object.keys(colors).length) out.colors = colors;
  }

  if (isObject(input.font)) {
    const heading = oneOf(FONT_IDS, input.font.heading);
    const body = oneOf(FONT_IDS, input.font.body);
    if (heading || body) out.font = { ...(heading && { heading }), ...(body && { body }) };
  }

  if (isObject(input.background)) {
    const kind = oneOf(BACKGROUND_KINDS, input.background.kind);
    const pattern = oneOf(PATTERN_IDS, input.background.pattern);
    if (kind || pattern) out.background = { ...(kind && { kind }), ...(pattern && { pattern }) };
  }

  if (isObject(input.banner)) {
    const kind = oneOf(BANNER_KINDS, input.banner.kind);
    const pattern = oneOf(PATTERN_IDS, input.banner.pattern);
    if (kind || pattern) out.banner = { ...(kind && { kind }), ...(pattern && { pattern }) };
  }

  const effect = oneOf(EFFECT_IDS, input.effect);
  if (effect) out.effect = effect;

  const status = cleanText(input.status, STATUS_MAX);
  if (status) out.status = status;

  if (Array.isArray(input.layout)) {
    const seen: string[] = [];
    const layout: LayoutItem[] = [];
    for (const item of input.layout.slice(0, BLOCK_IDS.length * 2)) {
      if (!isObject(item)) continue;
      const block = oneOf(BLOCK_IDS, item.block);
      if (!block || seen.includes(block)) continue;
      seen.push(block);
      layout.push({ block, visible: item.visible !== false });
    }
    if (layout.length) out.layout = layout;
  }

  return out;
}

/** Saved order first, then any blocks the saved layout doesn't mention (new ones show by default). */
export function normalizeLayout(layout: LayoutItem[] | undefined): LayoutItem[] {
  const saved = (layout || []).filter((l) => BLOCK_IDS.includes(l.block));
  const missing = BLOCK_IDS.filter((b) => !saved.some((l) => l.block === b)).map((block) => ({ block, visible: true }));
  return [...saved, ...missing];
}

/** Fills every field from the preset (customization may be null for profiles that never set one). */
export function resolveTheme(input: ProfileCustomization | null | undefined): ResolvedTheme {
  const c = sanitizeCustomization(input);
  const themeId = c.theme || DEFAULT_THEME;
  const p = THEMES[themeId];
  return {
    theme: themeId,
    colors: { ...p.colors, ...c.colors },
    font: { ...p.font, ...c.font },
    background: { ...p.background, ...c.background },
    banner: { ...p.banner, ...c.banner },
    effect: c.effect || p.effect,
    status: c.status || "",
    layout: normalizeLayout(c.layout),
  };
}

/** Google Fonts stylesheet URL for just the fonts a theme uses. */
export function fontStylesheetUrl(font: ResolvedTheme["font"]): string {
  const ids = font.heading === font.body ? [font.heading] : [font.heading, font.body];
  return `https://fonts.googleapis.com/css2?${ids.map((id) => `family=${FONTS[id].query}`).join("&")}&display=swap`;
}

/** Hex color plus alpha as an 8-digit hex (inputs are already validated hex). */
function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

function svgUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Built-in tileable patterns, drawn in the given color. Returns a CSS background-image value. */
export function patternImage(pattern: PatternId, color: string, opacity = 0.18): string {
  const c = withAlpha(color, opacity);
  switch (pattern) {
    case "dots":
      return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='4' cy='4' r='2' fill='${c}'/><circle cx='16' cy='16' r='2' fill='${c}'/></svg>`);
    case "grid":
      return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='M32 0H0V32' fill='none' stroke='${c}' stroke-width='1'/></svg>`);
    case "stars":
      return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><path d='M12 6l1.5 4.5L18 12l-4.5 1.5L12 18l-1.5-4.5L6 12l4.5-1.5z' fill='${c}'/><path d='M46 38l1 3 3 1-3 1-1 3-1-3-3-1 3-1z' fill='${c}'/><circle cx='52' cy='12' r='1.2' fill='${c}'/><circle cx='22' cy='50' r='1.2' fill='${c}'/></svg>`);
    case "waves":
      return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='24'><path d='M0 12c10 0 10-8 20-8s10 8 20 8 10-8 20-8' fill='none' stroke='${c}' stroke-width='2'/><path d='M0 22c10 0 10-8 20-8s10 8 20 8 10-8 20-8' fill='none' stroke='${c}' stroke-width='1'/></svg>`);
    case "diamonds":
      return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40'><path d='M14 2l12 18-12 18L2 20z' fill='none' stroke='${c}' stroke-width='1'/><circle cx='14' cy='20' r='1.5' fill='${c}'/></svg>`);
    case "stripes":
      return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><path d='M0 20L20 0M-5 5L5 -5M15 25L25 15' stroke='${c}' stroke-width='3'/></svg>`);
    case "paper":
      return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path d='M8 14c6 1 10-2 16 0M40 30c5 2 9-1 14 1M18 60c7 1 9-2 15 0M58 66c4 1 7-1 11 0M60 8c3 2 6 0 9 1' fill='none' stroke='${c}' stroke-width='1'/><circle cx='30' cy='44' r='0.8' fill='${c}'/><circle cx='70' cy='40' r='0.8' fill='${c}'/></svg>`);
    case "plaid":
      return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect x='0' y='14' width='40' height='6' fill='${c}'/><rect x='14' y='0' width='6' height='40' fill='${c}'/><rect x='0' y='30' width='40' height='2' fill='${c}'/><rect x='30' y='0' width='2' height='40' fill='${c}'/></svg>`);
    case "hearts":
      return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><path d='M12 18c-3-4-9-2-8 3 1 4 8 8 8 8s7-4 8-8c1-5-5-7-8-3z' fill='${c}'/><path d='M36 40c-2-2.5-6-1.3-5.4 2 .6 2.6 5.4 5.4 5.4 5.4s4.8-2.8 5.4-5.4c.6-3.3-3.4-4.5-5.4-2z' fill='${c}'/></svg>`);
    default:
      return "none";
  }
}

/** Black or white, whichever reads better on the given color (WCAG relative luminance). */
export function readableOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.179 ? "#141414" : "#FFFFFF";
}

/** Accent to link through an oklch midpoint, so complementary colors don't turn grey in the middle. */
function bannerGradient(colors: ThemeColors): string {
  return `linear-gradient(120deg, ${colors.accent}, color-mix(in oklch, ${colors.accent}, ${colors.link}), ${colors.link})`;
}

/** CSS custom properties for a profile wrapper. Values come only from validated theme data. */
export function themeToCssVars(t: ResolvedTheme): Record<string, string> {
  const { colors } = t;
  const bgImage =
    t.background.kind === "pattern"
      ? patternImage(t.background.pattern, colors.accent)
      : t.background.kind === "gradient"
        ? `radial-gradient(ellipse at top, ${withAlpha(colors.accent, 0.25)}, transparent 60%)`
        : "none";
  const bannerImage =
    t.banner.kind === "pattern"
      ? `${patternImage(t.banner.pattern, colors.text, 0.22)}, ${bannerGradient(colors)}`
      : bannerGradient(colors);
  return {
    "--p-bg": colors.bg,
    "--p-surface": colors.surface,
    "--p-text": colors.text,
    "--p-muted": colors.muted,
    "--p-accent": colors.accent,
    "--p-link": colors.link,
    "--p-on-accent": readableOn(colors.accent),
    "--p-line": withAlpha(colors.text, 0.14),
    "--p-accent-soft": withAlpha(colors.accent, 0.16),
    "--p-heading-font": FONTS[t.font.heading].stack,
    "--p-body-font": FONTS[t.font.body].stack,
    "--p-bg-image": bgImage,
    "--p-banner-image": bannerImage,
  };
}

/** Converts a number to Roman numerals, for chapter headings. */
export function toRoman(n: number): string {
  const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  let rest = Math.max(1, Math.floor(n));
  if (rest > 39) return String(rest);
  for (const [v, s] of map) {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  }
  return out;
}
