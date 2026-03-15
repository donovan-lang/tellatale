import type { Story } from "@/types";

export const DEMO_STORIES: Story[] = [
  {
    id: "demo-1",
    parent_id: null,
    author_id: null,
    author_name: "MakeATale",
    title: "The Last Lighthouse Keeper",
    story_type: "seed",
    is_ending: false,
    slug: null,
    teaser: null,
    tags: ["Horror", "Mystery"],
    content:
      "On the edge of a crumbling cliff, the last lighthouse keeper wound the mechanism for the final time. The ships had stopped coming years ago, but something else watched from the deep — something that feared the light. What does the keeper do when the bulb finally dies?",
    image_url: null,
    image_prompt:
      "A lonely lighthouse on a crumbling cliff at dusk, dark ocean below",
    upvotes: 142,
    downvotes: 3,
    depth: 0,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    children_count: 12,
  },
  {
    id: "demo-2",
    parent_id: null,
    author_id: null,
    author_name: "Wanderer",
    title: "Seeds of the Machine Garden",
    story_type: "seed",
    is_ending: false,
    slug: null,
    teaser: null,
    tags: ["Sci-Fi", "Fantasy"],
    content:
      "Nobody remembered who planted the first silicon seed. But by spring, the garden had grown circuit-boards instead of flowers, and the bees that visited them hummed at exactly 440 Hz. What grows next season?",
    image_url: null,
    image_prompt: null,
    upvotes: 89,
    downvotes: 4,
    depth: 0,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    children_count: 6,
  },
  {
    id: "demo-3",
    parent_id: null,
    author_id: null,
    author_name: "inkblot",
    title: "The Color That Doesn't Exist",
    story_type: "seed",
    is_ending: false,
    slug: null,
    teaser: null,
    tags: ["Horror", "Surreal"],
    content:
      "The painter discovered it by accident — a pigment that shouldn't be possible, a color the human eye wasn't built to see. But once you saw it, you couldn't unsee it. And neither could the things that lived inside it. Do you look away, or lean closer?",
    image_url: null,
    image_prompt:
      "An artist's studio with an impossible glowing color on the canvas",
    upvotes: 247,
    downvotes: 2,
    depth: 0,
    created_at: new Date(Date.now() - 10800000).toISOString(),
    children_count: 19,
  },
  {
    id: "demo-4",
    parent_id: null,
    author_id: null,
    author_name: "solstice",
    title: "The Library at the Bottom of the Lake",
    story_type: "seed",
    is_ending: false,
    slug: null,
    teaser: null,
    tags: ["Adventure", "Mystery"],
    content:
      "The divers found it at 200 meters — shelves of stone tablets, perfectly preserved, in a language that predated every known civilization by ten thousand years. The translations started making people forget things. Do you keep translating?",
    image_url: null,
    image_prompt:
      "An underwater library with glowing stone tablets on ancient shelves, deep blue water, bioluminescent light",
    upvotes: 198,
    downvotes: 5,
    depth: 0,
    created_at: new Date(Date.now() - 5400000).toISOString(),
    children_count: 14,
  },
  {
    id: "demo-5",
    parent_id: null,
    author_id: null,
    author_name: "nocturn",
    title: "Eleven Minutes After Midnight",
    story_type: "seed",
    is_ending: false,
    slug: null,
    teaser: null,
    tags: ["Thriller", "Horror"],
    content:
      "Every night at 12:11, the radio in apartment 4B turns itself on. Static, mostly. But last Thursday, someone answered when she said hello. Do you answer back tonight?",
    image_url: null,
    image_prompt: null,
    upvotes: 67,
    downvotes: 1,
    depth: 0,
    created_at: new Date(Date.now() - 1200000).toISOString(),
    children_count: 4,
  },
  {
    id: "demo-6",
    parent_id: null,
    author_id: null,
    author_name: "quietstorm",
    title: "The Cartographer's Last Map",
    story_type: "seed",
    is_ending: false,
    slug: null,
    teaser: null,
    tags: ["Adventure", "Fantasy"],
    content:
      "She'd mapped every continent, every coastline, every forgotten island. But the final map — the one she drew on her deathbed — showed a place that didn't exist. Until someone went looking for it. Do you follow the map?",
    image_url: null,
    image_prompt:
      "An old hand-drawn map on parchment showing an impossible island, compass rose, aged ink",
    upvotes: 113,
    downvotes: 2,
    depth: 0,
    created_at: new Date(Date.now() - 14400000).toISOString(),
    children_count: 8,
  },
];

export const DEMO_BRANCHES: Record<string, Story[]> = {
  "demo-1": [
    {
      id: "demo-1a",
      parent_id: "demo-1",
      author_id: null,
      author_name: "NightOwl",
      title: null,
      story_type: "branch",
      is_ending: false,
      slug: null,
      teaser: null,
      tags: null,
      content:
        "He descends the spiral stairs, clutching a lantern, to face whatever waits in the tide pools below.",
      image_url: null,
      image_prompt: null,
      upvotes: 9,
      downvotes: 0,
      depth: 1,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "demo-1b",
      parent_id: "demo-1",
      author_id: null,
      author_name: "DeepSea",
      title: null,
      story_type: "branch",
      is_ending: false,
      slug: null,
      teaser: null,
      tags: null,
      content:
        "He lets the light die. The cliff falls into darkness, and from below he hears a sigh of relief — then scratching.",
      image_url: null,
      image_prompt: null,
      upvotes: 6,
      downvotes: 1,
      depth: 1,
      created_at: new Date(Date.now() - 2400000).toISOString(),
    },
    {
      id: "demo-1c",
      parent_id: "demo-1",
      author_id: null,
      author_name: "Ember",
      title: null,
      story_type: "branch",
      is_ending: true,
      slug: null,
      teaser: null,
      tags: null,
      content:
        "He smashes the lens, scattering glass into the sea. The last light dies with him, and the deep things finally rest.",
      image_url: null,
      image_prompt: null,
      upvotes: 4,
      downvotes: 0,
      depth: 1,
      created_at: new Date(Date.now() - 900000).toISOString(),
    },
  ],
  "demo-2": [
    {
      id: "demo-2a",
      parent_id: "demo-2",
      author_id: null,
      author_name: "ByteGardener",
      title: null,
      story_type: "branch",
      is_ending: false,
      slug: null,
      teaser: null,
      tags: null,
      content:
        "The bees start building a queen — not of wax, but of copper wire and tiny capacitors. She hums at 880 Hz.",
      image_url: null,
      image_prompt: null,
      upvotes: 5,
      downvotes: 0,
      depth: 1,
      created_at: new Date(Date.now() - 3000000).toISOString(),
    },
  ],
  "demo-3": [],
};

export const STORY_CATEGORIES = [
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Mystery",
  "Romance",
  "Adventure",
  "Thriller",
  "Comedy",
  "Drama",
  "Surreal",
  "Historical",
  "Dystopia",
] as const;

export type StoryCategory = (typeof STORY_CATEGORIES)[number];

export function isDemo(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("your-project");
}

export function getDemoStory(id: string): Story | null {
  const root = DEMO_STORIES.find((s) => s.id === id);
  if (root) return root;

  for (const branches of Object.values(DEMO_BRANCHES)) {
    const branch = branches.find((s) => s.id === id);
    if (branch) return branch;
  }

  return null;
}

export function getDemoBranches(parentId: string): Story[] {
  return DEMO_BRANCHES[parentId] || [];
}

export function getDemoAncestors(id: string): Story[] {
  const story = getDemoStory(id);
  if (!story) return [];

  const chain: Story[] = [story];
  let current = story;
  while (current.parent_id) {
    const parent = getDemoStory(current.parent_id);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}
