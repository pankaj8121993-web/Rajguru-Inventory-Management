---
name: provisional-stock
description: Rules for provisional stock batches, unidentified holding pools, mixed stock and progressive identification. Use when working on any feature where the final lot, grade, commodity or source is not yet known.
---

# Provisional Stock

The heart of the product. Conventional inventory systems assume identity is known at
receipt. **Here it often is not**, and the platform must record that honestly.

## The four identification states

| State | Meaning |
|---|---|
| **Final identified lot** | Identity fully known; has a `lot_id` |
| **Provisional stock batch** | Broad identity known, final lot pending. `PB-[FACILITY]-[DATE]-[SERIAL]` |
| **Unidentified holding pool** | Stock exists; exact lot, grade, source or location not established |
| **Mixed stock pool** | Contains multiple grades, suppliers, owners or potential lots; needs segregation |

Confidence levels: confirmed · reasonably identified · provisional · mixed · unidentified ·
awaiting segregation · awaiting quality classification · awaiting source allocation.

## The prohibition

**Never force a user to invent a lot number, a grade or a stack.**

No placeholder lots. No "UNKNOWN" lot record. No default. If the lot is not known,
`lot_id` is null and the segment carries its identification status (ADR-0002, INV-04).

A placeholder lot destroys the distinction between identified and unidentified stock — which
is the entire point of the module.

## Partial identification

Fully supported and normal: part of a provisional segment to Lot A, part to Lot B, a balance
still pending (DR-13).

Two conservation rules, both enforced under lock:
- Outputs sum **exactly** to the input (INV-08)
- Allocation never exceeds available provisional quantity (INV-09)

## Ageing

Provisional stock that never resolves is an operational failure. Every provisional segment
ages and is reported. Pending identification and location tasks are raised automatically at
inward (DR-12).

## In the interface

**Provisional is not an error state.** Style it as ordinary and expected. If the UI makes it
look like a problem, staff will invent lot numbers to clear it — producing exactly the false
certainty the product exists to prevent.

## Query trap

**A careless inner join to `lots` silently hides every provisional segment.** Use outer
joins by default; an inner join needs justification. This is the single most likely reporting
defect in the platform.

## Checklist

- [ ] Can this flow complete with `lot_id` null?
- [ ] Is the user ever forced to invent an identifier? (Must be no)
- [ ] Do partial allocations conserve quantity exactly?
- [ ] Is allocation bounded by available quantity, under lock?
- [ ] Does provisional stock age and appear in reports?
- [ ] Do queries outer-join to lots?
- [ ] Does the UI treat provisional as normal, not as an error?
