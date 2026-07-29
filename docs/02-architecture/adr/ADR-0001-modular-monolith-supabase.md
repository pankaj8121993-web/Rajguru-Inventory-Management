# ADR-0001 — Secure modular monolith on Supabase PostgreSQL

- **Status:** Accepted
- **Date:** 2026-07-29
- **Deciders:** Rajguru Foods (product owner), platform architect
- **Supersedes:** —

## Context

Rajguru Foods needs a single operational source of truth for agricultural stock. The
operating reality is a small number of facilities, a modest number of concurrent internal
users, and very high requirements on **correctness, traceability and auditability** rather
than on scale.

The stock ledger must never be wrong. Quantities must be exact. History must be immutable.
Every change must be attributable. These are transactional, relational, constraint-heavy
requirements.

## Decision

Build a **secure modular monolith** on **Supabase PostgreSQL** as the single source of
truth, with Next.js and TypeScript for the application and Supabase Auth and Storage for
identity and documents.

The monolith is internally modular — each module owns its tables and exposes a service
interface — but deploys as one application against one database.

Explicitly rejected as starting points: microservices, Kubernetes, Kafka, multiple primary
databases, MongoDB as source of truth, Redis, and event-driven architecture.

## Rationale

**PostgreSQL fits the problem.** The invariants in `INVENTORY_INVARIANTS.md` are relational
constraints: foreign keys, check constraints, exact `numeric` arithmetic, row locking,
serialisable transactions. A document database would push all of that into application code,
where it is far easier to get wrong and impossible to guarantee.

**A monolith fits the scale.** Distributed transactions across services would be the single
largest source of correctness risk, and the load does not require distribution. Splitting a
system this size into services buys operational complexity and buys nothing else.

**Supabase gives the platform pieces without operating them.** Managed Postgres,
authentication, storage and Row Level Security, with point-in-time recovery — without a
dedicated infrastructure team.

**RLS is a genuine second line of defence.** Authorisation enforced in the database holds
even if application code has a bug. That matters for a system where an authorisation
failure means someone dispatches another party's stock.

**Modularity is preserved without distribution.** Module boundaries are enforced by
ownership of tables and service interfaces. If a module ever genuinely needs to be extracted,
those boundaries are where it would separate — but extraction is not a goal.

## Consequences

**Positive.** Strong transactional guarantees. Constraints enforce invariants at the last
line. One deployment, one migration path, one place to look. Small team can operate it.
Cost is low.

**Negative.** Vendor coupling to Supabase — mitigated because the core is standard
PostgreSQL and migrations are plain SQL, so the database is portable even if the platform is
not. Scaling is vertical first; acceptable for internal use at this scale. Module boundaries
are enforced by discipline and review rather than by network separation, which makes the
`rls-security-review` and code review steps load-bearing.

**Follow-on obligations.**
- Every table carries RLS from creation (NFR-03).
- Every schema change is a committed SQL migration.
- The `insurance` module gets read-only grants on stock tables (INV-21).
- Any future proposal to add Redis, a queue, or a second database must present measured
  evidence of need in a new ADR that explicitly supersedes this one.

## Alternatives considered

**Microservices from the start.** Rejected. Distributed transactions would put the stock
ledger's correctness at risk to solve a scale problem that does not exist.

**MongoDB or a document store.** Rejected, and explicitly prohibited by the blueprint. No
transactional multi-document guarantees of the kind needed, no exact decimal arithmetic
semantics, and the invariants would all move into application code.

**Self-hosted PostgreSQL on a VM.** Rejected. Same database benefits, but Rajguru Foods
would take on backup, patching, failover and recovery testing with no infrastructure team.

**A packaged ERP or WMS.** Rejected. None accommodate provisional stock, unidentified
holding pools, partial location precision and "no false accuracy" without heavy
customisation — these are the core of this product, not edge cases.
