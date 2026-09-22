/**
 * Genre-specific craft directives + micro-exemplars for story generation.
 *
 * Generic instructions ("be vivid", "avoid cliches") don't anchor a model to a
 * concrete voice — it falls back to whatever "generic fiction" looks like in
 * its training data. Giving it a short, genre-true prose sample plus a
 * specific craft note (sentence rhythm, diction, POV convention) gets much
 * closer to a genre-fluent human writer's output for the same prompt.
 *
 * Keys match STORY_CATEGORIES (src/lib/demo-data.ts) / the generate-tale
 * VALID_TAGS list exactly.
 */
export interface GenreCraft {
  /** One or two sentences of concrete, genre-specific craft guidance. */
  voice: string;
  /** A short (~60-90 word) original prose sample demonstrating the voice. Not
   * meant to be echoed — it's a style anchor, not content to reuse. */
  exemplar: string;
}

export const GENRE_CRAFT: Record<string, GenreCraft> = {
  Fantasy: {
    voice:
      "Ground the magic in specific sensory rules and cost — readers should feel what it costs the world or the caster, not just what it looks like. Favor concrete nouns (iron, ash, moss) over vague grandeur.",
    exemplar:
      "The binding took her left name first — the one her mother used, the one that meant \"small bird.\" She felt it lift out of her like a tooth, and the crows in the yew tree went silent all at once, as if they too had forgotten it.",
  },
  "Sci-Fi": {
    voice:
      "Introduce one strange technological or scientific rule and follow its logic ruthlessly — the strangeness should feel earned by physics or systems, not decoration. Keep jargon sparse and functional.",
    exemplar:
      "The ship didn't decelerate so much as forget it had ever been moving. Mara's inner ear caught up four seconds after her stomach did, and by then the reactor was already humming a half-tone flat — the sound it made, she'd learned, right before it started lying to them.",
  },
  Horror: {
    voice:
      "Build dread through restraint and wrongness in ordinary details, not gore or jump-scares. Let the character rationalize what they're seeing for one beat too long before the reader is allowed to.",
    exemplar:
      "The dog's bowl was still full. That was the first wrong thing — not the open door, not the smell — because Ruth had fed him at six like always, and dogs did not leave food untouched unless something had convinced them, very thoroughly, not to be hungry anymore.",
  },
  Mystery: {
    voice:
      "Plant one concrete, checkable detail the reader can hold onto (a time, an object, a contradiction) and let the POV character notice it without immediately explaining its significance. Withhold, don't lie.",
    exemplar:
      "The coffee was still warm when they found him, which meant someone had poured it after the call came in, not before — and the only person who took it black, the way this cup was, had been standing in the kitchen the whole time, watching the detectives work.",
  },
  Romance: {
    voice:
      "Tension lives in restraint and almost-contact, not declarations. Track physical awareness (a held breath, the space between hands) and let dialogue carry subtext the characters won't say outright.",
    exemplar:
      "She handed him the umbrella without quite letting go of it, so for a second they were both holding the same thin metal spine, rain drumming on it between them, and neither of them mentioned that the bus shelter would have done just as well.",
  },
  Adventure: {
    voice:
      "Keep momentum with short, physical sentences during action and let description breathe only at the turning points. The world should feel larger than the plot — hint at scale beyond the immediate scene.",
    exemplar:
      "The rope gave an inch, then held. Below her, the gorge disappeared into cloud the color of a bruise, and somewhere down there a river was still cutting the same path it had cut for ten thousand years, entirely uninterested in whether she made it across.",
  },
  Thriller: {
    voice:
      "Compress time — use short paragraphs and present-tense urgency even in past tense prose. Every scene should end on a fact that changes the stakes, not a mood.",
    exemplar:
      "Forty seconds. That's what the elevator display said when the lights cut out, and in the dark she realized the number hadn't been counting down to the lobby at all — it had been counting down to something else, and now it was gone, and so was the light.",
  },
  Comedy: {
    voice:
      "Timing over volume — let absurdity build from a character's dead-serious internal logic rather than the narration winking at the reader. The funniest line is usually the flattest one.",
    exemplar:
      "He had rehearsed the apology fourteen times in the elevator mirror, and every version ended with him looking sincere and slightly damp. What he had not rehearsed was the goat, who arrived first, ate the flowers, and left him holding only the ribbon and a great deal of explaining to do.",
  },
  Drama: {
    voice:
      "Let subtext carry the emotional weight — characters say the practical thing while the camera (the prose) lingers on the detail that reveals what they actually feel. Avoid naming the emotion directly.",
    exemplar:
      "\"You should eat something,\" her father said, and set the plate down exactly where her mother used to set it, six inches from the edge, though no one had asked him to remember that, and no one, least of all him, could explain why he still did.",
  },
  Surreal: {
    voice:
      "Present the impossible with flat, matter-of-fact narration — no astonishment from the characters. The wrongness should accumulate through logic that almost makes sense, then doesn't.",
    exemplar:
      "The staircase had added a fourteenth step sometime in the night, and Wen took it the way he took all the house's small revisions lately — with a nod, and a mental note to ask the walls about it later, once they were speaking to him again.",
  },
  Historical: {
    voice:
      "Ground period detail in the tactile and mundane (fabric, food, labor, currency) rather than dates and famous names — texture over exposition. Let period constraints (class, law, custom) drive the tension.",
    exemplar:
      "She counted the coins twice by candlelight, not because the sum would change, but because her hands needed something to do while she decided whether to spend the rent on the doctor or the debt collector, both of whom were due, as it happened, on the very same Tuesday.",
  },
  Dystopia: {
    voice:
      "Reveal the system through one small, bureaucratic indignity rather than a lecture on the regime. The horror is in how normal it's become to the people living inside it.",
    exemplar:
      "Form 12-B asked for her reason for wanting water, and she filled in \"thirst\" for the third time that month, in the box provided, in block letters, because the first two times she'd written something true and it had taken a week longer to process.",
  },
  Steampunk: {
    voice:
      "Treat brass, steam, and clockwork as load-bearing physical objects with weight, heat, and noise — not aesthetic dressing. Let invention carry class commentary: who builds it, who's crushed by it.",
    exemplar:
      "The engine's breath came in three parts — hiss, clank, and the low groan of a bearing that had been promising to fail since March — and Odalys had learned to read its moods the way sailors read weather, which was to say, too late, and always in hindsight.",
  },
  Cyberpunk: {
    voice:
      "Contrast high-tech surfaces with low-life stakes — the neon is someone's rent problem. Keep sentences clipped, sensory-saturated, and cynical; corporations should feel like weather, not villains monologuing.",
    exemplar:
      "The ad on her retina offered 0% financing on a new pancreas, right on schedule, right as her old one reminded her, with a small orange pulse in the corner of her vision, that it had about four hours of opinions left about how this night was going to go.",
  },
  Mythology: {
    voice:
      "Use the cadence of oral storytelling — repetition, epithets, a sense of inevitability. Gods and monsters should act on their own ancient logic, indifferent to modern morality.",
    exemplar:
      "The river-god took his tribute the way he always had, which is to say without asking, and the villagers left the third daughter's shoes on the bank the way their mothers had, and their mothers before that, because some debts are older than the people paying them.",
  },
  Noir: {
    voice:
      "First-person or tight-third, clipped and cynical, similes doing the heavy lifting. The city is a character with its own moral rot; the protagonist is compromised, not heroic.",
    exemplar:
      "She had a smile like a paid invoice — technically satisfying, and you knew somebody was going to regret it later. I lit a cigarette I'd already quit twice that year and told her I didn't do missing persons anymore, which was true right up until she said his name.",
  },
  Gothic: {
    voice:
      "Decay and inheritance are the engine — a house, a bloodline, or a secret rotting from the inside. Long, atmospheric sentences; dread accumulates through architecture and family silence, not sudden shocks.",
    exemplar:
      "The east wing had been closed since her aunt's death, not out of grief, the housekeeper said, but because the wallpaper in that wing had a way of remembering faces, and the family had decided, collectively and without ever discussing it, that some faces were better left forgotten.",
  },
  "Cosmic Horror": {
    voice:
      "Scale is the terror, not teeth — the character's sanity or significance should shrink against something incomprehensible. Avoid describing the entity directly; describe its effect on physics, geometry, or thought.",
    exemplar:
      "The math had been correct up until page forty, where the equations simply stopped resolving into numbers and started resolving, instead, into a compulsion — to go to the coast, to look at the water at 3 a.m., to stop asking why the tide had begun arriving early.",
  },
  "Slice-of-Life": {
    voice:
      "Small, specific, ordinary moments carry the emotional payload — a grocery list, a bus stop, a shared silence. Resist manufactured plot; let meaning arrive through accumulation, not events.",
    exemplar:
      "He still bought the good yogurt, the expensive one she liked, even though she'd been gone eight months and it sat in the fridge until it expired, because throwing it out unopened felt like a decision he wasn't ready to make on a Tuesday, or possibly ever.",
  },
  "Alternate History": {
    voice:
      "Establish the point of divergence through one concrete, lived-in consequence (a street name, a currency, a law) rather than exposition about the change itself. Treat the altered world as fully normal to its inhabitants.",
    exemplar:
      "Her ration card still had the Tsar's seal on it, faded now to the color of weak tea, and she'd stopped finding that strange around the same age most children stopped asking why the trains ran west instead of east — which is to say, once someone explained the war that hadn't happened.",
  },
};

/**
 * Builds a prompt fragment anchoring the model to a genre's voice, or an
 * empty string if the genre isn't recognized (falls back to the base prompt).
 */
export function buildGenreCraftBlock(genre?: string | null): string {
  if (!genre) return "";
  const craft = GENRE_CRAFT[genre];
  if (!craft) return "";

  return `\n\n## Genre Voice: ${genre}\n${craft.voice}\n\nStyle anchor (for voice/rhythm only — do not reuse its content, characters, or specific images):\n"${craft.exemplar}"\n`;
}
