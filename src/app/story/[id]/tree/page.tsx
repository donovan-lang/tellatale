export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase-server";
import StoryTree from "@/components/StoryTree";
import { ArrowLeft, GitFork } from "lucide-react";

async function getRootId(id: string): Promise<{ rootId: string; title: string | null } | null> {
  const supabase = createServiceClient();
  const isUuid = /^[0-9a-f]{8}-/i.test(id);
  const { data: story } = isUuid
    ? await supabase.from("stories").select("id, title, parent_id").eq("id", id).single()
    : await supabase.from("stories").select("id, title, parent_id").eq("slug", id).single();

  if (!story) return null;

  // Walk to root
  let current = story;
  while (current.parent_id) {
    const { data: parent } = await supabase.from("stories").select("id, title, parent_id").eq("id", current.parent_id).single();
    if (!parent) break;
    current = parent;
  }

  return { rootId: current.id, title: current.title };
}

export default async function StoryTreePage({ params }: { params: { id: string } }) {
  const data = await getRootId(params.id);

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Story not found.</p>
        <a href="/explore" className="btn-primary mt-4 inline-block">Explore</a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/story/${params.id}`} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={18} />
        </a>
        <GitFork size={20} className="text-brand-400" />
        <div>
          <h1 className="text-lg font-bold">Story Tree</h1>
          {data.title && <p className="text-xs text-gray-500">{data.title}</p>}
        </div>
      </div>
      <StoryTree rootId={data.rootId} currentId={params.id} />
    </div>
  );
}
