"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/supabase-browser";

export default function CreditBalance() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setCredits(null);
      return;
    }

    authFetch("/api/credits/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.total_available !== undefined) setCredits(d.total_available);
      })
      .catch(() => {});
  }, [user?.id]);

  if (credits === null) return null;

  return (
    <a
      href="/credits"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition-colors text-sm"
      title="AI Credits"
    >
      <Sparkles size={14} className="text-brand-400" />
      <span className="font-semibold text-brand-400">{credits}</span>
    </a>
  );
}
