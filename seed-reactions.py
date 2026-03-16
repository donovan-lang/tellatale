import json, subprocess, random

token = "sbp_26457d6a2834e945270b28efe523e6e7f27b90df"
api = "https://api.supabase.com/v1/projects/pnufyhorwltjagbklpwx/database/query"

# Get all story IDs
result = subprocess.run(["curl", "-s", "-X", "POST", api, "-H", f"Authorization: Bearer {token}", "-H", "Content-Type: application/json", "-d", json.dumps({"query": "SELECT id FROM stories WHERE is_hidden = false LIMIT 50"})], capture_output=True, text=True)
stories = json.loads(result.stdout)

emojis = ["\U0001F92F", "\U0001F602", "\U0001F631", "\U0001F60D", "\U0001F525"]
values = []

for s in stories:
    sid = s["id"]
    num = random.randint(3, 15)
    for i in range(num):
        emoji = random.choice(emojis)
        uid = f"seed_user_{random.randint(1, 200)}"
        values.append(f"('{sid}', '{uid}', '{emoji}')")

# Insert in batches
joiner = ","
batch_size = 100
for i in range(0, len(values), batch_size):
    batch = values[i:i+batch_size]
    sql = f"INSERT INTO reactions (story_id, user_id, emoji) VALUES {joiner.join(batch)} ON CONFLICT (story_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji"
    payload = json.dumps({"query": sql})
    r = subprocess.run(["curl", "-s", "-X", "POST", api, "-H", f"Authorization: Bearer {token}", "-H", "Content-Type: application/json", "-d", payload], capture_output=True, text=True)
    if "error" in r.stdout.lower() and r.stdout != "[]":
        print(f"Batch {i//batch_size} ERROR: {r.stdout[:150]}")
    else:
        print(f"Batch {i//batch_size}: {len(batch)} reactions")

print(f"Total: {len(values)} reactions seeded for {len(stories)} stories")
