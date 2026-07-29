# Incident Response

**Status:** Framework. No production system yet.

## Severity

| Level | Meaning | Examples | Response |
|---|---|---|---|
| **P1 Critical** | Stock data is wrong, or exposed | Ledger inconsistency, negative stock, cross-scope data access, credential compromise, data loss | Immediate; all hands |
| **P2 High** | A core workflow is blocked | Cannot post inward or outward, authentication down, posting failures | Same business day |
| **P3 Medium** | Degraded but workable | A report is wrong, an alert is not firing, slow performance | Within 3 business days |
| **P4 Low** | Minor | Cosmetic, wording, non-blocking usability | Next release |

**Anything touching the correctness of the stock ledger is P1**, regardless of how few
records it affects. A ledger that is wrong in one place cannot be trusted anywhere.

## Process

Detect → triage and assign severity → **contain** → investigate → fix → verify → recover →
record → review.

**Containment before investigation for P1.** If stock data is being corrupted, stop the
bleeding first — disable the affected path, revoke the compromised credential, block the
affected user — then investigate. A partially understood incident that has stopped is better
than a fully understood one that is still running.

## Data integrity incidents

The ledger is immutable, so a data-integrity incident is **never** fixed by editing rows.

1. Quantify the extent — which segments, lots, locations and dates.
2. Preserve the evidence. Do not clean up before it is documented.
3. Correct by **contra transaction and approved adjustment**, with reason and evidence.
4. Reconcile against source documents — the weighment slips.
5. Record the full sequence in the audit trail and in the incident record.
6. Fix the underlying defect and add a regression test.

## Security incidents

Contain — revoke sessions, rotate credentials, disable accounts. Preserve logs before
anything is changed. Assess what data was reachable and by whom. Notify management; notify
affected parties and any regulator where the assessment requires it. Remediate, then review.

**Never** rotate a key or clear a log before the evidence is captured.

## Communication

Management is informed of every P1 immediately. Affected users are told what is happening,
what to do meanwhile — usually "keep the paper slips and do not re-enter" — and when to
expect an update.

## Post-incident review

Within five business days of resolution, for every P1 and P2: timeline, root cause,
detection gap, response assessment, actions with owners and dates.

**Blameless.** The purpose is a system that fails less, not a person to hold responsible.
Every review produces at least one concrete change — a test, an alert, a control or a
procedure. A review that produces nothing did not find the real cause.

## Record

| Date | Severity | Summary | Root cause | Actions | Review |
|---|---|---|---|---|---|
| — | — | No incidents | — | — | — |
