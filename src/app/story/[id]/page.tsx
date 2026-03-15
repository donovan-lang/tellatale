import StoryCard from "@/components/StoryCard";
import StoryForm from "@/components/StoryForm";
import { isDemo, getDemoStory, getDemoBranches } from "@/lib/demo-data";
import type { Story } from "@/types";

async function getStory(id: string): Promise<Story | null> {
  try {
    if (isDemo()) return getDemoStory(id);

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .single();

    return data;
  } catch {
    return getDemoStory(id);
  }
}

async function getBranches(parentId: string): Promise<Story[]> {
  try {
    if (isDemo()) return getDemoBranches(parentId);

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("parent_id", parentId)
      .order("upvotes", { ascending: false });

    return data || [];
  } catch {
    return getDemoBranches(parentId);
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
        <a href="/" className="btn-primary mt-4 inline-block">
          Back to feed
        </a>
      </div>
    );
  }

  const branches = await getBranches(story.id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Parent story */}
      <StoryCard story={story} />

      {/* Branches */}
      {branches.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-brand-400">{branches.length}</span> branches
          </h2>
          <div className="space-y-3 border-l-2 border-gray-800 pl-4">
            {branches.map((branch) => (
              <StoryCard key={branch.id} story={branch} />
            ))}
          </div>
        </div>
      )}

      {/* Branch form */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Continue the story...</h2>
        <StoryForm parentId={story.id} />
      </div>
    </div>
  );
}
