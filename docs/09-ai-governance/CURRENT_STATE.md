# Current State

**The honest status of this project.** Read this first, before any other document and
before any code.

Rule: **document actual status, never intended status.** If something is scaffolded but not
working, it is Not started. If a test is written but failing, it is failing.

- **Last updated:** 2026-07-29
- **Current phase:** Phase 0 — Governance foundation
- **Application code:** None
- **Database:** None
- **Tests:** None
- **Deployed:** Nowhere

---

## What exists

Documentation and agent governance only. No `package.json`, no `supabase/` directory, no
application source, no schema, no test suite, no CI run yet against real code.

| Area | Status |
|---|---|
| Agent contracts — `AGENTS.md`, `CLAUDE.md` | Complete |
| Master blueprint installed as product authority | Complete |
| Product requirements (FR-01..56, NFR-01..15), scope | Complete — draft for business review |
| Glossary | Complete |
| Domain rules (DR-01..54) | Complete — draft for business review |
| Inventory invariants (INV-01..25) | Complete |
| Workflows (W1..W14) | Complete — draft for business review |
| Master data catalogue | Complete |
| Architecture + 4 ADRs | Complete |
| Dependency register | Candidate list only — nothing installed |
| Data model | Designed, **not built** |
| Migration register | Empty — no migrations exist |
| Security model, threat model | Complete |
| Permission / approval / override matrices | **Draft — require business approval** |
| Test strategy, UAT plan, test register | Strategy complete; **zero tests written** |
| Deployment, backup/restore, incident response | Planned; nothing deployed or tested |
| Project skills | 20 authored |
| GitHub templates, CI, security tooling config | Configured; **not yet exercised against code** |

---

## What does not exist

Everything operational. Specifically, and without exception:

- No authentication, users, roles, permissions or scopes
- No master data management
- No weighment entry of any kind
- No inward, no receipt batches, no inventory segments
- No lots, no stock transactions, **no stock ledger**
- No identification, classification or location refinement
- No transfers, reservations or outward
- No quality or fumigation
- No physical verification, discrepancies or adjustments
- No insurance module
- No 2D layout
- No dashboards, reports, search or alerts

---

## Module status

Legend: **Not started** · **In progress** · **Built, untested** · **Tested** · **Verified running**

| Module | Phase | Status |
|---|---|---|
| Identity and access | 3 | Not started |
| Masters | 3 | Not started |
| Locations | 3 | Not started |
| Governance — audit, override, attachments | 3 | Not started |
| Weighment | 4 | Not started |
| Provisional stock and identification | 5 | Not started |
| Inward, lot and ledger | 6 | Not started |
| Transfer and outward | 7 | Not started |
| Quality and fumigation | 8 | Not started |
| Physical verification | 9 | Not started |
| Insurance | 10 | Not started |
| 2D layout | 11 | Not started |
| Reporting and dashboards | 12 | Not started |
| Production hardening | 13 | Not started |

---

## Invariant coverage

**0 of 25 invariants have a test.** No invariant can be tested before the feature carrying
it exists. Tracked in `docs/06-testing/TEST_REGISTER.md`.

---

## Blockers and decisions needed

These block Phase 1 and Phase 3. They are business decisions, not technical ones.

| # | Decision needed | Blocks | Owner |
|---|---|---|---|
| 1 | Approve the permission matrix — roles, scopes, limits | Phase 3 | Rajguru Foods management |
| 2 | Approve the approval matrix and set every `TBD` threshold | Phase 3 | Rajguru Foods management |
| 3 | Approve the override matrix and confirm who holds override authority | Phase 3 | Rajguru Foods management |
| 4 | Choose the valuation basis for insurance — weighted average, FIFO, market or declared | Phase 10, and the data model | Rajguru Foods management |
| 5 | Confirm the facility, plot and godown list, with real dimensions and capacities | Phase 3 | Warehouse operations |
| 6 | Confirm the commodity list, varieties, grades and standard bag sizes | Phase 3 | Operations and trading |
| 7 | Set the net-weight difference tolerance | Phase 4 | Operations |
| 8 | Decide bag-count versus weight authority when they disagree | Phase 5 | Operations |
| 9 | Confirm multi-company scope — one legal entity or several | Data model | Management |
| 10 | Confirm document retention period for statutory compliance | Phase 13 | Management and auditor |
| 11 | Provision Supabase projects — development, staging, production | Phase 3 | Technical |

Items 1–3 are the largest. **The role, approval and override matrices are drafted from the
blueprint, but they describe how the business should work and only the business can approve
them.**

---

## Known risks

| Risk | Impact | Mitigation |
|---|---|---|
| Matrices unapproved | Phase 3 cannot start | Escalated above; drafts ready for review |
| Shared warehouse logins | Destroys attribution and maker-checker | Individual accounts from day one; see threat model |
| Concurrency defects on the posting path | Negative or double-counted stock | Mandatory concurrency tests as CI gates |
| Opening stock migration accuracy | Wrong starting balances undermine everything | Phase 13 with reconciliation and rehearsal on anonymised data |
| Scope growth into SaaS features | Dilutes the product | Scope document; prohibited list in the dependency register |

---

## Next task

**Phase 1 — Discovery and Domain.** Specifically: take the permission, approval and override
matrices to Rajguru Foods management for review and approval, and resolve blockers 1–3.
Everything in Phase 3 depends on them.

In parallel, and not blocked: collect the real facility, plot, godown, commodity and party
lists (blockers 5 and 6) so master data is ready when Phase 3 begins.
