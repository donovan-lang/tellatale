#!/usr/bin/env bash
# Finalize a release that was BUILT ON A WORKSTATION and uploaded with deploy/push-build.sh.
# House rule: never build on prod. This script only substitutes the anon key, installs runtime deps,
# smoke-tests on a side port, flips the `current` symlink and restarts pm2.
#
#   bash /opt/apps/makeatale-releases/<stamp>/deploy/finalize-release.sh /opt/apps/makeatale-releases/<stamp>
#
# The workstation build inlines NEXT_PUBLIC_SUPABASE_ANON_KEY=__MAT_SUPABASE_ANON_KEY_PLACEHOLDER__ so
# the real key (a public JWT, but still box-local) never has to leave the box. It is read from
# /opt/supabase/keys.json here and written into the built bundle in place.
set -euo pipefail

REL="${1:?release dir}"
BASE="/opt/apps/makeatale-releases"
SHARED="/opt/apps/makeatale-shared"
CURRENT="$BASE/current"
APP="makeatale"
PORT="${PORT:-3002}"
KEEP=3
PLACEHOLDER="__MAT_SUPABASE_ANON_KEY_PLACEHOLDER__"

[ -d "$REL/.next" ] || { echo "no .next in $REL"; exit 1; }
[ -f "$SHARED/.env.local" ] || { echo "missing $SHARED/.env.local"; exit 1; }
ln -sf "$SHARED/.env.local" "$REL/.env.local"

echo "==> substituting anon key into built bundle"
ANON="$(python3 -c 'import json;print(json.load(open("/opt/supabase/keys.json"))["anon"])')"
n=$(grep -rl --include='*.js' --include='*.json' --include='*.html' --include='*.rsc' --include='*.body' "$PLACEHOLDER" "$REL/.next" | wc -l)
grep -rl --include='*.js' --include='*.json' --include='*.html' --include='*.rsc' --include='*.body' "$PLACEHOLDER" "$REL/.next" \
  | xargs -r sed -i "s|$PLACEHOLDER|$ANON|g"
unset ANON
echo "    replaced in $n file(s)"
if grep -rq "$PLACEHOLDER" "$REL/.next"; then echo "placeholder still present after substitution"; exit 1; fi

echo "==> runtime deps"
cd "$REL"
if [ -d "$CURRENT/node_modules" ] && cmp -s "$CURRENT/package-lock.json" "$REL/package-lock.json"; then
  echo "    lockfile unchanged: hard-linking node_modules from current release"
  cp -al "$CURRENT/node_modules" "$REL/node_modules"
else
  npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund
fi

echo "==> smoke test on a side port"
SIDE=$((PORT + 100))
PORT=$SIDE npx next start -p "$SIDE" >/tmp/makeatale-smoke.log 2>&1 &
SPID=$!
ok=0
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$SIDE/" || true)
  [ "$code" = "200" ] && { ok=1; break; }
  sleep 2
done
kill "$SPID" 2>/dev/null || true
[ "$ok" = "1" ] || { echo "smoke test failed, see /tmp/makeatale-smoke.log; current release untouched"; exit 1; }

echo "==> switching current -> $REL"
ln -sfn "$REL" "$CURRENT"
if pm2 describe "$APP" >/dev/null 2>&1; then pm2 delete "$APP" >/dev/null; fi
cd "$CURRENT"
PORT=$PORT pm2 start npm --name "$APP" --cwd "$CURRENT" -- start -- -p "$PORT"
pm2 save >/dev/null

echo "==> pruning old releases (keep $KEEP)"
ls -1dt "$BASE"/20* | tail -n +$((KEEP + 1)) | xargs -r rm -rf
echo "live: $(readlink -f "$CURRENT") on :$PORT"
