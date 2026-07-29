---
name: bug-triage
description: Procedure for triaging, diagnosing and fixing defects, including mandatory regression tests. Use whenever a bug is reported or discovered.
---

# Bug Triage

## Severity

| Level | Meaning | Response |
|---|---|---|
| **Critical** | Stock data wrong or exposed; ledger inconsistency; security breach | Immediate |
| **High** | Core workflow blocked; an invariant at risk | Same business day |
| **Medium** | Degraded but workable | Within 3 business days |
| **Low** | Cosmetic or minor usability | Next release |

**Anything affecting ledger correctness is Critical**, however few records it touches. A
ledger wrong in one place cannot be trusted anywhere.

## Procedure

1. **Reproduce.** A bug that cannot be reproduced cannot be confirmed fixed.
2. **Record** in `docs/08-releases/BUGS.md` on discovery, not on fix.
3. **Assess blast radius** — which records, since when, and is data currently wrong?
4. **Contain** if data is actively being corrupted. Stop the bleeding before investigating.
5. **Find the root cause.** Not the symptom.
6. **Write a failing test first** — proving the bug exists.
7. **Fix.**
8. **Confirm the test passes**, and that nothing else broke.
9. **Correct any bad data** by contra transaction and approved adjustment — never by
   editing the ledger (INV-02).
10. **Record** the fix and the regression test identifier.

## The rule

> **Every bug fix ships with a regression test.** A fix without one is not complete.

## Data integrity bugs

The ledger is immutable. Bad data is corrected by contra transaction and approved
adjustment, with reason and evidence, reconciled against the source weighment slips.

**If a fix requires an `UPDATE` on `stock_ledger`, the approach is wrong.**

## Questions worth asking

- Could this have happened before and gone unnoticed?
- Is other data affected by the same cause?
- Would a concurrency test have caught it?
- Is there a missing invariant test?
- Why did existing tests pass?

The last one matters most — a bug that reached production through a green test suite means
the suite has a gap, and the gap is the real defect.

## Checklist

- [ ] Reproduced
- [ ] Recorded in BUGS.md
- [ ] Blast radius assessed
- [ ] Root cause found, not just the symptom
- [ ] Failing test written first
- [ ] Fixed and test passing
- [ ] Bad data corrected by proper transaction
- [ ] Regression test recorded
- [ ] Asked why existing tests missed it
