# Known Issues

Accepted limitations and unresolved items. Honest, current, and not aspirational.

## Current

| # | Issue | Impact | Plan |
|---|---|---|---|
| 0 | **The application has no authentication.** `DEV_ACTOR_CODE` names the acting user for audit attribution only | Anyone who can reach the app can change master data | **Run locally only; do not expose to a network.** Auth is the next slice, and needs blockers 1–3 and 11 |
| 1 | Permission, approval and override matrices are **drafts awaiting business approval** | Auth cannot be built correctly; building against unapproved matrices means rebuilding | Take to Rajguru Foods management — blockers 1–3 in `CURRENT_STATE.md` |
| 2 | Insurance valuation basis is undecided | Blocks Phase 10 and finalising the data model | Business decision — blocker 4 |
| 3 | No Supabase projects provisioned; the app runs on plain PostgreSQL through `pg` | Blocks auth and any deployment | Provision development, staging and production — blocker 11. Migrations are Supabase-compatible and will apply unchanged |
| 4 | Zero of 25 invariants have tests | No automated protection of ledger correctness yet | Every invariant concerns the stock ledger, which does not exist. Two forward guards are already enforced in CI (INV-04 nullability, NFR-01 no floats) |
| 5 | RLS is enabled on every table but carries no scope policies | Row-level scoping is not yet enforced | Arrives with the identity and access slice |
| 5b | CI has never run on GitHub | Gates are configured and pass locally, but the hosted run is unproven | First push exercises it |
| 6 | Restore has never been tested | An untested backup is not a backup | First test when a database exists; before go-live |
| 7 | `decimal.js` is installed but not yet used | No quantity arithmetic exists yet — capacities are stored and displayed, never computed | Will be used from Phase 4 where arithmetic begins. The schema already forbids floating-point columns, checked in CI |
| 8 | `users` is an interim table, not Supabase Auth | Will be replaced by `auth.users` + `profiles` | Migration planned with the identity slice |

## Accepted limitations for the first release

| Limitation | Reason |
|---|---|
| No weighbridge integration | By design (DR-07). Entry is manual. Requires separate written approval |
| No OCR of slips | Later phase; must not complicate the manual design |
| No 3D layout | Phase 14, generated from the same location data |
| No WhatsApp or mobile push | In-app and email first |
| No customer portal | Internal platform first |
| No processing module | Stock under processing is tracked as an ownership state only |
| Canvas map needs a separate accessible view | Consequence of ADR-0003; the accessible view ships with the map |
| Vertical scaling only | Consequence of ADR-0001; adequate for internal scale |

## Recording

Add anything the team knows is imperfect but has decided to live with, and anything deferred.
**An issue that is known and undocumented is worse than one that is documented and open.**
