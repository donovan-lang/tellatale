"use client";

const BADGES = [
  { id: "first_seed", icon: "\u{1F331}", name: "First Seed", desc: "Plant your first story", check: (s: any) => s.seeds >= 1 },
  { id: "ten_branches", icon: "\u{1F33F}", name: "Branching Out", desc: "Write 10 branches", check: (s: any) => s.branches >= 10 },
  { id: "hundred_votes", icon: "\u{2B50}", name: "Star Writer", desc: "Earn 100 votes", check: (s: any) => s.votes >= 100 },
  { id: "five_seeds", icon: "\u{1F333}", name: "Story Forest", desc: "Plant 5 story seeds", check: (s: any) => s.seeds >= 5 },
  { id: "prolific", icon: "\u{1F4DA}", name: "Prolific", desc: "Write 25 total stories", check: (s: any) => s.seeds + s.branches >= 25 },
  { id: "popular", icon: "\u{1F525}", name: "Trending", desc: "Get a story to 50+ votes", check: (s: any) => s.maxVotes >= 50 },
];

export default function AchievementBadges({ stats }: { stats: { seeds: number; branches: number; votes: number; maxVotes: number } }) {
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
