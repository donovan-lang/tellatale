"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BookMarked, ArrowLeft, Loader2, Flag, FileText } from "lucide-react";
import type { Story } from "@/types";

interface ChronicleDetail {
  id: string;
  title: string;
  story_path: string[];
  stories: Story[];
}

export default function ChroniclePlaybackPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [chronicle, setChronicle] = useState<ChronicleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetch(`/api/chronicles/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setChronicle(data);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router, params.id]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  if (!chronicle) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-400">
          Chronicle not found
        </h1>
        <a href="/chronicles" className="btn-primary mt-4 inline-block">
          Back to Chronicles
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/chronicles"
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </a>
        <BookMarked size={20} className="text-brand-400" />
        <h1 className="text-xl font-bold">{chronicle.title}</h1>
      </div>

      {/* Sequential reading */}
      <div className="space-y-4">
        {chronicle.stories.map((story, i) => (
          <div
            key={story.id}
            className={`card ${
              i === 0
                ? "border-l-4 border-l-brand-500"
                : story.is_ending
                ? "border-l-4 border-l-amber-500"
                : "border-l-4 border-l-gray-700"
            }`}
          >
            {story.title && (
              <h2 className="text-lg font-semibold mb-2">{story.title}</h2>
            )}
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {story.content}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
              <a href={`/author/${story.author_name?.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/ +/g, "-")}`} className="hover:text-brand-400 transition-colors">{story.author_name}</a>
              <span>Step {i + 1}</span>
              {story.is_ending && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Flag size={10} />
                  Ending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Export button (disabled teaser) */}
      <div className="mt-8 text-center">
        <button
          disabled
          className="btn-ghost text-sm flex items-center gap-2 mx-auto opacity-50 cursor-not-allowed"
        >
          <FileText size={16} />
          Export as PDF (Coming Soon)
        </button>
      </div>
    </div>
  );
}
