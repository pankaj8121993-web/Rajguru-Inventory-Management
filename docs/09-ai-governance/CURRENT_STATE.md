# Current State

**The honest status of this project.** Read this first, before any other document and
before any code.

Rule: **document actual status, never intended status.** If something is scaffolded but not
working, it is Not started. If a test is written but failing, it is failing.

- **Last updated:** 2026-07-29
- **Current phase:** Phase 3 — Platform Foundation, partially delivered
- **Application code:** Next.js 15 app, running and verified locally
- **Database:** PostgreSQL 16, 5 migrations, seeded — **local only, no Supabase project**
- **Tests:** 79 automated checks, all passing
- **Deployed:** Nowhere

---

## What works, verified by running it

The **master-data slices for locations, commodities, parties, vehicles and reason codes**
are complete and exercised end to end through a real browser against a real database.

| Capability | Evidence |
|---|---|
| Location hierarchy — facility, plot, godown, yard, bay, zone, stack, bin, heap, gate, weighbridge | 34 seeded nodes render as an indented tree with full paths |
| Create, edit and deactivate a location through the UI | Playwright creates a godown; it survives a reload |
| Placement rules enforced | A facility cannot be created inside a stack — rejected by trigger |
| Capacity rules enforced | Operational above approved is rejected; negative capacity is rejected |
| Duplicate codes rejected per company | Verified in the UI with a clear message |
| Commodities with groups, units, bag types, moisture, fumigation interval | 12 seeded commodities |
| Varieties and grades per commodity | 14 varieties, 13 grades; expandable rows; add through the UI |
| Cross-commodity variety guard | A Chana grade cannot use a Tur variety — rejected by trigger |
| Audit trail | Every create writes an audit event **in the same transaction**; verified in the database |
| Append-only audit | `UPDATE` and `DELETE` on `audit_events` are blocked by trigger |
| Deactivate, never delete | No delete path exists for any master (DR-54) |
| Parties with many-to-many types | 15 seeded parties; 6 hold more than one type (a trader who also stores stock is one record) |
| GSTIN, PAN, IFSC, mobile, pincode validation | Format-checked when supplied, optional throughout — a farmer with neither is a valid record |
| Mobile and registration normalisation | `+91 98220 55001` → `9822055001`; `mh 24 xy 7788` → `MH24XY7788` |
| Party type filter | Filters the list server-side |
| Vehicles with transporter link | Only parties holding the Transporter type appear in the picker |
| Document expiry warning | Expired insurance, pollution or fitness is flagged — never blocked or hidden |
| Employees with reporting lines | 7 seeded, self-reporting rejected |
| Reason codes by category | 53 codes across 9 categories, with evidence, approval and exception flags |
| Mobile layout | Verified at 390px |

## What exists but is not yet real

| Item | Status |
|---|---|
| Authentication | **None.** `DEV_ACTOR_CODE` names the acting user for audit attribution. This is not authentication and the app must not be exposed to a network |
| Roles, permissions, scopes | Not built. RLS is *enabled* on every table but carries no scope policies yet |
| Supabase | Not provisioned. The app runs on plain PostgreSQL through `pg`. Migrations are Supabase-compatible and will apply unchanged |

---

## What does not exist

- No weighment entry of any kind
- No inward, no receipt batches, no inventory segments
- No lots, no stock transactions, **no stock ledger**
- No provisional stock, identification or location refinement
- No transfers, reservations or outward
- No quality or fumigation
- No physical verification, discrepancies or adjustments
- No insurance module
- No 2D layout
- No reports, dashboards beyond master-data counts, search or alerts

---

## Module status

Legend: **Not started** · **In progress** · **Built, untested** · **Tested** · **Verified running**

| Module | Phase | Status |
|---|---|---|
| Locations | 3 | **Verified running** |
| Commodity masters | 3 | **Verified running** |
| Party, employee and transport masters | 3 | **Verified running** |
| Reason codes and document types | 3 | **Verified running** |
| Audit (governance) | 3 | **Verified running** — master data only |
| Identity and access | 3 | Not started |
| Weighbridge and driver masters | 3 | Schema and seed only — no UI yet |
| Approvals and override framework | 3 | Not started |
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

## Test status

| Suite | Result |
|---|---|
| ESLint | Clean |
| TypeScript strict | Clean |
| Vitest — validation | 38 passing |
| Database, constraints, RLS | 22 assertions passing |
| Playwright end-to-end | 19 passing |

**0 of 25 invariants have a direct test.** All 25 concern the stock ledger, which does not
exist yet. Two forward guards are already enforced in CI: `stock_ledger.lot_id` must be
nullable if that table ever appears (INV-04), and no floating-point column may exist
anywhere in the schema (NFR-01).

---

## Blockers and decisions needed

| # | Decision needed | Blocks | Owner |
|---|---|---|---|
| 1 | Approve the permission matrix — roles, scopes, limits | Auth and the rest of Phase 3 | Rajguru Foods management |
| 2 | Approve the approval matrix and set every `TBD` threshold | Phase 3 | Rajguru Foods management |
| 3 | Approve the override matrix and confirm who holds override authority | Phase 3 | Rajguru Foods management |
| 4 | Choose the valuation basis for insurance | Phase 10, and the data model | Rajguru Foods management |
| 5 | Confirm the real facility, plot and godown list with dimensions and capacities | Go-live data | Warehouse operations |
| 6 | Confirm the real commodity, variety and grade list | Go-live data | Operations and trading |
| 7 | Set the net-weight difference tolerance | Phase 4 | Operations |
| 8 | Decide bag-count versus weight authority when they disagree | Phase 5 | Operations |
| 9 | Confirm multi-company scope — one legal entity or several | Data model | Management |
| 10 | Confirm document retention period | Phase 13 | Management and auditor |
| 11 | **Provision Supabase projects — development, staging, production** | Auth, deployment, anything beyond local | Technical |

Blockers 5 and 6 are now **less urgent than they were**: the seed data is realistic enough
to build against, and you can enter your own godowns, commodities, parties, vehicles and
reason codes through the UI. They are still needed before go-live.

Blocker 11 is now the practical bottleneck. Nothing can be deployed or authenticated
without it.

---

## Known risks

| Risk | Impact | Mitigation |
|---|---|---|
| **No authentication** | Anyone reaching the app can change master data | Run locally only. Do not expose. Auth is the next slice |
| Matrices unapproved | Auth cannot be built correctly | Escalated; drafts ready for review |
| Shared warehouse logins | Would destroy attribution and maker-checker | Individual accounts from day one when auth arrives |
| Concurrency defects on the posting path | Negative or double-counted stock | Mandatory concurrency tests as CI gates from Phase 6 |
| Opening stock migration accuracy | Wrong starting balances undermine everything | Phase 13, with reconciliation and rehearsal |

---

## Running it locally

```bash
# PostgreSQL 16 must be running and reachable at the DATABASE_URL below
cp .env.example .env.local
npm install
./scripts/db-reset.sh     # migrate + seed
npm run dev               # http://localhost:3000
```

---

## Next task

Two candidates, depending on which blockers clear first.

**If the matrices and Supabase are settled → identity and access (Phase 3).** Users, roles,
permissions and scopes, with RLS policies that actually enforce scope, and maker-checker
groundwork. Every subsequent module depends on knowing who is acting. Needs blockers 1–3
and 11.

**If they are not → manual weighment entry (Phase 4).** All its master-data prerequisites
now exist: parties, vehicles, drivers, weighbridges, commodities and reason codes. It can
be built and demonstrated without authentication, then have access control applied when
the identity slice lands. Needs blocker 7 (net-weight tolerance) but a sensible default
can be configured and changed later.
