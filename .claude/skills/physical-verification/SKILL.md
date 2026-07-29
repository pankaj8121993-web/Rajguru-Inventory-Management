---
name: physical-verification
description: Physical verification, estimated versus book quantity, confidence levels, discrepancy lifecycle and stock adjustment. Use when working on verification, discrepancies, gain, loss or reconciliation.
---

# Physical Verification

## Three quantities — never conflate them

| Quantity | Source | Authority |
|---|---|---|
| **Book** | Posted transactions | Authoritative for dispatch and reporting |
| **Estimated physical** | A verification exercise | **Reference only** |
| **Final reconciled** | Complete weighment, exhaustion, or approved reconciliation | Closes a lot |

## The rule

> **Approximate physical verification never automatically changes book stock** (INV-13).

Verification writes to `physical_estimates`. Only a separate, reasoned, evidenced, approved
`stock_adjustment` touches the ledger.

A test must prove that an approved approximate verification leaves the ledger
byte-identical.

## Methods and confidence

Methods: approximate bag count · complete bag count · sample weighing · stack dimension
estimate · bulk volume estimate · average bag weight · visual estimate · complete
weighment · other approved method.

Confidence: final verified · high · moderate · approximate · visual only.

**Always record both.** A visual estimate and a complete weighment are both valid records
but are never equivalent evidence, and reports must not present them as though they were.

## Scope

Verification may be at lot · inventory segment · provisional batch · commodity pool ·
stack · bay · godown · plot · facility.

## The standing reference

The latest approved verification remains the reference until superseded or the lot closes
(DR-37). Show subsequent movements against it **without implying it is exact**.

## Discrepancy lifecycle

identified → under review → recount requested → explanation pending → monitoring until lot
closure → adjustment recommended → adjustment approved → recovery initiated →
closed without adjustment | closed after reconciliation.

A discrepancy is **a case to investigate**, not an automatic correction.

## Adjustment

Mandatory reason code · supporting evidence · named responsible person · tolerance
comparison · approval by quantity or value threshold · recovery status · full audit.

Gain reasons: moisture increase, weighment variation, excess receipt, processing recovery,
verification surplus, bag-count correction, standardisation.

Loss reasons: moisture, drying, handling, spillage, transit, pest, rodent, water, theft,
bag shortage, weighment difference, sampling, processing, fire, natural event, verification
shortage.

## Checklist

- [ ] Does verification write only to estimates?
- [ ] Is there a test proving the ledger is unchanged?
- [ ] Are method and confidence both recorded and displayed?
- [ ] Is the standing reference shown as a reference, not a fact?
- [ ] Does the discrepancy lifecycle work end to end?
- [ ] Does every adjustment carry reason, evidence, person and approval?
