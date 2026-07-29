# Test Register

Living record of test suites and their real status. **Update after every task with actual
results, never intended results.**

## Status

**No tests exist.** Phase 0 has no application code.

| Suite | Scope | Tests | Status | Last run |
|---|---|---|---|---|
| — | — | 0 | Not created | — |

## Invariant coverage

25 invariants defined, **0 covered**. Every one must have a passing test before the feature
carrying it is considered complete. See `TEST_STRATEGY.md` for identifiers.

| Invariant | Test | Status |
|---|---|---|
| INV-01 … INV-25 | see TEST_STRATEGY.md | Not implemented |

## Commands

To be defined with the application scaffold in Phase 3:

```
npm run test           # unit
npm run test:db        # database, RLS, invariants
npm run test:e2e       # Playwright
npm run test:a11y      # accessibility
```

## Recording rule

Record the command and its exact output. "Tests pass" is not a result.
