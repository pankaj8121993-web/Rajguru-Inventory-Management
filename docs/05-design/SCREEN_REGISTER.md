# Screen Register

Every screen, its purpose and its real status. **Status: none built.**

Navigation per blueprint §27.1.

| # | Screen | Purpose | Phase | Status |
|---|---|---|---|---|
| 1 | Login | Authentication, MFA | 3 | Not started |
| 2 | Dashboard — Management | Stock, ageing, discrepancy, underinsurance, approvals, alerts | 12 | Not started |
| 3 | Dashboard — Weighment | Drafts, awaiting verification, unallocated, duplicates | 12 | Not started |
| 4 | Dashboard — Identification | Lot pending, location pending, provisional ageing | 12 | Not started |
| 5 | Dashboard — Warehouse | Occupancy, pending movements, fumigation, tasks | 12 | Not started |
| 6 | Dashboard — Insurance | Cover, uninsured, underinsured, expiry, utilisation | 12 | Not started |
| 7 | Dashboard — Exception | Negative attempts, duplicates, overrides, backdating, self-approval attempts | 12 | Not started |
| 8 | Tasks | Personal work queue | 3 | Not started |
| 9 | Weighment list | Search, filter, status | 4 | Not started |
| 10 | Weighment entry — single | One slip | 4 | Not started |
| 11 | **Weighment bulk grid** | Spreadsheet entry, paste, import — the highest-value screen | 4 | Not started |
| 12 | Weighment detail | Full record, attachment, audit timeline | 4 | Not started |
| 13 | Duplicate review | Resolve suspected duplicates | 4 | Not started |
| 14 | Inward list | Receipt batches | 5 | Not started |
| 15 | Inward entry | Create inward, **with or without a lot** | 5 | Not started |
| 16 | Provisional stock register | Provisional, unidentified, mixed, with ageing | 5 | Not started |
| 17 | Identify and allocate | Partial identification across lots | 5 | Not started |
| 18 | Location refinement | Refine location; **asks "did the stock physically move?"** | 5 | Not started |
| 19 | Lot list and detail | Quantities, history, allocations | 6 | Not started |
| 20 | Lot split / merge | Preserving totals | 5 | Not started |
| 21 | Lot closure | Precondition checklist | 9 | Not started |
| 22 | Stock enquiry | By commodity, location, owner, lot, segment | 6 | Not started |
| 23 | Transfer request / issue / receipt | Full workflow with responsible persons | 7 | Not started |
| 24 | Outward | All modes | 7 | Not started |
| 25 | Exceptional outward | From provisional stock, with approval | 7 | Not started |
| 26 | Reservations | Reserve and release | 7 | Not started |
| 27 | Quality inspection | Against commodity template | 8 | Not started |
| 28 | Fumigation plan / event | Full cycle, chemical, safety period | 8 | Not started |
| 29 | Chemical inventory | Stock, consumption, expiry | 8 | Not started |
| 30 | Verification session | Method, confidence, estimates | 9 | Not started |
| 31 | Discrepancy case | Lifecycle to closure | 9 | Not started |
| 32 | Gain / loss adjustment | Reasoned, evidenced, approved | 9 | Not started |
| 33 | Insurance policy list / detail | Policies, endorsements, renewals | 10 | Not started |
| 34 | Coverage review | Ratio, uninsured, underinsured, risks | 10 | Not started |
| 35 | Claims | Register and documents | 10 | Not started |
| 36 | **Warehouse map (2D)** | Interactive layout with uncertainty display | 11 | Not started |
| 37 | Map accessible view | Keyboard and screen-reader equivalent of the map | 11 | Not started |
| 38 | Layout editor | Draw, upload plan, version, publish | 11 | Not started |
| 39 | Approval inbox | Pending approvals; **cannot approve own** | 3 | Not started |
| 40 | Override request | Reason, evidence, approval, expiry | 3 | Not started |
| 41 | Reports hub | 50 reports, filters, saved views, export | 12 | Not started |
| 42 | Global search | Across all entities | 12 | Not started |
| 43 | Party master | Parties and types | 3 | Not started |
| 44 | Location master | Hierarchy, capacity, dimensions | 3 | Not started |
| 45 | Commodity master | Commodities, varieties, grades | 3 | Not started |
| 46 | Reason code master | Gain, loss, damage, override, adjustment reasons | 3 | Not started |
| 47 | User and role administration | Users, roles, scopes, limits | 3 | Not started |
| 48 | Audit trail viewer | Complete history | 3 | Not started |
| 49 | Settings | System configuration, thresholds, tolerances | 3 | Not started |
| 50 | Notifications | Alerts and preferences | 12 | Not started |

## Completion criteria

A screen is complete only with **all** of: loading, empty, error, validation, success,
permission-denied and mobile states; audit timeline where relevant; related records;
attachments; approval status; accessibility verified; and the workflow exercised end to end
against a real database.
