# Glossary

Shared vocabulary for Rajguru Foods. Every term here has exactly one meaning across
documentation, database identifiers, API contracts and user interface labels. Where a
Hindi/Marathi or trade term is in daily use, it appears under **Also called**.

If a discussion needs a term that is not here, add it here first.

---

## Stock identity

**Inventory segment** — The permanent unit of stock identity. A distinct quantity with its
currently known identity, ownership and location. Every posted quantity references one.
Created at inward and never deleted; it is split, merged, refined or exhausted. Carries
`inventory_segment_id`, the column the stock ledger actually depends on.

**Final identified lot** — Stock whose identity is fully established: commodity, variety,
grade, crop year, origin and owner all confirmed. Has a `lot_id`.

**Provisional stock batch** — Broad identity is known (for example "Tur, farmer purchases,
14 March") but the final lot is pending. Reference format `PB-[FACILITY]-[DATE]-[SERIAL]`.
Real stock, fully tracked; it simply has no final lot yet.

**Unidentified holding pool** — Physical stock is known to exist but exact lot, grade,
source or location has not been established. Legitimate at inward; must age out through
identification.

**Mixed stock pool** — Stock known to contain multiple grades, suppliers, owners or
potential lots, requiring segregation before it can become final lots.

**Identification status** — Which of the four categories above a segment currently sits in.

**Identification confidence** — How sure that status is: confirmed, reasonably identified,
provisional, mixed, unidentified, awaiting segregation, awaiting quality classification,
awaiting source allocation.

**Receipt batch** — Groups one or more weighment slips into a single commercial or
operational inward. May be vehicle-wise, invoice-wise, day-wise, party-wise,
commodity-wise, purchase-contract-wise or auction-wise.

---

## Quantity concepts

Three different numbers. Never conflate them.

**Book quantity** — Derived purely from posted stock transactions. The ledger's answer.
The only quantity that is authoritative for dispatch and reporting.

**Estimated physical quantity** — An approximate physical estimate from a verification
exercise. A *reference figure only*. It never automatically changes book quantity
(INV-13).

**Final reconciled quantity** — Established after complete weighment, exhaustion of the
lot, or an approved reconciliation. Only this can close a lot.

**Available quantity** — Book quantity minus reserved, blocked, pledged and
restriction-held quantity. What may actually be dispatched.

**Reserved quantity** — Committed to a delivery order or contract. Reduces availability
but not physical quantity (INV-18).

**Blocked quantity** — Held back for quality, dispute, fumigation safety period or legal
reason. Requires an override to dispatch.

**Pledged quantity** — Encumbered to a bank or financier. Requires a formal release
before dispatch.

---

## Movement and change

**Inward** — Stock entering a facility. **Outward** — Stock leaving.

**Internal transfer** — Stock that **physically moved** between locations. Preserves total
quantity (INV-14).

**Location refinement** — The recorded location became more precise **without any physical
movement**. Example: stock recorded at plot level is later confirmed to be in Godown 2.
Not a transfer (INV-10).

**Identification event** — A provisional or unidentified segment gains a final lot.

**Classification event** — Commodity, variety, grade or crop year becomes more precise
without physical movement. Example: "Tur" later identified as "Lemon Tur".

**Correction** — The original entry was **wrong**. Something was mis-keyed or misread.

**Reclassification** — The original entry was **reasonable given what was known**, and
later information improved it. Correction and reclassification are separate workflows with
separate reporting (INV-12) because they mean different things about the operator.

**Split** — One segment or lot becomes several. Total preserved (INV-15).
**Merge** — Several become one. Total preserved (INV-16).

**Reversal** — A posted transaction is undone by an equal contra transaction. The original
is never deleted (INV-02).

**Adjustment** — A deliberate, approved, reasoned change to book stock — the only route by
which a gain or loss enters the ledger.

---

## Location

**Facility** — A physical site of operations. **Plot** — A parcel of land within a
facility, usually with a survey number. **Godown** — An enclosed storage building.
**Open yard** — Uncovered storage area. **Bay / Zone** — A subdivision within a godown or
yard. **Stack** — A built pile of bags. **Bin** — A container or silo cell.
**Heap** — Loose bulk stock, typically in an open yard.

Hierarchy: **Company → Facility → Plot → Godown / Building / Open Yard → Section / Floor →
Bay / Zone → Stack / Bin / Heap**

**Location precision** — How far down the hierarchy the location is actually known:
facility known, plot known, godown known, section or bay known, stack/bin/heap known,
exact confirmed. Stock may be validly posted at *any* node (INV-05).

---

## Ownership

**Own stock** — Owned by Rajguru Foods. **Stored stock** — Owned by a customer, physically
held by Rajguru Foods under a storage agreement. **Government stock** — Held for a
government agency. **Pledged stock** — Encumbered to a lender. **Stock under processing** —
Issued to a processing operation and not yet returned as finished goods or by-products.

---

## Parties

**Farmer** — Primary producer. **Trader** — Buys and sells commodity commercially.
**Broker / Commission agent** — Arranges transactions without taking title.
**Also called** dalal, adatiya. **Storage customer** — Stores their own stock in a Rajguru
godown. **Auction agency** — Runs the market yard auction. **Also called** APMC / mandi.

---

## Weighment

**Weighment slip** — The physical or scanned document from a weighbridge recording gross
and tare weight. Also called *kanta parchi*, *tol patti*, weighbridge ticket.

**Gross weight** — Vehicle plus load. **Tare weight** — Empty vehicle.
**Calculated net weight** — Gross minus tare, computed by the system.
**Printed net weight** — The net weight as printed on the slip.
**Net difference** — Calculated minus printed. Both values are always preserved; a
difference beyond tolerance requires a reason and possibly approval.

**Weighment allocation** — Assigning a slip's net quantity to one or more inventory
segments. A slip may split across segments where justified.

---

## Quality and fumigation

**Quality template** — The commodity-specific set of parameters to be measured.
**Fumigation** — Controlled application of a chemical to kill infestation.
**Safety period** — The interval after fumigation during which stock must not be handled
or dispatched. **Next due date** — When the location or lot requires fumigation again.

---

## Verification

**Physical verification** — A counting or estimation exercise producing an estimated
physical quantity. **Verification method** — How it was done: approximate bag count,
complete bag count, sample weighing, stack dimension estimate, bulk volume estimate,
average bag weight, visual estimate, complete weighment. **Confidence level** — Final
verified, high, moderate, approximate, visual only.

**Discrepancy** — A difference between book quantity and estimated physical quantity that
warrants review. A discrepancy is a *case to investigate*, not an automatic adjustment.

**Gain** — Book stock increases through an approved adjustment. **Loss** — Book stock
decreases. **Shortage** — Physical is less than book. **Excess** — Physical exceeds book.

---

## Control

**Maker-checker** — The person creating a transaction cannot be the person approving it
(INV-24). **Scope** — The facilities, plots, godowns, commodities, owners or transaction
types a user's role applies to. **Override** — A controlled, reasoned, approved exception
to a normal system restriction. Never silently changes a quantity (INV-19).

**Audit event** — An immutable record of who did what, when, from where, with what previous
and new values, reason, approval and evidence.

---

## Insurance

**Sum insured** — Maximum amount payable under a policy. **Sub-limit** — A cap within the
sum insured for a specific location, commodity or category. **Peril** — An insured cause
of loss. **Exclusion** — A cause of loss the policy does not cover. **Deductible /
Excess** — The portion of a claim borne by the insured.

**Average clause** — Where the sum insured is less than the value at risk, the insurer pays
claims proportionately reduced. This is the mechanism that makes underinsurance costly.

**Endorsement** — A formal amendment to a policy, for example adding a godown.
**Declaration** — A periodic statement of stock value to the insurer.

**Coverage ratio** — Available valid cover ÷ current insurable stock value.
**Uninsured value** — Insurable stock value minus available valid cover.
**Unendorsed location risk** — Stock sitting at a location the policy does not name.

All insurance figures are **management indicators**. They do not replace legal
interpretation of the policy wording and never alter stock (INV-21, INV-22).
