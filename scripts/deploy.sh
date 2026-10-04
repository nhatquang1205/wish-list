#!/usr/bin/env bash
# Runs on the VPS, piped in over ssh by .github/workflows/deploy.yml.
# Also fine to run by hand: bash scripts/deploy.sh https://your.host
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/wish-list}"
SERVICE="${SERVICE:-wishlist}"
APP_URL="${1:-}"

cd "$APP_DIR"

echo "→ fetching"
git fetch origin main
# Hard reset rather than pull: the working tree should match the commit CI
# just tested, with no merge to go wrong. .env is gitignored, so it survives.
git reset --hard origin/main

echo "→ installing"
npm ci

echo "→ applying schema"
# Idempotent: every statement in db/schema.sql is if-not-exists.
npm run db:init

echo "→ building"
npm run build

echo "→ restarting"
sudo systemctl restart "$SERVICE"

if [ -n "$APP_URL" ]; then
  echo "→ health check"
  for i in $(seq 1 15); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/login" || true)
    if [ "$code" = "200" ]; then
      echo "   $APP_URL/login → 200"
      exit 0
    fi
    sleep 2
  done
  echo "   never came back healthy (last status: ${code:-none})" >&2
  sudo systemctl status "$SERVICE" --no-pager --lines=30 >&2 || true
  exit 1
fi
