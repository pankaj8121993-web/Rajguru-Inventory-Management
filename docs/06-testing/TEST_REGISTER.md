# Test Register

Living record of test suites and their real status. **Update after every task with actual
results, never intended results.**

## Status — 2026-07-29

| Suite | Scope | Tests | Status | Last run |
|---|---|---|---|---|
| `npm run test` (Vitest) | Validation schemas for locations, commodities, grades, parties, vehicles, reason codes | 38 | **Passing** | 2026-07-29 |
| `npm run test:db` | Schema guarantees, constraints, triggers, RLS coverage | 22 assertions | **Passing** | 2026-07-29 |
| `npm run test:e2e` (Playwright) | Master-data workflows through a real browser | 19 | **Passing** | 2026-07-29 |
| `npm run lint` (ESLint) | Code quality | — | **Clean** | 2026-07-29 |
| `npm run typecheck` (tsc) | Type safety, strict mode | — | **Clean** | 2026-07-29 |

Total: **79 automated checks passing.**

## What the database tests prove

- RLS is enabled on every business table (NFR-03)
- No floating-point column exists anywhere in the schema (NFR-01)
- `stock_ledger.lot_id` will be nullable when that table arrives (INV-04, forward guard)
- A facility cannot be placed inside a stack
- Operational capacity cannot exceed approved capacity
- Capacity cannot be negative
- A location code cannot be duplicated within a company
- A location cannot be its own parent
- Moisture above 100% is rejected
- A grade cannot reference a variety of a different commodity
- A party must have at least one type — checked both when a type is removed and when a
  party is created with none
- A malformed GSTIN, PAN or mobile number is rejected
- A duplicate GSTIN is rejected
- A party cannot be its own broker
- An employee cannot report to themselves
- A malformed vehicle registration is rejected
- A negative vehicle capacity is rejected
- A duplicate reason code within a category is rejected
- Audit events cannot be updated or deleted (NFR-14)

## What the end-to-end tests prove

Creating a godown, a commodity, a farmer, a vehicle and a reason code through the browser,
each persisting across a reload; adding a variety to an existing commodity; filtering
parties by type; normalising a mobile number written as `+91 98220 55001` and a
registration written as `mh 24 xy 7788`; and six rejections surfacing a clear message to
the user while writing **no** row to the database.

It also confirms that a vehicle with an expired document is **warned about and still
listed** — an expiry must never hide a vehicle that is physically at the gate.

## Invariant coverage

**0 of 25 invariants have a direct test**, because no invariant's feature exists yet — all
25 concern the stock ledger, which arrives in Phases 5 and 6. Two forward guards are in
place already (`stock_ledger.lot_id` nullability for INV-04, and the no-floating-point
schema check for NFR-01), so the schema cannot drift before the features land.

| Invariant | Test | Status |
|---|---|---|
| INV-01 … INV-25 | see `TEST_STRATEGY.md` | Not implemented — features not built |

## Commands

```
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest unit tests
npm run test:db     # database, constraints, RLS
npm run test:e2e    # Playwright, resets the database first
```

`test:e2e` resets the development database through `scripts/db-reset.sh` before running,
so results are deterministic. That script refuses to run against a non-local database.

## Recording rule

Record the command and its exact output. "Tests pass" is not a result.
