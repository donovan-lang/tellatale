import { createServiceClient } from "./supabase-server";
import { callGemini, parseGeminiJSON } from "./gemini";
import { buildGenreCraftBlock } from "./genre-craft";
import type { SeedInput } from "@/types/seed-input";

// How many of the most recent nodes get their full content in the prompt.
// Older nodes are condensed to a one-line summary so deep trees (10+ branches)
// don't blow past context/token limits or dilute the model's attention on
// what actually just happened.
const FULL_DETAIL_NODE_COUNT = 3;

export interface StoryNode {
  id: string;
  title: string | null;
  content: string;
  teaser: string | null;
  parent_id: string | null;
  tags: string[] | null;
  author_name: string;
  story_type: "seed" | "branch" | "ending";
  metadata?: { seed_input?: SeedInput; bible?: StoryBible; [key: string]: unknown } | null;
}

/**
 * Persistent facts about a story (DreamGen-style scenario card), extracted once from the
 * seed and re-sent with every branch so deep paths keep names, setting, and voice straight.
 */
export interface StoryBible {
  premise: string;
  characters: { name: string; description: string }[];
  setting: string;
  central_conflict: string;
  pov: string;
  tense: string;
  style: string;
}

export interface StoryPath {
  nodes: StoryNode[];
  full_context: string;
  choices_made: string[];
}

/**
 * Recursively builds the full story path from a given story back to its root.
 * Returns all story nodes in chronological order (root → leaf).
 */
export async function buildStoryPath(storyId: string): Promise<StoryPath> {
  const sb = createServiceClient();
  const nodes: StoryNode[] = [];
  const choices_made: string[] = [];

  let currentId: string | null = storyId;

  // Walk up the parent chain to collect all nodes
  while (currentId) {
    const { data: storyData, error } = await sb
      .from("stories")
      .select("id, title, content, teaser, parent_id, tags, author_name, story_type, metadata")
      .eq("id", currentId)
      .single();

    if (error || !storyData) {
      break;
    }

    const story = storyData as StoryNode;
    nodes.unshift(story); // Add to front to maintain chronological order
    if (story.teaser) {
      choices_made.unshift(story.teaser);
    }
    currentId = story.parent_id;
  }

  // Build narrative context from the path
  const full_context = buildNarrativeContext(nodes);

  return {
    nodes,
    full_context,
    choices_made,
  };
}

/**
 * Builds a cohesive narrative context string from a story path.
 * This context is fed to Gemini so it understands the story journey so far.
 */
export function buildNarrativeContext(nodes: StoryNode[]): string {
  if (nodes.length === 0) return "";

  // Nodes older than this stay in full-detail range; anything before it gets condensed.
  const condensedCutoff = Math.max(1, nodes.length - FULL_DETAIL_NODE_COUNT);

  let context = `## Story So Far\n\n`;

  if (condensedCutoff > 1) {
    // Condense everything before the recent window into a short choice trail,
    // so early history isn't lost but doesn't dominate the token budget.
    context += `**Earlier in this journey:** `;
    context += nodes
      .slice(1, condensedCutoff)
      .map((n) => n.teaser)
      .filter(Boolean)
      .join(" → ");
    context += `\n\n`;
    context += `**Opening summary:**\n${summarize(nodes[0].content)}\n\n`;
  } else {
    context += `**Opening:**\n${nodes[0].content}\n\n`;
  }

  // Full detail for the most recent nodes, including the choice that led there
  const recentStart = Math.max(1, condensedCutoff);
  for (let i = recentStart; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.teaser) {
      context += `**The choice made:** "${node.teaser}"\n\n`;
    }

    context += `**What happened:**\n${node.content}\n\n`;
  }

  // Add tags context if present
  if (nodes[0].tags && nodes[0].tags.length > 0) {
    context += `**Genre/Tags:** ${nodes[0].tags.join(", ")}\n\n`;
  }

  context += `**Current scene state:** The narrative has progressed through ${nodes.length} checkpoint(s). Generate branches that respect this history and feel like organic continuations.`;

  return context;
}

/**
 * Condenses a story node's content to roughly its first two sentences, for use
 * in the narrative context once a node has aged out of the full-detail window.
 */
function summarize(content: string): string {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
  const short = sentences.slice(0, 2).join(" ").trim();
  return short.length < content.length ? `${short}..` : short;
}

const BIBLE_SCHEMA = {
  type: "OBJECT",
  properties: {
    premise: { type: "STRING" },
    characters: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { name: { type: "STRING" }, description: { type: "STRING" } },
        required: ["name", "description"],
      },
    },
    setting: { type: "STRING" },
    central_conflict: { type: "STRING" },
    pov: { type: "STRING" },
    tense: { type: "STRING" },
    style: { type: "STRING" },
  },
  required: ["premise", "characters", "setting", "central_conflict", "pov", "tense", "style"],
};

/**
 * Returns the root story's bible, generating and caching it in `metadata.bible` on first use.
 * Works for AI-generated and human-written seeds alike. Failures are non-fatal: branches
 * fall back to narrative context alone.
 */
export async function ensureStoryBible(root: StoryNode): Promise<StoryBible | null> {
  if (root.metadata?.bible) return root.metadata.bible;

  try {
    const bible = await generateStoryBible(root);

    const sb = createServiceClient();
    const { error } = await sb
      .from("stories")
      .update({ metadata: { ...(root.metadata || {}), bible } })
      .eq("id", root.id);
    if (error) console.warn("[story_engine] could not cache bible:", error.message);

    return bible;
  } catch (err) {
    console.warn("[story_engine] bible generation failed:", err);
    return null;
  }
}

/** Extracts a bible from the seed via Gemini (no caching; see ensureStoryBible). */
export async function generateStoryBible(root: StoryNode): Promise<StoryBible> {
  const seedInput = root.metadata?.seed_input;
  const raw = await callGemini({
    systemPrompt:
      "You extract a concise story bible from the opening of an interactive story. " +
      "Record only what the text states or clearly implies — never invent characters or facts. " +
      "Keep every field short: premise and conflict one sentence each, character descriptions under 20 words, " +
      "style one sentence describing voice, mood, and prose rhythm.",
    userPrompt:
      (seedInput ? `The author's original idea: "${seedInput.idea}"\n\n` : "") +
      `Title: ${root.title || "Untitled"}\n\nOpening:\n"""\n${root.content}\n"""`,
    temperature: 0.2,
    maxOutputTokens: 1000,
    responseSchema: BIBLE_SCHEMA,
  });
  return parseGeminiJSON<StoryBible>(raw);
}

export function formatBible(bible: StoryBible | null, seedInput?: SeedInput): string {
  if (!bible && !seedInput) return "";
  let out = "## Story Bible (canon — stay consistent with this)\n";
  if (seedInput) {
    out += `Author's original idea: "${seedInput.idea}"\n`;
    if (seedInput.tone) out += `Requested tone: ${seedInput.tone}\n`;
  }
  if (bible) {
    out += `Premise: ${bible.premise}\n`;
    out += `Setting: ${bible.setting}\n`;
    out += `Central conflict: ${bible.central_conflict}\n`;
    if (bible.characters.length) {
      out += `Characters:\n${bible.characters.map((c) => `- ${c.name}: ${c.description}`).join("\n")}\n`;
    }
    out += `Narration: ${bible.pov}, ${bible.tense} tense. Keep this point of view and tense.\n`;
    out += `Style: ${bible.style}\n`;
  }
  return out + "\n";
}

// Above this Jaccard similarity (on word shingles), two branches are
// considered too similar to present as a meaningful choice.
const BRANCH_SIMILARITY_THRESHOLD = 0.5;

/**
 * Generates branch options for a story, including full narrative context of choices made.
 * This ensures branches are aware of the story's history and choices.
 * If the two branches come back too similar to each other, retries once with
 * an instruction to differentiate them further.
 */
export async function generateChoiceAwareBranches(
  storyId: string,
  systemPrompt: string,
  opts: { direction?: string } = {}
): Promise<{ teaser: string; content: string }[]> {
  const storyPath = await buildStoryPath(storyId);

  // If this is the first story (no path), just get the story content
  let storyContent = storyPath.nodes[storyPath.nodes.length - 1]?.content || "";
  let storyTitle = storyPath.nodes[storyPath.nodes.length - 1]?.title || "Untitled";
  let tags = storyPath.nodes[0]?.tags || [];

  const root = storyPath.nodes[0];
  const bible = root ? await ensureStoryBible(root) : null;

  // Build the enhanced prompt that includes narrative context
  const userPrompt = buildBranchPromptWithContext(
    storyTitle,
    storyContent,
    storyPath,
    tags,
    formatBible(bible, root?.metadata?.seed_input),
    opts.direction
  );

  const fetchBranches = async (extraInstruction?: string) => {
    const raw = await callGemini({
      systemPrompt,
      userPrompt: extraInstruction ? `${userPrompt}\n\n${extraInstruction}` : userPrompt,
      temperature: 0.9,
      maxOutputTokens: 2000,
      responseSchema: {
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
      },
    });

    const parsed = parseGeminiJSON<{ branches?: { teaser: string; content: string }[] }>(raw);

    if (!parsed.branches || !Array.isArray(parsed.branches)) {
      throw new Error("Invalid branch response structure");
    }

    return parsed.branches;
  };

  let branches = await fetchBranches();

  if (branchesTooSimilar(branches)) {
    branches = await fetchBranches(
      "IMPORTANT: Your previous attempt produced two branches that were too similar to each other. " +
        "The two branches MUST diverge in a meaningfully different direction (different action, tone, or consequence) — not just reworded versions of the same event."
    );
  }

  return branches;
}

/** True if the first two branches are near-duplicates of each other. */
function branchesTooSimilar(branches: { teaser: string; content: string }[]): boolean {
  if (branches.length < 2) return false;
  const [a, b] = branches;
  const similarity = jaccardSimilarity(
    `${a.teaser} ${a.content}`,
    `${b.teaser} ${b.content}`
  );
  return similarity >= BRANCH_SIMILARITY_THRESHOLD;
}

/** Word-shingle Jaccard similarity between two strings, 0 (disjoint) to 1 (identical). */
function jaccardSimilarity(a: string, b: string): number {
  const setA = wordShingles(a);
  const setB = wordShingles(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  setA.forEach((shingle) => {
    if (setB.has(shingle)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Lowercased, punctuation-stripped 3-word shingles, for near-duplicate detection. */
function wordShingles(text: string, size = 3): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const shingles = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    shingles.add(words.slice(i, i + size).join(" "));
  }
  return shingles;
}

/**
 * Builds a branch generation prompt that includes the full story context and choices.
 * This is the key function that feeds choice context back into Gemini.
 */
export function buildBranchPromptWithContext(
  title: string,
  currentContent: string,
  storyPath: StoryPath,
  tags: string[],
  bibleBlock = "",
  readerDirection?: string
): string {
  let prompt = `Story title: "${title}"\n`;

  if (tags && tags.length > 0) {
    prompt += `Genre: ${tags.join(", ")}\n`;
    // Anchor to the primary genre's voice so branches read like the genre,
    // not generic continuation prose.
    prompt += buildGenreCraftBlock(tags[0]);
  }

  prompt += "\n";
  prompt += bibleBlock;

  // Include full narrative context if there's a story path
  if (storyPath.nodes.length > 1) {
    prompt += `## Narrative Context (Previous Choices Made)\n`;
    prompt += storyPath.full_context;
    prompt += "\n";
  }

  // Current story content
  prompt += `## Current Story Point\n`;
  prompt += `"""
${currentContent}
"""

`;

  // Branch generation instructions
  prompt += `Generate exactly 2 branch options for this story. Each branch should take the story in a distinctly different direction, giving readers a meaningful choice.

For each branch provide:
- "teaser": A 1-2 sentence choice line that readers see BEFORE clicking (like "Open the mysterious door" or "Follow the stranger into the alley"). This should be compelling and hint at what's ahead without spoiling it.
- "content": A 200-400 word continuation of the story from that choice point. Write it as the next scene, picking up seamlessly from where the current scene left off.

${
  storyPath.nodes.length > 1
    ? "IMPORTANT: Remember all the previous choices and narrative developments. Your branches should feel like organic continuations of this specific story path, not generic branches."
    : ""
}
${
  bibleBlock
    ? "Honor the Story Bible: use the established character names, setting, point of view, and tense, and keep the author's original idea at the heart of both branches. New characters are fine; renaming or contradicting existing ones is not."
    : ""
}

${
  readerDirection
    ? `READER'S REQUEST: A reader asked for the story to go this way: "${readerDirection.replace(/"/g, "'")}"
Branch 1 must follow this request faithfully — its teaser and content should clearly deliver what the reader asked for, while staying true to the story so far. Branch 2 must offer a meaningfully different alternative, so the reader still has a real choice.`
    : ""
}

Respond with ONLY this JSON (no markdown fences):
{
  "branches": [
    { "teaser": "...", "content": "..." },
    { "teaser": "...", "content": "..." }
  ]
}`;

  return prompt;
}

/**
 * Fetches a story and returns it with its full choice path context.
 * Useful for displaying stories with their complete history.
 */
export async function getStoryWithContext(
  storyId: string
): Promise<{ story: StoryNode; path: StoryPath }> {
  const sb = createServiceClient();
  const { data: story, error } = await sb
    .from("stories")
    .select("id, title, content, teaser, parent_id, tags, author_name, story_type, metadata")
    .eq("id", storyId)
    .single();

  if (error || !story) {
    throw new Error(`Story ${storyId} not found`);
  }

  const path = await buildStoryPath(storyId);

  return { story, path };
}
