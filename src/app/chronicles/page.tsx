"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BookMarked, Trash2, Play, Loader2 } from "lucide-react";
import type { Chronicle } from "@/types";

export default function ChroniclesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetch("/api/chronicles")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setChronicles(data);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this chronicle?")) return;
    await fetch(`/api/chronicles/${id}`, { method: "DELETE" });
    setChronicles((prev) => prev.filter((c) => c.id !== id));
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <BookMarked size={24} className="text-brand-400" />
        <h1 className="text-2xl font-bold">My Chronicles</h1>
      </div>

      {chronicles.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            No chronicles saved yet. Read a story and save your journey!
          </p>
          <a href="/#stories" className="btn-primary inline-block">
            Explore Stories
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {chronicles.map((chronicle) => (
            <div
              key={chronicle.id}
              className="card flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">{chronicle.title}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {chronicle.story_path.length} step
                  {chronicle.story_path.length !== 1 ? "s" : ""} in this journey
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/chronicles/${chronicle.id}`}
                  className="p-2 rounded-lg text-brand-400 hover:bg-brand-400/10 transition-colors"
                  title="Read"
                >
                  <Play size={16} />
                </a>
                <button
                  onClick={() => handleDelete(chronicle.id)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export PDF teaser */}
      <div className="mt-8 card bg-gray-900/30 border border-dashed border-gray-700">
        <p className="text-sm text-gray-500 text-center">
          Export PDF coming soon — turn your chronicles into shareable stories.
        </p>
      </div>
    </div>
  );
}
