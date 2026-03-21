/**
 * Tests for pure genre/theme utility functions.
 * No server, no DB, no network — just logic.
 */
import { describe, expect, test } from "bun:test";
import {
  GENRE_EMOJI,
  GENRE_ICON_SLUG,
  GENRE_COLORS,
  getGenreEmoji,
  getGenreIconPath,
  getGenreIcon,
} from "../src/lib/genre-theme";

const EXPECTED_GENRES = [
  "Fantasy", "Sci-Fi", "Horror", "Mystery", "Romance",
  "Adventure", "Thriller", "Comedy", "Drama", "Surreal",
  "Historical", "Dystopia",
];

// ── constant completeness ────────────────────────────────────────────────────

test("GENRE_EMOJI has all expected genres", () => {
  for (const g of EXPECTED_GENRES) {
    expect(GENRE_EMOJI[g]).toBeTruthy();
  }
});

test("GENRE_ICON_SLUG has all expected genres", () => {
  for (const g of EXPECTED_GENRES) {
    expect(GENRE_ICON_SLUG[g]).toBeTruthy();
  }
});

test("GENRE_COLORS has all expected genres with light/dark/border", () => {
  for (const g of EXPECTED_GENRES) {
    const c = GENRE_COLORS[g];
    expect(c).toBeTruthy();
    expect(c.light).toBeTruthy();
    expect(c.dark).toBeTruthy();
    expect(c.border).toBeTruthy();
  }
});

test("GENRE_EMOJI and GENRE_ICON_SLUG have the same keys", () => {
  const emojiKeys = Object.keys(GENRE_EMOJI).sort();
  const slugKeys = Object.keys(GENRE_ICON_SLUG).sort();
  expect(emojiKeys).toEqual(slugKeys);
});

// ── getGenreEmoji ────────────────────────────────────────────────────────────

describe("getGenreEmoji", () => {
  test("returns correct emoji for known genre", () => {
    expect(getGenreEmoji(["Fantasy"])).toBe(GENRE_EMOJI["Fantasy"]);
    expect(getGenreEmoji(["Horror"])).toBe(GENRE_EMOJI["Horror"]);
  });

  test("uses first tag when multiple provided", () => {
    expect(getGenreEmoji(["Sci-Fi", "Horror"])).toBe(GENRE_EMOJI["Sci-Fi"]);
  });

  test("returns book emoji for null", () => {
    expect(getGenreEmoji(null)).toBe("\u{1F4D6}");
  });

  test("returns book emoji for undefined", () => {
    expect(getGenreEmoji(undefined)).toBe("\u{1F4D6}");
  });

  test("returns book emoji for empty array", () => {
    expect(getGenreEmoji([])).toBe("\u{1F4D6}");
  });

  test("returns book emoji for unknown genre", () => {
    expect(getGenreEmoji(["UnknownGenre"])).toBe("\u{1F4D6}");
  });
});

// ── getGenreIconPath ─────────────────────────────────────────────────────────

describe("getGenreIconPath", () => {
  test("returns genre icon path for known genre", () => {
    expect(getGenreIconPath("Fantasy")).toBe("/genres/fantasy-128.png");
    expect(getGenreIconPath("Sci-Fi")).toBe("/genres/sci-fi-128.png");
  });

  test("returns default path for unknown genre", () => {
    expect(getGenreIconPath("Unknown")).toBe("/genres/default-128.png");
  });
});

// ── getGenreIcon ─────────────────────────────────────────────────────────────

describe("getGenreIcon", () => {
  test("returns correct path for known genre tag", () => {
    expect(getGenreIcon(["Mystery"])).toBe("/genres/mystery-128.png");
  });

  test("uses first tag", () => {
    expect(getGenreIcon(["Comedy", "Drama"])).toBe("/genres/comedy-128.png");
  });

  test("returns default for null/undefined/empty", () => {
    expect(getGenreIcon(null)).toBe("/genres/default-128.png");
    expect(getGenreIcon(undefined)).toBe("/genres/default-128.png");
    expect(getGenreIcon([])).toBe("/genres/default-128.png");
  });
});
