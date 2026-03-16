"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  ChevronUp,
  ChevronDown,
  Reply,
  Flag,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { getSupabase } from "@/lib/supabase-browser";
import { toAuthorSlug } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Comment } from "@/types";

function buildTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];
  comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
  map.forEach((c) => {
    if (c.parent_comment_id) {
      const parent = map.get(c.parent_comment_id);
      if (parent) parent.children!.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

function CommentItem({
  comment,
  depth,
  storyId,
  user,
  getHeaders,
  onReply,
}: {
  comment: Comment;
  depth: number;
  storyId: string;
  user: any;
  getHeaders: () => Promise<Record<string, string>>;
  onReply: (parentId: string, content: string) => Promise<void>;
}) {
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [votes, setVotes] = useState({ up: comment.upvotes, down: comment.downvotes });
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [reported, setReported] = useState(false);

  const score = votes.up - votes.down;

  async function handleVote(direction: 1 | -1) {
    if (!user) return;
    const newVote = userVote === direction ? 0 : direction;
    setVotes((prev) => ({
      up: prev.up + (newVote === 1 ? 1 : 0) - (userVote === 1 ? 1 : 0),
      down: prev.down + (newVote === -1 ? 1 : 0) - (userVote === -1 ? 1 : 0),
    }));
    setUserVote(newVote as 1 | -1 | 0);
    const headers = await getHeaders();
    const res = await fetch(`/api/stories/${storyId}/comments`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: comment.id, vote: newVote }),
    });
    const data = await res.json();
    if (data.ok) setVotes({ up: data.upvotes, down: data.downvotes });
  }

  async function handleReply() {
    if (!replyText.trim() || posting) return;
    setPosting(true);
    await onReply(comment.id, replyText.trim());
    setReplyText("");
    setReplying(false);
    setPosting(false);
  }

  async function handleReport() {
    if (reported) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story_id: storyId, reason: `Reported comment by ${comment.author_name}: "${comment.content.slice(0, 100)}"` }),
    });
    setReported(true);
  }

  return (
    <div className={`${depth > 0 ? "ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-800" : ""}`}>
      <div className="flex gap-3 py-2">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-0 shrink-0">
          <button
            onClick={() => handleVote(1)}
            disabled={!user}
            className={`p-0.5 rounded transition-all ${userVote === 1 ? "text-brand-400" : "text-gray-400 dark:text-gray-600 hover:text-brand-400"} disabled:opacity-30`}
          >
            <ChevronUp size={14} />
          </button>
          <span className={`text-[10px] font-bold tabular-nums ${score > 0 ? "text-brand-400" : score < 0 ? "text-red-400" : "text-gray-400 dark:text-gray-600"}`}>
            {score}
          </span>
          <button
            onClick={() => handleVote(-1)}
            disabled={!user}
            className={`p-0.5 rounded transition-all ${userVote === -1 ? "text-red-400" : "text-gray-400 dark:text-gray-600 hover:text-red-400"} disabled:opacity-30`}
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-brand-500/30 flex items-center justify-center text-[9px] font-bold shrink-0">
              {comment.author_name.charAt(0).toUpperCase()}
            </div>
            {comment.user_id ? (
              <a href={`/author/${toAuthorSlug(comment.author_name)}`} className="text-xs font-semibold text-gray-800 dark:text-gray-200 hover:text-brand-400 transition-colors">
                {comment.author_name}
              </a>
            ) : (
              <a href={`/author/${toAuthorSlug(comment.author_name)}`} className="text-xs font-semibold text-gray-800 dark:text-gray-200 hover:text-brand-400 transition-colors">{comment.author_name}</a>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-600">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1.5">
            {user && (
              <button
                onClick={() => setReplying(!replying)}
                className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-brand-400 transition-colors flex items-center gap-1"
              >
                <Reply size={10} /> Reply
              </button>
            )}
            <button
              onClick={handleReport}
              className={`text-[10px] transition-colors flex items-center gap-1 ${reported ? "text-green-400" : "text-gray-400 dark:text-gray-600 hover:text-red-400"}`}
            >
              <Flag size={9} /> {reported ? "Reported" : "Report"}
            </button>
          </div>

          {/* Reply form */}
          {replying && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder={`Reply to ${comment.author_name}...`}
                className="input-field py-1.5 text-xs flex-1"
                maxLength={2000}
                autoFocus
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || posting}
                className="btn-primary px-2.5 py-1.5 text-xs disabled:opacity-40"
              >
                {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Children (threaded replies) */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-1">
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              depth={depth + 1}
              storyId={storyId}
              user={user}
              getHeaders={getHeaders}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ storyId }: { storyId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const [formLoadedAt] = useState(Date.now());

  async function getHeaders(): Promise<Record<string, string>> {
    const sb = getSupabase();
    const { data: session } = await sb.auth.getSession();
    return session.session?.access_token
      ? { Authorization: `Bearer ${session.session.access_token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }

  function loadComments() {
    fetch(`/api/stories/${storyId}/comments`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setComments(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadComments(); }, [storyId]);

  async function handlePost(parentId?: string, text?: string) {
    const body = text || content.trim();
    if (!body || posting) return;
    if (!parentId && honeypot) return;
    if (!parentId && Date.now() - formLoadedAt < 2000) return;

    setPosting(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/stories/${storyId}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: body,
          parent_comment_id: parentId || null,
          _hp: honeypot,
          _ts: formLoadedAt,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newComment: Comment = {
          id: data.id,
          story_id: storyId,
          user_id: data.user_id || user?.id || null,
          author_name: data.author_name,
          content: body,
          parent_comment_id: parentId || null,
          upvotes: 0,
          downvotes: 0,
          is_hidden: false,
          created_at: new Date().toISOString(),
        };
        setComments((prev) => [...prev, newComment]);
        if (!parentId) setContent("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to post comment");
      }
    } catch {}
    setPosting(false);
  }

  async function handleReply(parentId: string, text: string) {
    await handlePost(parentId, text);
  }

  const tree = buildTree(comments);
  const penName = user?.user_metadata?.pen_name || user?.user_metadata?.full_name || user?.email?.split("@")[0];

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800/60">
      <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <MessageSquare size={16} className="text-brand-400" />
        Discussion
        {comments.length > 0 && (
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </h2>

      {/* Honeypot */}
      <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {/* Top-level comment input */}
      {user ? (
        <div className="flex gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
            {penName?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePost()}
                placeholder="Add a comment..."
                className="input-field py-2 flex-1"
                maxLength={2000}
              />
              <button
                onClick={() => handlePost()}
                disabled={!content.trim() || posting}
                className="btn-primary px-3 py-2 disabled:opacity-40"
              >
                {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
              Commenting as <span className="font-medium text-brand-400">{penName}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="card mb-5 text-center py-4">
          <p className="text-sm text-gray-500">
            <a href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Log in</a> to join the discussion.
          </p>
        </div>
      )}

      {/* Comments tree */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={16} className="animate-spin text-gray-500" />
        </div>
      ) : tree.length > 0 ? (
        <div className="space-y-1">
          {tree.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              depth={0}
              storyId={storyId}
              user={user}
              getHeaders={getHeaders}
              onReply={handleReply}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-6">
          No comments yet. Start the conversation.
        </p>
      )}
    </div>
  );
}
