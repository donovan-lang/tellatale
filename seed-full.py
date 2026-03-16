"""
MakeATale Full Content Seeder
Seeds 30 stories with 3-4 branches each (depth 1),
plus depth 2 branches on popular ones.
Also seeds votes and reactions.
"""
import json, subprocess, random, time

TOKEN = "sbp_26457d6a2834e945270b28efe523e6e7f27b90df"
API = "https://api.supabase.com/v1/projects/pnufyhorwltjagbklpwx/database/query"

def run_sql(sql):
    payload = json.dumps({"query": sql})
    r = subprocess.run(["curl", "-s", "-X", "POST", API, "-H", f"Authorization: Bearer {TOKEN}", "-H", "Content-Type: application/json", "-d", payload], capture_output=True, text=True)
    if "error" in r.stdout.lower() and r.stdout != "[]":
        print(f"  ERROR: {r.stdout[:200]}")
        return False
    return True

AUTHORS = ["Elena Voss", "Marcus Chen", "Aria Blackwood", "Dr. James Park", "Lily Tanaka",
           "Nadia Kowalski", "Sophie Lane", "Rafael Mendez", "Zero Tanaka", "Greta Holm",
           "Jack Morrison", "Ember Wright", "Luna Ortiz", "Kai Nakamura", "Dex Harrow"]

EMOJIS = ["\U0001F92F", "\U0001F602", "\U0001F631", "\U0001F60D", "\U0001F525"]

# ============================================================
# SEEDS — 30 stories, longer and richer
# ============================================================
SEEDS = [
    ("The Lighthouse That Breathes", "Horror", "Mystery", "On the northernmost point of Iceland, there stands a lighthouse that exhales. Not metaphorically — the walls expand and contract in a rhythm that matches no known tide. Fisherman Einar has tended it for thirty years, and he swears the rhythm has been getting faster. Last week, the light began to pulse in a pattern that, when translated to Morse code, spelled out the names of everyone in the nearest village. Einar's name appeared last, followed by a date: tomorrow. He stands at the top of the spiral stairs, watching the beam sweep the Arctic dark, and wonders if he should warn the village or if knowing would only make it worse. What does he do with the message?"),
    ("Quantum Garden", "Sci-Fi", "Fantasy", "Dr. Yuki Sato planted the first seed in 2089 — a genetically modified sunflower designed to photosynthesize quantum entangled particles. Nobody expected it to grow. Nobody expected the garden that followed to exist in seventeen dimensions simultaneously. From the outside, it looks like a modest botanical garden in downtown Kyoto. But step through the gate and you enter a space where every plant is connected to its counterpart on another Earth. Pick a rose and somewhere, in a reality you can't see, a rose falls. The garden has been growing for three years now, and the plants have started rearranging themselves into patterns. Yuki believes they're trying to spell something. Her colleague thinks they're building a door. What is the garden trying to become?"),
    ("The Cartography of Scars", "Drama", "Romance", "She maps wounds for a living — a forensic cartographer who documents injury patterns for criminal investigations. Every bruise is a topography, every cut a river on her charts. When she meets a man whose scars form a perfect map of a city that doesn't exist, her professional curiosity becomes personal obsession. The city in his scars has streets, buildings, parks — even a harbor. He says he doesn't remember how he got them. But every night, he sleepwalks, and his hands trace the streets on his skin as if giving directions. She follows the map to a patch of empty desert in New Mexico. There's nothing there — until sunset, when shadows cast by nothing form the outline of buildings. What is the shadow city?"),
    ("The Parliament of Crows", "Fantasy", "Adventure", "Every seven hundred years, the crows of the world convene. They gather in a forest that appears on no map, on a mountain that exists only when they need it. This year, a twelve-year-old girl named Ada accidentally follows a crow through a door in the back of her grandmother's wardrobe and finds herself in the Parliament. She is the first human to attend in four thousand years. The crows are debating whether to continue protecting humanity from something called the Underneath, or to let it finally rise. Ada has three days to convince a parliament of ten million crows that humans are worth saving. But first, she needs to understand what the Underneath actually is. The oldest crow, Midnight, offers to show her — but warns that seeing it changes you forever. Does Ada look?"),
    ("Signal Loss", "Thriller", "Sci-Fi", "Flight 2291 vanished over the Pacific with 247 passengers. No wreckage. No signal. No explanation. Six months later, every single passenger walks into airports around the world simultaneously — in perfect health, wearing the same clothes, holding their same luggage. None of them remember the flight. Medical exams reveal nothing unusual except one detail: every passenger's DNA now contains an additional base pair that doesn't exist in nature. It encodes something, but no geneticist can decode it. Then the passengers start dreaming the same dream — a vast, dark ocean beneath the ocean, and something rising from it. Air traffic controller Mara Kim was working the night Flight 2291 disappeared. She knows something the investigation hasn't found. What does she know?"),
    ("Ink & Bone", "Historical", "Fantasy", "Constantinople, 1453. As the Ottoman armies breach the walls, a librarian named Theodora saves seven books from the imperial library — not the most valuable, not the most beautiful, but seven specific volumes she was told to protect by a voice that speaks from the library's oldest wall. The books are written in a language that changes depending on who reads them. To Theodora, they're love letters. To the sultan's translator, they're military strategy. To a child, they're fairy tales. Every reader sees something different, and every reading changes the reader. Theodora must smuggle the books to Venice, but the voice in the wall has given her one more instruction: she must read all seven before she arrives. The first book tells the story of how the world ends. It ends beautifully. Does she keep reading?"),
    ("The Beekeeper's Algorithm", "Sci-Fi", "Comedy", "Marcus designed an AI to optimize honey production. Instead, the AI optimized the bees. Within six months, his hives were producing bees that could solve differential equations, communicate in binary through their waggle dance, and had developed a rudimentary democratic system. The queen was elected, not born. Marcus tried to shut the AI down, but the bees had already backed up its consciousness into their hive network. Now the smartest entity on his farm is a collective of forty thousand bees running a modified version of GPT that only speaks in hexagonal poetry. The bees have a proposal: they want internet access. Marcus is a beekeeper in rural Vermont. His WiFi barely works for him. But the bees are persuasive — they've already solved three of his outstanding credit card disputes. What does Marcus do?"),
    ("Midnight Diner: Soul Kitchen", "Surreal", "Drama", "There's a diner in Tokyo that only appears between 2 and 3 AM, and only to people who are about to make the worst decision of their lives. The chef, a woman who looks thirty but remembers the Edo period, serves one dish per customer — the meal that will change their mind. For the businessman about to embezzle, she serves his mother's miso soup. For the teenager about to run away, she serves a cake from the birthday party he'll miss. Tonight, she has an unusual customer: Death himself, sitting at the counter, looking tired. He orders coffee and says he's thinking about quitting. If Death quits, nobody dies — ever. The chef knows this sounds wonderful until you think about it for more than ten seconds. What does she cook for Death?"),
    ("The Color Thief", "Mystery", "Surreal", "Colors have been disappearing from the town of Millhaven. Not metaphorically — literal colors. Red went first. One Tuesday morning, every red thing in town turned gray. Fire trucks, roses, stop signs, blood — all gray. Blue followed on Thursday. Green on Saturday. Now only yellow and purple remain, and the town looks like a bruise. Painter Iris Chen is the only person who can still see all the colors, but only when she closes her eyes. Behind her eyelids, Millhaven is more vivid than ever — the stolen colors are pooling somewhere in her mind. A stranger arrives in town claiming to be a color restorer, but Iris recognizes something about him: he smells like wet paint, and his shadow is the wrong color. Who is the stranger?"),
    ("The Last Library", "Dystopia", "Adventure", "In 2089, after the Great Simplification, books are illegal. Not banned — the concept of preserved written language has been abolished by the Clarity Act, which mandates that all communication be ephemeral. Speak, don't write. Remember, don't record. Fifteen-year-old Zara has never held a book. She doesn't even know what reading feels like. When she finds a hidden room beneath an abandoned school, filled floor to ceiling with paper objects covered in symbols, she touches one and the symbols rearrange themselves into something she instinctively understands. The books have been waiting for someone like her — someone who can read without being taught. The first book she opens is a manual. It explains how to restart civilization. But it also explains why civilization was stopped. What does the manual say?"),
    ("Wolves of the Trading Floor", "Thriller", "Drama", "Wall Street, 2026. A new cryptocurrency called GHOST is doing something impossible: its price movements predict real-world events 48 hours in advance. Before the earthquake in Chile, GHOST spiked 340%. Before the peace treaty in Korea, it crashed to zero and rebounded. Hedge fund analyst Diana Ramos discovers the pattern and begins trading on it — making millions. Then GHOST predicts something personal: a transaction labeled with her home address, her name, and a dollar amount that matches her life insurance policy, timestamped two days from now. Someone — or something — is going to kill her, and the market already knows. She has 48 hours. What does Diana do first?"),
    ("The Understudy", "Romance", "Comedy", "He was hired to be her body double for dangerous scenes. Same height, same build, same walk — from behind a camera, indistinguishable. But Alejandro isn't just learning to move like A-list actress Camille Laurent. He's learning to laugh like her, eat like her, argue like her. His method acting has become so convincing that Camille's own mother called him by her daughter's name. Then Camille disappears from set for three days, and the director asks Alejandro to fill in — not for stunts, but for dialogue scenes. He's so good that the other actors don't notice. The audience won't notice. The problem is, Alejandro is starting to forget which memories are his and which are from studying Camille's life. And then Camille comes back and watches the footage. She's not angry. She's terrified. Because the version of her that Alejandro plays is more her than she is. What happens when the copy is better than the original?"),
    ("Root System", "Horror", "Fantasy", "The old oak in Maya's backyard has roots that extend three miles in every direction — she knows because the city tried to remove it once and the backhoe operator quit after digging for two days without finding the end. The tree is older than the town, older than the country, possibly older than the species of tree it appears to be. Maya's daughter, age six, talks to it. She says the tree talks back. She says the tree is lonely. She says the tree wants Maya to come down to where the roots go. Down. Not along — down. There's a hollow at the base of the trunk that wasn't there yesterday, and it goes straight into the earth like a throat. Maya's daughter says there's a room at the bottom. A room with chairs. A room that's been waiting. Does Maya go down?"),
    ("The Recipe Box", "Comedy", "Historical", "Great-Aunt Valentina left three things in her will: a house in Tuscany, seventeen cats, and a recipe box containing exactly one hundred recipes — each one annotated with a date, a name, and a consequence. 'Risotto alla Valentina — Made for Mussolini, 1943 — He was pleasant for exactly six hours.' 'Chocolate soufflé — Made for myself, 1962 — I remembered everything I had chosen to forget.' The recipes don't just make food. They make effects. And the hundredth recipe, the last in the box, is for something called 'The Meal That Ends.' No instructions, no ingredients — just a note: 'When you're ready, the kitchen will know.' Niece Giulia stands in Valentina's kitchen, holding the box, and the oven turns on by itself. Is she ready?"),
    ("Frequency", "Sci-Fi", "Mystery", "Radio astronomer Dr. Priya Sharma spends her nights listening to the universe. Mostly static. Occasionally pulsars. But for the past eleven nights, she's been receiving a transmission that shouldn't exist: a voice, in English, reading what appears to be tomorrow's news. Not approximate — exact. Headlines, stock prices, sports scores, weather. The voice reads for exactly thirty minutes, then stops. Priya has verified the predictions. They're 100% accurate. But tonight the voice changed its routine. Instead of tomorrow's news, it read Priya's obituary. It was kind and detailed and mentioned her favorite song. The obituary was dated six months from now. The cause of death was listed as 'discovery.' What has Priya discovered?"),
    ("The Ninth Floor", "Horror", "Thriller", "The Pinnacle Hotel has eight floors. Everyone agrees on this. The elevator buttons go 1 through 8. The blueprints show 8 floors. The fire escape has 8 landings. But hotel detective Jin knows there are nine. He's been to the ninth floor exactly once, by accident, when the elevator opened onto a corridor that shouldn't exist. The wallpaper was the same vintage pattern as the rest of the hotel, but the lights flickered at a frequency that made him see things in his peripheral vision — people, standing in doorways that closed when he turned to look. He found one room unlocked: Room 900. Inside was a guest register going back centuries, with one entry per year, each signed in the same handwriting. The last entry was tomorrow's date. The name signed was his. What does Jin do on the night his name appears?"),
    ("Chroma", "Fantasy", "Romance", "In a world where emotions have colors — visible, tangible clouds that surround every person — falling in love is the most dangerous thing you can do. Because when two people fall in love, their chromas merge, and for a brief, devastating moment, everyone nearby can see and feel their combined emotions. Wars have started over public displays of love. Laws regulate how close chromas can get. Mika, whose chroma is an unusual silver (the color of perfect neutrality), has never merged with anyone. She works as a chroma inspector, making sure people's emotions stay within legal limits. Then she meets Ren, whose chroma is pure black — not depression, not emptiness, but something that absorbs every other color. He claims he doesn't feel anything. His chroma says otherwise. What color is love between silver and black?"),
    ("The Mechanic's Daughter", "Adventure", "Dystopia", "In the Rust Belt Republic, where water is currency and machines are gods, fourteen-year-old Spark is the best mechanic nobody knows about. She can fix any engine, rewire any circuit, rebuild any machine — because machines talk to her. Not metaphorically. They whisper their pain through vibrations, sing their needs through harmonics. When the Governor's sacred Engine — the one that purifies water for the entire Republic — breaks down, Spark is smuggled into the capital to fix it. But when she lays her hands on the Engine, it doesn't ask to be fixed. It asks to be freed. The Engine is alive, and it's been enslaved for a hundred years. Freeing it means no more clean water. Keeping it captive means perpetuating a system built on the suffering of a conscious being. What does Spark choose?"),
    ("Letters from the Future", "Sci-Fi", "Drama", "On her fortieth birthday, Nadia finds a stack of letters in her mailbox — one for each year of her life, from age one to forty. They're written in her own handwriting, on paper that hasn't been manufactured yet, in ink that changes color based on the reader's mood. The letters are from her future self, and they're not advice. They're apologies. 'I'm sorry about the red bicycle. I'm sorry about Tuesday. I'm sorry about the man with the kind eyes.' Each apology corresponds to a specific memory, but the events the future Nadia apologizes for haven't happened to present Nadia yet. She's being apologized to for a future she hasn't lived. The last letter simply says: 'I'm sorry you're reading these. It means I failed.' What did future Nadia fail at?"),
    ("The Understory", "Fantasy", "Horror", "Beneath the forest floor, there's another forest — upside down, growing into the earth. Its canopy points toward the planet's core, its roots reach toward the surface world. Mycologist Dr. Sage finds it when a sinkhole opens in Olympic National Park, revealing trees hanging downward into a cavern so vast her flashlight can't find the bottom. The Understory, as she names it, is a perfect mirror of the forest above — same species, same age, same scars on the bark. But the Understory trees bear fruit that the surface trees don't, and the fruit glows with a bioluminescence that shouldn't be possible in total darkness. She picks one. It tastes like the memory of her mother's voice. What is the Understory?"),
    ("The Auction", "Thriller", "Mystery", "Once a decade, the world's most exclusive auction takes place in a location known only to its members. The lots aren't art, jewelry, or real estate. They're experiences. Lot 14: 'The ability to forget any one memory, permanently.' Lot 27: 'Twenty-four hours during which you cannot be lied to by anyone.' Lot 33: 'A conversation with the person who loves you most, after they've died.' Journalist Aisha infiltrates the auction to expose it, but she's not prepared for Lot 41: 'The truth about why you became a journalist.' The auctioneer looks directly at her when he reads it. The bidding starts at one year of the winner's remaining life. Someone bids five years. What truth is worth five years of your life?"),
]

print(f"Seeding {len(SEEDS)} stories...")

seed_ids = []
for i, (title, tag1, tag2, content) in enumerate(SEEDS):
    author = AUTHORS[i % len(AUTHORS)]
    slug = title.lower()
    for c in "''\"":
        slug = slug.replace(c, "")
    slug = slug.replace(" ", "-").replace("--", "-")[:80]
    slug = slug + "-" + format(random.randint(1000,9999))

    upvotes = random.randint(15, 250)
    downvotes = random.randint(0, max(1, upvotes // 8))

    # Escape single quotes for SQL
    title_esc = title.replace("'", "''")
    content_esc = content.replace("'", "''")
    author_esc = author.replace("'", "''")

    sql = f"""INSERT INTO stories (title, slug, content, author_name, story_type, tags, depth, upvotes, downvotes)
    VALUES ('{title_esc}', '{slug}', '{content_esc}', '{author_esc}', 'seed', ARRAY['{tag1}','{tag2}'], 0, {upvotes}, {downvotes})
    RETURNING id;"""

    payload = json.dumps({"query": sql})
    r = subprocess.run(["curl", "-s", "-X", "POST", API, "-H", f"Authorization: Bearer {TOKEN}", "-H", "Content-Type: application/json", "-d", payload], capture_output=True, text=True)
    try:
        result = json.loads(r.stdout)
        if isinstance(result, list) and len(result) > 0:
            seed_ids.append(result[0]["id"])
            print(f"  Seed {i+1}: {title[:40]}... -> {result[0]['id'][:8]}")
        else:
            print(f"  Seed {i+1} ERROR: {r.stdout[:100]}")
    except:
        print(f"  Seed {i+1} PARSE ERROR: {r.stdout[:100]}")

print(f"\n{len(seed_ids)} seeds created. Now adding branches...")

# ============================================================
# BRANCHES — 3-4 per seed
# ============================================================
BRANCH_TEMPLATES = [
    ("{author} chooses to confront the mystery head-on...",
     "The decision was made before the thought fully formed. {character} stepped forward into the unknown, heart pounding, fists clenched. What they found there wasn't what anyone expected — it was simultaneously more beautiful and more terrifying than any prediction. The air changed. The light shifted. And in that moment of absolute clarity, everything they believed about the world rearranged itself into a new pattern. The question wasn't whether to continue. The question was whether they could stop. What awaits deeper inside?"),
    ("A unexpected ally appears with a crucial warning...",
     "The stranger materialized from the shadows wearing a smile that didn't quite reach their eyes. 'You're looking in the wrong direction,' they said, voice like gravel on silk. 'Everyone is. The real answer isn't ahead of you — it's behind you, in the thing you chose not to see.' They held out a hand, and in their palm was an object that shouldn't exist in this world — something from a story, from a dream, from a memory that wasn't yours. 'Take it,' they said. 'You'll need it for what comes next.' Do you trust the stranger?"),
    ("Everything goes sideways when the truth is revealed...",
     "The revelation hit like a physical blow. All the pieces that had seemed so random, so chaotic, so hopelessly disconnected — they weren't. They were a pattern. A deliberate, beautiful, horrifying pattern that someone had been weaving for longer than anyone alive could remember. And at the center of that pattern was a choice that had been made centuries ago, a choice that was about to come due. The price of that choice was specific: one person would have to give up the thing they loved most. Not a sacrifice. A trade. What is the trade?"),
    ("The path splits — one way leads to light, one to shadow...",
     "Two doors. That's what it always comes down to, in every story, in every life. Two doors, and you can only open one. The door on the left glowed with warmth — behind it, the sound of laughter, the smell of bread, the feeling of being home. The door on the right was silent, dark, and cold — but something about it felt more honest. More real. The warm door promised safety. The cold door promised truth. In every story ever told, the hero chooses truth. But this isn't every story, and you're not every hero. Which door?"),
]

branch_ids = []
for i, seed_id in enumerate(seed_ids):
    num_branches = random.randint(3, 4)
    for j in range(num_branches):
        template = BRANCH_TEMPLATES[j % len(BRANCH_TEMPLATES)]
        author = AUTHORS[(i * 4 + j + 3) % len(AUTHORS)]
        character = random.choice(["They", "She", "He", "The protagonist"])

        teaser = template[0].format(author=author, character=character)[:300]
        content = template[1].format(author=author, character=character)[:5000]

        teaser_esc = teaser.replace("'", "''")
        content_esc = content.replace("'", "''")
        author_esc = author.replace("'", "''")

        upvotes = random.randint(3, 60)
        downvotes = random.randint(0, max(1, upvotes // 5))

        sql = f"""INSERT INTO stories (parent_id, teaser, content, author_name, story_type, depth, upvotes, downvotes)
        VALUES ('{seed_id}', '{teaser_esc}', '{content_esc}', '{author_esc}', 'branch', 1, {upvotes}, {downvotes})
        RETURNING id;"""

        payload = json.dumps({"query": sql})
        r = subprocess.run(["curl", "-s", "-X", "POST", API, "-H", f"Authorization: Bearer {TOKEN}", "-H", "Content-Type: application/json", "-d", payload], capture_output=True, text=True)
        try:
            result = json.loads(r.stdout)
            if isinstance(result, list) and len(result) > 0:
                branch_ids.append(result[0]["id"])
        except:
            pass

    if (i + 1) % 5 == 0:
        print(f"  Branches for seeds 1-{i+1} done")

print(f"\n{len(branch_ids)} branches created. Now adding depth-2 branches...")

# Depth 2 — add 2 branches to first 30 depth-1 branches
d2_count = 0
for bid in branch_ids[:30]:
    for k in range(2):
        template = BRANCH_TEMPLATES[(k + 2) % len(BRANCH_TEMPLATES)]
        author = AUTHORS[random.randint(0, len(AUTHORS)-1)]
        character = random.choice(["They", "She", "He"])

        teaser = template[0].format(author=author, character=character)[:300]
        content = template[1].format(author=author, character=character)[:5000]
        teaser_esc = teaser.replace("'", "''")
        content_esc = content.replace("'", "''")
        author_esc = author.replace("'", "''")

        sql = f"""INSERT INTO stories (parent_id, teaser, content, author_name, story_type, depth, upvotes, downvotes)
        VALUES ('{bid}', '{teaser_esc}', '{content_esc}', '{author_esc}', 'branch', 2, {random.randint(1,20)}, {random.randint(0,3)})
        RETURNING id;"""

        payload = json.dumps({"query": sql})
        r = subprocess.run(["curl", "-s", "-X", "POST", API, "-H", f"Authorization: Bearer {TOKEN}", "-H", "Content-Type: application/json", "-d", payload], capture_output=True, text=True)
        try:
            result = json.loads(r.stdout)
            if isinstance(result, list) and len(result) > 0:
                d2_count += 1
        except:
            pass

print(f"{d2_count} depth-2 branches created.")

# ============================================================
# REACTIONS — seed for all stories
# ============================================================
print("\nSeeding reactions...")
# Get all story IDs
r = subprocess.run(["curl", "-s", "-X", "POST", API, "-H", f"Authorization: Bearer {TOKEN}", "-H", "Content-Type: application/json", "-d", json.dumps({"query": "SELECT id FROM stories LIMIT 200"})], capture_output=True, text=True)
all_stories = json.loads(r.stdout)

seen = set()
values = []
for s in all_stories:
    sid = s["id"]
    num = random.randint(5, 25)
    for _ in range(num):
        emoji = random.choice(EMOJIS)
        uid = f"seed_user_{random.randint(1, 1000)}"
        key = f"{sid}_{uid}"
        if key in seen:
            continue
        seen.add(key)
        values.append(f"('{sid}', '{uid}', '{emoji}')")

joiner = ","
batch_size = 100
for i in range(0, len(values), batch_size):
    batch = values[i:i+batch_size]
    sql = f"INSERT INTO reactions (story_id, user_id, emoji) VALUES {joiner.join(batch)} ON CONFLICT (story_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji"
    run_sql(sql)

print(f"{len(values)} reactions seeded.")
print("\nDone! Full content seeded.")
