# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning is [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added — 2026-07-29 — Master data: locations and commodities (Phase 3, partial)

First working application code. A complete vertical slice for the two masters the
business needs first.

- **Database** — three Supabase-compatible migrations: foundation (extensions, structural
  enums, interim users, append-only `audit_events`), organisation and locations
  (self-referencing `location_nodes` tree with placement rules, cycle prevention and
  path function), and commodity masters (units, bag types, groups, commodities,
  varieties, grades)
- **Seed** — realistic Rajguru data: 2 facilities, 3 plots, 4 godowns, 2 open yards,
  9 bays, 7 stacks, 3 heaps, 12 commodities, 14 varieties, 13 grades
- **Application** — Next.js 15 App Router, TypeScript strict, Tailwind; server actions
  with Zod validation; `pg` behind a `server-only` data layer
- **Locations UI** — hierarchy tree with paths, create, edit, deactivate, search,
  type-aware forms that only ask for fields the node type actually has
- **Commodities UI** — list with expandable rows for varieties and grades, create, edit,
  deactivate, search
- **Audit** — every mutation writes an audit event inside the same transaction
- **Tooling** — `scripts/db-migrate.sh`, `scripts/db-reset.sh` (refuses non-local
  databases), `scripts/test-db.sh`
- **Tests** — 16 Vitest validation tests, 12 database assertions, 7 Playwright
  end-to-end tests; ESLint and strict TypeScript clean
- **CI** — governance, secret scan, lint/types/unit/build with client-bundle key scan,
  and a database job with a PostgreSQL service running migrations from scratch,
  database tests and Playwright

### Changed

- CI application gates activated now that `package.json` exists
- `next lint` replaced with the ESLint CLI (`next lint` is deprecated in Next 15 and
  prompts interactively, which cannot run in CI)

### Security

- Next.js pinned to 15.5.22, patching CVE-2025-66478
- `postcss` and `sharp` pinned via overrides to clear three high-severity advisories;
  `npm audit --omit=dev` reports 0 vulnerabilities

### Added — 2026-07-29 — Phase 0 governance foundation

- `AGENTS.md` and `CLAUDE.md` agent contracts
- Master blueprint installed as `docs/00-product/MASTER_BLUEPRINT.md`, the product authority
- Product requirements (FR-01..56, NFR-01..15) and scope
- Domain glossary, domain rules (DR-01..54), inventory invariants (INV-01..25),
  workflows (W1..W14), master data catalogue
- Architecture, dependency register and four ADRs
- Data model design and an empty migration register
- Security model, permission / approval / override matrices, threat model
- Test strategy, UAT plan, test register
- Deployment, backup and restore, incident response
- Current state, capability register, MCP register, decision log, phased backlog
- 20 project skills with a sync script
- GitHub issue and PR templates, CI workflow, CodeQL, Dependabot, Gitleaks, Semgrep

**No application code, database schema or tests.** Phase 0 is governance only.
