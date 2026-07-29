# Migration Register

Every schema change must appear here. A migration applied to any database but not committed
as SQL **is not done** (AGENTS.md §4, development prompt §4).

---

## Status

Nine migrations exist, covering master data, weighment, access control and the stock ledger. **No Supabase project is
provisioned**, so "dev" below means the local PostgreSQL 16 instance used during
development, not a hosted environment.

| # | File | Description | Phase | Applied dev | Applied staging | Applied prod | Reversible |
|---|---|---|---|---|---|---|---|
| 0001 | `0001_foundation.sql` | Extensions, structural enums (`location_node_type`, `identification_status`, `identification_confidence`, `location_precision`), interim `users`, append-only `audit_events` with mutation guards, `set_updated_at()` | 3 | Yes | No | No | Yes |
| 0002 | `0002_organisation_and_locations.sql` | `companies`, `location_nodes` self-referencing tree, `location_node_type_rules` placement table, hierarchy validation and cycle-prevention trigger, `location_node_path()`, RLS | 3 | Yes | No | No | Yes |
| 0003 | `0003_commodity_masters.sql` | `units`, `bag_types`, `commodity_groups`, `commodities`, `varieties`, `grades` with cross-commodity variety guard, RLS | 3 | Yes | No | No | Yes |
| 0004 | `0004_parties_and_transport.sql` | `party_types`, `parties` with GSTIN/PAN/IFSC/mobile/pincode format checks and partial unique indexes, `party_party_types` many-to-many with two deferred constraint triggers enforcing "at least one type", `employees`, `vehicles`, `drivers`, `weighbridges`, RLS | 3 | Yes | No | No | Yes |
| 0005 | `0005_reason_codes.sql` | `reason_code_categories`, `reason_codes` with evidence/approval/exception flags, `document_types`, RLS | 3 | Yes | No | No | Yes |
| 0006 | `0006_weighment.sql` | `system_settings` (tolerances as configuration), `weighment_slips` with **generated** calculated-net and net-difference columns, posted-record and maker-checker guards, `duplicate_reviews`, `find_duplicate_weighments()`, RLS | 4 | Yes | No | No | Yes |
| 0008 | `0008_stock_ledger.sql` | `receipt_batches`, `lots`, `inventory_segments`, `stock_transactions`, append-only `stock_ledger`, `stock_balance_projections` with the non-negative CHECK, and `post_stock_transaction()` — the only write path, taking a row lock before any balance check | 5, 6 | Yes | No | No | Yes |
| 0009 | `0009_vehicle_as_free_text.sql` | Folds vehicle and driver into typed columns on the weighment slip and drops both masters; rebuilds duplicate detection against the typed vehicle number. **Not reversible** | 4 | Yes | No | No | **No** |
| 0007 | `0007_roles_and_users.sql` | `roles`, `permissions`, `role_permissions`, scoped `user_roles`, `user_effective_permissions()`, `user_has_permission()` with hierarchy inheritance, RLS | 3 | Yes | No | No | Yes |

`supabase/seed.sql` seeds realistic development data. It is idempotent and is **not**
a migration — it never runs against staging or production.

### Note on the generated net weight

`calculated_net_weight_kg` and `net_difference_kg` are `GENERATED ALWAYS ... STORED`
columns. This makes DR-01 structural rather than a convention: it is impossible to write a
wrong net weight, even from a hand-written query or a future bug in the service layer. A
database test asserts both columns remain generated.

### Note on the party-type rule

The "a party must have at least one type" rule needs **two** deferred constraint triggers:
one on `party_party_types` (catching the removal of the last type) and one on `parties`
(catching a party inserted with no types at all). The second was added after a database
test proved the first alone let a typeless party through.

### Verified

`./scripts/db-migrate.sh` applies all three to an empty database, and
`./scripts/db-reset.sh` rebuilds from scratch. CI runs both on every push, so
"applies from nothing" is continuously proven rather than assumed.

---

## Rules

1. **Committed SQL is the source of truth.** Migrations live in `supabase/migrations/` and
   are applied through the Supabase CLI. A change made through the Supabase MCP or the
   dashboard must be exported to SQL and committed in the same session, or reverted.

2. **Sequential and immutable.** Filenames are `NNNN_short_description.sql` with a
   monotonically increasing number. **An applied migration is never edited.** Fix forward
   with a new migration.

3. **RLS from creation.** A migration that creates a business table must enable RLS and
   define its policies in the same migration. A table must never exist without RLS, even
   briefly (NFR-03).

4. **Reversibility.** Every migration states whether it is reversible and, where it is,
   ships a `-- ROLLBACK:` section. Irreversible migrations — dropping a column, changing a
   type with data loss — require explicit approval noted in this register.

5. **Data migrations are separate.** Schema changes and data backfills go in separate
   migrations, so a schema change can be reviewed independently of a data rewrite.

6. **No destructive SQL without human review.** `DROP`, `TRUNCATE` and destructive `ALTER`
   on any table holding business data require explicit human approval, recorded here.

7. **Never weaken an invariant.** A migration must not add `NOT NULL` to
   `stock_ledger.lot_id` (INV-04), grant write access on stock tables to a client role
   (INV-25), or remove an immutability guard (INV-02). CI checks for these.

8. **Test before registering.** Apply to development, run the invariant and RLS test suites,
   and only then record it here as applied.

---

## Adding a migration

```bash
supabase migration new <short_description>      # create
# write SQL, including RLS policies and a ROLLBACK section
supabase db reset                                # verify from scratch locally
npm run test:db                                  # constraints, RLS, invariants
supabase db push --project-ref <dev-ref>         # apply to development
```

Then add a row above with the file name, description, phase, environments applied, and
reversibility. Commit the SQL and the register entry together.

---

## Planned sequence

Indicative, from `PHASED_BACKLOG.md`. Numbers assigned when written.

| Phase | Migrations expected |
|---|---|
| 3 | Extensions and helpers · identity and access · audit and governance · attachments · masters (organisation, commodity, party, employee, vehicle, operational) · location nodes · approval rules · override framework |
| 4 | Weighment batches, slips, attachments, allocations, corrections, duplicate reviews |
| 5 | Receipt batches · inventory segments · provisional batches · unidentified pools · identification, classification and refinement events · pending tasks · splits and merges |
| 6 | Lots and lot relations · stock transactions and lines · **stock ledger** · balance projections · the posting function |
| 7 | Reservations · transfers · outward |
| 8 | Quality templates, inspections, results · fumigation · chemicals · safety restrictions |
| 9 | Verification sessions and estimates · discrepancies · adjustments · reconciliations · closures |
| 10 | Insurance policies and coverage · valuations · claims · alerts · fire safety |
| 11 | Layout versions, objects, geometry · dimensions · map layers |
| 12 | Report definitions, saved views, export jobs · reporting indexes |
| 13 | Opening stock migration · production indexes and tuning |

The **Phase 6 ledger and posting-function migration is the highest-risk change in the
project.** It carries INV-01, INV-02 and INV-03 and requires concurrency tests before it is
registered as applied.
