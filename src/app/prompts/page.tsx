import type { Metadata } from "next";
import { PenTool, ArrowRight, Share2, Calendar, Sparkles, ChevronLeft } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Prompt data                                                        */
/* ------------------------------------------------------------------ */

interface Prompt {
  text: string;
  genre: string;
  mood: string;
}

const PROMPTS: Prompt[] = [
  { text: "The last library on Earth has one book left, and it\u2019s writing itself.", genre: "Science Fiction", mood: "Mysterious" },
  { text: "You inherit a house, but it has one room that exists in a different time period.", genre: "Fantasy", mood: "Eerie" },
  { text: "An AI designed to predict the weather starts predicting human behavior.", genre: "Thriller", mood: "Unsettling" },
  { text: "A painter discovers that everything they paint becomes real overnight.", genre: "Fantasy", mood: "Whimsical" },
  { text: "Two strangers wake up on opposite sides of a locked door with only a phone between them.", genre: "Mystery", mood: "Tense" },
  { text: "The ocean recedes for a mile, revealing a city no one has ever seen.", genre: "Adventure", mood: "Awe-inspiring" },
  { text: "A child\u2019s imaginary friend starts leaving physical footprints.", genre: "Horror", mood: "Creepy" },
  { text: "You receive a letter from yourself, postmarked thirty years in the future.", genre: "Science Fiction", mood: "Reflective" },
  { text: "A musician plays a chord that makes everyone in the room remember something they\u2019d forgotten.", genre: "Literary Fiction", mood: "Nostalgic" },
  { text: "The last person on Earth hears a knock at the door.", genre: "Horror", mood: "Dreadful" },
  { text: "A detective is hired to solve their own murder.", genre: "Mystery", mood: "Dark" },
  { text: "Every mirror in the world stops showing reflections for exactly one minute.", genre: "Thriller", mood: "Paranoid" },
  { text: "A botanist discovers a flower that blooms only when someone nearby tells the truth.", genre: "Fantasy", mood: "Gentle" },
  { text: "Two rival kingdoms discover they\u2019ve been worshipping the same god under different names.", genre: "Fantasy", mood: "Epic" },
  { text: "A deep-sea diver finds a staircase descending into the ocean floor.", genre: "Horror", mood: "Claustrophobic" },
  { text: "The world\u2019s most boring person accidentally becomes the most interesting.", genre: "Comedy", mood: "Lighthearted" },
  { text: "An astronaut returns from a two-year mission to find that no one remembers them.", genre: "Science Fiction", mood: "Lonely" },
  { text: "A grandmother\u2019s recipe book contains instructions for things that aren\u2019t food.", genre: "Fantasy", mood: "Cozy" },
  { text: "A translator discovers a language that, when spoken aloud, changes reality.", genre: "Fantasy", mood: "Dangerous" },
  { text: "You find a camera that takes photos of tomorrow.", genre: "Science Fiction", mood: "Suspenseful" },
  { text: "A town where everyone has the same dream on the same night.", genre: "Mystery", mood: "Surreal" },
  { text: "The shadow of a long-dead tree still falls across the yard every afternoon.", genre: "Literary Fiction", mood: "Melancholic" },
  { text: "A robot designed for war writes its first poem.", genre: "Science Fiction", mood: "Bittersweet" },
  { text: "An elevator opens onto a floor that doesn\u2019t exist in the building\u2019s blueprints.", genre: "Horror", mood: "Unsettling" },
  { text: "A chef discovers that a certain spice lets people taste memories.", genre: "Fantasy", mood: "Warm" },
  { text: "Two childhood friends reunite, but one of them hasn\u2019t aged a single day.", genre: "Mystery", mood: "Haunting" },
  { text: "A bookshop appears overnight in an empty lot. It only sells books that haven\u2019t been written yet.", genre: "Fantasy", mood: "Wondrous" },
  { text: "A cartographer maps an island that moves.", genre: "Adventure", mood: "Adventurous" },
  { text: "During a blackout, the stars rearrange themselves into a message.", genre: "Science Fiction", mood: "Cosmic" },
  { text: "A therapist\u2019s newest patient claims to be a character from a novel.", genre: "Literary Fiction", mood: "Philosophical" },
  { text: "You open a door in your house that you\u2019ve never noticed before.", genre: "Horror", mood: "Curious" },
  { text: "A street performer\u2019s music makes statues in the park come alive.", genre: "Fantasy", mood: "Playful" },
  { text: "The rain starts falling upward, and no one can explain why.", genre: "Science Fiction", mood: "Strange" },
  { text: "A gravedigger finds a coffin with their own name on it \u2014 and it\u2019s empty.", genre: "Horror", mood: "Ominous" },
  { text: "An old clock tower chimes thirteen times, and the town resets to yesterday.", genre: "Fantasy", mood: "Mysterious" },
  { text: "A journalist receives anonymous tips that are always exactly right \u2014 about events that haven\u2019t happened yet.", genre: "Thriller", mood: "Urgent" },
  { text: "A dog walks into a police station and leads officers to a crime no one reported.", genre: "Mystery", mood: "Intriguing" },
  { text: "The Northern Lights descend to ground level, and people can walk through them.", genre: "Fantasy", mood: "Ethereal" },
  { text: "A retired astronaut keeps a jar of moon dust on their shelf. One night it starts glowing.", genre: "Science Fiction", mood: "Quiet" },
  { text: "Two people fall in love through letters, only to discover they live in different centuries.", genre: "Romance", mood: "Bittersweet" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Day-of-year (1-366) for a given date. */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Select a prompt deterministically for a given date. */
function promptForDate(d: Date): Prompt & { index: number } {
  const idx = dayOfYear(d) % PROMPTS.length;
  return { ...PROMPTS[idx], index: idx };
}

/** Format a date as "Month Day, Year". */
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Format a date as short "Mon Day". */
function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/*  Genre badge color                                                  */
/* ------------------------------------------------------------------ */

function genreColor(genre: string): string {
  const map: Record<string, string> = {
    "Science Fiction": "bg-blue-500/15 text-blue-400",
    Fantasy: "bg-purple-500/15 text-purple-400",
    Horror: "bg-red-500/15 text-red-400",
    Mystery: "bg-amber-500/15 text-amber-400",
    Thriller: "bg-orange-500/15 text-orange-400",
    Adventure: "bg-emerald-500/15 text-emerald-400",
    "Literary Fiction": "bg-indigo-500/15 text-indigo-400",
    Comedy: "bg-yellow-500/15 text-yellow-400",
    Romance: "bg-pink-500/15 text-pink-400",
  };
  return map[genre] || "bg-gray-500/15 text-gray-400";
}

/* ------------------------------------------------------------------ */
/*  SEO metadata                                                       */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Daily Writing Prompt | Make A Tale",
  description:
    "Get a fresh creative writing prompt every day. Spark your imagination and start your next story with our daily prompt.",
  openGraph: {
    title: "Daily Writing Prompt | Make A Tale",
    description: "A new creative writing prompt every day. Start your next story now.",
    url: "https://makeatale.com/prompts",
  },
  alternates: { canonical: "https://makeatale.com/prompts" },
};

/* ------------------------------------------------------------------ */
/*  Page (server component)                                            */
/* ------------------------------------------------------------------ */

export default function PromptsPage() {
  const today = new Date();
  const todayPrompt = promptForDate(today);

  /* Last 7 days (excluding today) */
  const previous: { date: Date; prompt: Prompt }[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    previous.push({ date: d, prompt: promptForDate(d) });
  }

  const shareText = encodeURIComponent(
    `Today\u2019s writing prompt on Make A Tale:\n\n\u201c${todayPrompt.text}\u201d\n\nhttps://makeatale.com/prompts`,
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ---- Hero ---- */}
      <div className="flex items-center gap-3 mb-2">
        <PenTool size={24} className="text-brand-400" />
        <h1 className="text-2xl font-bold">Daily Writing Prompt</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8 flex items-center gap-1.5">
        <Calendar size={14} />
        {fmtDate(today)}
      </p>

      {/* ---- Today's prompt card ---- */}
      <div className="card p-8 border-brand-500/30 bg-gradient-to-br from-brand-500/5 to-purple-500/5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-brand-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            Today&rsquo;s Prompt
          </span>
        </div>

        <blockquote className="text-xl md:text-2xl font-semibold leading-relaxed mb-6">
          &ldquo;{todayPrompt.text}&rdquo;
        </blockquote>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${genreColor(todayPrompt.genre)}`}>
            {todayPrompt.genre}
          </span>
          <span className="text-xs text-gray-500">
            Mood: {todayPrompt.mood}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/submit"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            Write This Story <ArrowRight size={14} />
          </a>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
          >
            <Share2 size={14} /> Share This Prompt
          </a>
        </div>
      </div>

      {/* ---- Previous prompts ---- */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-400 flex items-center gap-2">
          <ChevronLeft size={16} /> Previous Prompts
        </h2>
        <div className="space-y-3">
          {previous.map(({ date, prompt }) => (
            <div key={date.toISOString()} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm mb-1.5">&ldquo;{prompt.text}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${genreColor(prompt.genre)}`}>
                      {prompt.genre}
                    </span>
                    <span className="text-xs text-gray-600">{prompt.mood}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap pt-0.5">
                  {fmtShort(date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
