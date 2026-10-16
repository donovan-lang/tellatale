// Rupert: indie.io's self-hosted LLM (Open WebUI, OpenAI-compatible API).
const RUPERT_URL = "https://rupert.indieio.dev/api/v1/chat/completions";
export const RUPERT_MODEL = process.env.RUPERT_MODEL || "qwen3.8:27b";

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const REQUEST_TIMEOUT_MS = 120_000;

export interface RupertCallOptions {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  /** Gemini-style schema; Rupert can't enforce it, so it's described in the prompt instead. */
  responseSchema?: Record<string, unknown>;
  retries?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Renders a Gemini-style schema ({type:"OBJECT", properties, ...}) as an example JSON shape. */
function describeSchema(schema: Record<string, any>): string {
  switch (String(schema.type).toUpperCase()) {
    case "OBJECT": {
      const props = Object.entries(schema.properties || {}).map(
        ([k, v]) => `"${k}": ${describeSchema(v as Record<string, any>)}`
      );
      return `{${props.join(", ")}}`;
    }
    case "ARRAY":
      return `[${describeSchema(schema.items || { type: "STRING" })}, ...]`;
    case "INTEGER":
    case "NUMBER":
      return "number";
    case "BOOLEAN":
      return "boolean";
    default:
      return schema.enum ? (schema.enum as string[]).map((e) => `"${e}"`).join(" | ") : "string";
  }
}

/** Removes reasoning blocks some Rupert models emit before the answer. */
function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export async function callRupert(opts: RupertCallOptions): Promise<string> {
  const key = process.env.RUPERT_API_KEY;
  if (!key) throw new Error("RUPERT_API_KEY not configured");

  let systemPrompt = opts.systemPrompt;
  if (opts.responseSchema) {
    systemPrompt +=
      `\n\nRespond with ONLY a JSON object of this shape (no markdown fences, no extra text):\n` +
      describeSchema(opts.responseSchema);
  } else if (opts.jsonMode) {
    systemPrompt += "\n\nRespond with ONLY valid JSON (no markdown fences, no extra text).";
  }

  const maxAttempts = (opts.retries ?? 2) + 1;
  let lastError: Error = new Error("Rupert call failed");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(RUPERT_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          model: opts.model || RUPERT_MODEL,
          stream: false,
          temperature: opts.temperature ?? 0.9,
          // Headroom for models that reason before answering.
          max_tokens: (opts.maxOutputTokens ?? 2000) * 2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: opts.userPrompt },
          ],
          options: { num_ctx: 16384 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = new Error(`Rupert API error (${res.status}): ${errText}`);
        if (RETRYABLE_STATUS.has(res.status) && attempt < maxAttempts - 1) {
          await sleep(500 * Math.pow(2, attempt));
          continue;
        }
        throw lastError;
      }

      const data = await res.json();
      const text = stripThink(data.choices?.[0]?.message?.content || "");
      if (!text) {
        lastError = new Error("Empty Rupert response");
        if (attempt < maxAttempts - 1) {
          await sleep(500 * Math.pow(2, attempt));
          continue;
        }
        throw lastError;
      }
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Don't retry auth/bad-request errors
      if (/\((400|401|403|404)\)/.test(lastError.message)) throw lastError;
      if (attempt < maxAttempts - 1) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
    }
  }

  throw lastError;
}
