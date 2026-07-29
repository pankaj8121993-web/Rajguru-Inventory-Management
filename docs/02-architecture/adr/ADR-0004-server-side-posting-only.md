# ADR-0004 — Stock posting is server-side only

- **Status:** Accepted
- **Date:** 2026-07-29
- **Deciders:** Platform architect, security reviewer

## Context

Supabase allows a browser client to talk directly to PostgreSQL through PostgREST, with Row
Level Security as the authorisation boundary. This is convenient and is the common Supabase
pattern.

For stock posting, it is not sufficient.

Posting a stock transaction requires twenty-one ordered steps (see `ARCHITECTURE.md` §3),
including balance checks under row lock, reservation and block checks, fumigation
restriction checks, maker-checker validation, and atomic writes across the transaction,
ledger and audit tables. RLS can answer "may this user see or touch this row?" It cannot
express "is there enough available balance, is it reserved, is the fumigation safety period
active, and is this person forbidden from approving their own transaction?"

A client that could write to the ledger directly could also skip steps, reorder them, or
write a partial result.

## Decision

**The browser never produces a stock-ledger effect.**

- `INSERT`, `UPDATE` and `DELETE` are **not granted** to the `authenticated` or `anon` roles
  on `stock_ledger`, `stock_transactions`, `inventory_segments` or any balance table.
- All posting goes through a server-side application service that calls a transactional
  PostgreSQL function.
- The client submits *intent* (a validated request) and reads results. It never writes the
  outcome.
- Reads remain direct and RLS-filtered where convenient — the restriction is on writes to
  stock tables.
- The **service-role key never reaches the browser** and never enters a client bundle
  (INV-25).

## Rationale

Defence in depth. RLS remains enabled on every table and is a genuine second line — but it
is not asked to do a job it cannot do. Authorisation is enforced in the service *and* the
database; the two overlap deliberately.

Atomicity is only achievable in one place. A multi-step posting that must roll back
completely on any failure has to run inside a single database transaction. A browser issuing
separate calls cannot give that guarantee — a network failure between calls would leave the
ledger inconsistent, and there is no recovery path that preserves INV-02's immutability.

The grant model makes the rule structural rather than aspirational. If the write grants do
not exist, a client cannot violate the rule even through a bug or a crafted request. This is
enforced by schema, not by code review.

## Consequences

**Positive.** The ledger has exactly one write path, which is the one place to audit,
test and reason about. Atomicity is guaranteed. Concurrency is handled correctly through
row locking. Audit events cannot be skipped, because they are written inside the same
transaction as the ledger row. A client-side bug cannot corrupt stock.

**Negative.** More code than the direct-client Supabase pattern — every mutation needs a
server endpoint. Optimistic UI updates need care, since the authoritative result comes from
the server. Slightly higher latency on writes. This cost is accepted; the ledger's
correctness is the product.

**Follow-on obligations.**
- A schema test asserts that `authenticated` and `anon` hold no write grants on stock
  tables. This test is a CI gate.
- A CI check scans the client bundle for the service-role key (NFR-04).
- The posting function is covered by concurrency tests for INV-01, INV-09 and INV-14 —
  a check-then-write without a lock is a defect, and only a concurrent test will catch it.
- Server-side Supabase clients are constructed separately from browser clients, and the
  service-role client is instantiated only in server-only modules.

## Alternatives considered

**Direct client writes protected by RLS alone.** Rejected. RLS cannot express balance
availability, reservation state, fumigation restriction or maker-checker rules, and cannot
guarantee that a multi-table posting completes atomically.

**Database functions called directly from the browser via RPC.** Partially viable — the
function would still be transactional — but rejected as the general pattern. It puts all
orchestration into PL/pgSQL, which is harder to test and read than TypeScript services, and
it makes rate limiting, request validation and structured logging awkward. Database
functions are used for the transactional core; the service layer wraps them.

**A separate posting microservice.** Rejected. Contradicts ADR-0001 and adds a network
boundary inside what must be a single transaction.
