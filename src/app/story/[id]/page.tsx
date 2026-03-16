export const dynamic = "force-dynamic";

import Breadcrumbs from "@/components/Breadcrumbs";
import StoryReader from "@/components/StoryReader";
import { createServiceClient } from "@/lib/supabase-server";
import type { Story } from "@/types";
import type { Metadata } from "next";

async function getStory(id: string): Promise<Story | null> {
  try {
    const supabase = createServiceClient();
    // Try UUID first, then slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const { data } = isUuid
      ? await supabase.from("stories").select("*").eq("id", id).single()
      : await supabase.from("stories").select("*").eq("slug", id).single();
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
      .eq("is_hidden", false)
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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const story = await getStory(params.id);
  if (!story) return { title: "Story not found — MakeATale" };
  const desc = story.content.slice(0, 155) + "...";
  const title = story.title ? `${story.title} | MakeATale` : "A Tale | MakeATale";
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || "https://makeatale.com";
  const ogImage = `${baseUrl}/api/og/${params.id}`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "article",
      siteName: "MakeATale",
      images: [{ url: ogImage, width: 1200, height: 630, alt: story.title || "A Tale on MakeATale" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
  };
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
        <a href="/stories" className="btn-primary mt-4 inline-block">
          Explore stories
        </a>
      </div>
    );
  }

  if (story.is_hidden) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="card p-8">
          <h1 className="text-xl font-bold text-gray-400 mb-2">
            Content Removed
          </h1>
          <p className="text-sm text-gray-500">
            This content has been removed by moderators for violating community
            guidelines.
          </p>
          <a href="/stories" className="btn-primary mt-6 inline-block">
            Explore stories
          </a>
        </div>
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
