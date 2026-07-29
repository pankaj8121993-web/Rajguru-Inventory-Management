# Decision Log

Chronological record of decisions. Architectural decisions get a full ADR in
`docs/02-architecture/adr/`; this log records everything, including the smaller calls.

| # | Date | Decision | Rationale | ADR |
|---|---|---|---|---|
| 1 | 2026-07-29 | Build Rajguru Foods in a dedicated repository rather than in `pankaj8121993-web/stock` | That repository holds AlphaSentinel 360, an unrelated stock-market app on MongoDB and CRA. The blueprint mandates Supabase Postgres and Next.js. Mixing them would create a misleadingly named two-product monorepo | — |
| 2 | 2026-07-29 | Secure modular monolith on Supabase PostgreSQL | Invariants are relational; scale does not require distribution; RLS gives a genuine second line of defence | ADR-0001 |
| 3 | 2026-07-29 | The inventory segment, not the lot, anchors the ledger | A final lot is genuinely unknown at inward. A placeholder lot would create false certainty and make provisional stock unqueryable | ADR-0002 |
| 4 | 2026-07-29 | Konva for 2D layout; no PostGIS initially | Layout is object manipulation, not geospatial query. Hierarchy answers the containment questions. Reversible if real geospatial need appears | ADR-0003 |
| 5 | 2026-07-29 | Stock posting is server-side only; no client write grants on stock tables | RLS cannot express balance, reservation, fumigation or maker-checker rules, nor guarantee atomicity across a 21-step posting | ADR-0004 |
| 6 | 2026-07-29 | Location hierarchy modelled as one self-referencing `location_nodes` tree | Keeps the hierarchy flexible and makes location precision derivable from node type and depth | — |
| 7 | 2026-07-29 | Reason codes, document types and thresholds are tables, not enums | The business must be able to add a loss reason without a developer and a migration | — |
| 8 | 2026-07-29 | A decimal library is mandatory for quantities | JavaScript `number` cannot represent stock quantities exactly. Choice between `decimal.js` and `big.js` deferred to Phase 4 | — |
| 9 | 2026-07-29 | Permission, approval and override matrices drafted but marked as requiring business approval | They describe how the business should operate; only the business can approve them. Phase 3 is blocked until they are | — |

| 10 | 2026-07-29 | Build against local PostgreSQL 16 with the `pg` driver, not Supabase, until a Supabase project is provisioned | Docker is unavailable in the build environment so the Supabase local stack cannot run. Migrations are written Supabase-compatible and apply unchanged; the data layer is one module to swap | — |
| 11 | 2026-07-29 | Interim `users` table plus `DEV_ACTOR_CODE` for audit attribution, instead of building a throwaway login | Real auth needs the approved permission matrix (blockers 1–3) and Supabase Auth (blocker 11). An interim login would be discarded. Attribution still works so audit is real from day one | — |
| 12 | 2026-07-29 | Location placement rules live in a `location_node_type_rules` table, enforced by trigger, not in application code | The business may legitimately want a heap inside a bay at one site and not another. A table is editable; a hard-coded rule needs a developer | — |
| 13 | 2026-07-29 | Shared types split into `location-types.ts`, kept free of `server-only` | Client components need node-type labels. Keeping data access in `locations.ts` preserves ADR-0004 while letting the UI import constants | — |
| 14 | 2026-07-29 | Zod schemas extracted to `src/lib/validation/`, not `server-only` | Makes them unit-testable and gives one definition of validity shared by action and test. Server-side validation remains authoritative | — |
| 15 | 2026-07-29 | Replaced `next lint` with the ESLint CLI | `next lint` is deprecated in Next 15 and prompts interactively, so it cannot run in CI | — |
| 16 | 2026-07-29 | Pinned `postcss` 8.5.18 and `sharp` 0.35.0 through npm overrides | Three high-severity advisories arrived transitively through Next. npm's suggested fix was downgrading Next to 9.3.3, which is not a fix. Overrides clear the audit while keeping Next current | — |
| 17 | 2026-07-29 | Playwright owns the dev server and resets the database in `globalSetup` | Tests that mutate shared state gave order-dependent results — a created godown changed a count another test asserted. Resetting first makes failures real | — |

## Recording a decision

Add a row when a decision is made, not later. If it materially affects stock accuracy,
insurance reporting, security or architecture, write an ADR and reference it here.
