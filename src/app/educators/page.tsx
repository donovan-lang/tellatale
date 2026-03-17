import type { Metadata } from "next";
import {
  GraduationCap,
  Lightbulb,
  PenTool,
  Users,
  GitFork,
  BookOpen,
  Globe,
  ShieldOff,
  DollarSign,
  Sparkles,
  Vote,
  MessageCircle,
  ArrowRight,
  Library,
  Languages,
  Workflow,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MakeATale for Educators | Collaborative Storytelling in the Classroom",
  description:
    "Use MakeATale to teach creative writing, teamwork, and narrative thinking. Free, no accounts required. Students write branching stories together with optional AI assistance.",
  openGraph: {
    title: "MakeATale for Educators | Collaborative Storytelling in the Classroom",
    description:
      "Use MakeATale to teach creative writing, teamwork, and narrative thinking. Free, no accounts required.",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
};

const BENEFITS = [
  {
    icon: PenTool,
    title: "Creative writing practice with AI assistance",
    desc: "Students can generate story prompts with AI or write from scratch. AI lowers the blank-page barrier while keeping the creative work in students' hands.",
  },
  {
    icon: Users,
    title: "Collaborative storytelling teaches teamwork",
    desc: "Multiple students contribute branches to the same story, learning to build on each other's ideas and negotiate narrative direction.",
  },
  {
    icon: GitFork,
    title: "Branching narratives teach cause-and-effect",
    desc: "Every branch is a 'what if?' moment. Students see how different choices lead to different outcomes — critical thinking through fiction.",
  },
  {
    icon: Globe,
    title: "Genre exploration across literary traditions",
    desc: "From fantasy and sci-fi to horror and romance, students experiment with genre conventions, voice, and structure in a low-stakes environment.",
  },
  {
    icon: ShieldOff,
    title: "No accounts required",
    desc: "Students can read and write anonymously. No sign-up friction, no student data collection, no permissions slips needed.",
  },
  {
    icon: DollarSign,
    title: "Free to use",
    desc: "MakeATale is completely free. No premium tiers, no per-student licensing, no hidden costs.",
  },
];

const STEPS = [
  {
    number: "1",
    icon: Sparkles,
    title: "Teacher creates a story seed",
    desc: "Write an opening paragraph yourself, or use AI to generate a genre-specific prompt. Set the scene, introduce a character, pose a dilemma — whatever gets students writing.",
  },
  {
    number: "2",
    icon: PenTool,
    title: "Students write branches",
    desc: "Each student (or group) takes the story in a different direction. They read the seed, then write their own continuation — creating a branching narrative tree.",
  },
  {
    number: "3",
    icon: Vote,
    title: "Class votes on the best branches",
    desc: "Students upvote the branches they find most compelling. This builds critical reading skills and teaches students to evaluate narrative craft, not just produce it.",
  },
  {
    number: "4",
    icon: MessageCircle,
    title: "Discuss narrative choices",
    desc: "Why did certain branches resonate more? Facilitate a class discussion on voice, pacing, tension, character development, and what makes a story work.",
  },
];

const USE_CASES = [
  {
    icon: PenTool,
    title: "Creative writing workshops",
    desc: "Daily or weekly writing exercises with built-in peer feedback through the voting system.",
  },
  {
    icon: Library,
    title: "Literature classes",
    desc: "Explore genre conventions by having students write in specific genres and compare their approaches.",
  },
  {
    icon: Languages,
    title: "ESL / EFL writing practice",
    desc: "Low-pressure writing in a collaborative format. Students learn from reading peers' branches and build vocabulary in context.",
  },
  {
    icon: Workflow,
    title: "Story structure & narrative analysis",
    desc: "Use branching trees to visualize rising action, climax, and resolution. Students see structure by building it.",
  },
  {
    icon: UsersRound,
    title: "Collaborative group projects",
    desc: "Assign groups to build out different story trees. Combine creative writing with project management and peer review.",
  },
];

export default function EducatorsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-sm text-emerald-400 mb-6">
          <GraduationCap size={14} />
          For teachers &amp; educators
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          MakeATale for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-400 to-teal-400">
            Educators
          </span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Collaborative storytelling for the classroom. Students write branching
          narratives together, vote on the best continuations, and learn
          creative writing through practice — with optional AI assistance to
          spark ideas.
        </p>
      </div>

      {/* Why it works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Lightbulb size={20} className="text-brand-400" />
          Why It Works for Education
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="card p-5 group hover:border-brand-500/30"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center mb-3 group-hover:bg-brand-500/20 transition-colors">
                <b.icon size={18} className="text-brand-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to use it in class */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen size={20} className="text-brand-400" />
          How to Use It in Class
        </h2>
        <div className="gradient-border rounded-2xl bg-gray-100/50 dark:bg-gray-900/50 overflow-hidden">
          <div className="p-6 space-y-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold text-lg">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    <step.icon size={16} className="text-brand-400" />
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <GraduationCap size={20} className="text-brand-400" />
          Use Cases
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map((uc) => (
            <div
              key={uc.title}
              className="card p-5 group hover:border-brand-500/30"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center mb-3 group-hover:bg-brand-500/20 transition-colors">
                <uc.icon size={18} className="text-brand-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{uc.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12">
        <h2 className="text-2xl font-bold mb-3">
          Ready to bring storytelling into your classroom?
        </h2>
        <p className="text-gray-400 mb-6">
          No setup, no accounts, no cost. Just share a link and start writing.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/submit"
            className="btn-primary btn-large inline-flex items-center gap-2"
          >
            Start a Classroom Story
            <ArrowRight size={16} />
          </Link>
          <a
            href={
              process.env.NEXT_PUBLIC_DISCORD_INVITE ||
              "https://discord.gg/TJn25WNRVv"
            }
            target="_blank"
            rel="noopener"
            className="btn-secondary btn-large"
          >
            Join Discord for Educator Support
          </a>
        </div>
      </section>
    </div>
  );
}
