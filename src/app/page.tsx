import {
  GitFork,
  ThumbsUp,
  Wallet,
  Feather,
  TrendingUp,
  Clock,
  Users,
  BookOpen,
  Pen,
  Heart,
} from "lucide-react";
import StoryCard from "@/components/StoryCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import { DEMO_STORIES, isDemo } from "@/lib/demo-data";
import type { Story } from "@/types";

async function getStories(): Promise<Story[]> {
  try {
    if (isDemo()) return DEMO_STORIES;

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("stories")
      .select("*, children_count:stories(count)")
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch {
    return DEMO_STORIES;
  }
}

const STATS = [
  { label: "Stories planted", value: "2,847", icon: BookOpen },
  { label: "Branches grown", value: "11,203", icon: GitFork },
  { label: "Active writers", value: "934", icon: Users },
  { label: "Tips sent", value: "$4.2K", icon: Wallet },
];

const FEATURES = [
  {
    icon: Feather,
    title: "Plant a Seed",
    description:
      "Write the opening of a story — a scene, a question, a single haunting sentence. That's all it takes to start something.",
  },
  {
    icon: GitFork,
    title: "Branch & Fork",
    description:
      "Anyone can write what happens next. Stories fork into choose-your-own-adventure trees shaped by the community.",
  },
  {
    icon: ThumbsUp,
    title: "Vote on Paths",
    description:
      "Upvote the branches you love. The best continuations rise to the top. Bad turns fade away.",
  },
  {
    icon: Pen,
    title: "Build Your Reputation",
    description:
      "Your best writing earns votes and followers. Build a portfolio of stories and branches the community loves.",
  },
  {
    icon: Heart,
    title: "Tip Your Favorites",
    description:
      "Love a story? Send the writer a tip directly. Great writing deserves recognition.",
  },
  {
    icon: Users,
    title: "Join the Community",
    description:
      "Connect with writers, discover new voices, and be part of stories that grow beyond what any one person could write.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Write your opening",
    description: "A paragraph. A scene. A question. Plant the seed of something interesting.",
    color: "from-brand-500 to-purple-600",
  },
  {
    step: "02",
    title: "Share it with the world",
    description: "Your story hits the feed. Readers discover it, vote on it, and get hooked.",
    color: "from-purple-500 to-indigo-600",
  },
  {
    step: "03",
    title: "Others continue it",
    description: "Anyone can write the next chapter. Multiple paths emerge. The story grows.",
    color: "from-indigo-500 to-blue-600",
  },
  {
    step: "04",
    title: "The best paths win",
    description: "The community votes. The most compelling branches rise to the top.",
    color: "from-blue-500 to-cyan-600",
  },
];

export default async function HomePage() {
  const stories = await getStories();
  const topStories = [...stories].sort(
    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  );
  const newStories = [...stories].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-sm text-brand-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-400 pulse-dot" />
            Now in open beta — start writing for free
          </div>

          <h1 className="animate-fade-up animate-fade-up-delay-1 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Stories that{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-indigo-400 glow-brand">
              grow
            </span>
            <br />
            with every reader
          </h1>

          <p className="animate-fade-up animate-fade-up-delay-2 mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Write the beginning. The community writes what happens next.
            Collaborative fiction where every reader shapes the story.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-up animate-fade-up-delay-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="btn-primary btn-large shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30"
            >
              Start Writing — It&apos;s Free
            </a>
            <a href="/explore" className="btn-secondary btn-large">
              Explore Stories
            </a>
          </div>

          {/* Stats bar */}
          <div className="animate-fade-up animate-fade-up-delay-4 mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 text-center"
              >
                <stat.icon
                  size={18}
                  className="mx-auto text-brand-400 mb-2"
                />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-950 to-transparent" />
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-2">
            How It Works
          </p>
          <h2 className="section-heading">From seed to saga in four steps</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="relative group">
              <div className="gradient-border rounded-2xl p-6 h-full bg-gray-900/50">
                <span
                  className={`inline-block text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br ${item.color} mb-4`}
                >
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-2">
            Features
          </p>
          <h2 className="section-heading">
            Everything a storyteller needs
          </h2>
          <p className="mt-3 text-gray-500 max-w-lg mx-auto">
            Write, branch, vote, and earn — all in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="card group hover:border-brand-500/30 p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                <feature.icon size={20} className="text-brand-400" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== STORY EXAMPLE VISUAL ===== */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="gradient-border rounded-2xl bg-gray-900/50 p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-3">
                Branching Stories
              </p>
              <h2 className="section-heading mb-4">
                One seed. Infinite paths.
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Every story is a tree. You write the trunk — the community grows the branches.
                Readers vote on which paths are the most compelling, and the best stories
                rise to the top.
              </p>
              <a href="/submit" className="btn-primary inline-flex items-center gap-2">
                <Feather size={16} />
                Plant Your First Seed
              </a>
            </div>

            {/* Visual story tree */}
            <div className="bg-gray-950/50 rounded-xl p-6 border border-gray-800/50">
              <div className="space-y-3">
                {/* Root */}
                <div className="bg-gray-800/80 rounded-lg p-3 border-l-4 border-brand-500">
                  <p className="text-xs text-brand-400 font-semibold">Root Story</p>
                  <p className="text-sm mt-1">&ldquo;The door appeared on a Tuesday...&rdquo;</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>142 votes</span>
                    <span>3 branches</span>
                  </div>
                </div>
                {/* Branches */}
                <div className="ml-6 space-y-2">
                  <div className="bg-gray-800/50 rounded-lg p-3 border-l-2 border-purple-500/60">
                    <p className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                      <GitFork size={10} /> Branch A
                      <span className="ml-auto text-green-400">Top voted</span>
                    </p>
                    <p className="text-sm mt-1 text-gray-300">&ldquo;She opened it and found...&rdquo;</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border-l-2 border-indigo-500/40">
                    <p className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                      <GitFork size={10} /> Branch B
                    </p>
                    <p className="text-sm mt-1 text-gray-400">&ldquo;He walked past it, but...&rdquo;</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border-l-2 border-blue-500/30">
                    <p className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                      <GitFork size={10} /> Branch C
                    </p>
                    <p className="text-sm mt-1 text-gray-500">&ldquo;The door spoke first...&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOP STORIES ===== */}
      <section id="stories" className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-2">
              Explore
            </p>
            <h2 className="section-heading">Trending stories</h2>
            <p className="mt-2 text-gray-500 text-sm">
              The most-voted story seeds. Click to read branches or add your own.
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/#stories" className="btn-ghost text-sm inline-flex items-center gap-1.5 bg-gray-800 text-white">
              <TrendingUp size={14} /> Top
            </a>
            <a href="/#new" className="btn-ghost text-sm inline-flex items-center gap-1.5">
              <Clock size={14} /> New
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {topStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>

        {topStories.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-lg">No stories yet. Be the first.</p>
            <a href="/submit" className="btn-primary mt-4 inline-block">
              Plant the first seed
            </a>
          </div>
        )}
      </section>

      {/* ===== NEW STORIES ===== */}
      <section id="new" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="section-heading">Fresh seeds</h2>
            <p className="mt-2 text-gray-500 text-sm">
              Just planted. Be the first to branch these stories.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {newStories.map((story) => (
            <StoryCard key={`new-${story.id}`} story={story} />
          ))}
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="gradient-border rounded-2xl bg-gray-900/50 p-8 md:p-10 text-center">
          <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-2">
            Stay in the loop
          </p>
          <h2 className="section-heading mb-3">
            Get the best stories in your inbox
          </h2>
          <p className="text-gray-400 text-sm max-w-lg mx-auto mb-6">
            Weekly digest of top-voted stories, new features, and creator spotlights.
            No spam, unsubscribe anytime.
          </p>
          <div className="flex justify-center">
            <NewsletterSignup source="homepage_section" />
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="hero-gradient rounded-2xl border border-gray-800/60 p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your story is waiting to be told
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Join thousands of writers building collaborative fiction.
            Free to start. Earn tips from readers who love your work.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="btn-primary btn-large shadow-lg shadow-brand-500/20"
            >
              Create Your Free Account
            </a>
            <a href="/submit" className="btn-secondary btn-large">
              Or just start writing
            </a>
          </div>
          <p className="mt-6 text-xs text-gray-600">
            No credit card required. Write anonymously or create a profile.
          </p>
        </div>
      </section>
    </>
  );
}
