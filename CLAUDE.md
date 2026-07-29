# CLAUDE.md

Claude Code guidance for this repository.

`AGENTS.md` is the shared agent contract and applies in full. This file adds only what is
specific to Claude Code. Read `AGENTS.md` first.

---

## Session start

1. Invoke the `project-startup-audit` skill. It is read-only.
2. Report the audit before writing any code.
3. Do not ask questions the repository or `docs/00-product/MASTER_BLUEPRINT.md` already answers.

## Skills

Project skills are mirrored into `.claude/skills/`. They are the procedural source of
truth. Reach for them by task:

| Working on | Invoke |
|---|---|
| Any session start | `project-startup-audit` |
| Anything touching stock quantity or the ledger | `domain-stock-ledger` |
| Weighment slip entry, bulk entry, imports | `manual-weighment-workflow` |
| Masters, reference data, reason codes | `master-data-management` |
| Provisional, unidentified or mixed stock | `provisional-stock` |
| Inventory segments, splits, merges | `inventory-segment` |
| Locations, precision, hierarchy | `location-hierarchy` |
| 2D map, layout editor, occupancy | `warehouse-layout` |
| Physical verification, discrepancies | `physical-verification` |
| Fumigation, chemicals, restrictions | `fumigation-management` |
| Policies, coverage, underinsurance | `insurance-coverage` |
| Any schema change | `database-migration` |
| Any new table or policy | `rls-security-review` |
| Building a feature end to end | `feature-vertical-slice` |
| Any user-facing screen | `ui-ux-review` |
| Any report | `report-development` |
| Before claiming done | `test-and-verify` |
| Security passes | `security-audit` |
| Incoming defects | `bug-triage` |
| Wrapping a release | `release-closeout` |

## Tool preferences

- Prefer `Grep` and `Glob` over shell `grep`/`find`.
- Prefer local `git` over GitHub MCP for status, diff, log and blame.
- Use `Bash` for migrations, tests, linting and the Supabase CLI.
- Run independent tool calls in parallel.

## Writing code here

- TypeScript strict. No `any` in domain or posting code.
- Quantities are `numeric` in Postgres and a decimal type in TypeScript. Never `number`
  for a stock quantity, never floating-point arithmetic.
- Validate every input with Zod at the server boundary. Client validation is convenience only.
- Every mutation writes an audit event in the same transaction.
- Match the surrounding code's naming, comment density and idiom.

## What not to do

- Do not create weighbridge hardware integration.
- Do not add microservices, Kubernetes, Kafka, Redis, MongoDB or a second primary database.
- Do not add a generic admin dashboard template.
- Do not disable a security control to make a test pass.
- Do not claim production readiness until every gate in
  `docs/06-testing/TEST_STRATEGY.md` and the go-live conditions in the blueprint pass.

## Completion report

End substantial work with: Implemented, Files changed, Database, Tests (commands and exact
results), Security, UI verification, Insurance verification, Documentation, Known
limitations, Git status, and exactly one recommended next vertical slice.
