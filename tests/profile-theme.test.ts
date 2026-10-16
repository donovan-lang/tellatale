/**
 * Tests for the writer-profile customization whitelist and theme resolution.
 * No server, no DB, no network — just logic.
 */
import { describe, expect, test } from "bun:test";
import {
  BLOCK_IDS,
  STATUS_MAX,
  THEMES,
  normalizeLayout,
  readableOn,
  resolveTheme,
  sanitizeCustomization,
  themeToCssVars,
  toRoman,
} from "../src/lib/profile-theme";

describe("sanitizeCustomization", () => {
  test("non-objects become empty", () => {
    expect(sanitizeCustomization(null)).toEqual({});
    expect(sanitizeCustomization("gothic")).toEqual({});
    expect(sanitizeCustomization([1, 2])).toEqual({});
  });

  test("keeps valid values and drops unknown keys", () => {
    const out = sanitizeCustomization({
      theme: "gothic",
      colors: { accent: "#ff00aa", bg: "#123456" },
      font: { heading: "pirata", body: "lora" },
      effect: "glow",
      html: "<script>alert(1)</script>",
      css: "body{display:none}",
    });
    expect(out).toEqual({
      theme: "gothic",
      colors: { accent: "#FF00AA", bg: "#123456" },
      font: { heading: "pirata", body: "lora" },
      effect: "glow",
    });
  });

  test("rejects colors that aren't 6-digit hex (no CSS injection)", () => {
    const out = sanitizeCustomization({
      colors: { accent: "red", bg: "#fff", text: "#000000; background:url(x)", link: "url(javascript:1)", surface: "#ABCDEF" },
    });
    expect(out.colors).toEqual({ surface: "#ABCDEF" });
  });

  test("rejects unknown enum values", () => {
    const out = sanitizeCustomization({
      theme: "myspace",
      font: { heading: "Comic Sans" },
      background: { kind: "image", pattern: "url(x)" },
      banner: { kind: "video" },
      effect: "marquee",
    });
    expect(out).toEqual({});
  });

  test("status is trimmed, stripped of brackets/control chars, and capped", () => {
    expect(sanitizeCustomization({ status: "  writing <b>a ghost</b>\nstory  " }).status).toBe("writing ba ghost/bstory");
    expect(sanitizeCustomization({ status: "x".repeat(200) }).status!.length).toBe(STATUS_MAX);
    expect(sanitizeCustomization({ status: "   " }).status).toBeUndefined();
  });

  test("layout keeps known blocks once, in order", () => {
    const out = sanitizeCustomization({
      layout: [
        { block: "badges", visible: false },
        { block: "nope", visible: true },
        { block: "badges", visible: true },
        { block: "featured" },
        "chapters",
      ],
    });
    expect(out.layout).toEqual([
      { block: "badges", visible: false },
      { block: "featured", visible: true },
    ]);
  });
});

describe("resolveTheme", () => {
  test("null customization gets the default preset and every block", () => {
    const t = resolveTheme(null);
    expect(t.theme).toBe("storybook");
    expect(t.colors).toEqual(THEMES.storybook.colors);
    expect(t.layout.map((l) => l.block)).toEqual([...BLOCK_IDS]);
  });

  test("overrides merge over the chosen preset", () => {
    const t = resolveTheme({ theme: "noir", colors: { accent: "#00FF00" } });
    expect(t.colors.accent).toBe("#00FF00");
    expect(t.colors.bg).toBe(THEMES.noir.colors.bg);
    expect(t.font).toEqual(THEMES.noir.font);
  });

  test("normalizeLayout appends blocks a saved layout doesn't mention", () => {
    const l = normalizeLayout([{ block: "stories", visible: false }]);
    expect(l[0]).toEqual({ block: "stories", visible: false });
    expect(l).toHaveLength(BLOCK_IDS.length);
  });
});

describe("rendering helpers", () => {
  test("css vars contain only validated values", () => {
    const vars = themeToCssVars(resolveTheme({ theme: "cyberpunk" }));
    expect(vars["--p-accent"]).toBe(THEMES.cyberpunk.colors.accent);
    expect(vars["--p-bg-image"]).toStartWith('url("data:image/svg+xml,');
  });

  test("readableOn picks dark text on light colors and light on dark", () => {
    expect(readableOn("#FFFFFF")).toBe("#141414");
    expect(readableOn("#F2A007")).toBe("#141414");
    expect(readableOn("#120D14")).toBe("#FFFFFF");
  });

  test("toRoman", () => {
    expect(toRoman(1)).toBe("I");
    expect(toRoman(4)).toBe("IV");
    expect(toRoman(9)).toBe("IX");
    expect(toRoman(14)).toBe("XIV");
  });
});
