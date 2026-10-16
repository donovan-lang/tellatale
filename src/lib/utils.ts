export function toAuthorSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/ +/g, "-")
    .slice(0, 80);
}

/**
 * Splits story text into readable paragraphs. Uses the author's/model's own line breaks
 * when present; otherwise breaks a single wall of text every ~3 sentences and gives
 * dialogue its own paragraph. Client- and server-safe.
 */
export function toParagraphs(text: string): string[] {
  const existing = text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  if (existing.length > 1 || text.length < 400) return existing;

  const sentences = text.match(/[^.!?…]+(?:[.!?…]+["”’)]*|$)/g)?.map((s) => s.trim()).filter(Boolean) || [text];
  const paragraphs: string[] = [];
  let current: string[] = [];
  let currentIsDialogue = false;
  for (const sentence of sentences) {
    const isDialogue = /^["“]/.test(sentence);
    if (current.length && (current.length >= 3 || isDialogue || currentIsDialogue)) {
      paragraphs.push(current.join(" "));
      current = [];
    }
    current.push(sentence);
    currentIsDialogue = isDialogue;
  }
  if (current.length) paragraphs.push(current.join(" "));
  return paragraphs;
}

/** toParagraphs joined back with blank lines, for storing generated text. */
export function formatParagraphs(text: string): string {
  return toParagraphs(text).join("\n\n");
}
