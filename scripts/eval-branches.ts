/**
 * Branch-generation eval: does deep-path generation still honor the person's input?
 *
 *   npx tsx scripts/eval-branches.ts [depth=4]
 *
 * For each case: generate one seed with the production generate-tale prompt, then walk
 * `depth` branch levels (always taking branch 1) twice from the same seed:
 *   - "no bible":   branch prompt as it was before the story bible existed
 *   - "bible":      same, plus the story bible + author's original idea
 * Scores the deepest levels and writes scripts/output/eval-branches-<ts>.html.
 */
import * as fs from "fs";
import * as path from "path";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

import { callGemini as rawCallGemini, parseGeminiJSON } from "../src/lib/gemini";
import { buildGenreCraftBlock } from "../src/lib/genre-craft";
import {
  buildBranchPromptWithContext,
  buildNarrativeContext,
  formatBible,
  generateStoryBible,
  type StoryBible,
  type StoryNode,
} from "../src/lib/story_engine";

const DEPTH = Number(process.argv[2]) || 4;

// The API key is on Google's free tier (~5 RPM flash / 15 RPM lite), so space calls out.
const MIN_GAP_MS = 6000;
let nextSlot = 0;
async function callGemini(opts: Parameters<typeof rawCallGemini>[0]) {
  const wait = Math.max(0, nextSlot - Date.now());
  nextSlot = Math.max(nextSlot, Date.now()) + MIN_GAP_MS;
  if (wait) await new Promise((r) => setTimeout(r, wait));
  return rawCallGemini({ retries: 1, ...opts });
}

const readConst = (file: string, name: string) =>
  fs.readFileSync(file, "utf8").match(new RegExp(`const ${name} = \`([\\s\\S]*?)\`;`))![1];
const SEED_SYSTEM = readConst("src/app/api/generate-tale/route.ts", "SYSTEM_PROMPT");
const BRANCH_SYSTEM = readConst("src/app/api/branches/generate/route.ts", "SYSTEM_PROMPT");

const CASES = [
  { idea: "A lighthouse keeper named Maren finds a letter in her own handwriting dated tomorrow, warning her not to light the lamp.", genre: "Mystery", tone: "mysterious", details: ["Maren", "letter", "lamp", "lighthouse"] },
  { idea: "A retired dragon runs a bakery in a small mountain town and a knight shows up demanding a duel over a burnt croissant.", genre: "Comedy", tone: "whimsical", details: ["dragon", "bakery", "knight", "croissant"] },
  { idea: "On a generation ship, 14-year-old Idris discovers the 'stars' outside the viewport are a screen, and one pixel is dead.", genre: "Sci-Fi", tone: "tense", details: ["Idris", "screen", "pixel", "ship"] },
  { idea: "A 1920s jazz singer in Chicago realizes the mobster who owns her club is the ghost of her murdered brother.", genre: "Noir", tone: "gritty", details: ["jazz", "club", "brother", "ghost"] },
  { idea: "Two rival botanists are snowed in at an Antarctic research station with one seed vault key between them.", genre: "Romance", tone: "romantic", details: ["botanist", "station", "seed", "key"] },
];

const BRANCH_SCHEMA = {
  type: "OBJECT",
  properties: {
    branches: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { teaser: { type: "STRING" }, content: { type: "STRING" } },
        required: ["teaser", "content"],
      },
    },
  },
  required: ["branches"],
};
const SEED_SCHEMA = {
  type: "OBJECT",
  properties: { title: { type: "STRING" }, content: { type: "STRING" }, tags: { type: "ARRAY", items: { type: "STRING" } } },
  required: ["title", "content", "tags"],
};

type Variant = "no bible" | "bible";

async function walk(seed: StoryNode, bible: StoryBible | null, variant: Variant): Promise<StoryNode[]> {
  const nodes: StoryNode[] = [seed];
  for (let level = 1; level <= DEPTH; level++) {
    const current = nodes[nodes.length - 1];
    const bibleBlock = variant === "bible" ? formatBible(bible, seed.metadata?.seed_input) : "";
    const userPrompt = buildBranchPromptWithContext(
      current.title || seed.title || "Untitled",
      current.content,
      { nodes, full_context: buildNarrativeContext(nodes), choices_made: [] },
      seed.tags || [],
      bibleBlock
    );
    const raw = await callGemini({ systemPrompt: BRANCH_SYSTEM, userPrompt, temperature: 0.9, maxOutputTokens: 2000, responseSchema: BRANCH_SCHEMA });
    const { branches } = parseGeminiJSON<{ branches: { teaser: string; content: string }[] }>(raw);
    const b = branches[0];
    nodes.push({
      id: `${variant}-${level}`, title: null, content: b.content, teaser: b.teaser,
      parent_id: current.id, tags: seed.tags, author_name: "TaleBot", story_type: "branch",
    });
  }
  return nodes;
}

// ── scoring ────────────────────────────────────────────────────────────────
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const has = (text: string, term: string) => text.toLowerCase().includes(term.toLowerCase());
const secondPerson = (s: string) => (s.match(/\byou(r|rs|rself)?\b/gi)?.length || 0) / Math.max(1, wordCount(s)) > 0.015;
const firstName = (n: string) => n.replace(/^(the|a|an)\s+/i, "").split(/[\s,]/)[0];

function score(nodes: StoryNode[], c: (typeof CASES)[number], bible: StoryBible | null) {
  const deep = nodes.slice(-2).map((n) => n.content).join("\n");
  const last = nodes[nodes.length - 1].content;
  const seedChars = (bible?.characters || []).map((ch) => firstName(ch.name)).filter((n) => /^[A-Z]/.test(n));
  const branchWords = nodes.slice(1).map((n) => wordCount(n.content));
  return {
    details: c.details.filter((d) => has(deep, d)).length,
    detailsTotal: c.details.length,
    leadKept: seedChars.length ? has(last, seedChars[0]) : null,
    castKept: seedChars.filter((n) => has(deep, n)).length,
    castTotal: seedChars.length,
    povKept: secondPerson(nodes[0].content) === secondPerson(last),
    lengthOk: branchWords.filter((w) => w >= 200 && w <= 400).length,
    lengthTotal: branchWords.length,
  };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);

(async () => {
  console.log(`Depth ${DEPTH}, ${CASES.length} cases, 2 variants each…`);
  const runs = [];
  for (const [i, c] of CASES.entries()) {
    runs.push(await (async () => {
      try {
        const seedRaw = await callGemini({
          systemPrompt: SEED_SYSTEM + buildGenreCraftBlock(c.genre),
          userPrompt: `Generate a story seed based on this idea:\n\n"${c.idea}"\n\nGenre: ${c.genre}\nTone: ${c.tone}`,
          temperature: 0.9, maxOutputTokens: 2048, responseSchema: SEED_SCHEMA,
        });
        const s = parseGeminiJSON<{ title: string; content: string; tags: string[] }>(seedRaw);
        const seed: StoryNode = {
          id: `seed-${i}`, title: s.title, content: s.content, teaser: null, parent_id: null,
          tags: s.tags.length ? s.tags : [c.genre], author_name: "eval", story_type: "seed",
          metadata: { seed_input: { idea: c.idea, genre: c.genre, tone: c.tone } },
        };
        const bible = await generateStoryBible(seed);
        const plain = await walk(seed, bible, "no bible");
        const withBible = await walk(seed, bible, "bible");
        console.log(`  ✓ case ${i + 1} (${c.genre})`);
        return { c, seed, bible, plain, withBible, sPlain: score(plain, c, bible), sBible: score(withBible, c, bible) };
      } catch (err) {
        console.log(`  ✗ case ${i + 1} (${c.genre}): ${String(err).slice(0, 160)}`);
        return null;
      }
    })());
  }
  const ok = runs.filter((r): r is NonNullable<typeof r> => !!r);

  const agg = (key: "sPlain" | "sBible") => {
    const sum = (f: (s: ReturnType<typeof score>) => number) => ok.reduce((a, r) => a + f(r[key]), 0);
    const leads = ok.filter((r) => r[key].leadKept !== null);
    return {
      "idea details (last 2 levels)": `${sum((s) => s.details)}/${sum((s) => s.detailsTotal)}`,
      "lead character in final level": `${leads.filter((r) => r[key].leadKept).length}/${leads.length}`,
      "seed cast in last 2 levels": `${sum((s) => s.castKept)}/${sum((s) => s.castTotal)}`,
      "POV kept": `${sum((s) => (s.povKept ? 1 : 0))}/${ok.length}`,
      "branches 200–400 words": `${sum((s) => s.lengthOk)}/${sum((s) => s.lengthTotal)}`,
    };
  };
  const summary = { "no bible": agg("sPlain"), bible: agg("sBible") };
  console.log(`\nSUMMARY (${ok.length}/${CASES.length} cases completed)`);
  console.table(summary);

  const col = (label: string, nodes: StoryNode[]) =>
    `<div class="col"><h3>${label}</h3>${nodes.slice(1).map((n, k) => `<div class="lvl"><div class="teaser">Level ${k + 1}: ${esc(n.teaser || "")}</div>${n.content.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}</div>`).join("")}</div>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Branch Eval</title><style>
:root{--bg:#faf8f5;--fg:#1d1b18;--muted:#6b645b;--card:#fff;--line:#e6e0d7}
@media (prefers-color-scheme:dark){:root{--bg:#161412;--fg:#ece7e0;--muted:#a39b90;--card:#201d1a;--line:#35302a}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 Georgia,serif;padding:24px 16px}h1,h2,h3,table,.teaser,summary{font-family:system-ui,sans-serif}
table{border-collapse:collapse;margin:12px 0 32px}th,td{border-bottom:1px solid var(--line);padding:6px 12px;text-align:left}
.case{margin-bottom:40px}.idea{color:var(--muted);font-style:italic}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}
.col{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px}.col h3{margin:0 0 8px}.lvl{border-top:1px solid var(--line);padding-top:8px;margin-top:8px}
.teaser{font-size:13px;color:var(--muted);font-weight:600}details{margin:8px 0}pre{white-space:pre-wrap;font-size:13px}
</style></head><body><h1>Branch eval — depth ${DEPTH}</h1>
<table><tr><th>Metric</th><th>No bible</th><th>Bible</th></tr>${Object.keys(summary["no bible"]).map((k) => `<tr><td>${k}</td><td>${(summary["no bible"] as any)[k]}</td><td>${(summary.bible as any)[k]}</td></tr>`).join("")}</table>
${ok.map((r, i) => `<div class="case"><h2>${i + 1}. ${esc(r.c.genre)} — ${esc(r.seed.title || "")}</h2><p class="idea">"${esc(r.c.idea)}"</p>
<details><summary>Seed + bible</summary><pre>${esc(r.seed.content)}\n\n${esc(JSON.stringify(r.bible, null, 2))}</pre></details>
<div class="grid">${col("No bible", r.plain)}${col("Bible", r.withBible)}</div></div>`).join("")}
</body></html>`;
  fs.mkdirSync(path.join("scripts", "output"), { recursive: true });
  const out = path.join("scripts", "output", `eval-branches-${new Date().toISOString().replace(/[:.]/g, "-")}.html`);
  fs.writeFileSync(out, html);
  console.log(`\nWrote ${out}`);
})();
