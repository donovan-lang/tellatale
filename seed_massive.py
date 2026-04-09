#!/usr/bin/env python3
"""
MakeATale Massive Content Seeder
=================================
Uses Rupert 27B (Qwen 3.5) to generate:
  - 80 unique author personas with distinct writing styles
  - ~400 story seeds (5 per author)
  - ~1200 unique branches (3 per story)

Progress saved to data/seed_state.json — fully resumable.
Rate-limited to respect Rupert's 15 req/10min quota.

Usage:
  python seed_massive.py              # Run all phases
  python seed_massive.py authors      # Phase 1 only
  python seed_massive.py stories      # Phase 2 only
  python seed_massive.py branches     # Phase 3 only
  python seed_massive.py seed         # Phase 4: wipe + seed DB
  python seed_massive.py status       # Show progress
"""

import requests as req
import json
import time
import random
import os
import sys
import re
from datetime import datetime

# ============================================================
# Configuration
# ============================================================

RUPERT_URL = "https://rupert.shockwave.gg/api/v1/chat/completions"
RUPERT_KEY = "sk-06784be21aa945fcad01008c17288d3f"
RUPERT_MODEL = "qwen3.5-27b:latest"

SUPABASE_URL = "https://pnufyhorwltjagbklpwx.supabase.co/rest/v1"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudWZ5aG9yd2x0amFnYmtscHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzkxNzgsImV4cCI6MjA4OTE1NTE3OH0.oD3O9bcd6phuK6li-Z92CfRlMyqDZInARaViZ3eN0t0"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudWZ5aG9yd2x0amFnYmtscHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU3OTE3OCwiZXhwIjoyMDg5MTU1MTc4fQ.3IpQYisdM1079ZxXT4Hp8InsxCSx2AxHU45MywH9xbc"

STATE_FILE = os.path.join(os.path.dirname(__file__), "data", "seed_state.json")

# 15 requests per 10 min = 1 per 40s. Use 42s for safety.
RATE_LIMIT_INTERVAL = 42

GENRES = [
    "Fantasy", "Sci-Fi", "Horror", "Mystery", "Romance", "Adventure",
    "Thriller", "Comedy", "Drama", "Surreal", "Historical", "Dystopia",
    "Steampunk", "Cyberpunk", "Mythology", "Noir", "Gothic",
    "Cosmic Horror", "Slice-of-Life", "Alternate History"
]

TONES = [
    "dark", "lighthearted", "humorous", "epic", "mysterious",
    "romantic", "tense", "whimsical", "gritty", "dreamlike",
    "melancholic", "sardonic", "ethereal", "visceral", "contemplative"
]

# ============================================================
# State Management
# ============================================================

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"authors": [], "stories": [], "branches": [], "seeded": False}

def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)
    os.replace(tmp, STATE_FILE)

# ============================================================
# Rupert LLM — Streaming Client
# ============================================================

_last_call = 0

def rupert(system_prompt, user_prompt, max_tokens=8192, temperature=0.9):
    """Call Rupert 27B with streaming, rate limiting, and retry."""
    global _last_call

    elapsed = time.time() - _last_call
    if elapsed < RATE_LIMIT_INTERVAL:
        wait = RATE_LIMIT_INTERVAL - elapsed
        print(f"    [wait] rate limit {wait:.0f}s", end="", flush=True)
        time.sleep(wait)
        print(" -> go")

    for attempt in range(3):
        try:
            resp = req.post(
                RUPERT_URL,
                headers={"Authorization": f"Bearer {RUPERT_KEY}", "Content-Type": "application/json"},
                json={
                    "model": RUPERT_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "stream": True,
                },
                stream=True,
                timeout=300,
            )
            _last_call = time.time()

            if resp.status_code != 200:
                print(f"    [!] HTTP {resp.status_code} (attempt {attempt+1})")
                time.sleep(15)
                continue

            content = ""
            for line in resp.iter_lines():
                if not line:
                    continue
                text = line.decode("utf-8", errors="ignore")
                if not text.startswith("data: ") or text == "data: [DONE]":
                    continue
                try:
                    chunk = json.loads(text[6:])
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    content += delta.get("content", "")
                except Exception:
                    pass

            content = content.strip()
            if content:
                return content

            print(f"    [!] empty response (attempt {attempt+1})")
            time.sleep(10)

        except req.exceptions.Timeout:
            print(f"    [!] timeout (attempt {attempt+1})")
            _last_call = time.time()
            time.sleep(15)
        except Exception as e:
            print(f"    [!] {e} (attempt {attempt+1})")
            _last_call = time.time()
            time.sleep(10)

    return None


def parse_json(text):
    """Robustly extract JSON from LLM output."""
    if not text:
        return None

    # Strip Qwen thinking tags
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

    # Direct parse
    try:
        return json.loads(text)
    except Exception:
        pass

    # Strip markdown fences
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.MULTILINE)
    cleaned = re.sub(r"\n?\s*```\s*$", "", cleaned)
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Find first JSON array or object
    for open_c, close_c in [("[", "]"), ("{", "}")]:
        start = cleaned.find(open_c)
        if start == -1:
            continue
        depth = 0
        in_str = False
        escape = False
        for i in range(start, len(cleaned)):
            c = cleaned[i]
            if escape:
                escape = False
                continue
            if c == "\\":
                escape = True
                continue
            if c == '"':
                in_str = not in_str
                continue
            if in_str:
                continue
            if c == open_c:
                depth += 1
            elif c == close_c:
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(cleaned[start : i + 1])
                    except Exception:
                        break

    # Fix trailing commas
    fixed = re.sub(r",\s*([}\]])", r"\1", cleaned)
    try:
        return json.loads(fixed)
    except Exception:
        pass

    return None


# ============================================================
# Supabase Helpers
# ============================================================

def _sb_headers(prefer="return=representation"):
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }

def sb_insert(table, rows):
    """Insert one or more rows. Returns list of inserted rows or None."""
    data = rows if isinstance(rows, list) else [rows]
    resp = req.post(f"{SUPABASE_URL}/{table}", headers=_sb_headers(), json=data, timeout=30)
    if resp.status_code in (200, 201):
        return resp.json()
    print(f"    [!] INSERT {table}: {resp.status_code} — {resp.text[:200]}")
    return None

def sb_delete(table, filt="id=not.is.null"):
    resp = req.delete(f"{SUPABASE_URL}/{table}?{filt}", headers=_sb_headers("return=minimal"), timeout=30)
    return resp.status_code in (200, 204)

def sb_count(table):
    resp = req.get(
        f"{SUPABASE_URL}/{table}?select=id",
        headers={**_sb_headers(), "Prefer": "count=exact", "Range-Unit": "items", "Range": "0-0"},
        timeout=15,
    )
    ct = resp.headers.get("content-range", "")
    if "/" in ct:
        try:
            return int(ct.split("/")[1])
        except Exception:
            pass
    return "?"


# ============================================================
# Phase 1: Author Personas
# ============================================================

AUTHOR_SYS = """You generate fictional author personas for MakeATale, a collaborative choose-your-own-adventure story platform.

Create diverse, believable writers with distinct voices. Vary cultures, ages, backgrounds, and writing styles.

RESPOND WITH ONLY a JSON array — no markdown fences, no explanation:
[
  {
    "name": "Full Name",
    "bio": "2-3 sentence bio",
    "style": "Brief writing style description",
    "genres": ["Genre1", "Genre2"],
    "nationality": "Background"
  }
]"""

def phase_authors(state, target=80):
    authors = state.get("authors", [])
    if len(authors) >= target:
        print(f"  [OK] {len(authors)} authors already generated")
        return

    existing = {a["name"] for a in authors}
    genres_str = ", ".join(GENRES)

    while len(authors) < target:
        batch = min(10, target - len(authors))
        batch_num = len(authors) // 10 + 1

        # Vary the diversity prompt each batch
        diversity_hints = [
            "Include writers from Africa, East Asia, South America, Middle East, and Eastern Europe.",
            "Include a mix of debut novelists, retired professors, journalists, and poets.",
            "Include writers aged 20s through 70s. Some use pen names.",
            "Include indigenous, diaspora, and multilingual writers.",
            "Include genre-benders who combine unexpected genres.",
            "Include reclusive writers, social media stars, and award winners.",
            "Include writers inspired by oral traditions, manga, telenovelas, and folklore.",
            "Include scientists-turned-writers, ex-military, and theater people.",
        ]
        hint = diversity_hints[batch_num % len(diversity_hints)]

        skip_names = ", ".join(list(existing)[:30]) if existing else "none"
        prompt = f"""Generate exactly {batch} unique author personas.

Available genres: {genres_str}
Each author specializes in 2-3 genres. Give each a DISTINCT writing style.
{hint}
Do NOT reuse these names: {skip_names}"""

        print(f"  Batch {batch_num} — generating {batch} authors ({len(authors)}/{target})...")
        raw = rupert(AUTHOR_SYS, prompt, max_tokens=6144)
        parsed = parse_json(raw)

        if not parsed or not isinstance(parsed, list):
            print(f"    [FAIL] bad response, retrying...")
            continue

        added = 0
        for a in parsed:
            name = a.get("name", "").strip()
            if not name or name in existing:
                continue
            a["genres"] = [g for g in a.get("genres", []) if g in GENRES][:3]
            if not a["genres"]:
                a["genres"] = random.sample(GENRES, 2)
            authors.append(a)
            existing.add(name)
            added += 1

        state["authors"] = authors
        save_state(state)
        print(f"    +{added} -> {len(authors)} total")

    print(f"  [OK] {len(authors)} authors generated")


# ============================================================
# Phase 2: Story Seeds
# ============================================================

STORY_SYS_TEMPLATE = """You are {name}, a fiction writer. {bio}

Your writing style: {style}

Generate story seeds for MakeATale, a choose-your-own-adventure platform.

Rules:
- 400-800 words per story
- Rich, immersive openings that establish world/character/conflict
- End each story at a decision point — a fork that begs for multiple continuations
- Match the genre. Write in YOUR distinct style.
- Second person ("you") or third person — whichever fits better
- No meta-commentary. End naturally at the decision point.
- Every story must have a different premise. Be original.

RESPOND WITH ONLY a JSON array — no markdown fences:
[
  {{
    "title": "Story Title",
    "content": "Full 400-800 word story...",
    "tags": ["Genre1", "Genre2"],
    "tone": "one-word tone"
  }}
]"""

def phase_stories(state, per_author=5):
    authors = state.get("authors", [])
    if not authors:
        print("  [FAIL] No authors — run 'authors' phase first")
        return

    stories = state.get("stories", [])
    done_authors = {s["_author"] for s in stories}
    remaining = [a for a in authors if a["name"] not in done_authors]

    if not remaining:
        print(f"  [OK] {len(stories)} stories already generated for all {len(authors)} authors")
        return

    print(f"  {len(remaining)} authors need stories ({len(stories)} stories so far)...")

    for i, author in enumerate(remaining):
        sys_prompt = STORY_SYS_TEMPLATE.format(
            name=author["name"],
            bio=author.get("bio", "A talented writer."),
            style=author.get("style", "vivid and engaging prose"),
        )

        genre_str = ", ".join(author["genres"])
        tones = ", ".join(random.sample(TONES, 6))
        prompt = f"""Generate {per_author} story seeds across these genres: {genre_str}

Vary the subgenre, setting, time period, and tone across stories.
Available tones: {tones}

Generate exactly {per_author} stories as a JSON array."""

        print(f"  [{i+1}/{len(remaining)}] {author['name']} ({genre_str})...", end="", flush=True)
        raw = rupert(sys_prompt, prompt, max_tokens=10000, temperature=0.95)
        parsed = parse_json(raw)

        if not parsed or not isinstance(parsed, list):
            print(f" [FAIL] parse failed")
            continue

        added = 0
        for s in parsed:
            title = s.get("title", "").strip()
            content = s.get("content", "").strip()
            if not title or not content or len(content) < 200:
                continue
            s["tags"] = [t for t in s.get("tags", []) if t in GENRES][:3]
            if not s["tags"]:
                s["tags"] = random.sample(author["genres"], min(2, len(author["genres"])))
            s["_author"] = author["name"]
            s["tone"] = s.get("tone", random.choice(TONES))
            stories.append(s)
            added += 1

        state["stories"] = stories
        save_state(state)
        print(f" +{added} -> {len(stories)} total")

    print(f"  [OK] {len(stories)} stories generated")


# ============================================================
# Phase 3: Branches
# ============================================================

BRANCH_SYS = """You generate branch continuations for choose-your-own-adventure stories on MakeATale.

You will be given multiple story seeds. For EACH story, generate 3 unique branches.

Each branch has:
- teaser: the choice text shown to readers (10-30 words, compelling)
- content: 200-400 word continuation that takes the story in a distinct direction
- is_ending: true if this branch concludes the story arc, false otherwise

Make each branch genuinely DIFFERENT — different choices, different consequences, different moods.
At most 1 branch per story should be an ending. Match the original story's tone and voice.

RESPOND WITH ONLY a JSON object keyed by story number — no markdown fences:
{
  "story_1": [
    {"teaser": "...", "content": "...", "is_ending": false},
    {"teaser": "...", "content": "...", "is_ending": false},
    {"teaser": "...", "content": "...", "is_ending": true}
  ],
  "story_2": [...],
  "story_3": [...]
}"""

def phase_branches(state, batch_size=3):
    stories = state.get("stories", [])
    if not stories:
        print("  [FAIL] No stories — run 'stories' phase first")
        return

    branches = state.get("branches", [])
    done_indices = {b["_si"] for b in branches}
    remaining = [(i, s) for i, s in enumerate(stories) if i not in done_indices]

    if not remaining:
        print(f"  [OK] {len(branches)} branches already generated for all {len(stories)} stories")
        return

    print(f"  {len(remaining)} stories need branches ({len(branches)} branches so far)...")
    print(f"  Batching {batch_size} stories per call -> ~{len(remaining)//batch_size} calls")

    for batch_start in range(0, len(remaining), batch_size):
        batch = remaining[batch_start : batch_start + batch_size]

        # Build multi-story prompt
        sections = []
        for n, (si, story) in enumerate(batch, 1):
            excerpt = story["content"][:1500]
            sections.append(
                f"=== STORY {n}: \"{story['title']}\" by {story['_author']} ===\n"
                f"Genre: {', '.join(story.get('tags', []))}\n\n"
                f"{excerpt}\n"
            )

        prompt = (
            f"Generate 3 unique branch continuations for EACH of the following {len(batch)} stories.\n\n"
            + "\n".join(sections)
            + f"\n\nRespond with a JSON object: {{\"story_1\": [...], \"story_2\": [...], ...}} "
            f"with {len(batch)} keys total."
        )

        titles = [s[1]["title"][:25] for s in batch]
        print(f"  [{batch_start+1}-{batch_start+len(batch)}/{len(remaining)}] {' | '.join(titles)}...", end="", flush=True)

        raw = rupert(BRANCH_SYS, prompt, max_tokens=10000, temperature=0.9)
        parsed = parse_json(raw)

        if not parsed:
            print(f" [FAIL] parse failed")
            continue

        added = 0
        # Handle dict response (preferred format)
        if isinstance(parsed, dict):
            for n, (si, story) in enumerate(batch, 1):
                key = f"story_{n}"
                story_branches = parsed.get(key, [])
                if not isinstance(story_branches, list):
                    continue
                for b in story_branches:
                    if not isinstance(b, dict):
                        continue
                    teaser = b.get("teaser", "").strip()
                    content = b.get("content", "").strip()
                    if not teaser or not content or len(content) < 80:
                        continue
                    branches.append({
                        "teaser": teaser,
                        "content": content,
                        "is_ending": bool(b.get("is_ending", False)),
                        "_si": si,
                        "_author": story["_author"],
                    })
                    added += 1
        # Fallback: list of branches for the first story only
        elif isinstance(parsed, list) and len(batch) == 1:
            si, story = batch[0]
            for b in parsed:
                if not isinstance(b, dict):
                    continue
                teaser = b.get("teaser", "").strip()
                content = b.get("content", "").strip()
                if not teaser or not content or len(content) < 80:
                    continue
                branches.append({
                    "teaser": teaser,
                    "content": content,
                    "is_ending": bool(b.get("is_ending", False)),
                    "_si": si,
                    "_author": story["_author"],
                })
                added += 1

        state["branches"] = branches
        save_state(state)
        print(f" +{added} -> {len(branches)} total")

    print(f"  [OK] {len(branches)} branches generated")


# ============================================================
# Phase 4: Wipe & Seed to Supabase
# ============================================================

def phase_seed(state):
    stories = state.get("stories", [])
    branches_data = state.get("branches", [])

    if not stories:
        print("  [FAIL] No stories to seed")
        return

    # Show what we've got
    print(f"  Content ready:")
    print(f"    Authors:  {len(state.get('authors', []))}")
    print(f"    Stories:  {len(stories)}")
    print(f"    Branches: {len(branches_data)}")

    # Count current DB content
    current = sb_count("stories")
    print(f"    Current DB stories: {current}")

    # Wipe
    print("\n  Wiping old content...")
    for table in ["reactions", "votes", "comments", "chronicles", "reading_progress", "bookmarks", "reports"]:
        ok = sb_delete(table)
        status = "ok" if ok else "skip"
        print(f"    {table}: {status}")

    # Delete stories last (parent of everything)
    ok = sb_delete("stories")
    print(f"    stories: {'ok' if ok else 'FAILED'}")

    if not ok:
        print("  [!] Story wipe may have failed — check foreign key constraints")

    # Seed stories
    print(f"\n  Inserting {len(stories)} story seeds...")
    seed_map = {}  # story_index -> supabase UUID

    batch_size = 20
    for i in range(0, len(stories), batch_size):
        batch = stories[i : i + batch_size]
        rows = []
        for j, story in enumerate(batch):
            slug = story["title"].lower()
            slug = re.sub(r"[^a-z0-9]+", "-", slug)[:70].strip("-")
            slug += f"-{random.randint(1000, 9999)}"

            rows.append({
                "title": story["title"][:200],
                "slug": slug,
                "content": story["content"][:6000],
                "author_name": story["_author"],
                "story_type": "seed",
                "tags": story.get("tags", ["Fantasy"]),
                "depth": 0,
                "upvotes": random.randint(8, 250),
                "downvotes": random.randint(0, 15),
            })

        result = sb_insert("stories", rows)
        if result:
            for j, row in enumerate(result):
                seed_map[i + j] = row["id"]
            print(f"    seeds {i+1}-{i+len(batch)}: ok ({len(seed_map)} total)")
        else:
            print(f"    seeds {i+1}-{i+len(batch)}: FAILED")

    # Seed branches
    print(f"\n  Inserting {len(branches_data)} branches...")
    branch_count = 0

    branch_rows = []
    for b in branches_data:
        parent_id = seed_map.get(b["_si"])
        if not parent_id:
            continue
        branch_rows.append({
            "parent_id": parent_id,
            "teaser": b["teaser"][:300],
            "content": b["content"][:6000],
            "author_name": b.get("_author", "TaleBot"),
            "story_type": "branch",
            "depth": 1,
            "is_ending": b.get("is_ending", False),
            "upvotes": random.randint(1, 60),
            "downvotes": random.randint(0, 8),
        })

    for i in range(0, len(branch_rows), batch_size):
        batch = branch_rows[i : i + batch_size]
        result = sb_insert("stories", batch)
        if result:
            branch_count += len(result)
            print(f"    branches {i+1}-{i+len(batch)}: ok ({branch_count} total)")
        else:
            print(f"    branches {i+1}-{i+len(batch)}: FAILED")

    # Seed some reactions for liveliness
    print(f"\n  Seeding reactions...")
    emojis = ["\U0001F92F", "\U0001F602", "\U0001F631", "\U0001F60D", "\U0001F525", "\U0001F480", "\U0001FAE1", "\u2728"]
    reaction_count = 0

    # Get all inserted story IDs
    all_ids = list(seed_map.values())
    reaction_rows = []
    seen = set()
    for sid in all_ids:
        for _ in range(random.randint(3, 15)):
            uid = f"seed_user_{random.randint(1, 2000)}"
            key = f"{sid}_{uid}"
            if key in seen:
                continue
            seen.add(key)
            reaction_rows.append({"story_id": sid, "user_id": uid, "emoji": random.choice(emojis)})

    for i in range(0, len(reaction_rows), 100):
        batch = reaction_rows[i : i + 100]
        result = sb_insert("reactions", batch)
        if result:
            reaction_count += len(result)

    print(f"    {reaction_count} reactions seeded")

    state["seeded"] = True
    state["seed_stats"] = {
        "seeds": len(seed_map),
        "branches": branch_count,
        "reactions": reaction_count,
        "seeded_at": datetime.now().isoformat(),
    }
    save_state(state)

    print(f"\n  [OK] SEEDED: {len(seed_map)} stories + {branch_count} branches + {reaction_count} reactions")


# ============================================================
# Status
# ============================================================

def show_status(state):
    authors = state.get("authors", [])
    stories = state.get("stories", [])
    branches = state.get("branches", [])
    seeded = state.get("seeded", False)
    stats = state.get("seed_stats", {})

    print(f"  Authors:  {len(authors)}/80")
    print(f"  Stories:  {len(stories)}/~400")
    print(f"  Branches: {len(branches)}/~1200")
    print(f"  Seeded:   {'[OK] ' + stats.get('seeded_at', '') if seeded else '[FAIL] not yet'}")

    if authors:
        genres_used = {}
        for a in authors:
            for g in a.get("genres", []):
                genres_used[g] = genres_used.get(g, 0) + 1
        print(f"\n  Genre coverage ({len(genres_used)}/{len(GENRES)}):")
        for g in GENRES:
            ct = genres_used.get(g, 0)
            bar = "#" * ct
            print(f"    {g:20s} {ct:2d} {bar}")

    if stories:
        authors_with_stories = len({s["_author"] for s in stories})
        print(f"\n  Authors with stories: {authors_with_stories}/{len(authors)}")

    # Estimate remaining time
    if len(stories) < len(authors) * 5:
        remaining_authors = len(authors) - len({s["_author"] for s in stories})
        est_min = remaining_authors * RATE_LIMIT_INTERVAL / 60
        print(f"\n  Est. remaining for stories: ~{est_min:.0f} min")

    if stories and len(branches) < len(stories) * 3:
        remaining_stories = len(stories) - len({b["_si"] for b in branches})
        est_min = remaining_stories * RATE_LIMIT_INTERVAL / 60
        print(f"  Est. remaining for branches: ~{est_min:.0f} min")


# ============================================================
# Main
# ============================================================

def main():
    phase = sys.argv[1] if len(sys.argv) > 1 else "all"

    print("=" * 60)
    print("  MakeATale — Massive Content Seeder")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  Phase: {phase}")
    print("=" * 60)

    state = load_state()

    if phase == "status":
        show_status(state)
        return

    if phase in ("all", "authors"):
        print("\n[Phase 1] Author Personas")
        phase_authors(state, target=80)

    if phase in ("all", "stories"):
        print("\n[Phase 2] Story Seeds")
        phase_stories(state, per_author=5)

    if phase in ("all", "branches"):
        print("\n[Phase 3] Branches")
        phase_branches(state)

    if phase in ("all", "seed"):
        print("\n[Phase 4] Wipe & Seed to Supabase")
        phase_seed(state)

    print("\n" + "=" * 60)
    show_status(state)
    print("=" * 60)


if __name__ == "__main__":
    main()
