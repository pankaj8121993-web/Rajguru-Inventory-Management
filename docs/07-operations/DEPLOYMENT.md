# Deployment

**Status:** Planned. Nothing is deployed — Phase 0 has no application.

## Environments

| Environment | Purpose | Data | Supabase project |
|---|---|---|---|
| Local | Development | Seeded realistic data | Local Supabase CLI |
| Development | Shared integration | Seeded realistic data | Separate project |
| Staging | UAT and rehearsal | Anonymised extract | Separate project |
| Production | Live operations | Real | Separate project |

**Fully separated. No production data ever flows to a lower environment** — anonymised
extracts only. Credentials are never shared between environments.

## Pipeline

Push → CI (lint, type-check, unit, database, RLS, invariant, integration, E2E,
accessibility, secret scan, static analysis, bundle scan) → review → merge →
deploy to development → verify → promote to staging → UAT → promote to production.

Every gate in `docs/06-testing/TEST_STRATEGY.md` blocks promotion.

## Migrations

Migrations run **before** the application deploys, and must be backward compatible with the
currently running version so a rollback does not strand the database ahead of the code.

Sequence: back up → apply to staging → verify → apply to production during a low-activity
window → verify → deploy application → smoke test.

An irreversible migration requires explicit approval recorded in the migration register.

## Rollback

Application: redeploy the previous build. Database: apply the migration's `ROLLBACK`
section, or restore point-in-time if unavoidable.

**Because the ledger is immutable, a rollback must never discard posted transactions.**
Restoring the database to an earlier point discards real operational work — it is a last
resort requiring business sign-off, not a routine step.

## Secrets

Platform secret store only. Never in the repository. `.env` git-ignored; `.env.example`
documents required names with no values. Rotate on any suspected exposure and on staff
departure.

## Go-live

Blueprint §33: opening stock reconciled · all locations created · insurance policies
entered · godown coverage reviewed · role matrix approved · maker-checker tested · negative
stock prevented · ledger reconciles · provisional stock visible · fumigation controls work ·
physical verification remains reference only · audit logs complete · backups tested ·
reports reconcile · users trained · SOPs issued · UAT approved · no unresolved critical
security issue.
