---
name: feature-vertical-slice
description: The procedure for building any feature end to end as a complete vertical slice. Use when starting any new feature or module.
---

# Feature Vertical Slice

**Build vertical slices. Never large disconnected scaffolding.**

## The fourteen elements

A slice is complete only with all of:

1. **Domain rule** — identified in `DOMAIN_RULES.md`; added if missing
2. **Master data impact** — what masters and reason codes are needed
3. **Database schema** — tables, columns, types
4. **Migration** — committed SQL (`database-migration` skill)
5. **Constraints** — carrying the relevant invariants
6. **RLS** — policies with positive and negative tests (`rls-security-review` skill)
7. **Server service** — business logic, authorisation, orchestration
8. **Validation** — Zod at the server boundary; client validation is convenience only
9. **UI** — all states (`ui-ux-review` skill)
10. **Audit event** — written in the same transaction as the change
11. **Notifications** — where the workflow needs them
12. **Tests** — unit, database, RLS, permission, integration, E2E (`test-and-verify` skill)
13. **Documentation** — `CURRENT_STATE.md`, `CHANGELOG.md`, domain and architecture files
14. **Actual running verification** — the workflow exercised end to end against a real
    database

**Missing any one means the slice is not done.** Do not mark a placeholder complete.

## Order

Domain rule → schema and migration → constraints and RLS → server service → validation →
tests at each layer → UI → audit → verification → documentation.

Start from the domain rule, not the screen. A screen built before the rule is understood
will encode the wrong rule.

## Before starting

1. Run `project-startup-audit` if not already done this session
2. Confirm the feature aligns with `MASTER_BLUEPRINT.md`
3. Check `PHASED_BACKLOG.md` — is this phase unblocked?
4. Identify which invariants the slice touches
5. Invoke the relevant domain skill

## Before claiming done

- [ ] All fourteen elements present
- [ ] Invariant tests for every invariant touched, passing
- [ ] Ran the workflow against a real database and observed the correct result
- [ ] Failure paths tested, not just the happy path
- [ ] `CURRENT_STATE.md` updated with **actual** status
- [ ] Completion report with exact commands and exact results

**Compiling is not evidence. Running is evidence.**
