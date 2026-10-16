/**
 * Side-by-side story-seed comparison: Gemini vs Claude, using the exact
 * production system prompt + genre-craft block from /api/generate-tale.
 *
 *   npx tsx scripts/compare-models.ts
 *
 * Needs GEMINI_API_KEY; Claude models run only if ANTHROPIC_API_KEY is set (env or .env.local).
 * Writes scripts/output/compare-<timestamp>.html and prints a summary.
 */
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { buildGenreCraftBlock } from "../src/lib/genre-craft";
import { GEMINI_MODEL, GEMINI_FALLBACK_MODEL } from "../src/lib/gemini";

// ── env ────────────────────────────────────────────────────────────────────
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const HAS_CLAUDE = !!process.env.ANTHROPIC_API_KEY;
if (!HAS_CLAUDE) console.log("ANTHROPIC_API_KEY not set — running Gemini only.");

// ── production prompt (read from the route so this never drifts) ───────────
const routeSrc = fs.readFileSync("src/app/api/generate-tale/route.ts", "utf8");
const SYSTEM_PROMPT = routeSrc.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/)![1];

function buildUserPrompt(idea: string, genre: string, tone: string) {
  return (
    `Generate a story seed based on this idea:\n\n"${idea}"\n\nGenre: ${genre}\nTone: ${tone}` +
    "\n\nRemember: respond with ONLY the JSON object, no markdown fences."
  );
}

// Each case lists concrete details from the idea; we check whether the story uses them.
const CASES = [
  { idea: "A lighthouse keeper named Maren finds a letter in her own handwriting dated tomorrow, warning her not to light the lamp.", genre: "Mystery", tone: "mysterious", details: ["Maren", "letter", "lamp", "tomorrow"] },
  { idea: "A retired dragon runs a bakery in a small mountain town and a knight shows up demanding a duel over a burnt croissant.", genre: "Comedy", tone: "whimsical", details: ["dragon", "bakery", "knight", "croissant"] },
  { idea: "On a generation ship, 14-year-old Idris discovers the 'stars' outside the viewport are a screen, and one pixel is dead.", genre: "Sci-Fi", tone: "tense", details: ["Idris", "screen", "pixel", "ship"] },
  { idea: "A 1920s jazz singer in Chicago realizes the mobster who owns her club is the ghost of her murdered brother.", genre: "Noir", tone: "gritty", details: ["jazz", "Chicago", "brother", "ghost"] },
  { idea: "Two rival botanists are snowed in at an Antarctic research station with one seed vault key between them.", genre: "Romance", tone: "romantic", details: ["botanist", "Antarctic", "seed", "key"] },
];

const StorySchema = z.object({ title: z.string(), content: z.string(), tags: z.array(z.string()) });
type Story = z.infer<typeof StorySchema>;

interface Result {
  model: string;
  servedBy: string;
  story?: Story;
  error?: string;
  ms: number;
  inTok: number;
  outTok: number;
  costUsd?: number;
}

// ── Gemini (mirrors callGemini config: thinking low + response schema) ─────
async function runGemini(system: string, user: string): Promise<Result> {
  const t0 = Date.now();
  const schema = {
    type: "OBJECT",
    properties: { title: { type: "STRING" }, content: { type: "STRING" }, tags: { type: "ARRAY", items: { type: "STRING" } } },
    required: ["title", "content", "tags"],
  };
  let lastErr = "";
  for (const model of [GEMINI_MODEL, GEMINI_FALLBACK_MODEL]) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ parts: [{ text: user }] }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 2048,
              thinkingConfig: { thinkingLevel: "low" },
              responseMimeType: "application/json",
              responseSchema: schema,
            },
          }),
        }
      );
      const j: any = await res.json();
      if (!res.ok) {
        lastErr = `${model}: ${j.error?.code} ${j.error?.message?.slice(0, 80)}`;
        if (res.status === 429 || res.status === 503) {
          await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
          continue;
        }
        break;
      }
      const parts = j.candidates?.[0]?.content?.parts || [];
      const text = parts.filter((p: any) => !p.thought).map((p: any) => p.text || "").join("");
      const u = j.usageMetadata || {};
      try {
        return {
          model: "Gemini (prod)",
          servedBy: model,
          story: StorySchema.parse(JSON.parse(text)),
          ms: Date.now() - t0,
          inTok: u.promptTokenCount || 0,
          outTok: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0),
        };
      } catch {
        return { model: "Gemini (prod)", servedBy: model, error: "invalid JSON", ms: Date.now() - t0, inTok: 0, outTok: 0 };
      }
    }
  }
  return { model: "Gemini (prod)", servedBy: "-", error: lastErr, ms: Date.now() - t0, inTok: 0, outTok: 0 };
}

// ── Claude ─────────────────────────────────────────────────────────────────
const anthropic = HAS_CLAUDE ? new Anthropic() : (null as unknown as Anthropic);
const CLAUDE_PRICING: Record<string, [number, number]> = {
  "claude-sonnet-5": [2, 10],
  "claude-haiku-4-5": [1, 5],
};

async function runClaude(model: string, label: string, system: string, user: string): Promise<Result> {
  const t0 = Date.now();
  try {
    const response = await anthropic.messages.parse({
      model,
      max_tokens: 16000,
      system,
      messages: [{ role: "user", content: user }],
      output_config: {
        format: zodOutputFormat(StorySchema),
        // Creative seeds don't need deep reasoning; medium keeps cost/latency sane. Haiku 4.5 has no effort param.
        ...(model === "claude-haiku-4-5" ? {} : { effort: "medium" as const }),
      },
    });
    const [pin, pout] = CLAUDE_PRICING[model];
    const inTok = response.usage.input_tokens;
    const outTok = response.usage.output_tokens;
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return { model: label, servedBy: model, error: `stop_reason=${response.stop_reason}`, ms: Date.now() - t0, inTok, outTok };
    }
    return {
      model: label,
      servedBy: model,
      story: response.parsed_output,
      ms: Date.now() - t0,
      inTok,
      outTok,
      costUsd: (inTok * pin + outTok * pout) / 1e6,
    };
  } catch (err) {
    const msg = err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : String(err);
    return { model: label, servedBy: model, error: msg.slice(0, 200), ms: Date.now() - t0, inTok: 0, outTok: 0 };
  }
}

// ── scoring helpers ────────────────────────────────────────────────────────
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const hits = (s: string, details: string[]) => details.filter((d) => s.toLowerCase().includes(d.toLowerCase()));
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// ── main ───────────────────────────────────────────────────────────────────
(async () => {
  const rows: { c: (typeof CASES)[number]; results: Result[] }[] = [];
  for (const [i, c] of CASES.entries()) {
    const system = SYSTEM_PROMPT + buildGenreCraftBlock(c.genre);
    const user = buildUserPrompt(c.idea, c.genre, c.tone);
    console.log(`[${i + 1}/${CASES.length}] ${c.genre}: ${c.idea.slice(0, 60)}…`);
    const results = await Promise.all([
      runGemini(system, user),
      ...(HAS_CLAUDE
        ? [
            runClaude("claude-sonnet-5", "Claude Sonnet 5", system, user),
            runClaude("claude-haiku-4-5", "Claude Haiku 4.5", system, user),
          ]
        : []),
    ]);
    for (const r of results) {
      const s = r.story;
      console.log(
        `   ${r.model.padEnd(17)} ${s ? `${words(s.content)}w  details ${hits(s.content, c.details).length}/${c.details.length}` : "ERROR " + r.error}  ${(r.ms / 1000).toFixed(1)}s${r.costUsd != null ? `  $${r.costUsd.toFixed(4)}` : ""}${r.servedBy !== r.model && r.model.startsWith("Gemini") ? `  [${r.servedBy}]` : ""}`
      );
    }
    rows.push({ c, results });
  }

  // summary per model
  const labels = rows[0].results.map((r) => r.model);
  const summary = labels.map((label, k) => {
    const rs = rows.map((row) => row.results[k]);
    const ok = rs.filter((r) => r.story);
    const avg = (f: (r: Result) => number) => (ok.length ? ok.reduce((a, r) => a + f(r), 0) / ok.length : 0);
    const inRange = ok.filter((r) => { const w = words(r.story!.content); return w >= 400 && w <= 800; }).length;
    const detailHits = rows.reduce((a, row) => a + (row.results[k].story ? hits(row.results[k].story!.content, row.c.details).length : 0), 0);
    const detailTotal = rows.reduce((a, row) => a + row.c.details.length, 0);
    return {
      label,
      ok: `${ok.length}/${rs.length}`,
      avgWords: Math.round(avg((r) => words(r.story!.content))),
      inRange: `${inRange}/${ok.length}`,
      details: `${detailHits}/${detailTotal}`,
      avgSec: (avg((r) => r.ms) / 1000).toFixed(1),
      avgCost: ok[0]?.costUsd != null ? `$${avg((r) => r.costUsd || 0).toFixed(4)}` : "see Google pricing",
      servedBy: [...new Set(rs.map((r) => r.servedBy))].join(", "),
    };
  });
  console.log("\nSUMMARY");
  console.table(summary);

  // HTML
  const card = (r: Result, c: (typeof CASES)[number]) => {
    if (!r.story) return `<div class="card err"><h3>${esc(r.model)}</h3><p>Error: ${esc(r.error || "")}</p></div>`;
    const w = words(r.story.content);
    const h = hits(r.story.content, c.details);
    return `<div class="card">
      <h3>${esc(r.model)}${r.model.startsWith("Gemini") ? ` <small>${esc(r.servedBy)}</small>` : ""}</h3>
      <div class="meta"><span class="${w >= 400 && w <= 800 ? "good" : "bad"}">${w} words</span>
        <span class="${h.length === c.details.length ? "good" : "bad"}">details ${h.length}/${c.details.length}</span>
        <span>${(r.ms / 1000).toFixed(1)}s</span>${r.costUsd != null ? `<span>$${r.costUsd.toFixed(4)}</span>` : ""}
        <span>tags: ${esc(r.story.tags.join(", "))}</span></div>
      <h4>${esc(r.story.title)}</h4>
      ${r.story.content.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}
    </div>`;
  };
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Story Model Comparison</title><style>
:root{--bg:#faf8f5;--fg:#1d1b18;--muted:#6b645b;--card:#fff;--line:#e6e0d7;--good:#1f7a4d;--bad:#b4462b}
@media (prefers-color-scheme:dark){:root{--bg:#161412;--fg:#ece7e0;--muted:#a39b90;--card:#201d1a;--line:#35302a;--good:#5fc795;--bad:#f08a6c}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 Georgia,serif;padding:24px 16px}
h1,h2,h3,.meta,table{font-family:system-ui,sans-serif}h1{margin:0 0 4px}.sub{color:var(--muted);margin:0 0 24px}
table{border-collapse:collapse;margin-bottom:32px;font-size:14px;width:100%;max-width:1000px}th,td{border-bottom:1px solid var(--line);padding:6px 10px;text-align:left}
.case{margin-bottom:48px}.case h2{font-size:17px;margin-bottom:4px}.idea{color:var(--muted);margin:0 0 12px;font-style:italic}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px}.card h3{margin:0 0 6px;font-size:15px}.card h3 small{color:var(--muted);font-weight:400}
.card h4{margin:10px 0 6px;font-size:17px}.meta{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12px;color:var(--muted)}
.good{color:var(--good)}.bad{color:var(--bad)}.err{border-color:var(--bad)}
</style></head><body>
<h1>Story model comparison</h1><p class="sub">Same production system prompt + genre craft for every model · target 400–800 words · ${new Date().toLocaleString()}</p>
<table><tr><th>Model</th><th>Succeeded</th><th>Avg words</th><th>In 400–800</th><th>Prompt details used</th><th>Avg time</th><th>Avg cost</th><th>Served by</th></tr>
${summary.map((s) => `<tr><td>${s.label}</td><td>${s.ok}</td><td>${s.avgWords}</td><td>${s.inRange}</td><td>${s.details}</td><td>${s.avgSec}s</td><td>${s.avgCost}</td><td>${esc(s.servedBy)}</td></tr>`).join("")}
</table>
${rows.map(({ c, results }, i) => `<div class="case"><h2>${i + 1}. ${esc(c.genre)} · ${esc(c.tone)}</h2><p class="idea">"${esc(c.idea)}"</p>
<div class="grid">${results.map((r) => card(r, c)).join("")}</div></div>`).join("")}
</body></html>`;
  const outDir = path.join("scripts", "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `compare-${new Date().toISOString().replace(/[:.]/g, "-")}.html`);
  fs.writeFileSync(outFile, html);
  console.log(`\nWrote ${outFile}`);
})();
