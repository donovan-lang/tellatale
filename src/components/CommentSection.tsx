"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { getSupabase } from "@/lib/supabase-browser";
import { formatDistanceToNow } from "date-fns";
import type { Comment } from "@/types";

export default function CommentSection({ storyId }: { storyId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stories/${storyId}/comments`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setComments(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storyId]);

  async function handlePost() {
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      const sb = getSupabase();
      const { data: session } = await sb.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session.session?.access_token) headers.Authorization = `Bearer ${session.session.access_token}`;

      const res = await fetch(`/api/stories/${storyId}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, {
          id: data.id,
          story_id: storyId,
          user_id: user?.id || null,
          author_name: data.author_name || "Anonymous",
          content: content.trim(),
          parent_comment_id: null,
          upvotes: 0,
          is_hidden: false,
          created_at: new Date().toISOString(),
        }]);
        setContent("");
      }
    } catch {}
    setPosting(false);
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-800/60">
      <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-300">
        <MessageSquare size={16} className="text-brand-400" />
        Discussion
        {comments.length > 0 && (
          <span className="text-xs font-normal text-gray-500">{comments.length}</span>
        )}
      </h2>

      {/* Comment input */}
      <div className="flex gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold shrink-0">
          {user?.user_metadata?.pen_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePost()}
              placeholder={user ? "Add a comment..." : "Log in to comment"}
              disabled={!user}
              className="input-field py-2 flex-1"
              maxLength={1000}
            />
            <button
              onClick={handlePost}
              disabled={!content.trim() || posting || !user}
              className="btn-primary px-3 py-2 disabled:opacity-40"
            >
              {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={16} className="animate-spin text-gray-500" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-brand-500/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                {c.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-300">{c.author_name}</span>
                  <span className="text-[10px] text-gray-600">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600 text-center py-4">No comments yet. Be the first to discuss this story.</p>
      )}
    </div>
  );
}
