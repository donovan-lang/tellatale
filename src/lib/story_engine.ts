import { createServiceClient } from "./supabase-server";
import { callGemini, parseGeminiJSON } from "./gemini";
import { buildGenreCraftBlock } from "./genre-craft";

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
      .select("id, title, content, teaser, parent_id, tags, author_name, story_type")
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
function buildNarrativeContext(nodes: StoryNode[]): string {
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

/**
 * Generates branch options for a story, including full narrative context of choices made.
 * This ensures branches are aware of the story's history and choices.
 */
export async function generateChoiceAwareBranches(
  storyId: string,
  systemPrompt: string
): Promise<{ teaser: string; content: string }[]> {
  const storyPath = await buildStoryPath(storyId);

  // If this is the first story (no path), just get the story content
  let storyContent = storyPath.nodes[storyPath.nodes.length - 1]?.content || "";
  let storyTitle = storyPath.nodes[storyPath.nodes.length - 1]?.title || "Untitled";
  let tags = storyPath.nodes[0]?.tags || [];

  // Build the enhanced prompt that includes narrative context
  const userPrompt = buildBranchPromptWithContext(
    storyTitle,
    storyContent,
    storyPath,
    tags
  );

  const raw = await callGemini({
    systemPrompt,
    userPrompt,
    temperature: 0.9,
    maxOutputTokens: 2000,
    jsonMode: true,
  });

  const parsed = parseGeminiJSON<{ branches?: { teaser: string; content: string }[] }>(raw);

  if (!parsed.branches || !Array.isArray(parsed.branches)) {
    throw new Error("Invalid branch response structure");
  }

  return parsed.branches;
}

/**
 * Builds a branch generation prompt that includes the full story context and choices.
 * This is the key function that feeds choice context back into Gemini.
 */
function buildBranchPromptWithContext(
  title: string,
  currentContent: string,
  storyPath: StoryPath,
  tags: string[]
): string {
  let prompt = `Story title: "${title}"\n`;

  if (tags && tags.length > 0) {
    prompt += `Genre: ${tags.join(", ")}\n`;
    // Anchor to the primary genre's voice so branches read like the genre,
    // not generic continuation prose.
    prompt += buildGenreCraftBlock(tags[0]);
  }

  prompt += "\n";

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
    .select("id, title, content, teaser, parent_id, tags, author_name, story_type")
    .eq("id", storyId)
    .single();

  if (error || !story) {
    throw new Error(`Story ${storyId} not found`);
  }

  const path = await buildStoryPath(storyId);

  return { story, path };
}
