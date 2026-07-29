#!/usr/bin/env bash
# Verify the governance structure is intact: required documents and skills exist,
# and skill mirrors are current.
#
# Usage: ./scripts/check-structure.sh

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

missing=0
check() {
  if [[ -f "$1" ]]; then
    printf '  ok      %s\n' "$1"
  else
    printf '  MISSING %s\n' "$1"
    missing=$((missing + 1))
  fi
}

echo "Root contracts"
for f in AGENTS.md CLAUDE.md README.md .gitignore .editorconfig; do check "$f"; done

echo
echo "Documentation"
for f in \
  docs/00-product/MASTER_BLUEPRINT.md \
  docs/00-product/PRODUCT_REQUIREMENTS.md \
  docs/00-product/SCOPE.md \
  docs/01-domain/GLOSSARY.md \
  docs/01-domain/DOMAIN_RULES.md \
  docs/01-domain/INVENTORY_INVARIANTS.md \
  docs/01-domain/WORKFLOWS.md \
  docs/01-domain/MASTER_DATA_CATALOGUE.md \
  docs/02-architecture/ARCHITECTURE.md \
  docs/02-architecture/DEPENDENCY_REGISTER.md \
  docs/03-database/DATA_MODEL.md \
  docs/03-database/MIGRATION_REGISTER.md \
  docs/04-security/SECURITY_MODEL.md \
  docs/04-security/PERMISSION_MATRIX.md \
  docs/04-security/APPROVAL_MATRIX.md \
  docs/04-security/OVERRIDE_MATRIX.md \
  docs/04-security/THREAT_MODEL.md \
  docs/05-design/DESIGN_SYSTEM.md \
  docs/05-design/SCREEN_REGISTER.md \
  docs/06-testing/TEST_STRATEGY.md \
  docs/06-testing/UAT_PLAN.md \
  docs/06-testing/TEST_REGISTER.md \
  docs/07-operations/DEPLOYMENT.md \
  docs/07-operations/BACKUP_RESTORE.md \
  docs/07-operations/INCIDENT_RESPONSE.md \
  docs/08-releases/CHANGELOG.md \
  docs/08-releases/BUGS.md \
  docs/08-releases/KNOWN_ISSUES.md \
  docs/08-releases/RELEASE_NOTES.md \
  docs/09-ai-governance/CURRENT_STATE.md \
  docs/09-ai-governance/CAPABILITY_REGISTER.md \
  docs/09-ai-governance/DECISION_LOG.md \
  docs/09-ai-governance/MCP_REGISTER.md \
  docs/09-ai-governance/PHASED_BACKLOG.md \
  docs/09-ai-governance/AGENT_ACTIVITY.md \
; do check "$f"; done

echo
echo "Architecture decision records"
adr_count=$(find docs/02-architecture/adr -name 'ADR-*.md' 2>/dev/null | wc -l | tr -d ' ')
if [[ "$adr_count" -ge 1 ]]; then
  printf '  ok      %s ADR(s)\n' "$adr_count"
else
  printf '  MISSING no ADRs found\n'
  missing=$((missing + 1))
fi

echo
echo "Project skills"
REQUIRED_SKILLS=(
  project-startup-audit domain-stock-ledger manual-weighment-workflow
  master-data-management provisional-stock inventory-segment location-hierarchy
  warehouse-layout physical-verification fumigation-management insurance-coverage
  database-migration rls-security-review feature-vertical-slice ui-ux-review
  report-development test-and-verify security-audit bug-triage release-closeout
)
for s in "${REQUIRED_SKILLS[@]}"; do check "agent-skills/$s/SKILL.md"; done

echo
echo "Skill mirrors"
if ./scripts/sync-skills.sh --check >/dev/null 2>&1; then
  printf '  ok      .agents/skills and .claude/skills are current\n'
else
  printf '  STALE   run ./scripts/sync-skills.sh and commit\n'
  missing=$((missing + 1))
fi

echo
if [[ "$missing" -eq 0 ]]; then
  echo "Structure check passed."
  exit 0
else
  echo "Structure check FAILED: $missing problem(s)."
  exit 1
fi
