"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Circle, ChevronUp } from "lucide-react";
import type { Story } from "@/types";

interface TreeNode {
  story: Story;
  children: TreeNode[];
}

function buildTree(stories: Story[], rootId: string): TreeNode | null {
  const map = new Map<string, TreeNode>();
  stories.forEach((s) => map.set(s.id, { story: s, children: [] }));
  let root: TreeNode | null = null;
  map.forEach((node) => {
    if (node.story.id === rootId) {
      root = node;
    } else if (node.story.parent_id) {
      const parent = map.get(node.story.parent_id);
      if (parent) parent.children.push(node);
    }
  });
  return root;
}

function TreeNodeView({
  node,
  currentId,
  depth,
  onClick,
}: {
  node: TreeNode;
  currentId?: string;
  depth: number;
  onClick: (id: string) => void;
}) {
  const s = node.story;
  const isCurrent = s.id === currentId;
  const score = s.upvotes - s.downvotes;

  return (
    <div className="relative">
      <button
        onClick={() => onClick(s.slug || s.id)}
        className={`w-full text-left rounded-lg p-3 transition-all duration-200 border ${
          isCurrent
            ? "bg-brand-500/15 border-brand-500/40 shadow-md shadow-brand-500/10"
            : "bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-800/60"
        }`}
      >
        <p className={`text-xs font-medium line-clamp-2 ${isCurrent ? "text-brand-300" : "text-gray-300"}`}>
          {s.title || s.teaser || s.content?.slice(0, 80)}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-[9px] text-gray-500">
          <span>{s.author_name}</span>
          <span className="flex items-center gap-0.5">
            <ChevronUp size={8} /> {score}
          </span>
          {s.is_ending && <span className="text-amber-400">Ending</span>}
        </div>
      </button>
      {node.children.length > 0 && (
        <div className="ml-4 mt-1 pl-3 border-l-2 border-gray-800 space-y-1">
          {node.children.map((child) => (
            <TreeNodeView
              key={child.story.id}
              node={child}
              currentId={currentId}
              depth={depth + 1}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StoryTree({ rootId, currentId }: { rootId: string; currentId?: string }) {
  const router = useRouter();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stories/${rootId}/tree`)
      .then((r) => r.json())
      .then((stories: Story[]) => {
        if (Array.isArray(stories) && stories.length > 0) {
          setTree(buildTree(stories, rootId));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rootId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={20} className="animate-spin text-gray-500" />
      </div>
    );
  }

  if (!tree) {
    return <p className="text-center text-gray-500 py-10">Could not load story tree.</p>;
  }

  return (
    <div className="space-y-1">
      <TreeNodeView
        node={tree}
        currentId={currentId}
        depth={0}
        onClick={(id) => router.push(`/story/${id}`)}
      />
    </div>
  );
}
