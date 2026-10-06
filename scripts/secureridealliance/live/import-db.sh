#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-mysql_secureridealliance_rw}"
DB_USER="${DB_USER:-mysql_secureridealliance_778594e}"
SQL_FILE="${1:-/home/deploy/repos/SRA_APP/server/database.sql}"

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: SQL file not found: $SQL_FILE" >&2
  exit 1
fi

awk '
  /^CREATE DATABASE / || /^USE / { next }
  /^-- .*INDEXES/ { skip = 1; next }
  /^-- .*SEED: Admin users/ { skip = 0 }
  !skip { print }
' "$SQL_FILE" | mysql -u "$DB_USER" -p "$DB_NAME"
