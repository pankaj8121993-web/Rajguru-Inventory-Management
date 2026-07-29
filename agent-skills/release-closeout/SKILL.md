---
name: release-closeout
description: Procedure for closing out a release — verification, documentation, dependency review and honest status reporting. Use when wrapping a release or completing a phase.
---

# Release Closeout

## Verify first

- [ ] All CI gates green — lint, type-check, unit, database, RLS, **invariant**,
      integration, E2E, accessibility, secret scan, static analysis, bundle scan
- [ ] Every invariant touched this release has a passing test
- [ ] Concurrency tests pass where state is shared
- [ ] Migrations apply cleanly from scratch
- [ ] No open Critical or High bug
- [ ] Security audit run (`security-audit` skill)
- [ ] Workflows actually exercised end to end, not just tested

## Update documentation

| File | With |
|---|---|
| `docs/09-ai-governance/CURRENT_STATE.md` | **Actual** status of every module |
| `docs/08-releases/CHANGELOG.md` | What changed |
| `docs/08-releases/RELEASE_NOTES.md` | Plain language for warehouse and management staff |
| `docs/08-releases/BUGS.md` | Resolved bugs and their regression tests |
| `docs/08-releases/KNOWN_ISSUES.md` | Anything imperfect and accepted |
| `docs/09-ai-governance/DECISION_LOG.md` | Decisions made |
| `docs/03-database/MIGRATION_REGISTER.md` | Migrations applied and where |
| `docs/06-testing/TEST_REGISTER.md` | Suites and exact results |
| `docs/05-design/SCREEN_REGISTER.md` | Screen statuses |
| `docs/02-architecture/DEPENDENCY_REGISTER.md` | Dependency and advisory review |

## Honesty rule

> **Document actual status, not intended status.**

Scaffolded but not working is **Not started**. A written but failing test is **failing**.
A feature working only with mocked data is **not verified**.

## Dependency review

Check advisories, unmaintained packages and license changes. Anything unmaintained with
open security issues goes to `KNOWN_ISSUES.md` with a replacement plan.

## Completion report

**Implemented** · **Files changed** · **Database** (migrations, policies, functions,
triggers, indexes) · **Tests** (exact commands, exact results) · **Security** (controls
added, outstanding risks) · **UI verification** (screens and workflows actually tested) ·
**Insurance verification** (policies and calculations tested) · **Documentation** (files
updated) · **Known limitations** · **Git status** · **Next task** (exactly one logical
next vertical slice).

## The final rule

> **Do not state production-ready unless every production gate has passed.**

Go-live conditions are in `MASTER_BLUEPRINT.md` §33 and `SECURITY_MODEL.md` §9. Until all of
them pass, the honest word is "not yet".
