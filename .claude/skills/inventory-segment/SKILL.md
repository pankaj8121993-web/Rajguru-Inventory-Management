---
name: inventory-segment
description: The inventory segment lifecycle — creation, split, merge, refinement, traceability and its role as the ledger anchor. Use when working on segments, or on anything that reads or writes the stock ledger.
---

# Inventory Segment

The permanent anchor of stock identity (ADR-0002).

## The shape

```
stock_ledger
  inventory_segment_id   NOT NULL   -- INV-03: always present
  lot_id                 NULL       -- INV-04: nullable, permanently
  location_node_id       NOT NULL   -- INV-05: any node, not just leaves
```

**Never add `NOT NULL` to `lot_id`.** A test asserts this and must keep passing.

## What a segment carries

Segment number · receipt batch · commodity, variety, grade where known · owner · source ·
quantity · unit · **identification status** · **identification confidence** · location ·
**location precision** · lot if assigned · quality status · fumigation status ·
restrictions · responsible person · documents · audit history.

The three bolded fields are `NOT NULL` on every segment (INV-06, INV-07).

## Lifecycle

Created at inward → assigned to a lot, or split across lots, or merged, or reclassified, or
refined to an exact location, or transferred, or dispatched, or reconciled → closed.

**Never deleted.** A segment that is exhausted is closed, not removed — traceability back to
the original inward must survive.

## Conservation

Splits and merges preserve quantity exactly (INV-15, INV-16). Children sum to parent;
merged equals the sum of sources. Enforce inside the transaction, not in application code
after the fact.

## Traceability

From any quantity it must be possible to reach: weighment slip · inward transaction ·
source · party · owner · segment · lot or provisional batch · location · user ·
responsible persons · documents · approval · full audit history.

If a change breaks any link in that chain, it is wrong.

## Checklist

- [ ] Every posted quantity has a segment
- [ ] `lot_id` still nullable
- [ ] Identification status, confidence and location precision all set
- [ ] Splits and merges conserve quantity, verified by test
- [ ] Segments closed, never deleted
- [ ] Traceability chain intact
