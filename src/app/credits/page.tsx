"use client";

import { useEffect, useState } from "react";
import { Sparkles, Zap, Crown, Check, Loader2 } from "lucide-react";

interface Tier {
  id: string;
  credits: number;
  price: string;
  price_cents: number;
  per_credit: string;
  name: string;
}

interface Balance {
  purchased_credits: number;
  daily_credits_remaining: number;
  total_available: number;
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  starter: <Sparkles size={24} className="text-brand-400" />,
  value: <Zap size={24} className="text-yellow-400" />,
  pro: <Crown size={24} className="text-purple-400" />,
};

const TIER_LABELS: Record<string, string> = {
  starter: "Starter",
  value: "Best Value",
  pro: "Pro",
};

export default function CreditsPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check URL params for success/cancelled
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setSuccess(true);
      window.history.replaceState({}, "", "/credits");
    }

    // Fetch tiers
    fetch("/api/credits/purchase")
      .then((r) => r.json())
      .then((d) => setTiers(d.tiers || []))
      .catch(() => {});

    // Fetch balance (if logged in)
    const session = localStorage.getItem("sb-pnufyhorwltjagbklpwx-auth-token");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        const token = parsed?.[0] || parsed?.access_token;
        if (token) {
          fetch("/api/credits/balance", {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.total_available !== undefined) setBalance(d);
            })
            .catch(() => {});
        }
      } catch {}
    }
  }, []);

  async function handlePurchase(tierId: string) {
    setLoading(tierId);
    try {
      const session = localStorage.getItem("sb-pnufyhorwltjagbklpwx-auth-token");
      const parsed = session ? JSON.parse(session) : null;
      const token = parsed?.[0] || parsed?.access_token;

      if (!token) {
        window.location.href = "/login?redirect=/credits";
        return;
      }

      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Payment error");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Success banner */}
      {success && (
        <div className="mb-8 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-3">
          <Check size={20} />
          Credits added to your account! Start creating.
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">AI Story Credits</h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          Every account gets <strong className="text-brand-400">5 free AI generations per day</strong>.
          Need more? Purchase credits to unlock unlimited AI-powered storytelling.
        </p>
      </div>

      {/* Current balance */}
      {balance && (
        <div className="card p-5 mb-8 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Balance</p>
          <p className="text-3xl font-bold text-brand-400">{balance.total_available}</p>
          <p className="text-xs text-gray-500 mt-1">
            {balance.daily_credits_remaining} daily free + {balance.purchased_credits} purchased
          </p>
        </div>
      )}

      {/* What credits buy */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label: "Generate Story", cost: "1 credit", icon: "seed" },
          { label: "AI Branches", cost: "1 credit", icon: "branch" },
          { label: "Writing Assist", cost: "1 credit", icon: "polish" },
          { label: "Image Gen", cost: "3 credits", icon: "image" },
        ].map((item) => (
          <div key={item.label} className="card p-3 text-center">
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="text-xs text-brand-400 mt-1">{item.cost}</p>
          </div>
        ))}
      </div>

      {/* Pricing tiers */}
      <div className="grid sm:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`card p-6 text-center relative ${
              tier.id === "value"
                ? "border-brand-500/50 bg-gradient-to-b from-brand-500/5 to-transparent"
                : ""
            }`}
          >
            {tier.id === "value" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                Most Popular
              </div>
            )}

            <div className="flex justify-center mb-3">
              {TIER_ICONS[tier.id] || <Sparkles size={24} />}
            </div>

            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {TIER_LABELS[tier.id] || tier.id}
            </p>

            <p className="text-4xl font-bold mb-1">{tier.price}</p>

            <p className="text-2xl font-semibold text-brand-400 mb-1">
              {tier.credits} credits
            </p>

            <p className="text-xs text-gray-500 mb-5">
              {tier.per_credit} per credit
            </p>

            <button
              onClick={() => handlePurchase(tier.id)}
              disabled={loading !== null}
              className="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading === tier.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Buy Credits"
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Free tier info */}
      <div className="mt-10 text-center text-sm text-gray-500">
        <p>
          <strong>Free tier:</strong> 5 AI generations per day, resets at midnight UTC.
        </p>
        <p className="mt-1">
          Reading, writing without AI, voting, and commenting are always free.
        </p>
      </div>
    </div>
  );
}
