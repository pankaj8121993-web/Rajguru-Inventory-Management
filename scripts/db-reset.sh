#!/usr/bin/env bash
# Drop, recreate, migrate and seed the LOCAL development database.
#
# Refuses to run against anything that is not localhost — this must never be
# pointed at staging or production (SECURITY_MODEL.md 4).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL="${DATABASE_URL:-postgresql://postgres@127.0.0.1:54322/rajguru_dev}"

if [[ "$URL" != *"127.0.0.1"* && "$URL" != *"localhost"* ]]; then
  echo "refusing to reset a non-local database: $URL" >&2
  exit 1
fi

DB="${URL##*/}"
ADMIN="${URL%/*}/postgres"

psql "$ADMIN" -v ON_ERROR_STOP=1 -q \
  -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = '$DB' and pid <> pg_backend_pid();" \
  -c "drop database if exists \"$DB\";" \
  -c "create database \"$DB\";"

DATABASE_URL="$URL" "$ROOT/scripts/db-migrate.sh"
psql "$URL" -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/seed.sql"
echo "database reset and seeded: $DB"
