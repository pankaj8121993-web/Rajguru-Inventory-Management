# Workflows

End-to-end process definitions. Each workflow lists its steps, the states a record moves
through, who acts, and the controls that apply. Rule references are to `DOMAIN_RULES.md`;
invariant references to `INVENTORY_INVARIANTS.md`.

---

## W1. Manual weighment entry

**Actors:** Weighment Entry Operator (maker), Weighment Verifier (checker)

1. Operator enters the slip — individually, or through the day-wise / invoice-wise bulk
   grid, or by Excel/CSV import, or paste from a spreadsheet.
2. System computes net weight (DR-01) and compares with the printed net (DR-02).
3. System runs duplicate detection (DR-05) and surfaces any match for explicit resolution.
4. Operator attaches the slip image or PDF.
5. Row-level and batch-level validation runs. Failing rows are exportable for correction;
   valid rows may post partially.
6. Verifier reviews and verifies.
7. Slip becomes available for allocation to a receipt batch.

**States:** draft → awaiting document → awaiting verification → verified →
partially allocated → fully allocated → posted. Plus: disputed, reversed, cancelled.

**Controls:** Corrections are free before posting, contra-only after (DR-06). Beyond-tolerance
net differences need a reason and possibly approval (DR-03).

---

## W2. Inward

**Actors:** Warehouse Operator (maker), Warehouse Manager (approver), Stock Accountant

1. Select or create the receipt batch (vehicle, invoice, day, party, commodity, contract or
   auction basis — DR-08).
2. Attach one or more verified weighment slips.
3. Record source category and owner.
4. Record commodity — or provisional commodity if not yet certain.
5. Record the **best-known** location. System derives location precision (DR-10).
6. Choose identification status.
7. **If the final lot is known** → assign it.
   **If not** → system creates a provisional batch or unidentified pool segment (DR-09).
   *The operator is never asked to invent a lot number.*
8. Upload evidence.
9. Verify → approve → post to the stock ledger.
10. System raises pending identification and/or location tasks as applicable (DR-12).

**Posting sequence (atomic — all or nothing):** authenticate → verify permission → verify
location scope → verify status → validate quantity → validate segment → validate lot where
applicable → validate ownership → validate location → check available balance → check
reservation → check block → check fumigation restriction → check insurance warning → check
maker-checker → lock records → write transaction → write ledger → write audit → commit.

---

## W3. Identify and allocate provisional stock

**Actors:** Warehouse Supervisor (maker), Stock Accountant (approver)

1. Select the provisional or unidentified segment.
2. Select the quantity to allocate — may be partial (DR-13).
3. Assign an existing lot, create a new lot, or split across several lots.
4. Update commodity, variety, grade, crop year and source allocation as now known.
5. Assign a more precise location if now known.
6. Record quality results and photographs.
7. **Answer the mandatory question: "Did the stock physically move?"** (DR-16)
   - **No** → identification / classification / location-refinement event only.
   - **Yes** → route to W5 internal transfer.
8. Submit for approval → approve → post.

**Controls:** Allocations cannot exceed available provisional quantity (INV-09). Quantity is
conserved exactly across the allocation (INV-08). A balance may legitimately remain pending.

---

## W4. Correction versus reclassification

The user chooses which they are doing; the system never guesses (DR-17).

| | Correction | Reclassification |
|---|---|---|
| Meaning | The original entry was wrong | The original was reasonable; new information arrived |
| Example | Vehicle number mis-keyed | "Tur" now confirmed as "Lemon Tur" |
| Reason codes | Error reason set | Reclassification reason set |
| Reporting | Correction report — an operator quality signal | Reclassification report — normal maturation |
| Original record | Preserved and visible | Preserved and visible |

---

## W5. Internal transfer

**Actors:** Requestor, Approver, Issuer, Labour contractor, Operator, Receiver, Verifier

Request → source selection → quantity → approval → issue → movement → receipt →
difference → reconciliation → posting.

**Controls:** Total quantity is preserved (INV-14). Every named role is recorded (DR-23).
Any issued-versus-received difference opens a discrepancy case (DR-24) — it never
disappears silently.

---

## W6. Outward

**Actors:** Dispatch Executive (maker), Warehouse Manager (approver)

1. Select mode — one invoice one weighment, one invoice many weighments, many invoices one
   vehicle, many lots one vehicle, one lot many vehicles, day-wise bulk, delivery order,
   government release, stored-stock release, transfer dispatch, or exceptional outward from
   provisional stock.
2. Select source lots or segments.
3. System validates availability, reservation, block, pledge and fumigation restriction
   (DR-25).
4. Enter the outward weighment and reconcile to it.
5. Approve → post.

**Exceptional outward from provisional stock (DR-26)** additionally requires: provisional
reference, best-known location, destination, reason, approver, evidence and a recorded
final reconciliation requirement.

---

## W7. Quality inspection

Sample (pre-inward, vehicle, stack, periodic or dispatch) → record against the commodity's
quality template → lab report where applicable → outcome: accepted, conditionally accepted
with condition text, or rejected.

An override records the original result, revised status, reason and approver. The original
result is never overwritten (DR-29).

---

## W8. Fumigation

Plan → schedule → execute (chemical, batch, dosage, quantity consumed, vendor, operator,
supervisor, start time, exposure period) → opening → safety period → result → follow-up →
next due date → certificate and photographs.

**Controls:** Dispatch is restricted during the safety period (DR-32). Chemical consumption
decrements chemical inventory; expired chemical needs an override (DR-33). Repeat
infestation raises an alert (DR-34). When provisional stock later becomes final lots, the
fumigation history flows through proportionally (DR-22).

---

## W9. Physical verification

**Actors:** Physical Verification Team (maker), Discrepancy Reviewer, approver for any adjustment

1. Open a verification session with scope — lot, segment, provisional batch, commodity pool,
   stack, bay, godown, plot or facility.
2. Record the method and the confidence level (DR-35).
3. Record the estimated physical quantity per line.
4. System compares against book quantity and computes variance.
5. Approve the verification. **The ledger is not touched** (INV-13).
6. Where variance exceeds tolerance, a discrepancy case opens (DR-36).
7. The approved verification becomes the standing reference until superseded or the lot
   closes (DR-37).

**Discrepancy lifecycle (DR-38):** identified → under review → recount requested →
explanation pending → monitoring until lot closure → adjustment recommended → adjustment
approved → recovery initiated → closed without adjustment | closed after reconciliation.

Only an approved adjustment writes to the ledger.

---

## W10. Gain, loss and adjustment

Identify → select reason code (mandatory) → attach evidence → name the responsible person →
compare against tolerance → route for approval by quantity or value threshold (DR-40) →
approve → post → track recovery status where applicable.

Stock is never edited directly (DR-41, INV-02).

---

## W11. Lot closure

Warehouse confirmation → location cleared → final physical check → final reconciliation →
discrepancy review complete → gain or loss posted → no active reservation → no unresolved
transfer → supervisor approval → stock accountant approval → final closure approval.

A lot cannot close with an unexplained balance (INV-20). Reopening requires approval and is
reported as an exception (DR-21).

---

## W12. Insurance coverage review

1. Value current stock by the configured valuation basis.
2. Match stock to policies by location, commodity and ownership eligibility (DR-44).
3. Apply sub-limits.
4. Compute coverage ratio, uninsured value and estimated underinsurance (DR-43).
5. Surface unendorsed locations, excluded commodities, expiring policies and exceeded
   sum insured.
6. Present as management indicators with the assumption set attached (DR-46).

No step in this workflow writes to any stock table (INV-21).

---

## W13. Approval

Submit → route by rule (transaction type, quantity, value, location, commodity) → approver
acts (approve, reject, return for amendment) → post or return.

**Controls:** The approver can never be the maker (INV-24). Approval limits are scoped per
role. Delegation is explicit, time-boxed and audited.

---

## W14. Override

Request → state the restriction being overridden → mandatory reason → supporting document →
approval (dual approval for high-risk) → apply with an effective period → expire → audit.

The original value is always retained. An override never silently changes a quantity
(INV-19). Overrides nearing expiry and repeated overrides both raise alerts (DR-51).
