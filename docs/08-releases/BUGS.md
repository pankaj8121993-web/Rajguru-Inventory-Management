# Bug Register

Every defect is recorded here, and **every fix ships with a regression test**
(development prompt §19).

## Open

| ID | Date | Severity | Summary | Area | Status | Owner |
|---|---|---|---|---|---|---|
| — | — | — | No open bugs | — | — | — |

## Resolved

| ID | Date | Severity | Summary | Fix | Regression test |
|---|---|---|---|---|---|
| — | — | — | None | — | — |

## Severity

| Level | Meaning |
|---|---|
| **Critical** | Stock data wrong or exposed; ledger inconsistency; security breach |
| **High** | A core workflow blocked; invariant at risk |
| **Medium** | Feature degraded but workable |
| **Low** | Cosmetic or minor usability |

**Anything affecting ledger correctness is Critical**, however few records it touches.

## Recording

Add on discovery, not on fix. Record: what was expected, what happened, how to reproduce,
the affected area, and the invariant or rule involved if any. On resolution, record the fix
and the identifier of the regression test that now prevents recurrence. A fix without a
regression test is not complete.
