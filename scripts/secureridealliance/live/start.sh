#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5056}"
PM2_NAME="secureridealliance-live"
PROJECT_DIR="/home/deploy/repos/SRA_APP"
ENV_FILE="/home/deploy/secrets/secureridealliance-live.env"

cd "$PROJECT_DIR" || { echo "ERROR: could not cd to $PROJECT_DIR" >&2; exit 1; }
[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE is missing." >&2; exit 1; }

set -a
. "$ENV_FILE"
set +a

export NODE_ENV="production"
export PORT="$PORT"
export DB_NAME="${DB_NAME:-mysql_secureridealliance_rw}"

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start server/index.js --name "$PM2_NAME" --max-memory-restart 400M
fi

pm2 save
curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null
echo "Started $PM2_NAME on port $PORT"
