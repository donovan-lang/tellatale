"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";
import { Users, Copy, Check, Link, Loader2 } from "lucide-react";

interface ReferralData {
  code: string;
  referrals: number;
  link: string;
}

export default function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const sb = getSupabase();
        const { data: sessionData } = await sb.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;

        const res = await fetch("/api/referral", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Silently fail — referral is non-critical
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function copyLink() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = data.link;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="card space-y-4">
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Users size={16} className="text-brand-400" />
        Invite Writers
      </h2>

      <p className="text-sm text-gray-500">
        Share your link and grow the community. Every writer you bring makes the
        stories better.
      </p>

      {/* Invite link */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400 overflow-hidden">
          <Link size={14} className="shrink-0 text-gray-400" />
          <span className="truncate">{data.link}</span>
        </div>
        <button
          onClick={copyLink}
          className="shrink-0 btn-primary px-4 py-3 flex items-center gap-2 text-sm"
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-brand-400">{data.referrals}</p>
        <p className="text-xs text-gray-500 mt-1">
          {data.referrals === 1 ? "writer invited" : "writers invited"}
        </p>
      </div>
    </div>
  );
}
