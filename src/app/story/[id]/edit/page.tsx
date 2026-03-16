"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getSupabase } from "@/lib/supabase-browser";
import { useToast } from "@/components/Toast";
import { Loader2, Save, Trash2, ArrowLeft } from "lucide-react";
import type { Story } from "@/types";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

export default function StoryEditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [teaser, setTeaser] = useState("");
  const [content, setContent] = useState("");

  const loadStory = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/stories/${id}`);
      if (!res.ok) {
        setError("Story not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      const s: Story = data.story;

      // Auth check: only the author can edit
      if (!user || s.author_id !== user.id) {
        setError("You are not authorized to edit this story.");
        setLoading(false);
        return;
      }

      setStory(s);
      setTitle(s.title || "");
      setTeaser(s.teaser || "");
      setContent(s.content || "");
    } catch {
      setError("Failed to load story.");
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadStory();
  }, [user, authLoading, router, loadStory]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    try {
      const headers = await getAuthHeaders();
      const body: Record<string, string> = { content: content.trim() };

      if (story?.story_type === "seed" && title.trim()) {
        body.title = title.trim();
      }
      if (story?.story_type === "branch") {
        body.teaser = teaser.trim();
      }

      const res = await fetch(`/api/stories/${id}/edit`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Failed to save", "error");
      } else {
        toast("Story updated!");
        router.push(`/story/${id}`);
        router.refresh();
      }
    } catch {
      toast("Failed to save. Try again.", "error");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/stories/${id}/edit`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Failed to delete", "error");
      } else {
        toast("Story deleted.");
        // If it had a parent, go there; otherwise go to stories list
        if (story?.parent_id) {
          router.push(`/story/${story.parent_id}`);
        } else {
          router.push("/stories");
        }
        router.refresh();
      }
    } catch {
      toast("Failed to delete. Try again.", "error");
    }
    setDeleting(false);
    setConfirmDelete(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="card p-8">
          <h1 className="text-xl font-bold text-gray-400 mb-2">{error}</h1>
          <a href="/stories" className="btn-primary mt-6 inline-block">
            Back to stories
          </a>
        </div>
      </div>
    );
  }

  if (!story) return null;

  const isSeed = story.story_type === "seed";
  const isBranch = story.story_type === "branch";
  const maxContent = isBranch ? 5000 : 3000;
  const maxTeaser = 300;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/story/${id}`)}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Edit {isSeed ? "Story" : "Branch"}</h1>
      </div>

      <div className="space-y-4">
        {/* Title (seeds only) */}
        {isSeed && (
          <div className="card space-y-2 p-4">
            <label className="text-xs text-gray-500 font-medium block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Story title..."
              maxLength={200}
              className="input-field text-lg font-semibold"
            />
          </div>
        )}

        {/* Teaser (branches only) */}
        {isBranch && (
          <div className="card space-y-2 p-4">
            <label className="text-xs text-gray-500 font-medium block">
              Choice line <span className="text-gray-600">(what readers see before clicking)</span>
            </label>
            <input
              type="text"
              value={teaser}
              onChange={(e) => setTeaser(e.target.value)}
              placeholder="e.g. She opens the door and steps into the darkness..."
              maxLength={maxTeaser}
              className="input-field"
            />
            <p className="text-right text-xs text-gray-400 mt-1">
              {teaser.length}/{maxTeaser}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="card space-y-2 p-4">
          <label className="text-xs text-gray-500 font-medium block">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Your story content..."
            maxLength={maxContent}
            className="input-field resize-y min-h-[200px]"
          />
          <div className="flex justify-end">
            <span
              className={`text-xs tabular-nums ${
                content.length > maxContent * 0.9 ? "text-amber-400" : "text-gray-600"
              }`}
            >
              {content.length.toLocaleString()}/{maxContent.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-semibold disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {/* Delete section */}
        <div className="card p-4 border border-red-500/20">
          <h2 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h2>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-gray-500 hover:text-red-400 transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete this {isSeed ? "story" : "branch"}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Are you sure? This will permanently delete this{" "}
                {isSeed ? "story and all its branches" : "branch"}. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
