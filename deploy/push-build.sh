#!/usr/bin/env bash
# Build on the workstation and ship the artifact to the Linode (never build on prod).
#   bash deploy/push-build.sh            # build + upload + finalize
#   SKIP_BUILD=1 bash deploy/push-build.sh
#
# Requires .env.production.local in the repo root (gitignored) with the NEXT_PUBLIC_* values and
# NEXT_PUBLIC_SUPABASE_ANON_KEY=__MAT_SUPABASE_ANON_KEY_PLACEHOLDER__ (see deploy/finalize-release.sh).
set -euo pipefail
cd "$(dirname "$0")/.."

SSH="${SSH:-C:/Windows/System32/OpenSSH/ssh.exe}"     # Git Bash ssh silently fails on this PC
KEY="${KEY:-$HOME/.ssh/claudebot-key}"
HOST="${HOST:-root@173.255.204.127}"
BASE="/opt/apps/makeatale-releases"

grep -q "__MAT_SUPABASE_ANON_KEY_PLACEHOLDER__" .env.production.local || { echo ".env.production.local must use the anon-key placeholder"; exit 1; }

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "==> next build (workstation)"
  NODE_OPTIONS="--max-old-space-size=4096" npm run build
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
REL="$BASE/$STAMP"
echo "==> uploading to $HOST:$REL"
tar czf - --exclude=.next/cache .next public package.json package-lock.json next.config.js deploy \
  | "$SSH" -i "$KEY" "$HOST" "mkdir -p '$REL' && tar xzf - -C '$REL'"
git rev-parse --short HEAD | "$SSH" -i "$KEY" "$HOST" "cat > '$REL/GIT_SHA'"

echo "==> finalizing on the box"
"$SSH" -i "$KEY" "$HOST" "bash '$REL/deploy/finalize-release.sh' '$REL'"
