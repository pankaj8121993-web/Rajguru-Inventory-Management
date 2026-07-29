# Known Issues

Accepted limitations and unresolved items. Honest, current, and not aspirational.

## Current

| # | Issue | Impact | Plan |
|---|---|---|---|
| 1 | Permission, approval and override matrices are **drafts awaiting business approval** | Phase 3 cannot start; building against unapproved matrices means rebuilding | Take to Rajguru Foods management — blockers 1–3 in `CURRENT_STATE.md` |
| 2 | Insurance valuation basis is undecided | Blocks Phase 10 and finalising the data model | Business decision — blocker 4 |
| 3 | No Supabase projects provisioned | Blocks Phase 3 | Provision development, staging and production — blocker 11 |
| 4 | Zero of 25 invariants have tests | No automated protection of ledger correctness yet | Tests arrive with the features that carry them, Phases 3–10 |
| 5 | CI workflow has never run against real code | Gates are configured but unproven | First run at Phase 3 |
| 6 | Restore has never been tested | An untested backup is not a backup | First test when a database exists; before go-live |
| 7 | Decimal library not yet chosen | Quantity arithmetic approach unconfirmed | Choose at Phase 4 with an ADR |

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
