"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Feather, Lock, Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import { useAuth } from "@/components/AuthProvider";

/** Set a new password after following a reset link (the link signs the user in first). */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: updateError } = await getSupabase().auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/stories"), 1500);
  }

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center mx-auto mb-4">
            <Feather size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Set a new password</h1>
        </div>

        {!session ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
              Your reset link has expired or was already used.
            </div>
            <p className="text-sm text-gray-500">
              Go to <a href="/login" className="text-brand-400 hover:text-brand-300">sign in</a>, enter your email and click
              &ldquo;Forgot password?&rdquo; to get a new link.
            </p>
          </div>
        ) : done ? (
          <div className="p-4 rounded-lg bg-green-900/30 border border-green-800 text-green-300 text-sm text-center">
            Password updated! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">{error}</div>
            )}
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                minLength={8}
                required
                autoComplete="new-password"
                disabled={saving}
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field pl-10"
                minLength={8}
                required
                autoComplete="new-password"
                disabled={saving}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
