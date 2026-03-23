# Story Engine: Choice-Aware Branching Narrative

## Overview

The Story Engine (`story_engine.ts`) implements **choice-aware branching narrative generation**, where reader choices feed back into the Gemini AI prompt context. This ensures that generated story branches are coherent with the narrative history and respect the choices that led to the current story point.

## Key Features

### 1. **Story Path Building** (`buildStoryPath`)
- Recursively walks up the parent chain to reconstruct the full story journey
- Returns all story nodes in chronological order (root → current)
- Tracks all choices made (extracted from teasers)

```typescript
const path = await buildStoryPath(storyId);
// path.nodes: [rootStory, branch1, branch2, ...]
// path.choices_made: ["choice 1", "choice 2", ...]
// path.full_context: Rich narrative context
```

### 2. **Narrative Context Building** (`buildNarrativeContext`)
- Synthesizes the story path into a coherent narrative context
- Includes:
  - Opening story content
  - Each choice that was made
  - What happened after each choice
  - Genre/tags for tone consistency
  - Instructions to respect the narrative history

### 3. **Choice-Aware Branch Generation** (`generateChoiceAwareBranches`)
- Generates branches with full story context
- Passes narrative history to Gemini
- Ensures branches feel like natural continuations, not isolated variations
- Returns 2 branch options with:
  - `teaser`: 1-2 sentence choice preview
  - `content`: 200-400 word story continuation

### 4. **Get Story With Context** (`getStoryWithContext`)
- Fetches a story and its complete choice path
- Useful for displaying stories with full history
- Returns: `{ story, path }`

## API Usage

### Option 1: Auto-Branching (Cron Job)
The cron job `/api/cron/auto-branch` now automatically generates choice-aware branches for popular stories.

```typescript
// No changes needed - it uses generateChoiceAwareBranches internally
POST /api/cron/auto-branch
Authorization: Bearer {CRON_SECRET}
```

Metadata includes:
```json
{
  "choice_aware": true,
  "narrative_context_included": true
}
```

### Option 2: On-Demand Generation
New endpoint for generating branches on-demand with full context.

```typescript
POST /api/branches/generate
Content-Type: application/json

{
  "story_id": "uuid",
  "auto_insert": true  // optional, default: true
}
```

**Response:**
```json
{
  "branches": [
    {
      "teaser": "Open the mysterious door",
      "content": "You push the door open..."
    },
    {
      "teaser": "Follow the stranger",
      "content": "You chase after the figure..."
    }
  ],
  "story_context": {
    "path_length": 3,
    "choices_made": ["Open the door", "Follow the guide"],
    "root_title": "The Lost Temple"
  },
  "inserted_ids": ["uuid1", "uuid2"]  // if auto_insert: true
}
```

## Database Schema

The system leverages the existing story structure:
- `stories.parent_id`: Links children to parent stories
- `stories.teaser`: The choice text (extracted as choices_made)
- `stories.content`: Story content at each node
- `stories.tags`: Genre/theme tags (maintained through branches)
- `stories.metadata.choice_aware`: Marks branches generated with context

## How It Works: Example

**Story Path:**
```
[Root Story] → [Branch A] → [Branch B]
```

**What Gets Sent to Gemini:**

```
## Story So Far

**Opening:**
You wake in a dark forest. An old path leads left, a newer trail heads right...

**The choice made:** "Take the old path"

**What happened:**
You follow the weathered trail deeper into ancient woods...

**The choice made:** "Enter the stone ruins"

**What happened:**
The ruins loom before you, covered in moss and mystery...

**Current scene state:** The narrative has progressed through 3 checkpoints. Generate branches that respect this history and feel like organic continuations.

Genre/Tags: Fantasy, Adventure
```

Gemini then generates branches that:
1. Acknowledge the forest setting
2. Respect the stone ruins discovery
3. Build naturally on both previous choices
4. Feel cohesive with established tone/genre

## Implementation Details

### Story Path Reconstruction
- Walk up parent_id chain until root (parent_id = null)
- Maintain chronological order (root at index 0)
- Extract teaser text as "choice" narrative

### Context Injection
- Story path context is built into the user prompt
- System prompt remains consistent (rules for writing quality branches)
- Temperature: 0.9 (creative but stable)
- Max tokens: 2000

### Error Handling
- Validates story exists before processing
- Falls back gracefully if path reconstruction fails
- Handles empty responses from Gemini
- Type-safe: all data validated against interfaces

## Performance Considerations

- **Path building:** O(n) where n = path depth (typically 3-5 nodes)
- **Context building:** String concatenation, linear in path length
- **API latency:** ~3-5 seconds for Gemini generation
- **Database queries:** 2 queries (find story, recurse parent chain)

Suitable for:
- ✅ Cron jobs (background processing)
- ✅ On-demand API calls
- ✅ Real-time user generation requests

## Testing

### Manual Test
```typescript
// Generate branches for a story
const branches = await generateChoiceAwareBranches(
  "story-uuid-here",
  SYSTEM_PROMPT
);

console.log(branches);
// Output: [{ teaser: "...", content: "..." }, ...]

// Get story with full context
const { story, path } = await getStoryWithContext("story-uuid-here");
console.log(path.full_context);
// Shows full narrative journey
```

### API Test
```bash
curl -X POST http://localhost:3000/api/branches/generate \
  -H "Content-Type: application/json" \
  -d '{
    "story_id": "abc123",
    "auto_insert": false
  }'
```

## Future Enhancements

1. **Validation:** Ensure generated branches match tone/length guidelines
2. **Rejection Feedback:** User feedback on poor branches → fine-tune prompts
3. **Multi-Path Awareness:** Handle stories with multiple branches at same level
4. **Narrative Consistency Scoring:** Measure how well branches respect history
5. **Choice Summaries:** Auto-generate choice labels from teasers

## Migration from Old System

Old auto-branch route just looked at immediate parent. New system:

```
OLD: Generate branches for Story B based only on Story B
NEW: Generate branches for Story B based on [Story A] → [Story B]
```

This produces more coherent, history-aware narratives that feel like genuine continuations rather than variations.
