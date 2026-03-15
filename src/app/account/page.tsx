"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  User,
  Mail,
  Pen,
  Bell,
  CreditCard,
  Wallet,
  Save,
  Loader2,
  Settings,
  BookOpen,
  Shield,
  FileText,
} from "lucide-react";

interface ProfileData {
  pen_name: string;
  bio: string | null;
  wallet_address: string | null;
  email: string;
  provider: string;
  avatar_url: string | null;
  email_prefs: {
    notify_branch: boolean;
    notify_votes: boolean;
    notify_tips: boolean;
    newsletter: boolean;
    marketing: boolean;
  };
}

type Tab = "profile" | "story" | "notifications" | "payment";

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");

  // Editable fields
  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  // Story preferences
  const [defaultAnonymous, setDefaultAnonymous] = useState(false);
  const [matureContent, setMatureContent] = useState(false);

  // Notification prefs
  const [notifyBranch, setNotifyBranch] = useState(true);
  const [notifyVotes, setNotifyVotes] = useState(true);
  const [notifyTips, setNotifyTips] = useState(true);
  const [newsletter, setNewsletter] = useState(true);

  const loadProfile = useCallback(async (currentUser: typeof user) => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data: ProfileData = await res.json();
        setProfile(data);
        setPenName(data.pen_name || "");
        setBio(data.bio || "");
        setWalletAddress(data.wallet_address || "");
        setNotifyBranch(data.email_prefs.notify_branch);
        setNotifyVotes(data.email_prefs.notify_votes);
        setNotifyTips(data.email_prefs.notify_tips);
        setNewsletter(data.email_prefs.newsletter);
      } else {
        // API failed (auth cookie issue) — build profile from user metadata
        const name =
          currentUser?.user_metadata?.pen_name ||
          currentUser?.user_metadata?.full_name ||
          currentUser?.email?.split("@")[0] ||
          "Anonymous";
        setProfile({
          pen_name: name,
          bio: null,
          wallet_address: null,
          email: currentUser?.email || "",
          provider: currentUser?.app_metadata?.provider || "email",
          avatar_url: currentUser?.user_metadata?.avatar_url || null,
          email_prefs: {
            notify_branch: true,
            notify_votes: true,
            notify_tips: true,
            newsletter: true,
            marketing: false,
          },
        });
        setPenName(name);
      }
    } catch {
      // Fallback
      setProfile({
        pen_name: "Anonymous",
        bio: null,
        wallet_address: null,
        email: currentUser?.email || "",
        provider: "email",
        avatar_url: null,
        email_prefs: {
          notify_branch: true,
          notify_votes: true,
          notify_tips: true,
          newsletter: true,
          marketing: false,
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadProfile(user);
  }, [user, authLoading, router, loadProfile]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pen_name: penName,
          bio,
          wallet_address: walletAddress,
          email_prefs: {
            notify_branch: notifyBranch,
            notify_votes: notifyVotes,
            notify_tips: notifyTips,
            newsletter,
            marketing: false,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to save");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      alert("Failed to save. Try again.");
    }
    setSaving(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const TABS: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "story", label: "Story Settings", icon: BookOpen },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payment", label: "Payment", icon: CreditCard },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-xl font-bold">
          {penName.charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{penName || "Your Account"}</h1>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide border-b border-gray-800 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors shrink-0 ${
              tab === t.id
                ? "text-brand-400 border-b-2 border-brand-400 -mb-px"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ====== PROFILE TAB ====== */}
      {tab === "profile" && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Pen size={16} className="text-brand-400" />
              Display Name
            </h2>
            <input
              type="text"
              value={penName}
              onChange={(e) => setPenName(e.target.value)}
              placeholder="Your pen name"
              maxLength={50}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500"
            />
            <p className="text-xs text-gray-600">
              This is how other writers see you. Max 50 characters.
            </p>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText size={16} className="text-brand-400" />
              Bio
            </h2>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell readers a little about yourself..."
              maxLength={300}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:border-brand-500"
            />
            <p className="text-right text-xs text-gray-600">
              {bio.length}/300
            </p>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Mail size={16} className="text-brand-400" />
              Email
            </h2>
            <div className="flex items-center gap-3">
              <input
                type="email"
                value={profile.email}
                disabled
                className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
              />
              <span className="text-xs text-gray-600 bg-gray-800 px-3 py-1.5 rounded-full capitalize">
                {profile.provider}
              </span>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Wallet size={16} className="text-brand-400" />
              Tip Wallet (Solana)
            </h2>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Your Solana wallet address for receiving tips"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-brand-500"
            />
            <p className="text-xs text-gray-600">
              When readers tip your stories, funds go here. Leave blank to
              disable tips.
            </p>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2 text-red-400">
              <Shield size={16} />
              Account
            </h2>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              Sign out of this device
            </button>
          </div>
        </div>
      )}

      {/* ====== STORY SETTINGS TAB ====== */}
      {tab === "story" && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Settings size={16} className="text-brand-400" />
              Writing Defaults
            </h2>
            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={defaultAnonymous}
                onChange={(e) => setDefaultAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
              />
              Post as Anonymous by default
            </label>
            <p className="text-xs text-gray-600 ml-7">
              Your pen name won&apos;t appear on new stories or branches. You
              can override this per-post.
            </p>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <BookOpen size={16} className="text-brand-400" />
              Content Preferences
            </h2>
            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={matureContent}
                onChange={(e) => setMatureContent(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
              />
              Show mature/dark themes in feed
            </label>
            <p className="text-xs text-gray-600 ml-7">
              Some stories may contain mature themes. Enable this to include
              them in your feed.
            </p>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold">Your Stories</h2>
            <p className="text-sm text-gray-500">
              View and manage all stories and branches you&apos;ve written.
            </p>
            <p className="text-xs text-gray-600 italic">
              Story management dashboard coming soon.
            </p>
          </div>
        </div>
      )}

      {/* ====== NOTIFICATIONS TAB ====== */}
      {tab === "notifications" && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Bell size={16} className="text-brand-400" />
              Email Notifications
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyBranch}
                  onChange={(e) => setNotifyBranch(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
                />
                Someone branches your story
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyVotes}
                  onChange={(e) => setNotifyVotes(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
                />
                Your story gets upvoted
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyTips}
                  onChange={(e) => setNotifyTips(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
                />
                You receive a tip
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
                />
                Weekly digest of top stories & platform news
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ====== PAYMENT TAB ====== */}
      {tab === "payment" && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CreditCard size={16} className="text-brand-400" />
              Payment & Earnings
            </h2>
            <div className="bg-gray-800/50 rounded-lg p-6 text-center">
              <CreditCard size={32} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">
                Payment features are coming soon.
              </p>
              <p className="text-xs text-gray-600 mt-2">
                You&apos;ll be able to manage earnings from tips, set up
                payouts, and purchase tokens for premium features like PDF
                chronicle exports.
              </p>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Wallet size={16} className="text-brand-400" />
              Tip Earnings
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-brand-400">$0.00</p>
                <p className="text-xs text-gray-500 mt-1">Total earned</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-gray-500 mt-1">Tips received</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-2xl font-bold">$0.00</p>
                <p className="text-xs text-gray-500 mt-1">Available</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Tip earnings are sent directly to your Solana wallet. Set your
              wallet address in the Profile tab.
            </p>
          </div>
        </div>
      )}

      {/* Save button (sticky bottom) */}
      <div className="sticky bottom-4 mt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-semibold shadow-lg shadow-brand-500/20 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : saved ? (
            "Saved!"
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
