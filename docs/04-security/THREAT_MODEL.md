# Threat Model

**Method:** STRIDE over the trust boundaries in `docs/02-architecture/ARCHITECTURE.md`.
**Status:** Initial model at Phase 0. Reviewed at each phase completion and whenever the
architecture changes.

---

## Assets, by value

1. **The stock ledger.** The record of what the business owns and holds for others.
   Corrupting or falsifying it is the highest-impact attack.
2. **Stored-stock records.** Third-party stock held under agreement — a discrepancy here is
   a legal and commercial liability.
3. **The audit trail.** If it can be altered, no other control can be trusted.
4. **Insurance policy data.** Drives the underinsurance analysis management relies on.
5. **Party master data.** Commercially sensitive — suppliers, customers, terms, bank details.
6. **Documents.** Weighment slips, certificates, policies.
7. **Credentials and the service-role key.**

## Trust boundaries

| # | Boundary | Notes |
|---|---|---|
| TB1 | Internet → Next.js server | Authenticated internal users; the only public surface |
| TB2 | Next.js server → PostgreSQL | Service layer; holds the service-role key |
| TB3 | Browser → PostgreSQL (direct reads) | RLS-filtered; **no write grants on stock tables** |
| TB4 | Server → Supabase Storage | Signed URLs only |
| TB5 | Imported files → application | Excel, CSV and images — untrusted input |
| TB6 | AI agent → repository and MCP servers | Development-time; untrusted content |

---

## Threats

### Spoofing

| Threat | Mitigation | Residual |
|---|---|---|
| Stolen credentials | Strong passwords, breached-password check, MFA for privileged roles, lockout, session revocation | Medium — depends on MFA rollout discipline |
| Session hijacking | HTTP-only `Secure` `SameSite` cookies, no tokens in `localStorage`, session expiry | Low |
| Shared warehouse accounts | Individual accounts enforced by policy; audit reveals shared use through impossible-travel and concurrent-session patterns | **Medium — the most likely real-world weakness.** Shared logins are common in warehouse operations and would defeat attribution and maker-checker |
| Agent acting on injected instructions | All external content is data, never instruction; MCP servers classified; Supabase MCP never touches production | Medium |

### Tampering

| Threat | Mitigation | Residual |
|---|---|---|
| Direct ledger modification | No client write grants (ADR-0004); `UPDATE`/`DELETE` revoked; trigger blocks; contra-entry only (INV-02) | Low |
| Bypassing the posting service | Grants make it structurally impossible from a client role | Low |
| Backdating to hide a discrepancy | Backdating is a high-risk override with dual approval and documentation; exception dashboard reports it | Medium |
| Audit trail alteration | Append-only; written in the same transaction; no application delete path | Low |
| Malicious spreadsheet import | Type and content validation, formula stripping, row-level validation, no formula evaluation | Low |
| SQL injection | Parameterised queries only; no string-built SQL | Low |

### Repudiation

| Threat | Mitigation | Residual |
|---|---|---|
| "I did not post that" | Audit event with user, time, device, IP, previous and new values, written atomically with the change | Low |
| "I did not approve that" | Approval actions separately audited; self-approval structurally blocked | Low |
| Shared account destroys attribution | Individual accounts; see Spoofing | **Medium — the key dependency** |

### Information disclosure

| Threat | Mitigation | Residual |
|---|---|---|
| Cross-scope data access | RLS on every table plus service-layer scope checks | Low |
| IDOR via identifiers in URLs | Every access authorised by scope. **A UUID is not an access control** | Low |
| Document leakage | Private buckets, short-lived signed URLs issued after authorisation | Low |
| Export beyond scope | Exports generated server-side under the user's scope | Low |
| Service-role key in the client bundle | Server-only modules; CI bundle scan (NFR-04) | Low |
| Secrets committed | Gitleaks in CI; `.env` git-ignored | Low |
| Sensitive detail in error messages | Generic client messages; detail to logs with a correlation ID | Low |
| Personal data in error tracking | Sentry payload scrubbing configured before enabling | Medium until implemented |

### Denial of service

| Threat | Mitigation | Residual |
|---|---|---|
| Authentication brute force | Rate limiting and progressive lockout | Low |
| Unbounded query or report | Mandatory pagination with enforced maximum page size (NFR-07); report row limits | Low |
| Large import exhausting resources | File size limits, row limits, chunked background processing | Medium |
| Lock contention on the posting path | Narrow lock scope, short transactions, monitored; concurrency-tested | Medium — needs load testing at Phase 13 |

### Elevation of privilege

| Threat | Mitigation | Residual |
|---|---|---|
| Self-granted role or widened scope | Role assignment is itself a permission requiring approval; a user can never modify their own assignments | Low |
| Self-approval | Blocked in service, `CHECK` constraint and RLS — three layers (INV-24) | Low |
| Admin assuming commercial override rights | Override is a separate permission (DR-50) | Low |
| RLS policy gap on a new table | Automated schema test asserting RLS on every business table, run in CI | Low |
| Privilege escalation through a dependency | Dependabot, CodeQL, Semgrep, license and advisory review | Medium |

---

## The three highest residual risks

**1. Shared warehouse accounts.** Attribution, maker-checker and the entire audit trail rest
on one person being one account. Warehouse environments naturally drift toward a shared
terminal login. *Response:* individual accounts enforced from day one, MFA where practical,
detection of concurrent and impossible-travel sessions, and training that explains **why**
this matters rather than just prohibiting it.

**2. Insider manipulation of stock records.** The person best placed to falsify a stock
record is a legitimate user. *Response:* maker-checker, immutable ledger, complete audit,
discrepancy review, physical verification that cannot silently adjust the ledger, and the
exception dashboard. Prevention is not achievable against a determined insider; **fast,
reliable detection is the actual control.**

**3. Concurrency defects on the posting path.** A check-then-write without a row lock will
pass every single-threaded test and fail in production, producing negative or double-counted
stock. *Response:* mandatory concurrency tests for INV-01, INV-09 and INV-14 as CI gates,
and load testing before go-live.

---

## Review

At the end of each phase, and on any architectural change, using the `security-audit` skill.
An external penetration test is required before go-live (`SECURITY_MODEL.md` §9).
