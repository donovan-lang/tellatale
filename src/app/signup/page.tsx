"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Feather, Mail, Lock, User, ArrowRight, Loader2, Bell, BellOff } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [penName, setPenName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formLoadedAt] = useState(Date.now());

  // Notification preferences
  const [notifyBranches, setNotifyBranches] = useState(true);
  const [notifyVotes, setNotifyVotes] = useState(true);
  const [notifyTips, setNotifyTips] = useState(true);
  const [newsletter, setNewsletter] = useState(true);

  async function saveEmailPrefs(userId: string, userEmail: string) {
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          source: "signup",
          user_id: userId,
          notify_branch: notifyBranches,
          notify_votes: notifyVotes,
          notify_tips: notifyTips,
          newsletter,
        }),
      });
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Anti-spam checks
    if (honeypot) return;
    if (Date.now() - formLoadedAt < 2000) {
      setError("Please wait a moment before submitting.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = getSupabase();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          pen_name: penName.trim() || "Anonymous",
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Save notification preferences
    if (data.user) {
      await saveEmailPrefs(data.user.id, email);
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/explore"), 1500);
  }

  async function handleGoogle() {
    setError(null);
    const supabase = getSupabase();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/explore`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center mx-auto mb-4">
            <Feather size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Start writing, branching, and earning tips.
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-900/30 border border-green-800 text-green-300 text-sm text-center">
            Account created! Redirecting...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Google sign-in */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="btn-secondary w-full flex items-center justify-center gap-3 py-3 text-sm font-medium disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-amber-50/30 dark:bg-gray-950 px-3 text-gray-600">or sign up with email</span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field — hidden from humans, bots fill it */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Pen name"
              value={penName}
              onChange={(e) => setPenName(e.target.value)}
              className="input-field pl-10"
              disabled={loading}
            />
          </div>

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-10"
              required
              disabled={loading}
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10"
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          {/* Notification preferences */}
          <div className="bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Bell size={14} className="text-brand-400" />
              Email notifications
            </p>
            <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyBranches}
                onChange={(e) => setNotifyBranches(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-brand-500 focus:ring-brand-500"
              />
              When someone branches your story
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyVotes}
                onChange={(e) => setNotifyVotes(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-brand-500 focus:ring-brand-500"
              />
              When your story gets upvoted
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyTips}
                onChange={(e) => setNotifyTips(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-brand-500 focus:ring-brand-500"
              />
              When you receive a tip
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-brand-500 focus:ring-brand-500"
              />
              Weekly digest of top stories & platform news
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-brand-400 hover:text-brand-300">Sign in</a>
        </p>

        <p className="mt-3 text-center text-xs text-gray-700">
          Don&apos;t want an account?{" "}
          <a href="/submit" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Write anonymously</a>
        </p>

        <p className="mt-6 text-center text-[11px] text-gray-700">
          By signing up you agree to our Terms of Service and Privacy Policy.
          We&apos;ll send you notifications based on your preferences above.
        </p>
      </div>
    </div>
  );
}
