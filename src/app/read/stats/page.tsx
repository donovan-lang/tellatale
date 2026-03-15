"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { BookOpen, GitFork, ThumbsUp, Loader2, Share2 } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function ReadStatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    Promise.all([
      fetch("/api/reading-progress").then(r => r.json()),
      fetch(`/api/stories?author_id=${user.id}`).then(r => r.json()),
    ]).then(([progress, stories]) => {
      setStats({
        storiesRead: Array.isArray(progress) ? progress.length : 0,
        storiesWritten: Array.isArray(stories) ? stories.length : 0,
        totalVotes: Array.isArray(stories) ? stories.reduce((s: number, st: any) => s + (st.upvotes || 0), 0) : 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-500" /></div>;
  if (!stats) return null;

  const penName = user?.user_metadata?.pen_name || user?.user_metadata?.full_name || "Writer";

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-2xl p-8 text-white text-center shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-sm font-black">M</div>
          <span className="text-lg font-bold text-purple-300">MakeATale</span>
        </div>
        <p className="text-sm text-purple-300 uppercase tracking-wider mb-2">Your Story Stats</p>
        <h1 className="text-3xl font-bold mb-8">{penName}</h1>
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div>
            <BookOpen size={24} className="mx-auto text-purple-400 mb-2" />
            <p className="text-3xl font-bold">{stats.storiesRead}</p>
            <p className="text-xs text-purple-300">Stories read</p>
          </div>
          <div>
            <GitFork size={24} className="mx-auto text-brand-400 mb-2" />
            <p className="text-3xl font-bold">{stats.storiesWritten}</p>
            <p className="text-xs text-purple-300">Written</p>
          </div>
          <div>
            <ThumbsUp size={24} className="mx-auto text-green-400 mb-2" />
            <p className="text-3xl font-bold">{stats.totalVotes}</p>
            <p className="text-xs text-purple-300">Votes earned</p>
          </div>
        </div>
        <p className="text-xs text-purple-400">makeatale.com</p>
      </div>
      <button
        onClick={() => { navigator.clipboard.writeText(`I've read ${stats.storiesRead} stories and written ${stats.storiesWritten} on MakeATale! Check it out: makeatale.com`); toast("Stats copied — paste to share!"); }}
        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
      >
        <Share2 size={16} /> Share Your Stats
      </button>
      <a href="/read" className="btn-ghost w-full mt-2 text-center block text-sm">Back to Library</a>
    </div>
  );
}
