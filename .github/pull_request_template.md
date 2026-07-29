## What this changes

<!-- What is delivered, in plain language. -->

## Vertical slice checklist

A slice is complete only with all fourteen elements (`AGENTS.md` §5). Tick what applies;
strike through what genuinely does not.

- [ ] Domain rule identified or added
- [ ] Master data impact considered
- [ ] Database schema
- [ ] Migration (committed SQL, registered)
- [ ] Constraints carrying the relevant invariants
- [ ] RLS policies with positive **and** negative tests
- [ ] Server service
- [ ] Validation at the server boundary
- [ ] UI with all states
- [ ] Audit event written in the same transaction
- [ ] Notifications where needed
- [ ] Tests
- [ ] Documentation updated
- [ ] **Actual running verification** — not just compilation

## Invariants

Which invariants does this touch? (`docs/01-domain/INVENTORY_INVARIANTS.md`)

<!-- e.g. INV-01, INV-09, INV-14 — or "none" -->

- [ ] Every invariant touched has a passing test
- [ ] Concurrency tested where state is shared
- [ ] No floating-point arithmetic on any quantity
- [ ] No client write grants added on stock tables

## Tests

Exact commands and exact results. "Tests pass" is not a result.

```
```

## Verification

What was actually run and observed — screens, workflows, data.

## Security

- [ ] RLS enabled on any new table
- [ ] No secrets committed
- [ ] No security control disabled to make a test pass

## Documentation

- [ ] `docs/09-ai-governance/CURRENT_STATE.md` reflects **actual** status
- [ ] `docs/08-releases/CHANGELOG.md`
- [ ] Migration register, decision log, or domain docs where relevant

## Known limitations

<!-- Anything incomplete or deferred. Be honest — an undocumented gap is worse than an open one. -->
