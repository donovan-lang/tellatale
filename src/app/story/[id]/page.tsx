export const dynamic = "force-dynamic";

import Breadcrumbs from "@/components/Breadcrumbs";
import StoryReader from "@/components/StoryReader";
import { createServiceClient } from "@/lib/supabase-server";
import type { Story } from "@/types";

async function getStory(id: string): Promise<Story | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  } catch {
    return null;
  }
}

async function getBranches(parentId: string): Promise<Story[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("parent_id", parentId)
      .order("upvotes", { ascending: false });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

async function getAncestors(id: string): Promise<Story[]> {
  try {
    const supabase = createServiceClient();

    // Try RPC first
    const { data: ancestorData } = await supabase.rpc("get_story_ancestors", {
      story_uuid: id,
    });

    if (ancestorData && ancestorData.length > 0) {
      return ancestorData;
    }

    // Fallback: walk manually
    const chain: Story[] = [];
    let currentId: string | null = id;

    while (currentId) {
      const result = await supabase
        .from("stories")
        .select("*")
        .eq("id", currentId)
        .single();

      const node = result.data as Story | null;
      if (!node) break;
      chain.unshift(node);
      currentId = node.parent_id;
    }

    return chain;
  } catch {
    return [];
  }
}

export default async function StoryPage({
  params,
}: {
  params: { id: string };
}) {
  const story = await getStory(params.id);

  if (!story) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-400">Story not found</h1>
        <p className="mt-2 text-gray-600">
          This story may have been removed or doesn&apos;t exist yet.
        </p>
        <a href="/explore" className="btn-primary mt-4 inline-block">
          Explore stories
        </a>
      </div>
    );
  }

  const [branches, ancestors] = await Promise.all([
    getBranches(story.id),
    getAncestors(story.id),
  ]);

  const chainAuthors = ancestors
    .map((a) => a.author_id)
    .filter((id): id is string => !!id);

  const rootStoryId = ancestors.length > 0 ? ancestors[0].id : story.id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Breadcrumbs ancestors={ancestors} />
      <StoryReader
        story={story}
        branches={branches}
        chainAuthors={chainAuthors}
        rootStoryId={rootStoryId}
      />
    </div>
  );
}
