"use client";

import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Eye, Loader2, Paintbrush, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { authFetch, authJsonHeaders } from "@/lib/supabase-browser";
import ProfileView from "@/components/profile/ProfileView";
import { splitStories, type ProfileAuthor } from "@/lib/profile-data";
import {
  BACKGROUND_KINDS,
  BANNER_KINDS,
  BLOCK_LABELS,
  COLOR_KEYS,
  EFFECT_IDS,
  FONTS,
  FONT_IDS,
  LIVE_BLOCKS,
  PATTERN_IDS,
  STATUS_MAX,
  THEMES,
  THEME_IDS,
  resolveTheme,
  type ColorKey,
  type LayoutItem,
  type ProfileCustomization,
  type ThemeId,
} from "@/lib/profile-theme";
import type { Story } from "@/types";

const COLOR_LABELS: Record<ColorKey, string> = {
  bg: "Page background",
  surface: "Panels",
  text: "Text",
  muted: "Quiet text",
  accent: "Accent",
  link: "Links",
};
const BACKGROUND_LABELS = { solid: "Solid", gradient: "Glow", pattern: "Pattern" } as const;
const BANNER_LABELS = { gradient: "Gradient", pattern: "Pattern" } as const;
const EFFECT_LABELS = { none: "None", sparkles: "Sparkles", scanlines: "Scanlines", rain: "Rain", glow: "Candle glow" } as const;
const PATTERN_LABELS = {
  none: "None", dots: "Dots", grid: "Grid", stars: "Stars", waves: "Waves", diamonds: "Diamonds",
  stripes: "Blinds", paper: "Paper", plaid: "Plaid", hearts: "Hearts",
} as const;

interface ProfileRow {
  id: string;
  slug: string | null;
  pen_name: string;
  bio: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  created_at: string;
}

/** Stylesheet for every preset's heading font, so the theme picker can show each one. */
const PICKER_FONTS_URL = `https://fonts.googleapis.com/css2?${Array.from(
  new Set(THEME_IDS.map((id) => THEMES[id].font.heading))
)
  .map((f) => `family=${FONTS[f].query}`)
  .join("&")}&display=swap`;

export default function ProfileEditorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [custom, setCustom] = useState<ProfileCustomization>({});
  const [pinned, setPinned] = useState<string | null>(null);
  const [ready, setReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?redirect=/account/profile");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([authFetch("/api/profile"), authFetch("/api/profile/customization")]);
        if (!pRes.ok) throw new Error("profile");
        const p: ProfileRow = await pRes.json();
        setProfile(p);
        if (cRes.ok) {
          const c = await cRes.json();
          setCustom(c.customization || {});
          setPinned(c.pinned_story_id || null);
          setReady(c.ready !== false);
        }
        const sRes = await fetch(`/api/stories?author_id=${encodeURIComponent(p.id)}`);
        if (sRes.ok) setStories(await sRes.json());
      } catch {
        setMessage({ kind: "error", text: "Couldn't load your profile. Refresh the page to try again." });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const theme = useMemo(() => resolveTheme(custom), [custom]);

  const author: ProfileAuthor | null = useMemo(() => {
    if (!profile) return null;
    return {
      profileId: profile.id,
      slug: profile.slug || "",
      name: profile.pen_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      walletAddress: profile.wallet_address,
      joined: profile.created_at,
      pinnedStoryId: pinned,
      ...splitStories(stories),
    };
  }, [profile, stories, pinned]);

  const update = (patch: Partial<ProfileCustomization>) => {
    setMessage(null);
    setCustom((c) => ({ ...c, ...patch }));
  };

  /** A new theme brings its own colors, fonts and textures; status and layout stay. */
  const pickTheme = (id: ThemeId) =>
    update({ theme: id, colors: undefined, font: undefined, background: undefined, banner: undefined, effect: undefined });

  const layout = theme.layout.filter((l) => LIVE_BLOCKS.includes(l.block));
  const setLayout = (next: LayoutItem[]) => {
    const reserved = theme.layout.filter((l) => !LIVE_BLOCKS.includes(l.block));
    update({ layout: [...next, ...reserved] });
  };
  const move = (i: number, dir: -1 | 1) => {
    const next = [...layout];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setLayout(next);
  };

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/customization", {
        method: "PUT",
        headers: await authJsonHeaders(),
        body: JSON.stringify({ customization: custom, pinned_story_id: pinned }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save your profile. Try again.");
      setCustom(data.customization || {});
      setMessage({ kind: "ok", text: "Profile saved." });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Couldn't save your profile. Try again." });
    } finally {
      setSaving(false);
    }
  }

  // Links inside the preview would leave the editor and lose unsaved changes.
  const blockPreviewNav = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) e.preventDefault();
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-brand-400" size={28} />
      </div>
    );
  }
  if (!author) {
    return <p className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500">{message?.text || "Sign in to customize your profile."}</p>;
  }

  const seeds = author.seeds;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <link rel="stylesheet" href={PICKER_FONTS_URL} />
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-2xl font-bold flex items-center gap-2 mr-auto">
          <Paintbrush size={22} className="text-brand-400" />
          Customize your profile
        </h1>
        {profile?.slug && (
          <a href={`/author/${profile.slug}`} className="btn-secondary text-sm inline-flex items-center gap-1.5">
            <Eye size={15} /> View your profile
          </a>
        )}
        <button onClick={save} disabled={saving || !ready} className="btn-primary text-sm inline-flex items-center gap-1.5 disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Save profile
        </button>
      </div>

      {!ready && (
        <p className="card mb-5 text-sm border-amber-400/50">
          Profile customization isn&apos;t switched on for this server yet. You can try looks in the preview, but saving
          will work after the next update.
        </p>
      )}
      {message && (
        <p role="status" className={`mb-5 text-sm ${message.kind === "ok" ? "text-green-500" : "text-red-500"}`}>
          {message.text}
        </p>
      )}

      <div className="lg:hidden mb-4 inline-flex rounded-full border border-gray-300 dark:border-gray-700 p-1 text-sm">
        {(["edit", "preview"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={`px-4 py-1.5 rounded-full ${mobileView === v ? "bg-brand-500 text-white" : ""}`}
            aria-pressed={mobileView === v}
          >
            {v === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-start">
        <div className={`space-y-5 ${mobileView === "preview" ? "hidden lg:block" : ""}`}>
          <Section title="Theme" hint="Picking a theme resets colors, fonts and textures.">
            <div className="grid grid-cols-2 gap-2">
              {THEME_IDS.map((id) => {
                const p = THEMES[id];
                const active = theme.theme === id;
                return (
                  <button
                    key={id}
                    onClick={() => pickTheme(id)}
                    aria-pressed={active}
                    className={`text-left rounded-xl p-3 border-2 transition-colors ${active ? "border-brand-500" : "border-transparent"}`}
                    style={{ background: p.colors.bg, color: p.colors.text }}
                  >
                    <span className="block text-2xl leading-none" style={{ fontFamily: FONTS[p.font.heading].stack }}>
                      {p.label}
                    </span>
                    <span className="block text-[11px] mt-1 opacity-80">{p.blurb}</span>
                    <span className="flex gap-1 mt-2" aria-hidden>
                      {[p.colors.accent, p.colors.link, p.colors.surface].map((c) => (
                        <span key={c} className="w-4 h-4 rounded-full border border-black/10" style={{ background: c }} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section
            title="Colors"
            action={custom.colors && <ResetButton onClick={() => update({ colors: undefined })} label="Use theme colors" />}
          >
            <div className="grid grid-cols-2 gap-3">
              {COLOR_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="color"
                    value={theme.colors[key].toLowerCase()}
                    onChange={(e) => update({ colors: { ...custom.colors, [key]: e.target.value.toUpperCase() } })}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-gray-300 dark:border-gray-700"
                  />
                  {COLOR_LABELS[key]}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Fonts" action={custom.font && <ResetButton onClick={() => update({ font: undefined })} label="Use theme fonts" />}>
            <div className="grid grid-cols-2 gap-3">
              {(["heading", "body"] as const).map((slot) => (
                <label key={slot} className="text-sm space-y-1">
                  <span className="block text-gray-500">{slot === "heading" ? "Headings" : "Body text"}</span>
                  <select
                    value={theme.font[slot]}
                    onChange={(e) => update({ font: { ...custom.font, [slot]: e.target.value as keyof typeof FONTS } })}
                    className="input-field"
                  >
                    {FONT_IDS.map((f) => (
                      <option key={f} value={f}>{FONTS[f].label}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Background and banner">
            <div className="space-y-4">
              <Choice
                label="Page background"
                options={BACKGROUND_KINDS}
                labels={BACKGROUND_LABELS}
                value={theme.background.kind}
                onChange={(kind) => update({ background: { ...custom.background, kind } })}
              />
              {theme.background.kind === "pattern" && (
                <PatternSelect value={theme.background.pattern} onChange={(pattern) => update({ background: { ...custom.background, pattern } })} />
              )}
              <Choice
                label="Banner"
                options={BANNER_KINDS}
                labels={BANNER_LABELS}
                value={theme.banner.kind}
                onChange={(kind) => update({ banner: { ...custom.banner, kind } })}
              />
              {theme.banner.kind === "pattern" && (
                <PatternSelect value={theme.banner.pattern} onChange={(pattern) => update({ banner: { ...custom.banner, pattern } })} />
              )}
              <Choice label="Effect" options={EFFECT_IDS} labels={EFFECT_LABELS} value={theme.effect} onChange={(effect) => update({ effect })} />
              <p className="text-xs text-gray-500">Effects stay still for readers who turn off motion on their device.</p>
            </div>
          </Section>

          <Section title="Status" hint="A line under your name, like what you're writing right now.">
            <input
              type="text"
              value={custom.status || ""}
              maxLength={STATUS_MAX}
              onChange={(e) => update({ status: e.target.value })}
              placeholder="Currently writing a ghost story set on a night train"
              className="input-field"
            />
            <p className="text-right text-xs text-gray-500 mt-1">{(custom.status || "").length}/{STATUS_MAX}</p>
          </Section>

          <Section title="Featured tale" hint="Shown near the top of your profile.">
            {seeds.length ? (
              <select value={pinned || ""} onChange={(e) => { setMessage(null); setPinned(e.target.value || null); }} className="input-field">
                <option value="">Your most-loved seed (automatic)</option>
                {seeds.map((s) => (
                  <option key={s.id} value={s.id}>{s.title || "Untitled"}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500">
                Plant a seed and you can feature it here. <a href="/submit" className="text-brand-400 underline">Write a story</a>
              </p>
            )}
          </Section>

          <Section title="Sections" hint="Choose what readers see and in what order. Your header always comes first.">
            <ul className="space-y-2">
              {layout.map((item, i) => (
                <li key={item.block} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                  <label className="flex items-center gap-2 flex-1 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.visible}
                      onChange={(e) => setLayout(layout.map((l, k) => (k === i ? { ...l, visible: e.target.checked } : l)))}
                    />
                    <span className={item.visible ? "" : "text-gray-500 line-through"}>{BLOCK_LABELS[item.block]}</span>
                  </label>
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30" aria-label={`Move ${BLOCK_LABELS[item.block]} up`}>
                    <ArrowUp size={15} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === layout.length - 1} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30" aria-label={`Move ${BLOCK_LABELS[item.block]} down`}>
                    <ArrowDown size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className={`lg:sticky lg:top-20 ${mobileView === "edit" ? "hidden lg:block" : ""}`}>
          <p className="text-xs text-gray-500 mb-2">Live preview. Links are paused here so you don&apos;t lose changes.</p>
          <div
            className="rounded-2xl overflow-auto border border-gray-200 dark:border-gray-700 lg:h-[calc(100vh-8rem)]"
            onClickCapture={blockPreviewNav}
          >
            <ProfileView author={author} theme={theme} preview />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <h2 className="font-semibold">{title}</h2>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ResetButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="text-xs text-gray-500 hover:text-brand-400 inline-flex items-center gap-1">
      <RotateCcw size={12} /> {label}
    </button>
  );
}

function Choice<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm text-gray-500 mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={`px-3 py-1.5 rounded-full text-sm border ${value === o ? "bg-brand-500 text-white border-brand-500" : "border-gray-300 dark:border-gray-700"}`}
          >
            {labels[o]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function PatternSelect({ value, onChange }: { value: (typeof PATTERN_IDS)[number]; onChange: (v: (typeof PATTERN_IDS)[number]) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as (typeof PATTERN_IDS)[number])} className="input-field" aria-label="Pattern">
      {PATTERN_IDS.map((p) => (
        <option key={p} value={p}>{PATTERN_LABELS[p]}</option>
      ))}
    </select>
  );
}
