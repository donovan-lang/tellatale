"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, Users, Loader2, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Challenge } from "@/types";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setChallenges(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = challenges.filter((c) => new Date(c.end_date) > new Date());
  const past = challenges.filter((c) => new Date(c.end_date) <= new Date());

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Trophy size={24} className="text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold">Writing Challenges</h1>
          <p className="text-sm text-gray-500">Compete with other writers. Top-voted entries get featured.</p>
        </div>
      </div>

      {/* Active */}
      {active.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-brand-400">Active Now</h2>
          <div className="space-y-4">
            {active.map((c) => (
              <div key={c.id} className="card p-6 border-brand-500/30 bg-gradient-to-r from-brand-500/5 to-purple-500/5">
                <h3 className="text-xl font-bold mb-2">{c.title}</h3>
                {c.description && <p className="text-sm text-gray-400 mb-3">{c.description}</p>}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1">Prompt</p>
                  <p className="text-sm text-gray-300 italic">&ldquo;{c.prompt}&rdquo;</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Ends {formatDistanceToNow(new Date(c.end_date), { addSuffix: true })}
                  </span>
                </div>
                <a href="/submit" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                  Enter Challenge <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="card text-center py-12 mb-10">
          <Trophy size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500 mb-2">No active challenges right now.</p>
          <p className="text-xs text-gray-600">Check back soon — new challenges are posted regularly.</p>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-400">Past Challenges</h2>
          <div className="space-y-3">
            {past.map((c) => (
              <div key={c.id} className="card p-4 opacity-70">
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-1">&ldquo;{c.prompt}&rdquo;</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
