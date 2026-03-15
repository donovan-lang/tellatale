import type { Story } from "@/types";

export const DEMO_STORIES: Story[] = [
  {
    id: "demo-1",
    parent_id: null,
    author_id: null,
    author_name: "MakeATale",
    title: "The Last Lighthouse Keeper",
    content:
      "On the edge of a crumbling cliff, the last lighthouse keeper wound the mechanism for the final time. The ships had stopped coming years ago, but something else watched from the deep — something that feared the light.",
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
    content:
      "Nobody remembered who planted the first silicon seed. But by spring, the garden had grown circuit-boards instead of flowers, and the bees that visited them hummed at exactly 440 Hz.",
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
    content:
      "The painter discovered it by accident — a pigment that shouldn't be possible, a color the human eye wasn't built to see. But once you saw it, you couldn't unsee it. And neither could the things that lived inside it.",
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
    content:
      "The divers found it at 200 meters — shelves of stone tablets, perfectly preserved, in a language that predated every known civilization by ten thousand years. The translations started making people forget things.",
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
    content:
      "Every night at 12:11, the radio in apartment 4B turns itself on. Static, mostly. But last Thursday, someone answered when she said hello.",
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
    content:
      "She'd mapped every continent, every coastline, every forgotten island. But the final map — the one she drew on her deathbed — showed a place that didn't exist. Until someone went looking for it.",
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
      title: "The Thing in the Tide",
      content:
        "The keeper saw it first as a ripple against the current — then as a shape, vast and pale, rising just below the surface. It didn't have eyes, not exactly. But it turned toward the beam the way a flower turns toward the sun.",
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
      title: "The Light Goes Out",
      content:
        "He let it die. The mechanism groaned, the bulb flickered twice, and the cliff fell into darkness. From somewhere below, he heard what sounded almost like a sigh of relief — and then the scratching began.",
      image_url: null,
      image_prompt: null,
      upvotes: 6,
      downvotes: 1,
      depth: 1,
      created_at: new Date(Date.now() - 2400000).toISOString(),
    },
  ],
  "demo-2": [
    {
      id: "demo-2a",
      parent_id: "demo-2",
      author_id: null,
      author_name: "ByteGardener",
      title: "The Beekeeper's Discovery",
      content:
        "Maria noticed her hives producing something strange — not honey, but a warm amber resin that conducted electricity. The bees were adapting, building circuits of their own inside the combs.",
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
