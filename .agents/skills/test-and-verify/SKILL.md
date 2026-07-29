---
name: test-and-verify
description: Verification procedure to run before claiming any work complete, including invariant tests, concurrency tests and actual running verification. Use before reporting any feature as done.
---

# Test and Verify

## The rule

> **Do not claim completion because code compiles. Verify the actual running workflow.**

## Layers

Unit (Vitest) · database and RLS (SQL) · permission · integration · component (RTL) ·
end-to-end (Playwright) · accessibility (axe-core) · concurrency · volume.

## Invariant tests are gates

25 invariants in `docs/01-domain/INVENTORY_INVARIANTS.md`. Any invariant a change touches
must have a **passing** test before the work is complete. A failure blocks merge.

## Concurrency — the one most often skipped

**A check-then-write without a row lock passes every single-threaded test and fails in
production.** Mocks cannot test locking; these run against real PostgreSQL with genuine
parallel transactions.

Required:
- Two simultaneous dispatches against one balance → exactly one succeeds (INV-01)
- Two simultaneous allocations from one segment → total never exceeds available (INV-09)
- Simultaneous transfer and dispatch → total preserved (INV-14)
- Simultaneous reservation and dispatch → no over-commitment (INV-18)

## Per feature

Unit · database · RLS · permission · integration · Playwright where user-facing ·
**a regression test for every bug fixed** · failure paths · duplicate actions · concurrency
where state is shared · large data where volume is realistic.

## Test data

Realistic agricultural data. Real commodities, real vehicle formats, plausible weights,
bag counts and moisture. **Never `foo` or `test123`** — unrealistic data hides real bugs.

**No production data in any test environment.**

## Never

**Never disable a security control or weaken an invariant to make a test pass.** If a control
blocks a test, the test or the design is wrong. Fix that instead.

## Evidence

A completion report states the **exact commands and their exact output**. "Tests pass" is
not a result. For UI work: which screens and workflows were actually exercised. For
insurance: which policies and calculations were actually verified.

## Checklist

- [ ] All layers covered for this change
- [ ] Every touched invariant has a passing test
- [ ] Concurrency tested where state is shared
- [ ] Failure paths tested, not just the happy path
- [ ] Regression test added for any bug fixed
- [ ] Accessibility checked on user-facing work
- [ ] Realistic data used
- [ ] Workflow actually run end to end and observed
- [ ] Exact commands and results recorded
