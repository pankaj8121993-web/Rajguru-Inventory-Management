# Capability Register

What tooling this project has, what it is for, and its trust classification.

## Project skills

Canonical in `agent-skills/<name>/SKILL.md`, mirrored to `.agents/skills/` and
`.claude/skills/` by `scripts/sync-skills.sh`. All 20 required by development prompt §3 exist.

| Skill | Use when |
|---|---|
| `project-startup-audit` | **Every session, first.** Read-only audit and report |
| `domain-stock-ledger` | Any change touching stock quantity, posting or the ledger |
| `manual-weighment-workflow` | Weighment entry, bulk grids, imports, duplicates |
| `master-data-management` | Any master or reference data |
| `provisional-stock` | Provisional, unidentified or mixed stock; identification |
| `inventory-segment` | Segment lifecycle, splits, merges, traceability |
| `location-hierarchy` | Location nodes, precision, refinement versus transfer |
| `warehouse-layout` | 2D map, layout editor, occupancy, uncertainty display |
| `physical-verification` | Verification, estimates, discrepancies, adjustments |
| `fumigation-management` | Fumigation, chemicals, safety periods, restrictions |
| `insurance-coverage` | Policies, coverage, underinsurance, claims |
| `database-migration` | Any schema change |
| `rls-security-review` | Any new table, policy or grant |
| `feature-vertical-slice` | Building any feature end to end |
| `ui-ux-review` | Any user-facing screen |
| `report-development` | Any report or dashboard |
| `test-and-verify` | Before claiming anything complete |
| `security-audit` | Phase completion and security passes |
| `bug-triage` | Any incoming defect |
| `release-closeout` | Wrapping a release |

## Subagents

| Agent | Use |
|---|---|
| `Explore` | Broad read-only search across many files |
| `Plan` | Implementation planning for a slice |
| `general-purpose` | Multi-step research |

No domain-specific subagents are defined. Skills carry the domain knowledge instead —
a skill loads into the current context, where a subagent starts cold.

## Local tooling

Git · Supabase CLI (migrations) · Node and npm · Playwright with pre-installed Chromium
(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`; never run `playwright install`).

## Automation in CI

Gitleaks (secrets) · Semgrep and CodeQL (static analysis) · Dependabot (dependencies) ·
axe-core (accessibility) · Vitest and Playwright (tests).

## Not adopted, deliberately

| Capability | Why not |
|---|---|
| Figma MCP | No approved design exists yet. Use only when one does |
| Browser MCP for routine work | Prefer existing tests, then the Playwright CLI |
| Any unreviewed MCP server | Must pass the review in `MCP_REGISTER.md` first |
| Domain subagents | Skills serve the purpose without a cold start |
