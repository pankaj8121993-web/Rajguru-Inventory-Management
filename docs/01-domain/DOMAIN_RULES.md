# Domain Rules

Business rules that govern behaviour. Invariants in `INVENTORY_INVARIANTS.md` are absolute;
the rules here are the operational logic built on top of them. Terms are defined in
`GLOSSARY.md`.

Rules are identified as `DR-nn` for stable reference from code and tests.

---

## 1. Weighment

**DR-01** Calculated net weight is always `gross − tare`. The system computes it; the user
never types it.

**DR-02** Where the printed net weight on the slip differs from the calculated net weight,
both values are preserved permanently, along with the absolute and percentage difference.
Neither value overwrites the other.

**DR-03** A difference within the configured tolerance posts without friction. Beyond
tolerance it requires a reason code. Beyond the escalation threshold it requires approval.
Tolerances are configuration, not code.

**DR-04** One weighment slip may be allocated across more than one inventory segment where
justified. One inward may draw on many slips. One invoice may relate to many slips. None of
these relationships is one-to-one.

**DR-05** A weighment record cannot be posted twice. Duplicate detection compares slip
number, weighbridge, date, vehicle, gross, tare, net, party, commodity and direction.
A suspected duplicate is a warning that must be explicitly resolved as reviewed-and-accepted,
confirmed duplicate, cancelled, or linked to the earlier record.

**DR-06** Before posting, a weighment may be corrected in place. After posting, it can only
be reversed by contra entry (INV-02).

**DR-07** No weighbridge hardware integration exists or may be built without separate
written approval. Entry is manual, from physical, photographed, scanned or PDF slips.

## 2. Inward

**DR-08** An inward may be created vehicle-wise, invoice-wise, party-wise, day-wise,
commodity-wise, purchase-batch-wise or auction-wise. The system must not assume one vehicle
equals one inward.

**DR-09** A final lot is never required at inward (INV-04). Where the lot is unknown the
system creates a provisional batch or an unidentified pool segment. The user is never asked
to invent a lot number.

**DR-10** An exact location is never required at inward (INV-05). The user records the
best-known location node and the system records the corresponding location precision.

**DR-11** Every inward posts against a receipt batch and produces at least one inventory
segment.

**DR-12** Any inward that leaves identity or location incomplete automatically raises a
pending identification task, a pending location task, or both. These tasks age and are
reported on. Unresolved provisional stock is an operational exception, not a silent state.

## 3. Identification, classification and refinement

**DR-13** Identification may be partial. Part of a provisional segment may go to Lot A,
part to Lot B, and a balance may remain pending. The parts must sum exactly to the original
(INV-08).

**DR-14** Location refinement may be partial. Part may be placed in Godown 1, part in
Godown 2, and a balance may remain at plot level.

**DR-15** Allocation to a final lot can never exceed the available provisional quantity
(INV-09), checked under row lock.

**DR-16** Before any refinement the user must answer explicitly: **"Did the stock physically
move?"** A `yes` routes to the internal transfer workflow. A `no` records a refinement
event only. The system must never infer this from the data.

**DR-17** Correction and reclassification are chosen deliberately by the user, carry
different reason codes, and appear in different reports (INV-12).

**DR-18** Refinement only ever increases precision. A segment recorded at bay level cannot
be silently coarsened back to godown level; that requires a correction with a reason.

## 4. Lots

**DR-19** A lot is created either at inward when identity is known, or later through
identification of provisional stock.

**DR-20** Lot closure requires all of: warehouse confirmation, location cleared, final
physical check, final reconciliation, discrepancy review complete, gain or loss posted, no
active reservation, no unresolved transfer, supervisor approval, stock accountant approval
and final closure approval. A lot cannot close leaving an unexplained balance (INV-20).

**DR-21** Reopening a closed lot requires approval and is reported as an exception.

**DR-22** Fumigation history follows stock. When provisional stock becomes final lots, the
fumigation history flows to those lots in proportion to quantity and location coverage.

## 5. Transfer and outward

**DR-23** A transfer follows request → approval → issue → movement → receipt → difference →
reconciliation → posting. Each step records its responsible person: requestor, approver,
issuer, labour contractor, equipment operator, receiver, verifier.

**DR-24** A difference between issued and received quantity opens a discrepancy case. It
never silently disappears.

**DR-25** Outward cannot exceed available stock, cannot consume reserved stock, cannot
dispatch blocked or fumigation-restricted stock without override, and cannot dispatch
pledged stock without a formal release.

**DR-26** Outward from provisional stock is permitted only through controlled approval, and
must capture the provisional reference, quantity, best-known location, outward weighment,
destination, reason, approver, evidence and a final reconciliation requirement.

**DR-27** Every outward preserves its source lot or provisional segment reference. Stock
never leaves anonymously.

## 6. Quality

**DR-28** Quality parameters are defined per commodity by template, not hard-coded.

**DR-29** An original quality result is never overwritten. A quality override records the
original result, the revised status, the reason and the approver.

**DR-30** Conditional approval is a distinct outcome from acceptance and from rejection,
and carries the condition text.

## 7. Fumigation

**DR-31** Fumigation may be recorded against a facility, plot, godown, bay, stack, bin,
provisional batch, unidentified pool or final lot.

**DR-32** During the safety period, dispatch from covered stock is restricted. Lifting the
restriction early requires an override with a reason and an approver.

**DR-33** Chemical consumption decrements chemical inventory. Expired chemical cannot be
recorded as used without an override.

**DR-34** Repeat infestation at the same location within the configured window raises an
alert for review.

## 8. Physical verification

**DR-35** Verification records the method and the confidence level. A visual estimate and a
complete weighment are both valid records but are never treated as equivalent evidence.

**DR-36** An approximate verification never changes book stock (INV-13). It creates a
reference figure and, where the variance exceeds tolerance, a discrepancy case.

**DR-37** The latest approved verification remains the reference until a newer verification
is approved or the lot closes. Subsequent movements are displayed against that reference
without implying the reference is exact.

**DR-38** A discrepancy moves through: identified → under review → recount requested →
explanation pending → monitoring until lot closure → adjustment recommended → adjustment
approved → recovery initiated → closed without adjustment, or closed after reconciliation.
Only an approved adjustment touches the ledger.

## 9. Gain, loss and adjustment

**DR-39** Every gain or loss carries a mandatory reason code from the configured list,
supporting evidence and a named responsible person.

**DR-40** Approval routing depends on quantity or value thresholds held in configuration.

**DR-41** Stock is never edited directly. A change to book stock always occurs through a
typed, reasoned, approved transaction.

## 10. Insurance

**DR-42** Coverage is evaluated godown-wise, plot-wise, facility-wise and commodity-wise.

**DR-43** Coverage ratio is available valid cover ÷ current insurable stock value.
Uninsured value is insurable stock value minus available valid cover.

**DR-44** Cover is only counted as valid where the policy is active on the date, the
location is endorsed, the commodity is not excluded, and the ownership type is eligible.
Anything failing these tests is reported as a risk, not silently treated as covered.

**DR-45** Stock at an unendorsed location and stock of an excluded commodity must always be
visible in coverage reporting (INV-23). Coverage queries outer-join from stock to policy.

**DR-46** Insurance calculation results are labelled as management indicators and carry
their assumption set. They never alter stock (INV-21) and never claim legal effect
(INV-22).

**DR-47** A manual insurance override preserves the original calculation, the revised
allocation, the reason, the supporting document, the approver and the effective period.

## 11. Access and approval

**DR-48** Roles are many-to-many with users and may be scoped by company, facility, plot,
godown, department, commodity, ownership type, transaction type, and value or quantity
limit.

**DR-49** A user may hold both maker and approver roles, but may never approve their own
controlled transaction (INV-24).

**DR-50** Override authority is a distinct permission from administrative access. A
technical administrator does not automatically hold commercial override rights.

**DR-51** High-risk overrides require dual approval. Overrides may be temporary and carry an
expiry. Repeated overrides of the same type raise an alert.

## 12. Master data

**DR-52** Business masters are never hard-coded in source. Commodities, reason codes,
document types, statuses and thresholds are configuration.

**DR-53** Masters support effective dates and expiry. Changing a master never rewrites
history — transactions retain the values that applied when they were posted.

**DR-54** A master in use is deactivated, never deleted.
