# Test Strategy

Development prompt §19. **No test suite exists yet** — Phase 0 has no application code.
This is the strategy every subsequent phase must follow.

---

## The governing rule

> **Do not claim completion because code compiles. Verify the actual running workflow.**

A vertical slice is not done until someone — or something — has exercised it end to end
against a real database and observed the correct result. Compilation, type-checking and
passing unit tests are necessary and insufficient.

---

## Layers

| Layer | Tool | Covers |
|---|---|---|
| Unit | Vitest | Pure logic: net weight, tolerance, coverage ratio, decimal arithmetic, state transitions |
| Database | SQL tests via Supabase CLI | Constraints, triggers, immutability guards, posting functions |
| RLS | SQL tests as different roles | Every policy on every table, positive and negative |
| Permission | Vitest, integration | Role and scope enforcement in the service layer |
| Integration | Vitest against a real test database | Whole workflows through the service layer |
| Component | React Testing Library | Rendering, validation, all UI states |
| End-to-end | Playwright | Complete user journeys through the browser |
| Accessibility | axe-core with Playwright | WCAG 2.1 AA on primary workflows |
| Concurrency | Vitest with parallel transactions | Race conditions on the posting path |
| Volume | Playwright and scripted load | Bulk entry and large imports |

---

## Mandatory invariant tests

These are **CI gates**. A failure blocks merge. Identifiers match
`docs/01-domain/INVENTORY_INVARIANTS.md`.

| Test | Invariant | Must prove |
|---|---|---|
| `inv01_negative_stock` | INV-01 | Stock cannot go negative — including under concurrent dispatch |
| `inv02_ledger_immutable` | INV-02 | `UPDATE` and `DELETE` on `stock_ledger` fail for every role |
| `inv03_segment_required` | INV-03 | A ledger row without a segment cannot be written |
| `inv04_lot_optional` | INV-04 | Inward posts successfully with `lot_id` null; **and** the column is still nullable |
| `inv05_broad_location_valid` | INV-05 | Stock posts at plot level with no leaf location |
| `inv06_identification_recorded` | INV-06 | A segment without identification status cannot be created |
| `inv07_location_precision_recorded` | INV-07 | A segment without location precision cannot be created |
| `inv08_provisional_conserved` | INV-08 | Allocation outputs sum exactly to the input |
| `inv09_allocation_within_available` | INV-09 | Over-allocation fails — including under concurrency |
| `inv10_refinement_not_transfer` | INV-10 | Refinement writes a refinement event and no transfer |
| `inv11_movement_requires_transfer` | INV-11 | A "yes, it moved" answer routes to the transfer workflow |
| `inv12_correction_vs_reclass` | INV-12 | The two produce different records and appear in different reports |
| `inv13_verification_no_ledger` | INV-13 | An approved approximate verification leaves the ledger byte-identical |
| `inv14_transfer_preserves_total` | INV-14 | Total is unchanged — including under concurrency |
| `inv15_split_preserves_total` | INV-15 | Children sum to the parent |
| `inv16_merge_preserves_total` | INV-16 | Merged equals the sum of sources |
| `inv17_ownership_preserves_qty` | INV-17 | Ownership change moves no quantity |
| `inv18_reservation_not_physical` | INV-18 | Reservation reduces available, not physical |
| `inv19_override_no_silent_qty` | INV-19 | No override path alters a quantity |
| `inv20_closure_no_unexplained` | INV-20 | Closure with an unexplained balance is refused |
| `inv21_insurance_no_stock_write` | INV-21 | The insurance role holds no write grant on any stock table |
| `inv22_coverage_advisory_label` | INV-22 | Every coverage figure carries its advisory label and assumptions |
| `inv23_uncovered_stock_visible` | INV-23 | Stock at an unendorsed location appears in coverage output |
| `inv24_no_self_approval` | INV-24 | Self-approval fails at all three layers — service, constraint, RLS |
| `inv25_no_service_key_client` | INV-25 | The service-role key appears nowhere in the client bundle |

## Other mandatory tests

Reversal behaviour · partial location refinement · exceptional outward · expired override ·
location scope enforcement · insurance coverage calculation · excluded commodity warning ·
unendorsed location warning · policy expiry alert · underinsurance calculation ·
duplicate-action idempotency · failure paths · large-data behaviour.

---

## Concurrency testing — not optional

**A check-then-write without a row lock passes every single-threaded test and fails in
production.** It is the most likely serious defect in this system, and only a concurrent
test will find it.

Required concurrency tests:

- Two simultaneous dispatches against the same balance → exactly one succeeds (INV-01)
- Two simultaneous allocations from one provisional segment → total never exceeds available (INV-09)
- Simultaneous transfer and dispatch of the same stock → total preserved (INV-14)
- Simultaneous reservation and dispatch → no over-commitment (INV-18)

These run against a real PostgreSQL instance with genuine parallel transactions. Mocks
cannot test locking.

---

## Per-feature requirements

Every feature adds: unit tests · database tests · RLS tests · permission tests ·
integration tests · Playwright tests where user-facing · **a regression test for every
bug fixed** · failure-path tests · duplicate-action tests · concurrency tests where state
is shared · large-data tests where volume is realistic.

---

## Test data

Realistic agricultural data throughout — Tur, Lemon Tur, Chana, Maize, Urad, Moong, Wheat,
Paddy; real vehicle-number formats; plausible weights, bag counts and moisture readings;
genuine location hierarchies.

Never `foo`, `test123` or `Lorem ipsum`. Unrealistic test data hides real bugs: a 1 kg bag
or a 5-character party name will not surface the layout, rounding and validation problems
that a 50 kg bag and a real trade name will.

**No production data in any test environment.** Migration rehearsals use anonymised extracts.

---

## Coverage

Coverage percentage is a diagnostic, not a target. What matters:

- **100% of invariants** have a passing test — non-negotiable
- **100% of RLS policies** tested positive and negative
- **100% of approval and override paths** tested
- Every posting path tested for success, failure and rollback
- Every screen tested in all its states: loading, empty, error, validation, success,
  permission-denied and mobile

A slice with high line coverage and no invariant test is not tested.

---

## CI gates

| Gate | Blocks merge |
|---|---|
| Lint and type-check | Yes |
| Unit tests | Yes |
| Database and RLS tests | Yes |
| **Invariant tests** | Yes |
| Integration tests | Yes |
| Playwright E2E | Yes |
| Accessibility (axe) | Yes |
| Secret scan (Gitleaks) | Yes |
| Static analysis (Semgrep, CodeQL) | Yes on high severity |
| Client bundle key scan | Yes |
| Migration applies cleanly from scratch | Yes |

**Never disable a security control or weaken an invariant to make a test pass.** If a
control blocks a test, the test or the design is wrong.

---

## Verification evidence

A completion report states the exact commands run and their exact results. Not "tests pass"
— the command and its output. For UI work, the screens and workflows actually exercised.
For insurance work, the policies and calculations actually verified.
