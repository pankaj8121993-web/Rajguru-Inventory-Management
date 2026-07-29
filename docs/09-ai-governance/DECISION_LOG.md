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

| 18 | 2026-07-29 | A party's types are many-to-many, not a single column | A trader is frequently also a storage customer, and a broker also a commission agent. One record with several types beats duplicate records that drift apart | — |
| 19 | 2026-07-29 | GSTIN, PAN, bank details and address are all optional on a party | A farmer selling at the mandi gate often has none of them. Requiring them would force invented data — the false precision the blueprint forbids (§2.4). Format is checked only when a value is supplied | — |
| 20 | 2026-07-29 | Vehicle document expiry warns, never blocks | A vehicle at the gate with a lapsed certificate is a real situation. Blocking it would push staff to enter a different vehicle number, which is worse than recording the truth and flagging it | — |
| 21 | 2026-07-29 | The transporter on a vehicle is a party holding the Transporter type, not a separate transporter master | The same firm may be both a transporter and a trader. A separate master would duplicate it | — |
| 22 | 2026-07-29 | Seed document-validity dates are relative to `current_date` | Hard-coded dates silently stop exercising the expiry paths as time passes. Relative offsets keep one certificate genuinely expired whenever the seed is loaded | — |

| 23 | 2026-07-29 | **Authentication deferred until after feature development**; the administrator will create real user accounts then | Rajguru Foods decision. It unblocks feature work that would otherwise wait on Supabase provisioning and matrix approval. The role matrix and scoped assignments are built now so nothing has to be retrofitted, and every module is written against `user_has_permission()` from the start | — |
| 24 | 2026-07-29 | Calculated net weight and net difference are `GENERATED ALWAYS ... STORED` columns | Makes DR-01 structural instead of conventional: no query, service bug or manual fix can write a wrong net weight. Verified by a database test asserting both stay generated | — |
| 25 | 2026-07-29 | Net-weight tolerances live in `system_settings`, not code | DR-03. Operations must be able to change a tolerance without a deployment. Defaulted to 0.5% warn / 2% escalate pending confirmation (blocker 7) | — |
| 26 | 2026-07-29 | Duplicate detection reports candidates and records a review row; it never auto-merges | DR-05. Two genuinely separate loads can share a vehicle, weight and day. Only a person can tell the difference, so the system raises the question rather than answering it | — |
| 27 | 2026-07-29 | A scoped permission inherits down the location hierarchy | A permission granted at a facility must reach its godowns, bays and stacks, or every assignment would need enumerating. Implemented as a recursive ancestor walk in `user_has_permission()` | — |
| 28 | 2026-07-29 | Date columns are cast to text in queries | `pg` returns `date` as a JavaScript `Date`, which React cannot render and which does not match the declared string types. Casting at the query boundary keeps the contract honest | — |

| 29 | 2026-07-29 | **Vehicle and driver are typed fields on the weighment slip, not masters** | Rajguru Foods decision. A truck nobody has seen before arrives at the gate every day; requiring registration first would either block the weighment or push the operator to pick a wrong vehicle from a list. Transporters remain parties — they are commercial counterparties with terms and a relationship, which a registration number is not | — |
| 30 | 2026-07-29 | The posting function is the only write path to `stock_ledger`, and takes a row lock before any balance check | A check without a lock passes every single-threaded test and produces negative stock in production. The lock, not the CHECK constraint, is what makes concurrent dispatch safe; the constraint is the backstop | — |
| 31 | 2026-07-29 | Seed data posts opening stock through `post_stock_transaction()` rather than inserting into the ledger | If the seed could bypass the posting path, so could anything else. Nothing writes to `stock_ledger` directly, including fixtures | — |

## Recording a decision

Add a row when a decision is made, not later. If it materially affects stock accuracy,
insurance reporting, security or architecture, write an ADR and reference it here.
