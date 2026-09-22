const GEMINI_URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiCallOptions {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  retries?: number;
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls Gemini with retry/backoff on transient errors (429/5xx, network failures).
 * Returns the raw text of the first candidate.
 */
export async function callGemini(opts: GeminiCallOptions): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = opts.model || "gemini-2.5-flash";
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
            ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
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
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

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
