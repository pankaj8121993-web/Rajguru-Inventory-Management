---
name: domain-stock-ledger
description: Rules and review procedure for any change touching stock quantity, stock posting, the ledger, balances, reservations, splits, merges or transfers. Use before writing or modifying any code that could affect a stock quantity.
---

# Stock Ledger Domain

**Invoke this before changing any stock-related code, and run the invariant tests
afterwards.** This is the most correctness-critical area of the platform.

## Non-negotiable

| Rule | Invariant |
|---|---|
| Stock can never go negative | INV-01 |
| Posted ledger entries are immutable — no `UPDATE`, no `DELETE` | INV-02 |
| Every posted quantity has an `inventory_segment_id` | INV-03 |
| `lot_id` is nullable and stays that way | INV-04 |
| Transfer, split and merge preserve total quantity | INV-14, INV-15, INV-16 |
| Ownership transfer moves no physical quantity | INV-17 |
| Reservation reduces availability, not physical stock | INV-18 |
| Approximate verification never alters the ledger | INV-13 |
| Override never silently changes a quantity | INV-19 |
| A maker never approves their own transaction | INV-24 |

## The posting sequence

Authenticate → verify permission → verify location scope → verify status → validate
quantity → validate segment → validate lot where applicable → validate ownership →
validate location → check available balance → check reservation → check block → check
fumigation restriction → check insurance warning → check maker-checker → **lock rows** →
write transaction → write ledger → write audit → commit atomically → roll back fully on
any failure.

## The two mistakes that matter most

**1. Check-then-write without a lock.** Reading a balance, deciding it is sufficient, then
writing — without holding a row lock — passes every single-threaded test and produces
negative or double-counted stock in production. Always `SELECT … FOR UPDATE` before the
balance check, and always write a concurrency test.

**2. Floating-point arithmetic.** `numeric(18,3)` in Postgres, a decimal library in
TypeScript. JavaScript `number` on a quantity is a defect regardless of whether a test
currently catches it.

## Corrections

The ledger is append-only. A wrong entry is corrected by a **contra transaction**, never by
editing. The original stays visible forever. If a fix requires an `UPDATE` on
`stock_ledger`, the approach is wrong.

## Checklist before finishing

- [ ] Does the change touch quantity? Then invariant tests must run and pass.
- [ ] Is every balance check inside a lock?
- [ ] Is there a concurrency test?
- [ ] Is all quantity arithmetic decimal?
- [ ] Is the audit event written in the same transaction?
- [ ] Does failure roll back completely?
- [ ] Could this let a client write to a stock table? (It must not — ADR-0004)
