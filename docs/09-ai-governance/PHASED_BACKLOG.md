# Phased Backlog

Blueprint §32. Each phase delivers vertical slices — never scaffolding.

**Current position: Phase 0 complete. Phase 1 blocked on business approvals** (see
`CURRENT_STATE.md`).

---

## Phase 0 — Governance ✅ Complete

Repository · `AGENTS.md` · `CLAUDE.md` · 20 project skills · CI baseline · documentation
structure · security baseline · current-state file · capability register.

## Phase 1 — Discovery and Domain 🔒 Blocked

**Blocked on management approval of the permission, approval and override matrices.**

- [ ] Approve the permission matrix — roles, scopes, limits *(blocker 1)*
- [ ] Approve the approval matrix; set every threshold *(blocker 2)*
- [ ] Approve the override matrix; confirm authority holders *(blocker 3)*
- [ ] Choose the insurance valuation basis *(blocker 4)*
- [ ] Collect real facility, plot and godown data with dimensions and capacity *(blocker 5)*
- [ ] Collect the commodity, variety, grade and bag-size list *(blocker 6)*
- [ ] Set the net-weight tolerance *(blocker 7)*
- [ ] Decide bag-count versus weight authority *(blocker 8)*
- [ ] Confirm multi-company scope *(blocker 9)*
- [ ] Confirm document retention period *(blocker 10)*
- [ ] Walk the workflows with actual operators and correct them
- [ ] Finalise the data model against approved decisions

Blockers 5 and 6 are **not** blocked by 1–3 and should proceed in parallel.

## Phase 2 — UX Prototype

Login · dashboard · manual weighment · bulk entry grid · inward · provisional stock ·
lot · warehouse map · physical verification · insurance dashboard · approval inbox.

Prototype with realistic agricultural data and validate with real operators on the devices
they use — including phones on the yard.

## Phase 3 — Platform Foundation

Next.js scaffold · Supabase projects (dev, staging, prod) · auth with MFA for privileged
roles · roles, multiple roles, scopes · approval engine · override framework · audit
events · master data management · attachments.

**Gates:** RLS on every table · self-approval blocked at three layers (INV-24) · no
service-role key in the client bundle (INV-25) · override cannot change a quantity (INV-19).

## Phase 4 — Manual Weighment

Individual entry · day-wise and invoice-wise bulk grid · Excel and CSV import ·
validation · duplicate detection · verification · correction before posting · reversal
after posting.

**Gates:** gross, tare, calculated net, printed net and difference all preserved (DR-02) ·
duplicate detection across all nine fields (DR-05) · exact decimal arithmetic (NFR-01).

## Phase 5 — Provisional Stock and Identification

Receipt batches · **inventory segments** · provisional batches · unidentified pools ·
broad location posting · partial identification · partial location refinement ·
reclassification · location refinement · reconciliation.

**Gates:** INV-03, INV-04, INV-05, INV-06, INV-07, INV-08, INV-09, INV-10, INV-12, INV-15,
INV-16. This phase establishes ADR-0002 in code and is where "no false accuracy" becomes
real.

## Phase 6 — Inward, Lot and Ledger

Inward · sources · ownership · lots · **stock posting function** · **stock ledger** ·
balance projections · timeline.

**The highest-risk phase.** Carries INV-01, INV-02, INV-03 and INV-17.
**Concurrency tests are a hard gate** — a check-then-write without a row lock passes every
single-threaded test and fails in production.

## Phase 7 — Transfer and Outward

Internal transfer with all responsible persons · reservations · outward in every mode ·
exceptional outward from provisional stock · reversal.

**Gates:** INV-11, INV-14, INV-18 · outward controls on availability, reservation, block,
pledge and fumigation restriction (DR-25).

## Phase 8 — Quality and Fumigation

Quality templates and inspections · fumigation across all scopes · safety-period
restrictions · chemical inventory and expiry · alerts · fumigation history flowing to lots
on identification (DR-22).

## Phase 9 — Physical Verification

Estimates by every method · confidence levels · discrepancy lifecycle · recount ·
adjustment · lot closure.

**Gates:** INV-13 — an approved approximate verification must leave the ledger
byte-identical · INV-20 — closure with an unexplained balance refused.

## Phase 10 — Insurance

Policy master · location, commodity and ownership coverage · sub-limits · stock valuation ·
coverage ratio · underinsurance analysis · alerts · claims · reports.

**Gates:** INV-21 — read-only grants on stock, verified · INV-22 — advisory labels ·
INV-23 — uncovered stock always visible.

Cannot start before the valuation basis is decided (blocker 4).

## Phase 11 — 2D Layout

Map · occupancy · uncertainty display · fumigation and discrepancy overlays · insurance
overlay · layout editor · versioning.

**Gates:** moving a map object never moves stock (FR-46) · the accessible equivalent view
ships **with** the map, not after it (ADR-0003).

## Phase 12 — Reporting

The 50 reports in blueprint §24 · six dashboards §23 · global search §25 · alerts §26 ·
Excel and PDF export · saved views · scheduled delivery · drill-down to source.

**Gate:** every report reconciles to the ledger. A report that does not reconcile is a
defect, not a rounding difference.

## Phase 13 — Production Hardening

Security review and external penetration test · load testing, especially posting-path lock
contention · backup and **tested restore** · UAT · training · SOPs · **opening stock
migration**.

The opening stock migration is the second-highest-risk activity in the project. Rehearse on
anonymised data, reconcile fully, and get business sign-off on the starting balances.

## Phase 14 — Future

3D layout · OCR of slips · weighbridge integration · AI assistant · WhatsApp · customer
portal · processing module · sensor integration.

None of these may begin before go-live, and weighbridge integration requires separate
written approval (DR-07).

---

## Sequencing rules

1. **No phase starts before its blockers clear.** Building on unapproved matrices means
   rebuilding.
2. **Vertical slices only.** All fourteen elements, or it is not done (`AGENTS.md` §5).
3. **Invariants gate their phase.** A phase carrying an invariant does not complete until
   that invariant has a passing test.
4. **Concurrency tests are not deferrable** for Phases 6 and 7.
5. **`CURRENT_STATE.md` is updated at the end of every task** with actual status.
