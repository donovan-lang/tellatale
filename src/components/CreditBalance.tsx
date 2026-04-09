"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export default function CreditBalance() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const session = localStorage.getItem("sb-pnufyhorwltjagbklpwx-auth-token");
    if (!session) return;

    try {
      const parsed = JSON.parse(session);
      const token = parsed?.[0] || parsed?.access_token;
      if (!token) return;

      fetch("/api/credits/balance", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.total_available !== undefined) setCredits(d.total_available);
        })
        .catch(() => {});
    } catch {}
  }, []);

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
