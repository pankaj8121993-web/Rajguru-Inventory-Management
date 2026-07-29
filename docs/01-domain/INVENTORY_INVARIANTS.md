# Inventory Invariants

**Status:** Authoritative. Derived from `docs/00-product/MASTER_BLUEPRINT.md` §31.

These are the rules the platform may never break. Each one is numbered permanently — the
number is a stable identifier used in code comments, constraint names and test names. Do
not renumber. Add new invariants at the end.

Every invariant below must eventually have at least one automated test. The **Test** column
records the intended test identifier; `— (Phase N)` means the test does not exist yet
because the feature does not exist yet.

---

## A. Ledger integrity

| # | Invariant | Enforcement | Test |
|---|---|---|---|
| INV-01 | Stock can never become negative. | `CHECK` constraint on balance projections plus a balance check inside the posting function, under row lock. | `inv01_negative_stock` — (Phase 6) |
| INV-02 | Posted ledger entries are immutable. No update, no delete. | Revoke `UPDATE`/`DELETE` on `stock_ledger`; trigger raising an exception; corrections happen by contra entry. | `inv02_ledger_immutable` — (Phase 6) |
| INV-03 | Every posted quantity has an inventory segment. | `stock_ledger.inventory_segment_id NOT NULL` with foreign key. | `inv03_segment_required` — (Phase 5) |
| INV-25 | Service-role access remains server-side only. | Key held in server environment only; CI secret scan; no service key in any client bundle. | `inv25_no_service_key_client` — (Phase 3) |

## B. Identity and precision

| # | Invariant | Enforcement | Test |
|---|---|---|---|
| INV-04 | A final lot is **not** mandatory at inward. | `stock_ledger.lot_id` is nullable. No `NOT NULL`, no default lot, no placeholder lot. | `inv04_lot_optional` — (Phase 5) |
| INV-05 | A broad location is valid where the exact location is unknown. | Location may reference any node in the hierarchy; no constraint forcing a leaf node. | `inv05_broad_location_valid` — (Phase 5) |
| INV-06 | Identification precision is always recorded. | `identification_status` and `identification_confidence` are `NOT NULL` on every segment. | `inv06_identification_recorded` — (Phase 5) |
| INV-07 | Location precision is always recorded. | `location_precision` is `NOT NULL` on every segment. | `inv07_location_precision_recorded` — (Phase 5) |

## C. Quantity conservation

| # | Invariant | Enforcement | Test |
|---|---|---|---|
| INV-08 | Provisional stock cannot disappear during allocation. | Allocation is a balanced transaction: sum of outputs equals input. Checked in the posting function. | `inv08_provisional_conserved` — (Phase 5) |
| INV-09 | Final lot allocations cannot exceed available provisional quantity. | Balance check under row lock before allocation posts. | `inv09_allocation_within_available` — (Phase 5) |
| INV-14 | Transfer preserves total stock. | Issue and receipt lines net to zero across the transaction. | `inv14_transfer_preserves_total` — (Phase 7) |
| INV-15 | Split preserves total quantity. | Sum of child segments equals parent segment. | `inv15_split_preserves_total` — (Phase 5) |
| INV-16 | Merge preserves total quantity. | Sum of source segments equals merged segment. | `inv16_merge_preserves_total` — (Phase 5) |
| INV-17 | Ownership transfer preserves physical quantity. | Ownership change writes no net quantity movement. | `inv17_ownership_preserves_qty` — (Phase 6) |
| INV-18 | Reservation reduces availability but never physical quantity. | Reservations are a separate column and a separate table; they never write to `stock_ledger`. | `inv18_reservation_not_physical` — (Phase 7) |

## D. Movement versus metadata

| # | Invariant | Enforcement | Test |
|---|---|---|---|
| INV-10 | Location refinement without physical movement does not create a transfer. | Refinement writes a `location_refinement_event`, never a transfer transaction. | `inv10_refinement_not_transfer` — (Phase 5) |
| INV-11 | Actual physical movement requires a transfer transaction. | UI forces the explicit question "Did the stock physically move?"; a `yes` answer routes to the transfer workflow. | `inv11_movement_requires_transfer` — (Phase 7) |
| INV-12 | Correction and reclassification are different. | Separate transaction types, separate reason-code sets, separate reports. | `inv12_correction_vs_reclass` — (Phase 5) |

## E. Verification and adjustment

| # | Invariant | Enforcement | Test |
|---|---|---|---|
| INV-13 | Physical verification does not automatically change the ledger. | Verification writes only to `physical_estimates`. Any ledger effect requires a separate, approved `stock_adjustment`. | `inv13_verification_no_ledger` — (Phase 9) |
| INV-20 | Lot closure cannot leave an unexplained balance. | Closure precondition: book balance is zero or fully explained by approved adjustments and reconciliations. | `inv20_closure_no_unexplained` — (Phase 9) |

## F. Authority and control

| # | Invariant | Enforcement | Test |
|---|---|---|---|
| INV-19 | An override can never silently change a quantity. | Override records the original value, a mandatory reason and an approver. Quantity changes still require a normal adjustment transaction. | `inv19_override_no_silent_qty` — (Phase 3) |
| INV-24 | A maker cannot approve their own controlled transaction. | Approval service rejects `approver_id = maker_id`; database `CHECK`; RLS policy. | `inv24_no_self_approval` — (Phase 3) |

## G. Insurance

| # | Invariant | Enforcement | Test |
|---|---|---|---|
| INV-21 | Insurance calculations never alter stock. | The insurance module has no write path to any stock table. Enforced by grants and reviewed in `rls-security-review`. | `inv21_insurance_no_stock_write` — (Phase 10) |
| INV-22 | Insurance coverage is advisory unless confirmed by policy interpretation. | Every coverage figure is rendered with an advisory label and carries its assumption set. | `inv22_coverage_advisory_label` — (Phase 10) |
| INV-23 | Stock at uncovered locations must be visible. | Coverage queries use an outer join from stock to policy so uncovered stock can never be filtered out silently. | `inv23_uncovered_stock_visible` — (Phase 10) |

---

## Cross-cutting technical rules

These are not numbered invariants but are equally binding.

- **No floating point for quantities.** Postgres `numeric(18,3)` for weights,
  `integer` for bag counts. In TypeScript use a decimal library — never JavaScript
  `number` arithmetic on a quantity.
- **Posting is atomic.** The full sequence (authenticate, authorise, validate, lock,
  write transaction, write ledger, write audit, commit) succeeds completely or rolls back
  completely.
- **Locking before balance checks.** Any check-then-write on a balance must hold a row
  lock, or the check is meaningless under concurrency. Concurrency tests are mandatory
  for INV-01, INV-09 and INV-14.
- **Audit in the same transaction.** If the audit event fails to write, the business
  transaction fails too.

---

## How to change this file

An invariant may only be added, never quietly weakened or removed. Weakening one requires
an accepted ADR in `docs/02-architecture/adr/` recording who approved the change and why,
and a corresponding entry in `docs/09-ai-governance/DECISION_LOG.md`.
