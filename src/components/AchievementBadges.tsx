"use client";

interface BadgeStats {
  seeds: number;
  branches: number;
  votes: number;
  maxVotes: number;
  endings?: number;
  maxDepth?: number;
}

const BADGES: { id: string; icon: string; name: string; desc: string; check: (s: BadgeStats) => boolean }[] = [
  { id: "first_seed", icon: "\u{1F331}", name: "First Seed", desc: "Plant your first story", check: (s) => s.seeds >= 1 },
  { id: "ten_branches", icon: "\u{1F33F}", name: "Branching Out", desc: "Write 10 branches", check: (s) => s.branches >= 10 },
  { id: "hundred_votes", icon: "\u{2B50}", name: "Star Writer", desc: "Earn 100 votes", check: (s) => s.votes >= 100 },
  { id: "five_seeds", icon: "\u{1F333}", name: "Story Forest", desc: "Plant 5 story seeds", check: (s) => s.seeds >= 5 },
  { id: "prolific", icon: "\u{1F4DA}", name: "Prolific", desc: "Write 25 total stories", check: (s) => s.seeds + s.branches >= 25 },
  { id: "popular", icon: "\u{1F525}", name: "Trending", desc: "Get a story to 50+ votes", check: (s) => s.maxVotes >= 50 },
  { id: "first_ending", icon: "\u{1F3C1}", name: "The End", desc: "Write an ending to a path", check: (s) => (s.endings || 0) >= 1 },
  { id: "deep_diver", icon: "\u{1F30A}", name: "Deep Diver", desc: "Write a branch 5+ choices deep", check: (s) => (s.maxDepth || 0) >= 5 },
];

/** `themed` draws with the writer's profile theme (CSS vars from profile-theme.ts) instead of brand colors. */
export default function AchievementBadges({ stats, themed = false }: { stats: BadgeStats; themed?: boolean }) {
  if (themed) {
    return (
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BADGES.map((b) => {
          const earned = b.check(stats);
          return (
            <li
              key={b.id}
              className={`profile-badge ${earned ? "is-earned" : "is-locked"}`}
              title={earned ? b.desc : `Locked: ${b.desc}`}
            >
              <span className="text-2xl" aria-hidden>{b.icon}</span>
              <span className="text-xs font-semibold leading-tight">{b.name}</span>
              <span className="sr-only">{earned ? "earned" : "not earned yet"}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {BADGES.map(b => {
        const earned = b.check(stats);
        return (
          <div key={b.id} className={`text-center p-2 rounded-lg border ${earned ? "bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30" : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-40"}`} title={b.desc}>
            <span className="text-xl">{b.icon}</span>
            <p className="text-[9px] font-semibold mt-0.5 text-gray-700 dark:text-gray-300">{b.name}</p>
          </div>
        );
      })}
    </div>
  );
}
