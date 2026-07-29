# Rajguru Foods — Inventory, Warehouse, Insurance and Spatial Stock Management Platform

Internal platform for complete stock, warehouse and inventory control at Rajguru Foods.

The platform is the single operational source of truth for manual weighment-slip inward
and outward, final lots, provisional stock, unidentified and mixed stock, multi-level
storage locations, internal transfers, quality, fumigation, physical verification, gain and
loss, insurance coverage and interactive 2D warehouse layout.

> **Status: Phase 0 — Governance foundation.**
> No operational features are implemented yet. See
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

No application code exists yet. The stack is recorded in
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
