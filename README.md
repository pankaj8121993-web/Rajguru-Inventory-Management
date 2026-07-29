# Rajguru Foods — Inventory, Warehouse, Insurance and Spatial Stock Management Platform

Internal platform for complete stock, warehouse and inventory control at Rajguru Foods.

The platform is the single operational source of truth for manual weighment-slip inward
and outward, final lots, provisional stock, unidentified and mixed stock, multi-level
storage locations, internal transfers, quality, fumigation, physical verification, gain and
loss, insurance coverage and interactive 2D warehouse layout.

> **Status: Phase 3, partial — master data for locations and commodities is working.**
> There is no authentication, no weighment entry and no stock ledger yet.
> **Run locally only.** See
> [`docs/09-ai-governance/CURRENT_STATE.md`](docs/09-ai-governance/CURRENT_STATE.md)
> for the authoritative, honest status of every module.

---

## Core principle

> Record what is known, clearly identify what is not known, preserve every original
> record, progressively improve stock identity and location, protect the stock ledger,
> expose operational and insurance risk, and never create false certainty.

The platform must reflect real agricultural warehouse operations. It must never force
artificial precision where the lot, grade or exact storage location is genuinely unknown
at the time of inward.

---

## Running it locally

Requires Node 20+ and PostgreSQL 16 reachable on `127.0.0.1:54322`
(adjust `DATABASE_URL` if yours differs).

```bash
cp .env.example .env.local
npm install
./scripts/db-reset.sh      # apply migrations, then seed realistic test data
npm run dev                # http://localhost:3000
```

You can then create your own facilities, plots, godowns, bays, stacks, commodities,
varieties and grades directly in the app — nothing is hard-coded.

### Checks

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript, strict
npm run test          # Vitest — validation unit tests
npm run test:db       # constraints, triggers, RLS coverage
npm run test:e2e      # Playwright — resets the database first
./scripts/check-structure.sh
```

All of the above currently pass: 16 unit, 12 database assertions, 7 end-to-end.

> **The app has no authentication.** `DEV_ACTOR_CODE` in `.env.local` only names the user
> recorded against each audit event. Do not expose this to a network until the identity
> and access slice lands.

---

## Intended stack

| Layer | Choice |
|---|---|
| Front end | Next.js, React, TypeScript, PWA |
| Styling | Tailwind CSS, shadcn/ui |
| Data / forms | TanStack Query, TanStack Table, React Hook Form, Zod |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth / storage | Supabase Auth, Supabase Storage |
| 2D spatial | Konva / React Konva |
| 3D spatial | Three.js / React Three Fiber — later phase |
| Testing | Vitest, React Testing Library, Playwright, axe-core |
| Architecture | Secure modular monolith |

The database is currently plain PostgreSQL 16 accessed through `pg`, because no Supabase
project is provisioned yet (decision 10 in the decision log). Migrations are written
Supabase-compatible and will apply unchanged. The stack is recorded in
[`docs/02-architecture/ARCHITECTURE.md`](docs/02-architecture/ARCHITECTURE.md) and
[ADR-0001](docs/02-architecture/adr/ADR-0001-modular-monolith-supabase.md).

---

## Documentation map

| Area | Location |
|---|---|
| Master blueprint (product authority) | [`docs/00-product/MASTER_BLUEPRINT.md`](docs/00-product/MASTER_BLUEPRINT.md) |
| Product requirements, scope | `docs/00-product/` |
| Domain rules, glossary, invariants, workflows, master-data catalogue | `docs/01-domain/` |
| Architecture, dependency register, ADRs | `docs/02-architecture/` |
| Data model, migration register | `docs/03-database/` |
| Security model, permission / approval / override matrices, threat model | `docs/04-security/` |
| Design system, screen register | `docs/05-design/` |
| Test strategy, UAT plan | `docs/06-testing/` |
| Deployment, backup and restore, incident response | `docs/07-operations/` |
| Changelog, bugs, known issues | `docs/08-releases/` |
| Current state, capability register, decision log, MCP register, backlog | `docs/09-ai-governance/` |

---

## Working in this repository

Agents must read [`AGENTS.md`](AGENTS.md) first, then run the `project-startup-audit`
skill before making any change. Claude Code users should also read [`CLAUDE.md`](CLAUDE.md).

Project skills are canonical in `agent-skills/` and mirrored to `.agents/skills/` and
`.claude/skills/`:

```bash
./scripts/sync-skills.sh          # mirror canonical skills
./scripts/check-structure.sh      # verify required docs and skills exist
```

---

## Development phases

Phase 0 governance → 1 discovery → 2 UX prototype → 3 platform foundation →
4 manual weighment → 5 provisional stock → 6 inward, lot and ledger → 7 transfer and
outward → 8 quality and fumigation → 9 physical verification → 10 insurance →
11 2D layout → 12 reporting → 13 production hardening → 14 future (3D, OCR, weighbridge).

Full backlog: [`docs/09-ai-governance/PHASED_BACKLOG.md`](docs/09-ai-governance/PHASED_BACKLOG.md).

---

Internal and proprietary to Rajguru Foods. Not for public distribution.
