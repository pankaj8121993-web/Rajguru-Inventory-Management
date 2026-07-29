# Backup and Restore

**Status:** Planned. No database exists yet.

## The rule

> **A backup that has never been restored is not a backup.**

Restore is tested on a schedule and the result recorded here. An untested backup is treated
as no backup for go-live purposes.

## What is backed up

| Asset | Method | Frequency | Retention |
|---|---|---|---|
| PostgreSQL database | Supabase automated backup + point-in-time recovery | Continuous PITR, daily snapshot | To be set with the business |
| Storage objects (slips, certificates, photographs) | Bucket replication | Daily | Matches database retention |
| Migrations and application code | Git | Every commit | Permanent |
| Configuration and secrets | Secret store's own backup | On change | Per platform |

Retention must satisfy statutory record-keeping for stock and insurance documentation —
**confirm the required period with the business and with the auditor before go-live.**

## Recovery objectives

To be agreed with the business:

- **RPO** — acceptable data loss. Target: under 5 minutes via PITR.
- **RTO** — acceptable downtime. Target: under 4 hours.

## Restore procedure

1. Declare the incident and record the target recovery point.
2. **Stop writes.** Continuing to post during recovery corrupts the outcome.
3. Restore the database to the target point in a **new** project — never over the live one
   until verified.
4. Restore storage objects to the matching point.
5. Verify: ledger reconciles to balances; audit trail is continuous; document references
   resolve; row counts match expectation.
6. Repoint the application.
7. Reconcile the gap: any transaction between the recovery point and the incident is lost
   and must be re-entered from source documents — the weighment slips.
8. Record the incident, the loss, and the re-entry, in `INCIDENT_RESPONSE.md`.

Step 7 is why physical slips must be retained. **The paper is the ultimate backup.**

## Restore test schedule

| Test | Frequency | Last run | Result |
|---|---|---|---|
| Point-in-time restore to a scratch project | Quarterly | — | Not yet run |
| Full restore with ledger reconciliation | Before go-live, then half-yearly | — | Not yet run |
| Storage object restore | Half-yearly | — | Not yet run |

Record every run. A failed or skipped test is a `KNOWN_ISSUES.md` entry.
