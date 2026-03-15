"use client";

import { useEffect, useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { getSupabase } from "@/lib/supabase-browser";

export default function FollowButton({ authorId }: { authorId: string }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function getHeaders(): Promise<Record<string, string>> {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    return data.session?.access_token
      ? { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }

  useEffect(() => {
    if (!user || user.id === authorId) return;
    getHeaders().then((h) =>
      fetch(`/api/follows/${authorId}`, { headers: h })
        .then((r) => r.json())
        .then((d) => setFollowing(d.following))
        .catch(() => {})
    );
  }, [user, authorId]);

  async function toggle() {
    if (!user || loading) return;
    setLoading(true);
    const headers = await getHeaders();
    if (following) {
      await fetch(`/api/follows/${authorId}`, { method: "DELETE", headers });
      setFollowing(false);
    } else {
      await fetch("/api/follows", { method: "POST", headers, body: JSON.stringify({ followed_id: authorId }) });
      setFollowing(true);
    }
    setLoading(false);
  }

  if (!user || user.id === authorId) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
        following
          ? "bg-brand-500/10 text-brand-400 border border-brand-500/30"
          : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700"
      }`}
    >
      {following ? <UserCheck size={12} /> : <UserPlus size={12} />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
