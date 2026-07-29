---
name: database-migration
description: Procedure for any schema change — writing, testing, applying and registering SQL migrations. Use whenever the database schema changes in any way.
---

# Database Migration

## The rule

> **Every schema change exists as committed SQL. A change applied through an MCP or the
> dashboard but not committed is not done.**

## Procedure

```bash
supabase migration new <short_description>
# write SQL — including RLS policies and a ROLLBACK section
supabase db reset          # verify it builds from scratch
npm run test:db            # constraints, RLS, invariants
supabase db push --project-ref <dev-ref>
```

Then add a row to `docs/03-database/MIGRATION_REGISTER.md` and commit the SQL and the
register entry together.

## Rules

1. **Sequential and immutable.** `NNNN_description.sql`. An applied migration is never
   edited — fix forward.
2. **RLS in the same migration.** A business table must never exist without RLS, even
   briefly.
3. **State reversibility.** Ship a `-- ROLLBACK:` section where reversible. Irreversible
   migrations need explicit approval noted in the register.
4. **Separate schema from data.** Backfills go in their own migration.
5. **No destructive SQL without human review.** `DROP`, `TRUNCATE`, destructive `ALTER`.
6. **Backward compatible where possible** — a migration runs before the application
   deploys, so it must not break the currently running version.

## Never do these

- Add `NOT NULL` to `stock_ledger.lot_id` (INV-04)
- Grant `INSERT`, `UPDATE` or `DELETE` on a stock table to `anon` or `authenticated` (INV-25)
- Remove an immutability guard on `stock_ledger` (INV-02)
- Use `float`, `real` or `double precision` for a quantity (NFR-01)
- Create a table without RLS (NFR-03)

CI checks for these.

## Conventions

`uuid` keys · `numeric(18,3)` quantities · `integer` bag counts · `timestamptz` always ·
`snake_case` · plural tables · indexed foreign keys · `created_at`/`created_by`/
`updated_at`/`updated_by` on every business table.

## Checklist

- [ ] RLS enabled with policies, in this migration
- [ ] Constraints carry the relevant invariants
- [ ] No floating-point quantity columns
- [ ] Foreign keys indexed
- [ ] Rollback section present, or irreversibility approved
- [ ] `supabase db reset` succeeds from scratch
- [ ] Database, RLS and invariant tests pass
- [ ] Registered in the migration register
- [ ] SQL committed
