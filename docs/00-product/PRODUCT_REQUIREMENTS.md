# Product Requirements

Derived from `MASTER_BLUEPRINT.md`, which remains the authority. This document turns the
blueprint into numbered, testable requirements. Where the two differ, the blueprint wins and
this file is corrected.

Identifiers are stable: `FR-nn` functional, `NFR-nn` non-functional.

---

## Functional requirements

### Weighment

| ID | Requirement | Phase |
|---|---|---|
| FR-01 | Record a weighment slip manually with all fields in blueprint §6.1, preserving gross, tare, calculated net, printed net and difference. | 4 |
| FR-02 | Enter weighments in bulk via a spreadsheet grid, Excel paste, Excel import and CSV import, with row- and batch-level validation, common-value application, row duplication, draft save, bulk attachment upload, partial posting and error export. | 4 |
| FR-03 | Detect duplicate weighments across slip number, weighbridge, date, vehicle, gross, tare, net, party, commodity and direction, and require explicit resolution. | 4 |
| FR-04 | Move a weighment through draft, awaiting document, awaiting verification, verified, partially allocated, fully allocated, posted, disputed, reversed and cancelled. | 4 |
| FR-05 | Allocate one slip across multiple inventory segments, and one inward across multiple slips. | 4 |

### Inward and stock identity

| ID | Requirement | Phase |
|---|---|---|
| FR-06 | Create a receipt batch on a vehicle, invoice, day, party, commodity, contract or auction basis. | 5 |
| FR-07 | Post an inward **without** a final lot number, creating a provisional batch or unidentified pool segment. | 5 |
| FR-08 | Post an inward at any location node — facility, plot, godown, section, bay, stack — recording location precision. | 5 |
| FR-09 | Record identification status and identification confidence on every segment. | 5 |
| FR-10 | Support final identified lots, provisional batches, unidentified holding pools and mixed stock pools. | 5 |
| FR-11 | Partially identify provisional stock across several lots leaving a pending balance. | 5 |
| FR-12 | Partially refine location leaving a balance at a coarser node. | 5 |
| FR-13 | Distinguish correction from reclassification with separate workflows and reports. | 5 |
| FR-14 | Require the explicit user answer to "Did the stock physically move?" before any location change. | 5 |
| FR-15 | Raise, age and report pending identification and pending location tasks. | 5 |

### Lots and ledger

| ID | Requirement | Phase |
|---|---|---|
| FR-16 | Maintain lots with original, current book, reserved, available, blocked, damaged and pledged quantities. | 6 |
| FR-17 | Create, identify, split, merge, transfer, reclassify, change ownership, reserve, release, process, close and reopen lots. | 6 |
| FR-18 | Post all stock changes through typed transactions to an immutable ledger. | 6 |
| FR-19 | Track ownership types: own, stored, government, pledged, under processing. | 6 |
| FR-20 | Enforce lot closure preconditions and prevent closure with an unexplained balance. | 9 |

### Movement

| ID | Requirement | Phase |
|---|---|---|
| FR-21 | Execute internal transfers through request, approval, issue, movement, receipt, difference, reconciliation and posting, recording every responsible person. | 7 |
| FR-22 | Support all outward modes in blueprint §14.1 including exceptional outward from provisional stock under controlled approval. | 7 |
| FR-23 | Enforce outward controls on availability, reservation, block, pledge and fumigation restriction. | 7 |
| FR-24 | Reserve and release stock without altering physical quantity. | 7 |

### Quality and fumigation

| ID | Requirement | Phase |
|---|---|---|
| FR-25 | Define commodity-wise quality templates and record inspections against them, preserving original results through any override. | 8 |
| FR-26 | Record fumigation against any location node, provisional batch, unidentified pool or lot, with chemical, dosage, exposure, safety period, result and next due date. | 8 |
| FR-27 | Restrict dispatch during the fumigation safety period, overridable with reason and approval. | 8 |
| FR-28 | Track chemical inventory, consumption and expiry. | 8 |
| FR-29 | Flow fumigation history to final lots when provisional stock is identified. | 8 |

### Verification and adjustment

| ID | Requirement | Phase |
|---|---|---|
| FR-30 | Maintain book quantity, estimated physical quantity and final reconciled quantity as three distinct figures. | 9 |
| FR-31 | Record verification at lot, segment, provisional batch, commodity pool, stack, bay, godown, plot or facility scope, with method and confidence level. | 9 |
| FR-32 | Never alter book stock from an approximate verification. | 9 |
| FR-33 | Manage the full discrepancy lifecycle through to closure. | 9 |
| FR-34 | Post gains and losses only through reasoned, evidenced, approved adjustments. | 9 |

### Insurance

| ID | Requirement | Phase |
|---|---|---|
| FR-35 | Maintain insurance policies with all fields in blueprint §19.1, including endorsements and renewal history. | 10 |
| FR-36 | Map policy coverage to locations, commodities and ownership types with sub-limits. | 10 |
| FR-37 | Calculate current stock value, available valid cover, coverage ratio, uninsured value, estimated underinsurance and policy utilisation. | 10 |
| FR-38 | Surface expiry risk, unendorsed location risk and excluded commodity risk. | 10 |
| FR-39 | Present all insurance output as management indicators with the assumption set, never altering stock. | 10 |
| FR-40 | Record insurance overrides with original calculation, revised allocation, reason, document, approver and effective period. | 10 |
| FR-41 | Maintain claims with documents and status. | 10 |

### Spatial

| ID | Requirement | Phase |
|---|---|---|
| FR-42 | Provide an interactive 2D layout of facilities, plots, godowns, yards, bays, stacks and bins with pan, zoom and filter. | 11 |
| FR-43 | Show stock detail on clicking a location, per blueprint §20.2. | 11 |
| FR-44 | Display uncertainty explicitly — exact stack stock, godown-level unallocated, plot-level, unplaced, mixed, identification pending, location pending, uninsured, underinsured. | 11 |
| FR-45 | Provide a layout editor with drawing, floor-plan upload, resize, rotate, lock and version publishing. | 11 |
| FR-46 | Prevent any map interaction from directly altering stock. | 11 |
| FR-47 | Generate a future 3D view from the same location data. | 14 |

### Access, approval and audit

| ID | Requirement | Phase |
|---|---|---|
| FR-48 | Assign multiple scoped roles per user, scoped by company, facility, plot, godown, department, commodity, ownership, transaction type and limits. | 3 |
| FR-49 | Enforce maker-checker and prevent self-approval. | 3 |
| FR-50 | Provide a controlled override framework with separate permission, dual approval for high risk, mandatory reason, evidence, expiry and repeated-override alerting. | 3 |
| FR-51 | Record a complete, immutable audit trail per blueprint §28.4. | 3 |
| FR-52 | Manage all masters in blueprint §4 with history, effective dates, import, export and approval where required. | 3 |

### Reporting and awareness

| ID | Requirement | Phase |
|---|---|---|
| FR-53 | Provide the six dashboards in blueprint §23. | 12 |
| FR-54 | Provide the 50 reports in blueprint §24 with filters, saved views, Excel and PDF export, scheduled delivery and drill-down to source. | 12 |
| FR-55 | Provide global search across all entities in blueprint §25. | 12 |
| FR-56 | Deliver the alerts in blueprint §26 in-app and by email. | 12 |

---

## Non-functional requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Quantities use exact decimal arithmetic end to end. | No floating point on any quantity path — verified by test |
| NFR-02 | Stock posting is atomic and correct under concurrency. | Concurrency tests pass for INV-01, INV-09, INV-14 |
| NFR-03 | Row Level Security is enabled on every business table. | 100% — verified by an automated schema test |
| NFR-04 | The service-role key never reaches the browser. | Verified by bundle scan in CI |
| NFR-05 | Interactive screens respond acceptably on a mid-range Android phone over 4G. | Largest Contentful Paint under 2.5s on the dashboard |
| NFR-06 | Bulk entry stays usable at volume. | 500-row grid remains responsive; import of 5,000 rows completes and reports errors |
| NFR-07 | List and report queries are bounded. | Every list is paginated; no unbounded query reaches the database |
| NFR-08 | The interface is usable by non-technical warehouse staff. | Minimal typing, smart defaults, clear statuses, no hidden actions |
| NFR-09 | Accessibility. | WCAG 2.1 AA on primary workflows; axe-core clean |
| NFR-10 | Mobile-first responsive across phone, tablet and desktop. | All primary workflows usable at 360px width |
| NFR-11 | Multilingual-ready. | All user-facing strings externalised from day one |
| NFR-12 | Data protection. | Encryption in transit and at rest; private document storage with signed URLs |
| NFR-13 | Recoverability. | Automated backup with tested point-in-time recovery |
| NFR-14 | Auditability. | Every mutation writes an audit event in the same transaction |
| NFR-15 | Environment separation. | Development, test and production fully separated; no production data in development |

---

## Explicitly out of scope for the first release

Weighbridge hardware integration · OCR of slips · 3D layout · WhatsApp and mobile push ·
customer portal · processing module · sensor integration · AI assistant.

Also permanently out of scope: billing, subscriptions, marketing pages, generic
multi-tenancy and any SaaS boilerplate.
