const GEMINI_URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
export const GEMINI_MODEL = "gemini-3.6-flash";
/** Used when GEMINI_MODEL is overloaded (429/503 after retries). */
export const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";

export interface GeminiCallOptions {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  /** Gemini structured-output schema; enforces valid JSON of this shape (implies jsonMode). */
  responseSchema?: Record<string, unknown>;
  retries?: number;
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls Gemini with retry/backoff on transient errors (429/5xx, network failures).
 * If the default model is still overloaded after retries, falls back to GEMINI_FALLBACK_MODEL.
 * Returns the raw text of the first candidate.
 */
export async function callGemini(opts: GeminiCallOptions): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  if (opts.model) return callGeminiModel(opts, opts.model, key);
  try {
    return await callGeminiModel(opts, GEMINI_MODEL, key);
  } catch (err) {
    if (!(err instanceof Error) || !/\((429|503)\)/.test(err.message)) throw err;
    console.warn(`[gemini] ${GEMINI_MODEL} overloaded, falling back to ${GEMINI_FALLBACK_MODEL}`);
    return callGeminiModel(opts, GEMINI_FALLBACK_MODEL, key);
  }
}

async function callGeminiModel(opts: GeminiCallOptions, model: string, key: string): Promise<string> {
  const url = `${GEMINI_URL_BASE}/${model}:generateContent?key=${key}`;
  const maxAttempts = (opts.retries ?? 2) + 1;

  let lastError: Error = new Error("Gemini call failed");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: opts.systemPrompt }] },
          contents: [{ parts: [{ text: opts.userPrompt }] }],
          generationConfig: {
            temperature: opts.temperature ?? 0.9,
            maxOutputTokens: opts.maxOutputTokens ?? 2000,
            // Thinking tokens count against maxOutputTokens; at default level they can eat the whole budget.
            thinkingConfig: { thinkingLevel: "low" },
            ...(opts.jsonMode || opts.responseSchema ? { responseMimeType: "application/json" } : {}),
            ...(opts.responseSchema ? { responseSchema: opts.responseSchema } : {}),
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = new Error(`Gemini API error (${res.status}): ${errText}`);
        if (RETRYABLE_STATUS.has(res.status) && attempt < maxAttempts - 1) {
          await sleep(300 * Math.pow(2, attempt));
          continue;
        }
        throw lastError;
      }

      const data = await res.json();
      const parts: { text?: string; thought?: boolean }[] = data.candidates?.[0]?.content?.parts || [];
      const text = parts.filter((p) => !p.thought).map((p) => p.text || "").join("").trim();

      if (!text) {
        lastError = new Error("Empty Gemini response");
        if (attempt < maxAttempts - 1) {
          await sleep(300 * Math.pow(2, attempt));
          continue;
        }
        throw lastError;
      }

      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts - 1) {
        await sleep(300 * Math.pow(2, attempt));
        continue;
      }
    }
  }

  throw lastError;
}

/** Strips markdown code fences (if present) and JSON.parses the result. */
export function parseGeminiJSON<T = unknown>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned) as T;
}
