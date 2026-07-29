#!/usr/bin/env bash
# Apply all migrations in order to $DATABASE_URL (or the local dev database).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL="${DATABASE_URL:-postgresql://postgres@127.0.0.1:54322/rajguru_dev}"

for f in "$ROOT"/supabase/migrations/*.sql; do
  printf 'applying %s\n' "$(basename "$f")"
  psql "$URL" -v ON_ERROR_STOP=1 -q -f "$f"
done
echo "migrations applied"
