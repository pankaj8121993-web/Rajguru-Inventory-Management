# UAT Plan

User acceptance testing before go-live. **Status:** Framework only — scenarios are written
as each phase completes.

## Principles

UAT is run by the people who will actually use the system: warehouse operators, weighment
entry staff, stock accountants, dispatch executives, the verification team and management.
Not by developers, and not by managers standing in for operators.

Testing uses **realistic operational data and real workflows**, on the devices staff
actually use — including the mid-range Android phones used on the yard.

## Entry criteria

- All phase features implemented and CI green
- No open critical or high defect
- Test environment loaded with realistic data
- Users trained on the workflows in scope
- SOPs drafted

## Scenario areas

| Area | Must demonstrate |
|---|---|
| Weighment | Individual entry, day-wise bulk, invoice-wise, Excel import, duplicate detection, net difference beyond tolerance, correction before posting, reversal after |
| Inward | Vehicle-wise, invoice-wise, day-wise; inward **with no final lot**; inward at plot level only; multi-slip inward |
| Provisional stock | Partial identification across two lots leaving a balance; partial location refinement; ageing visibility |
| Refinement vs transfer | The "did the stock physically move?" question routing correctly both ways |
| Correction vs reclassification | Both workflows, and their separate reports |
| Lots | Create, split, merge, transfer, ownership change, closure with full preconditions |
| Transfer | Full workflow with a deliberate issued-vs-received difference raising a discrepancy |
| Outward | Each mode, including exceptional outward from provisional stock |
| Controls | Attempted dispatch of reserved, blocked, pledged and fumigation-restricted stock |
| Quality | Inspection against template, conditional approval, override preserving the original |
| Fumigation | Full cycle, safety-period dispatch restriction, chemical consumption, history flowing to lots on identification |
| Verification | Each method and confidence level; **confirming the ledger does not change**; discrepancy through to closure |
| Gain and loss | Reasoned, evidenced, approved adjustment at each threshold |
| Insurance | Policy entry, endorsement, coverage review, underinsurance, unendorsed location, excluded commodity, expiry alert |
| 2D layout | Draw, publish a version, click through to stock, see uncertainty states; **confirm moving an object does not move stock** |
| Access | Scope enforcement, maker-checker, self-approval refusal, override with approval and expiry |
| Reports | Each report reconciles to the ledger and drills down to source |
| Mobile | Primary workflows on a phone on the yard |

## Sign-off

Each area is signed off by its business owner. Recorded per scenario: date, tester, steps,
expected result, actual result, pass or fail, defect reference.

## Exit criteria

- Every scenario passed or has a formally accepted deviation
- No open critical or high defect
- Reports reconcile to the ledger
- Backup and restore demonstrated by actual restore
- Users trained, SOPs issued
- Blueprint §33 go-live conditions met
- Business sign-off recorded
