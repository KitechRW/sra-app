#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-main}"
PROJECT_DIR="/home/deploy/repos/SRA_APP"
REPO_URL="git@github.com:KitechRW/SRA_APP.git"
FRONTEND_DIR="/srv/www/secureridealliance.rw/web/live/app"

mkdir -p "$(dirname "$PROJECT_DIR")"
if [ ! -d "$PROJECT_DIR/.git" ]; then
  rm -rf "$PROJECT_DIR"
  git clone "$REPO_URL" "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"
git remote set-url origin "$REPO_URL"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd -e .env -e client/dist/

npm ci
npm --prefix client ci
npm run build

if [ -w "$FRONTEND_DIR" ]; then
  rsync -a --delete client/dist/ "$FRONTEND_DIR/"
  echo "Frontend deployed to $FRONTEND_DIR"
else
  echo "WARNING: $FRONTEND_DIR is not writable by $(whoami)." >&2
  echo "Run the privileged setup commands, then re-run this script." >&2
fi

bash /scripts/secureridealliance/live/start.sh
