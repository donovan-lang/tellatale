#!/usr/bin/env bash
# Self-hosted MakeATale deploy (replaces Vercel). Run ON the server as root:
#   bash /opt/apps/makeatale-releases/current/deploy/deploy-selfhost.sh [branch]
# or from a workstation:
#   ssh -i ~/.ssh/claudebot-key root@173.255.204.127 'bash /opt/apps/makeatale-releases/current/deploy/deploy-selfhost.sh master'
#
# - pulls donovan-lang/tellatale (public repo, no credentials needed)
# - builds into a fresh release dir so a failed build never takes the running site down
# - keeps secrets in /opt/apps/makeatale-shared/.env.local (never in git, chmod 600)
# - flips the `current` symlink and reloads pm2 only after a successful build + smoke test
set -euo pipefail

BRANCH="${1:-master}"
REPO="https://github.com/donovan-lang/tellatale.git"
BASE="/opt/apps/makeatale-releases"
SHARED="/opt/apps/makeatale-shared"
CURRENT="$BASE/current"
APP="makeatale"
PORT="${PORT:-3002}"
KEEP=3

mkdir -p "$BASE" "$SHARED"
[ -f "$SHARED/.env.local" ] || { echo "missing $SHARED/.env.local"; exit 1; }

STAMP="$(date +%Y%m%d-%H%M%S)"
REL="$BASE/$STAMP"
echo "==> cloning $BRANCH into $REL"
git clone --depth 1 --branch "$BRANCH" "$REPO" "$REL"
ln -sf "$SHARED/.env.local" "$REL/.env.local"

cd "$REL"
echo "==> npm ci"
# The committed lockfile has drifted from package.json (e.g. utf-8-validate peer of the Solana
# deps). Vercel tolerates that; npm ci does not. Fall back to npm install rather than fail.
npm ci --no-audit --no-fund || { echo "npm ci failed (lockfile drift) - falling back to npm install"; npm install --no-audit --no-fund; }
echo "==> next build"
NODE_OPTIONS="--max-old-space-size=2048" npm run build

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

echo "==> switching current -> $STAMP"
ln -sfn "$REL" "$CURRENT"
if pm2 describe "$APP" >/dev/null 2>&1; then
  pm2 delete "$APP" >/dev/null
fi
cd "$CURRENT"
PORT=$PORT pm2 start npm --name "$APP" --cwd "$CURRENT" -- start -- -p "$PORT"
pm2 save >/dev/null

echo "==> pruning old releases (keep $KEEP)"
ls -1dt "$BASE"/20* | tail -n +$((KEEP + 1)) | xargs -r rm -rf
echo "deployed $BRANCH @ $(git -C "$CURRENT" rev-parse --short HEAD) on :$PORT"
