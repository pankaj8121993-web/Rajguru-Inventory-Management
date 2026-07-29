#!/usr/bin/env bash
# Mirror canonical skills from agent-skills/ to the agent-specific directories.
#
# agent-skills/ is the single source of truth. .agents/skills/ and .claude/skills/
# are generated — never edit them by hand; edit the canonical copy and re-run this.
#
# Usage:  ./scripts/sync-skills.sh [--check]
#   --check  verify mirrors are current without modifying anything (used in CI)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/agent-skills"
TARGETS=("$ROOT/.agents/skills" "$ROOT/.claude/skills")
CHECK_ONLY=0

[[ "${1:-}" == "--check" ]] && CHECK_ONLY=1

if [[ ! -d "$SRC" ]]; then
  echo "error: canonical skill directory not found: $SRC" >&2
  exit 1
fi

skill_count=$(find "$SRC" -mindepth 2 -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')
if [[ "$skill_count" -eq 0 ]]; then
  echo "error: no SKILL.md files found under $SRC" >&2
  exit 1
fi

status=0

for target in "${TARGETS[@]}"; do
  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    if ! diff -rq "$SRC" "$target" >/dev/null 2>&1; then
      echo "out of sync: $target"
      diff -rq "$SRC" "$target" 2>&1 | sed 's/^/  /' || true
      status=1
    else
      echo "in sync: $target"
    fi
  else
    rm -rf "$target"
    mkdir -p "$(dirname "$target")"
    cp -r "$SRC" "$target"
    echo "synced: $target"
  fi
done

if [[ "$CHECK_ONLY" -eq 1 && "$status" -ne 0 ]]; then
  echo
  echo "Skill mirrors are stale. Run ./scripts/sync-skills.sh and commit the result." >&2
  exit 1
fi

echo "$skill_count skills"
