# Architecture

**Style:** Secure modular monolith.

Not microservices, not Kubernetes, not Kafka, not multiple primary databases, not MongoDB,
not Redis unless a measured need appears, not event streaming. These are prohibited
starting points (blueprint §29.6, development prompt §6). Adopting any of them later
requires an accepted ADR with evidence of need.

---

## 1. Shape

```
Browser (Next.js PWA)
        │  HTTPS, session cookie
        ▼
Next.js server — route handlers / server actions
        │
        ├── Application services  ← all business logic lives here
        │       └── Posting service (the only path to the stock ledger)
        │
        ▼
Supabase PostgreSQL
        ├── Row Level Security on every business table
        ├── Transactional posting functions
        ├── Constraints, triggers, immutability guards
        └── Audit tables

Supabase Auth      — identity, sessions, MFA
Supabase Storage   — slips, certificates, photographs (private, signed URLs)
```

### The one rule that shapes everything

**The browser can never produce a stock-ledger effect.**

The client may read (through RLS-filtered queries) and may submit intent. It may never
write to `stock_ledger`, `stock_transactions`, `inventory_segments` or any balance table.
Those grants do not exist for the `authenticated` role.

All posting goes through a server-side service that calls a transactional database
function. The anon and authenticated keys are public by design; RLS is what protects the
data, and the posting path is protected by grants on top of that.

---

## 2. Modules

The monolith is internally modular. Each module owns its tables and exposes a service
interface; modules do not reach into each other's tables directly.

| Module | Owns | Depends on |
|---|---|---|
| `identity` | users, roles, permissions, scopes, approvals | — |
| `masters` | companies, facilities, commodities, parties, vehicles, reason codes | identity |
| `locations` | location nodes, dimensions, capacity | masters |
| `weighment` | slips, batches, allocations, duplicate reviews | masters, identity |
| `stock` | receipt batches, inventory segments, lots, transactions, **ledger**, balances | locations, masters, identity |
| `identification` | identification, classification, refinement, pending tasks | stock |
| `quality` | templates, inspections, results | stock, masters |
| `fumigation` | plans, events, chemicals, restrictions | stock, locations |
| `verification` | sessions, estimates, discrepancies, adjustments | stock |
| `insurance` | policies, coverage, valuations, claims, alerts | stock *(read-only)*, locations, masters |
| `spatial` | layout versions, objects, geometry | locations |
| `governance` | attachments, comments, notifications, overrides, audit, settings | identity |

**`insurance` has read-only access to stock.** This is enforced by grants, not convention —
it is invariant INV-21 and is checked in every `rls-security-review`.

---

## 3. The posting path

Every stock-affecting operation runs this sequence, atomically:

1. Authenticate the user
2. Verify permission for the transaction type
3. Verify location scope
4. Verify transaction status is postable
5. Validate quantity (positive, correct precision, within tolerance)
6. Validate the inventory segment
7. Validate the lot where applicable
8. Validate ownership
9. Validate location
10. Check available balance
11. Check reservation
12. Check block
13. Check fumigation restriction
14. Check insurance warning where configured
15. Check maker-checker
16. **Lock the required rows**
17. Write the transaction
18. Write the ledger
19. Write the audit event
20. Commit atomically
21. Roll back completely on any failure

Steps 10–16 must hold the lock. A balance check without a lock is meaningless under
concurrency, so locking precedes the check in implementation even though the list reads
sequentially.

**Quantities are `numeric(18,3)` in Postgres and a decimal type in TypeScript. Never
JavaScript `number` arithmetic on a quantity** — this is NFR-01 and is non-negotiable.

---

## 4. Where logic lives

| Concern | Location | Why |
|---|---|---|
| Invariants that must never break | Database — constraints, triggers, functions | The database is the last line; it holds even if application code is wrong |
| Business workflow and orchestration | Server-side application services | Testable, readable, one place to reason about a process |
| Authorisation | RLS **and** service-layer checks | Defence in depth; RLS alone cannot express approval routing |
| Input validation | Zod schemas at the server boundary | Client validation is convenience only, never trusted |
| Presentation and interaction | React components | No business rules in components |

Duplicating a check between the database and the service is intentional, not redundant.

---

## 5. Front end

Next.js App Router with React and TypeScript, delivered as a PWA. Tailwind CSS with
shadcn/ui for the component layer. TanStack Query for server state, TanStack Table for the
dense grids that bulk entry and reports need, React Hook Form with Zod for forms.

Server Components for data display; Client Components only where interaction requires it.
Mutations go through server actions or route handlers — never a direct client-to-database
write on a business table.

**2D layout** uses Konva via React Konva: a canvas library suited to interactive object
manipulation, without pulling in a mapping stack. PostGIS is not adopted; layout geometry
is stored as plain coordinates relative to a layout version, which is sufficient for
warehouse plans. PostGIS would only be justified by genuine geospatial querying — see
ADR-0003.

**3D** (Phase 14) will use Three.js and React Three Fiber, generated from the same location
data as 2D. No separate spatial model.

---

## 6. Data and storage

Supabase PostgreSQL is the single source of truth. Versioned SQL migrations under
`supabase/migrations/`, applied through the Supabase CLI, registered in
`docs/03-database/MIGRATION_REGISTER.md`. Every schema change exists as committed SQL —
a change applied through an MCP but not committed is not done.

Supabase Storage holds weighment slips, fumigation certificates and photographs in private
buckets, accessed only through short-lived signed URLs. Uploads are validated for type and
size, and stored under a path derived from the owning record.

---

## 7. Environments

Three fully separated Supabase projects: development, staging and production. No production
data in development or staging — opening-stock migration rehearsals use anonymised extracts.
Secrets live in the platform's secret store, never in the repository. `.env` is git-ignored;
`.env.example` documents the required names with no values.

---

## 8. Observability

Structured JSON logs with a correlation ID per request. Error tracking through Sentry.
Health check endpoint. Audit dashboards built on `audit_events`. Performance monitoring on
the posting path in particular — it is the operation that must never be slow or wrong.

---

## 9. Testing

Vitest for units and services, React Testing Library for components, Playwright for
end-to-end journeys, axe-core for accessibility, and SQL-level tests for constraints, RLS
policies and invariants. The invariant tests in `docs/01-domain/INVENTORY_INVARIANTS.md`
are mandatory gates, not optional coverage.

Full approach: `docs/06-testing/TEST_STRATEGY.md`.

---

## 10. Decisions

| ADR | Decision |
|---|---|
| [ADR-0001](adr/ADR-0001-modular-monolith-supabase.md) | Modular monolith on Supabase PostgreSQL |
| [ADR-0002](adr/ADR-0002-inventory-segment-as-ledger-anchor.md) | Inventory segment, not lot, anchors the ledger |
| [ADR-0003](adr/ADR-0003-2d-layout-konva-no-postgis.md) | Konva for 2D layout; no PostGIS initially |
| [ADR-0004](adr/ADR-0004-server-side-posting-only.md) | Stock posting is server-side only |
