export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase-server";
import { getGenreIconPath, GENRE_ICON_SLUG, GENRE_COLORS } from "@/lib/genre-theme";
import StoryCard from "@/components/StoryCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Story } from "@/types";
import Link from "next/link";

/* ── slug <-> genre name mapping ── */

const SLUG_TO_GENRE: Record<string, string> = Object.fromEntries(
  Object.entries(GENRE_ICON_SLUG).map(([genre, slug]) => [slug, genre]),
);

/* ── related genres mapping ── */

const RELATED_GENRES: Record<string, string[]> = {
  Fantasy: ["Sci-Fi", "Adventure", "Surreal"],
  "Sci-Fi": ["Fantasy", "Dystopia", "Thriller"],
  Horror: ["Thriller", "Mystery", "Surreal"],
  Mystery: ["Thriller", "Horror", "Drama"],
  Romance: ["Drama", "Comedy", "Fantasy"],
  Adventure: ["Fantasy", "Sci-Fi", "Thriller"],
  Thriller: ["Mystery", "Horror", "Adventure"],
  Comedy: ["Drama", "Romance", "Surreal"],
  Drama: ["Romance", "Comedy", "Historical"],
  Surreal: ["Fantasy", "Horror", "Comedy"],
  Historical: ["Drama", "Adventure", "Mystery"],
  Dystopia: ["Sci-Fi", "Thriller", "Horror"],
};

/* ── genre-specific FAQs ── */

const GENRE_FAQS: Record<string, { question: string; answer: string }[]> = {
  Fantasy: [
    {
      question: "What makes a good Fantasy story?",
      answer:
        "A great Fantasy story builds a vivid, internally consistent world with its own rules of magic, cultures, and conflicts. The best Fantasy tales balance imaginative world-building with relatable characters who face meaningful moral dilemmas. Whether it's high fantasy with epic quests or low fantasy grounded in everyday life, the key is making readers believe in the impossible.",
    },
    {
      question: "How do I write Fantasy fiction with AI on MakeATale?",
      answer:
        "Start by choosing the Fantasy genre when creating a new tale. Provide a compelling premise — describe the world, a central conflict, or a character with a unique gift. The AI will generate a rich opening chapter that you can then branch in multiple directions. You can steer the story toward sword-and-sorcery action, political intrigue, or mythological adventure by how you prompt each new branch.",
    },
    {
      question: "Can I branch someone else's Fantasy story?",
      answer:
        "Absolutely! Branching is at the heart of MakeATale. Find a Fantasy story you love, and click 'Branch' to take the narrative in your own direction. Maybe the hero fails the quest, or an unexpected ally appears. Every branch creates a new path while preserving the original story for others to enjoy.",
    },
  ],
  "Sci-Fi": [
    {
      question: "What makes a good Sci-Fi story?",
      answer:
        "The best Sci-Fi stories use speculative technology or science as a lens to explore timeless human questions — identity, morality, power, and survival. Strong Sci-Fi combines plausible (or at least internally logical) science with compelling characters navigating the consequences of innovation. Whether it's near-future cyberpunk or far-future space opera, grounding the fantastical in human emotion is what resonates.",
    },
    {
      question: "How do I write Sci-Fi fiction with AI on MakeATale?",
      answer:
        "Select the Sci-Fi genre and describe your setting — a generation ship, a post-singularity Earth, a first-contact scenario. The AI excels at extrapolating scientific concepts into narrative form. Give it a 'what if' premise and it will build outward. You can branch into hard science explorations, space adventure, or philosophical thought experiments.",
    },
    {
      question: "Can I branch someone else's Sci-Fi story?",
      answer:
        "Yes — and Sci-Fi stories are perfect for branching because technology and discoveries create natural decision points. What if the crew trusts the alien signal? What if they don't? Each branch explores a different consequence, creating a multiverse of narratives from a single seed story.",
    },
  ],
  Horror: [
    {
      question: "What makes a good Horror story?",
      answer:
        "Great Horror builds dread through atmosphere, pacing, and the unknown. The most effective Horror stories don't rely solely on shock — they tap into primal fears like isolation, loss of control, and the uncanny. Whether it's psychological horror, supernatural terror, or body horror, the key is making the reader's imagination do the heavy lifting by suggesting more than you show.",
    },
    {
      question: "How do I write Horror fiction with AI on MakeATale?",
      answer:
        "Choose the Horror genre and set the stage with an unsettling premise — an abandoned location, a strange occurrence, a character who notices something wrong. The AI is skilled at escalating tension and building atmospheric dread. Guide the story through branches that explore different fears: the monster revealed, the psychological unraveling, or the slow descent into madness.",
    },
    {
      question: "Can I branch someone else's Horror story?",
      answer:
        "Definitely! Horror stories are fantastic for branching because fear is subjective. One reader might branch toward a supernatural explanation while another takes the story in a psychological direction. You can turn a ghost story into cosmic horror, or give a doomed character a fighting chance. The original tale stays intact for others to explore.",
    },
  ],
  Mystery: [
    {
      question: "What makes a good Mystery story?",
      answer:
        "A compelling Mystery plays fair with the reader — planting clues, red herrings, and misdirection that all make sense in retrospect. The best mysteries feature a puzzle worth solving, a detective (professional or amateur) with a unique perspective, and stakes that matter beyond just 'whodunit.' Pacing is critical: reveal enough to keep readers hooked but hold back enough to preserve the surprise.",
    },
    {
      question: "How do I write Mystery fiction with AI on MakeATale?",
      answer:
        "Start with the Mystery genre and describe the crime, the setting, or the detective. The AI will weave in suspects, motives, and clues. You can branch the investigation in different directions — follow different leads, suspect different characters, or uncover entirely different conspiracies. Each branch becomes its own whodunit with a unique resolution.",
    },
    {
      question: "Can I branch someone else's Mystery story?",
      answer:
        "Yes! Mysteries are ideal for branching because every clue can lead somewhere different. If the original author followed the butler, you can branch to investigate the business partner instead. You can even branch to reveal that the detective themselves is involved. Multiple solutions to the same mystery make for a rich reading experience.",
    },
  ],
  Romance: [
    {
      question: "What makes a good Romance story?",
      answer:
        "The heart of great Romance is emotional authenticity and chemistry between characters. Readers want to feel the tension, the longing, and the eventual connection. The best Romance stories give both characters compelling inner lives, meaningful obstacles (not just misunderstandings), and a satisfying emotional payoff. Whether sweet or steamy, the relationship arc should feel earned.",
    },
    {
      question: "How do I write Romance fiction with AI on MakeATale?",
      answer:
        "Select the Romance genre and set up your characters — who they are, how they meet, and what keeps them apart. The AI handles dialogue, tension, and emotional beats well. Branch the story to explore different relationship dynamics: slow-burn longing, enemies-to-lovers, second-chance romance, or unexpected connections. Each branch can lead to a different kind of love story.",
    },
    {
      question: "Can I branch someone else's Romance story?",
      answer:
        "Of course! Romance stories shine with branching because love is full of choices. What if the character chooses the other love interest? What if they prioritize their career? What if the grand gesture goes wrong? Branching lets you explore alternate romantic paths while the original story's love story remains untouched.",
    },
  ],
  Adventure: [
    {
      question: "What makes a good Adventure story?",
      answer:
        "Great Adventure stories combine physical stakes with personal growth. The hero ventures into the unknown — uncharted lands, dangerous missions, treasure hunts — and returns changed. The best adventures balance action set-pieces with character development, feature vivid settings that feel like characters themselves, and maintain a sense of wonder and forward momentum throughout.",
    },
    {
      question: "How do I write Adventure fiction with AI on MakeATale?",
      answer:
        "Choose the Adventure genre and describe your hero and their quest — a lost artifact, an unexplored continent, a rescue mission. The AI generates exciting action sequences, environmental challenges, and unexpected allies or enemies. Branch the story at critical decision points: take the mountain pass or the river route, trust the stranger or go it alone.",
    },
    {
      question: "Can I branch someone else's Adventure story?",
      answer:
        "Absolutely! Adventure stories are built for branching. Every fork in the road, every choice to fight or flee, every new ally or betrayal creates a natural branch point. You can take a jungle expedition into ancient ruins, send a sea voyage toward uncharted islands, or have the hero discover something that changes the entire mission.",
    },
  ],
  Thriller: [
    {
      question: "What makes a good Thriller story?",
      answer:
        "Thrillers live and die by pacing and stakes. The best Thrillers put characters under intense pressure with a ticking clock, layer in twists that recontextualize everything the reader thought they knew, and maintain relentless forward momentum. Whether it's a political conspiracy, a cat-and-mouse chase, or a survival scenario, the reader should never feel safe.",
    },
    {
      question: "How do I write Thriller fiction with AI on MakeATale?",
      answer:
        "Select the Thriller genre and establish the threat — a conspiracy, a kidnapping, a betrayal. Set the stakes high and personal. The AI is excellent at building tension, dropping cliffhangers, and weaving complex plots. Branch the story to explore different twists: the ally who's actually the enemy, the plan that goes sideways, or the revelation that changes everything.",
    },
    {
      question: "Can I branch someone else's Thriller story?",
      answer:
        "Yes — Thrillers are perfect for branching because every twist can go multiple ways. What if the protagonist escapes the trap differently? What if the villain's plan succeeds? What if the double agent switches sides again? Each branch ratchets up the tension in a new direction while keeping readers on the edge of their seats.",
    },
  ],
  Comedy: [
    {
      question: "What makes a good Comedy story?",
      answer:
        "Great Comedy comes from character, timing, and surprise. The funniest stories feature characters with strong, distinct voices placed in situations that escalate in unexpected ways. Good Comedy doesn't just tell jokes — it builds a comedic premise and mines it thoroughly. Whether it's witty wordplay, absurdist situations, or sharp satire, the humor should feel organic to the story.",
    },
    {
      question: "How do I write Comedy fiction with AI on MakeATale?",
      answer:
        "Choose the Comedy genre and set up a ridiculous premise or a character in over their head. The AI handles comedic escalation well — give it a funny 'what if' and watch the situation spiral. Branch the story to explore different punchlines: the plan backfires spectacularly, the misunderstanding deepens, or the character doubles down on their worst idea.",
    },
    {
      question: "Can I branch someone else's Comedy story?",
      answer:
        "Definitely! Comedy branches beautifully because humor is all about the unexpected. Take a story in an even more absurd direction, introduce a new comedic complication, or flip the tone for a hilarious contrast. Some of the funniest moments come from branching a serious setup into comedy gold.",
    },
  ],
  Drama: [
    {
      question: "What makes a good Drama story?",
      answer:
        "Powerful Drama comes from authentic emotional conflict — characters forced to make impossible choices that reveal who they truly are. The best dramas explore complex relationships, moral gray areas, and the consequences of decisions. Strong Drama doesn't need explosions or plot twists; it needs characters readers care deeply about facing situations that test their values.",
    },
    {
      question: "How do I write Drama fiction with AI on MakeATale?",
      answer:
        "Select the Drama genre and ground your story in a character's emotional reality — a family secret, a moral dilemma, a relationship at a crossroads. The AI excels at dialogue-driven scenes and internal conflict. Branch the story to explore different emotional outcomes: the conversation that heals, the truth that destroys, or the sacrifice that redefines everything.",
    },
    {
      question: "Can I branch someone else's Drama story?",
      answer:
        "Yes! Drama is rich for branching because human choices have infinite consequences. What if the character forgives instead of leaving? What if they tell the truth instead of keeping the secret? Each branch explores a different emotional landscape, giving readers multiple ways to experience the same characters and conflicts.",
    },
  ],
  Surreal: [
    {
      question: "What makes a good Surreal story?",
      answer:
        "Great Surreal fiction bends reality with purpose — the strange and dreamlike elements should evoke emotions or ideas that conventional storytelling can't reach. The best Surreal tales have an internal dream logic that keeps readers engaged even when they can't fully explain what's happening. Think Kafka, Borges, or Murakami: the bizarre illuminates the deeply human.",
    },
    {
      question: "How do I write Surreal fiction with AI on MakeATale?",
      answer:
        "Choose the Surreal genre and embrace the strange. Describe a world where gravity is optional, time runs sideways, or identity is fluid. The AI thrives with surreal prompts — give it permission to be weird and it will surprise you. Branch the story to follow different threads of dream logic, exploring parallel realities or shifting perspectives.",
    },
    {
      question: "Can I branch someone else's Surreal story?",
      answer:
        "Absolutely! Surreal stories practically demand branching because their fluid nature means anything can happen next. Take a melting-clock narrative into philosophical territory, spin a talking-animal parable into cosmic horror, or ground a fever-dream in sudden emotional clarity. Surreal branching is where MakeATale really shines.",
    },
  ],
  Historical: [
    {
      question: "What makes a good Historical story?",
      answer:
        "The best Historical fiction makes the past feel alive and immediate. It balances authentic period detail — language, customs, technology, social dynamics — with universal human stories that resonate today. Great Historical stories use their setting not as window dressing but as a force that shapes characters' choices. The history should feel essential, not incidental.",
    },
    {
      question: "How do I write Historical fiction with AI on MakeATale?",
      answer:
        "Select the Historical genre and anchor your story in a specific time and place — Renaissance Florence, the Silk Road, the American frontier. The AI draws on broad historical knowledge to create period-appropriate settings, dialogue, and conflicts. Branch the story to explore alternate historical paths: what if the battle was lost, the letter arrived in time, or the revolution took a different turn?",
    },
    {
      question: "Can I branch someone else's Historical story?",
      answer:
        "Yes! Historical stories are fascinating to branch because you can explore 'what if' scenarios within real historical contexts. What if a different decision was made at a pivotal moment? What if a minor historical figure stepped into the spotlight? Each branch becomes its own alternate history while staying rooted in authentic period detail.",
    },
  ],
  Dystopia: [
    {
      question: "What makes a good Dystopia story?",
      answer:
        "Effective Dystopia takes a present-day concern — surveillance, inequality, environmental collapse, corporate power — and extrapolates it to a terrifying but plausible extreme. The best dystopian fiction features a world that feels uncomfortably close to our own, a protagonist who begins to see through the system, and stakes that are both personal and societal. The warning should feel urgent, not distant.",
    },
    {
      question: "How do I write Dystopia fiction with AI on MakeATale?",
      answer:
        "Choose the Dystopia genre and describe the broken world — what went wrong, who holds power, and what daily life looks like for ordinary people. The AI builds oppressive atmospheres and morally complex scenarios effectively. Branch the story to explore different forms of resistance, collaboration, or survival within the system.",
    },
    {
      question: "Can I branch someone else's Dystopia story?",
      answer:
        "Definitely! Dystopian stories are perfect for branching because resistance can take many forms. One branch might follow the underground rebellion while another explores working within the system to change it. You can branch toward hope or deeper darkness, giving readers a choice in how they experience the broken world.",
    },
  ],
};

const GENRE_DESCRIPTIONS: Record<string, string> = {
  Fantasy:
    "Venture into enchanted realms of magic, mythical creatures, and epic quests. These tales weave worlds where the impossible becomes reality.",
  "Sci-Fi":
    "Explore the frontiers of technology, space, and the future of humanity. These stories push the boundaries of science and imagination.",
  Horror:
    "Dare to read tales of terror, the supernatural, and the unknown. These stories will keep you on the edge of your seat long after dark.",
  Mystery:
    "Unravel puzzles, follow clues, and piece together the truth. These tales of intrigue and suspense keep you guessing until the very end.",
  Romance:
    "Fall into stories of love, passion, and connection. From first sparks to grand gestures, these tales explore the many facets of the heart.",
  Adventure:
    "Embark on thrilling journeys filled with danger, discovery, and daring feats. These stories take you on unforgettable expeditions.",
  Thriller:
    "Heart-pounding suspense and relentless tension await. These stories deliver twists, stakes, and adrenaline from start to finish.",
  Comedy:
    "Laugh out loud with stories full of wit, absurdity, and humor. These lighthearted tales prove that laughter truly is the best medicine.",
  Drama:
    "Powerful character-driven stories that explore the depth of human emotion, conflict, and resilience in the face of life's challenges.",
  Surreal:
    "Step into the strange and dreamlike. These tales bend reality, blur boundaries, and take you on a journey through the wonderfully bizarre.",
  Historical:
    "Travel back in time through stories set against the backdrop of real historical events, cultures, and eras brought vividly to life.",
  Dystopia:
    "Peer into dark futures and broken societies. These cautionary tales explore what happens when power, technology, or nature goes wrong.",
};

/* ── data fetching ── */

async function getGenreStories(genre: string): Promise<Story[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("stories")
    .select("*")
    .is("parent_id", null)
    .eq("is_hidden", false)
    .contains("tags", [genre])
    .order("upvotes", { ascending: false })
    .limit(100);
  return (data as Story[]) || [];
}

/* ── metadata ── */

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const genre = SLUG_TO_GENRE[params.slug];
  if (!genre) return { title: "Genre Not Found | MakeATale" };

  const baseDescription =
    GENRE_DESCRIPTIONS[genre] ||
    `Browse ${genre} stories on MakeATale. Read, branch, and create your own.`;

  const description = `${baseDescription} Read free ${genre.toLowerCase()} stories, write your own with AI, or branch existing tales in new directions on MakeATale.`;

  const keywords = [
    `${genre.toLowerCase()} stories`,
    `${genre.toLowerCase()} fiction`,
    `AI ${genre.toLowerCase()} stories`,
    `write ${genre.toLowerCase()}`,
    `interactive ${genre.toLowerCase()}`,
    `branching stories`,
    `collaborative fiction`,
    "MakeATale",
  ];

  return {
    title: `${genre} Stories — Read, Write & Branch ${genre} Fiction | MakeATale`,
    description,
    keywords,
    openGraph: {
      title: `${genre} Stories — Read, Write & Branch ${genre} Fiction | MakeATale`,
      description,
      siteName: "MakeATale",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${genre} Stories | MakeATale`,
      description,
    },
  };
}

/* ── page ── */

export default async function GenrePage({
  params,
}: {
  params: { slug: string };
}) {
  const genre = SLUG_TO_GENRE[params.slug];
  if (!genre) return notFound();

  const stories = await getGenreStories(genre);
  const faqs = GENRE_FAQS[genre] || [];
  const theme = GENRE_COLORS[genre] || {
    light: "bg-gray-50",
    dark: "dark:bg-gray-800",
    border: "border-gray-200 dark:border-gray-700",
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8">
      {/* Hero */}
      <section className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <img
            src={getGenreIconPath(genre)}
            alt={genre}
            width={80}
            height={80}
            className="rounded-xl"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {genre} Stories
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {stories.length} {stories.length === 1 ? "story" : "stories"}
        </p>
        <p className="mt-4 max-w-xl mx-auto text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          {GENRE_DESCRIPTIONS[genre]}
        </p>
      </section>

      {/* CTA */}
      <div className="flex justify-center mb-10">
        <Link
          href="/submit"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
        >
          <img
            src={getGenreIconPath(genre)}
            alt=""
            width={18}
            height={18}
            className="rounded-sm"
          />
          Generate a {genre} Tale
        </Link>
      </div>

      {/* Story grid */}
      {stories.length > 0 ? (
        <div className="space-y-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <img
            src={getGenreIconPath(genre)}
            alt=""
            width={48}
            height={48}
            className="mx-auto mb-4 rounded-lg opacity-40"
          />
          <p className="text-gray-500 mb-4">
            No {genre} stories yet. Be the first to write one!
          </p>
          <Link href="/submit" className="btn-primary inline-block text-sm">
            Plant a {genre} Seed
          </Link>
        </div>
      )}

      {/* Start Writing CTA */}
      <section className="mt-16 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-600/5 border border-brand-500/20 p-8 text-center">
        <h2 className="text-2xl font-bold mb-3">
          Ready to write your own {genre} tale?
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-lg mx-auto mb-6">
          MakeATale uses AI to help you craft compelling {genre.toLowerCase()}{" "}
          stories in minutes. Start from scratch or branch an existing story to
          explore a different path. Your next great {genre.toLowerCase()} tale is
          one click away.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/submit"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
          >
            <img
              src={getGenreIconPath(genre)}
              alt=""
              width={18}
              height={18}
              className="rounded-sm"
            />
            Start a {genre} Tale
          </Link>
          <a
            href={
              process.env.NEXT_PUBLIC_DISCORD_INVITE ||
              "https://discord.gg/TJn25WNRVv"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-400 transition-colors"
          >
            Join our Discord
          </a>
        </div>
      </section>

      {/* Related Genres */}
      {(RELATED_GENRES[genre] || []).length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold mb-4">
            Related Genres
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(RELATED_GENRES[genre] || []).map((related) => {
              const relatedSlug = GENRE_ICON_SLUG[related];
              const relatedTheme = GENRE_COLORS[related] || {
                light: "bg-gray-50",
                dark: "dark:bg-gray-800",
                border: "border-gray-200 dark:border-gray-700",
              };
              return (
                <Link
                  key={related}
                  href={`/genre/${relatedSlug}`}
                  className={`flex items-center gap-3 rounded-xl border p-4 transition-shadow hover:shadow-md ${relatedTheme.light} ${relatedTheme.dark} ${relatedTheme.border}`}
                >
                  <img
                    src={getGenreIconPath(related)}
                    alt={related}
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <div>
                    <span className="font-semibold text-sm">{related}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {GENRE_DESCRIPTIONS[related]?.slice(0, 80)}...
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <dl className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-5"
              >
                <dt className="font-semibold text-sm mb-2">{faq.question}</dt>
                <dd className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Browse other genres link */}
      <div className="mt-12 text-center">
        <Link
          href="/genre"
          className="text-sm text-gray-500 hover:text-brand-400 transition-colors"
        >
          Browse all genres &rarr;
        </Link>
      </div>

      {/* FAQ JSON-LD structured data */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      )}
    </div>
  );
}
