# Scope

## In scope

An internal, cloud-hosted platform used by Rajguru Foods staff to control agricultural
stock across owned and operated facilities, covering:

- Manual inward and outward driven by weighment slips
- Stock sourced from farmers, traders, brokers, auctions, government and storage customers
- Final lots, provisional stock, unidentified stock and mixed stock
- Multi-level storage locations across plots, godowns, open yards, bays, stacks, bins and heaps
- Ownership types: own, stored, government, pledged, under processing
- Internal transfers, quality inspection, fumigation
- Physical verification, discrepancy management, gain, loss and damage
- Insurance coverage and underinsurance analysis
- Interactive 2D warehouse layout
- Role-based access, maker-checker approval, controlled admin override
- Dashboards, reports, alerts and a complete audit trail

## Out of scope for the first release

| Excluded | Reason |
|---|---|
| Weighbridge hardware integration | Entry is manual by design (DR-07). Requires separate written approval. |
| OCR of weighment slips | Later phase; must not complicate the manual entry design. |
| 3D warehouse layout | Phase 14. Will be generated from the same location data as 2D. |
| WhatsApp and mobile push notifications | In-app and email first. |
| Customer portal | Internal platform first. |
| Processing / milling module | Stock under processing is tracked as an ownership state; the processing operation itself is later. |
| IoT and sensor integration | Later phase. |
| AI assistant | Later phase. |

## Permanently out of scope

Billing, subscriptions and payments · marketing or public pages · generic multi-tenancy ·
SaaS boilerplate · any feature that exists to serve external customers rather than Rajguru
Foods operations.

## Deliberately not automated

Some things are intentionally left to human judgement, because automating them would create
false certainty:

- **Physical verification never posts to the ledger.** A count is evidence for a human
  decision, not a decision.
- **Coverage calculations never bind an insurer.** They are management indicators.
- **Movement is never inferred.** The user states whether stock physically moved.
- **Duplicates are never auto-merged.** A suspected duplicate is resolved explicitly.
- **Correction versus reclassification is never guessed.** The user chooses.

## Users

Warehouse operators and supervisors, weighment entry operators and verifiers, gate
operators, quality inspectors, fumigation operators and approvers, stock accountants,
dispatch executives, physical verification teams, discrepancy reviewers, insurance
managers, auditors, management viewers and administrators.

Full role list and permissions: `docs/04-security/PERMISSION_MATRIX.md`.

## Success criteria

The platform is successful when it is the single operational source of truth for stock —
when the book quantity in the system is the number the business acts on, provisional stock
is visible rather than hidden, and management can see uninsured and underinsured exposure
without asking anyone to prepare a spreadsheet.

Go-live conditions: `MASTER_BLUEPRINT.md` §33.
