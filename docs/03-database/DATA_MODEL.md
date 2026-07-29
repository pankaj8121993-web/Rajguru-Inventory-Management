# Data Model

Target schema. **No tables exist yet** — this is the design the phased migrations will
build. Entity groups follow blueprint §30.

Conventions and the entity catalogue below are binding on every migration.

---

## Conventions

| Concern | Rule |
|---|---|
| Primary keys | `uuid` with `gen_random_uuid()` default |
| Business codes | Separate human-meaningful unique `code` column alongside the UUID |
| Quantities | `numeric(18,3)` — **never** `float`, `real` or `double precision` (NFR-01) |
| Bag counts | `integer` |
| Money | `numeric(18,2)` with an explicit currency column |
| Percentages | `numeric(9,4)` |
| Timestamps | `timestamptz`, always UTC, never `timestamp` |
| Dates | `date` where time genuinely does not apply |
| Naming | `snake_case`, plural table names, singular column names |
| Foreign keys | Named `<referenced_table_singular>_id`, always indexed |
| Audit columns | `created_at`, `created_by`, `updated_at`, `updated_by` on every business table |
| Soft delete | `is_active boolean` on masters. **Business records are never hard-deleted** |
| RLS | Enabled on every business table at creation (NFR-03) |
| Enums | Only for structural values used in invariant logic. Anything the business may extend is a table (see `MASTER_DATA_CATALOGUE.md`) |

---

## Entity groups

### Identity and access
`users` · `profiles` · `roles` · `permissions` · `user_roles` · `role_permissions` ·
`user_scopes` · `approval_rules` · `approval_instances` · `approval_actions`

`user_roles` is many-to-many (blueprint §5.1) and carries the scope. A user may hold the
same role at different scopes, and different roles at the same scope.

### Masters
`companies` · `facilities` · `plots` · `location_nodes` · `commodities` · `varieties` ·
`grades` · `units` · `bag_types` · `parties` · `party_types` · `employees` · `vehicles` ·
`transporters` · `weighbridges` · `chemicals` · `insurance_companies` ·
`insurance_brokers` · `insurance_policy_types`

`location_nodes` is a **self-referencing tree** typed by node type, covering facility, plot,
godown, building, open yard, floor, section, bay, zone, stack, bin, heap, loading point,
gate, weighbridge and restricted area. Location precision is derivable from node type and
depth. A single tree keeps the hierarchy flexible (`docs/01-domain/MASTER_DATA_CATALOGUE.md` §3).

`parties` to `party_types` is many-to-many — a trader may also be a storage customer.

### Weighment
`weighment_batches` · `weighment_slips` · `weighment_attachments` ·
`weighment_allocations` · `corrections` · `duplicate_reviews`

`weighment_slips` stores `gross_weight`, `tare_weight`, `calculated_net_weight`,
`printed_net_weight` and `net_difference` as **five separate persisted columns**. Calculated
net is generated; printed net is as-transcribed; neither ever overwrites the other (DR-02).

`weighment_allocations` is many-to-many between slips and inventory segments — one slip may
split across segments, one segment may draw on several slips (DR-04).

### Stock — the core
`receipt_batches` · `inventory_segments` · `provisional_batches` · `unidentified_pools` ·
`lots` · `lot_sources` · `lot_source_allocations` · `lot_ownership_history` ·
`lot_location_allocations` · `stock_transactions` · `stock_transaction_lines` ·
`stock_ledger` · `stock_balance_projections` · `reservations` · `splits` · `merges` ·
`closures`

**The critical shape (ADR-0002):**

```
stock_ledger
  inventory_segment_id   uuid  NOT NULL  REFERENCES inventory_segments   -- INV-03
  lot_id                 uuid  NULL      REFERENCES lots                 -- INV-04
  location_node_id       uuid  NOT NULL  REFERENCES location_nodes       -- INV-05
  quantity               numeric(18,3) NOT NULL
  ...
```

`lot_id` is nullable **by design and permanently**. Never add `NOT NULL`.

`stock_ledger` is append-only: `UPDATE` and `DELETE` are revoked and blocked by trigger
(INV-02). Corrections are contra entries.

`stock_balance_projections` is a maintained balance per segment, updated inside the posting
transaction under row lock, with a `CHECK (quantity >= 0)` enforcing INV-01.

`reservations` never write to `stock_ledger` — they reduce availability only (INV-18).

### Identification
`identification_events` · `classification_events` · `location_refinement_events` ·
`segment_split_events` · `segment_merge_events` · `pending_identity_tasks` ·
`pending_location_tasks` · `provisional_reconciliations`

`location_refinement_events` exist precisely so that refinement is **not** a transfer
(INV-10). Split and merge events must conserve quantity (INV-15, INV-16).

### Quality and fumigation
`quality_templates` · `quality_parameters` · `quality_inspections` · `quality_results` ·
`fumigation_plans` · `fumigation_events` · `fumigation_lots` · `fumigation_locations` ·
`chemical_inventory` · `chemical_usage` · `safety_restrictions`

`quality_results` rows are immutable; an override writes a new row referencing the original
(DR-29).

### Verification
`verification_sessions` · `verification_teams` · `verification_lines` ·
`physical_estimates` · `discrepancy_cases` · `discrepancy_actions` · `stock_adjustments` ·
`lot_reconciliations`

`physical_estimates` has **no write path to `stock_ledger`** (INV-13). Only an approved
`stock_adjustment` posts to the ledger.

### Insurance
`insurance_policies` · `insurance_policy_locations` · `insurance_policy_commodities` ·
`insurance_policy_owners` · `insurance_policy_perils` · `insurance_policy_exclusions` ·
`insurance_endorsements` · `insurance_declarations` · `insurance_coverage_allocations` ·
`insurance_valuation_snapshots` · `insurance_claims` · `insurance_claim_documents` ·
`insurance_alerts` · `fire_safety_inspections`

The whole group holds **read-only grants** on stock tables (INV-21), enforced by grant, not
convention. `insurance_valuation_snapshots` captures the assumption set with each
calculation so figures remain reproducible and auditable (INV-22).

### Spatial
`layout_versions` · `layout_objects` · `layout_geometry` · `location_dimensions` ·
`map_layers` · `annotations`

Geometry is layout-local coordinates, not PostGIS (ADR-0003). Publishing a layout version
freezes its geometry.

### Governance
`attachments` · `comments` · `notifications` · `override_requests` · `override_actions` ·
`audit_events` · `system_settings` · `feature_flags` · `job_runs` · `report_exports`

`audit_events` is append-only and written **inside the same transaction** as the business
change (NFR-14). `override_requests` retains the original value (INV-19).

---

## Constraints that carry invariants

| Invariant | Database enforcement |
|---|---|
| INV-01 | `CHECK (quantity >= 0)` on `stock_balance_projections`; balance verified under row lock in the posting function |
| INV-02 | `UPDATE`/`DELETE` revoked on `stock_ledger`; trigger raises on attempt |
| INV-03 | `stock_ledger.inventory_segment_id NOT NULL` + FK |
| INV-04 | `stock_ledger.lot_id` nullable — asserted by a test that fails if `NOT NULL` is ever added |
| INV-06, INV-07 | `identification_status`, `identification_confidence`, `location_precision` all `NOT NULL` on `inventory_segments` |
| INV-08, INV-15, INV-16 | Balanced-transaction check inside the posting function; sum of lines nets to zero |
| INV-09 | Available-balance check under `SELECT … FOR UPDATE` |
| INV-24 | `CHECK (approver_id <> maker_id)` on `approval_actions`, plus a service-layer check and an RLS policy |
| INV-25 | Grants only; no client role holds write access to stock tables |

---

## Indexing

Every foreign key is indexed. Beyond that, index for the queries that actually run: ledger
by segment and date; balances by location node and commodity; segments by identification
status and age (the provisional-ageing report); slips by slip number, vehicle and date (the
duplicate check, DR-05); policies by expiry date (the expiry alert).

Add indexes with evidence from a query plan, not by guess, and record them in the migration
register.

---

## Open questions for Phase 1

These are genuinely undecided and must be resolved before the schema is built. They are
tracked in `docs/09-ai-governance/PHASED_BACKLOG.md`.

1. **Valuation basis for insurance** — weighted average cost, FIFO, market rate, or
   declared value? Drives `insurance_valuation_snapshots` and every coverage figure.
2. **Balance projection strategy** — a maintained projection table (chosen above) versus
   computing balances from the ledger on read. The projection is faster and enforces INV-01
   with a `CHECK`, but must be provably consistent with the ledger; a reconciliation job is
   required either way.
3. **Multi-company scope** — is there genuinely more than one legal entity, and does stock
   ever move between them? Affects whether company is a scope dimension or a partition.
4. **Crop year semantics** — a master value, or derived from inward date and commodity?
5. **Bag versus weight authority** — when bag count and weight disagree, which governs?
   Affects reconciliation and gain/loss reasons.
