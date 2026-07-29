---
name: location-hierarchy
description: Location nodes, the storage hierarchy, location precision, and the critical distinction between location refinement and physical transfer. Use when working on locations, placement, or anything that changes where stock is recorded.
---

# Location Hierarchy

## The hierarchy

**Company → Facility → Plot → Godown / Building / Open Yard → Section / Floor →
Bay / Zone → Stack / Bin / Heap**

One self-referencing `location_nodes` tree typed by node type. Precision is derivable from
node type and depth.

## Stock may be posted at any node

**A stock record is valid at any level** (INV-05). Facility known, plot known, godown known,
section or bay known, stack/bin/heap known, exact confirmed — all are legitimate.

Never require a leaf node. Never invent a stack.

## The question that must always be asked

> **Did the stock physically move?**

This is the most important branch in the product. The user answers explicitly; the system
never infers it (DR-16).

| Answer | Meaning | Action |
|---|---|---|
| **No** | The record became more precise. Nothing moved | `location_refinement_event` — **not a transfer** (INV-10) |
| **Yes** | Stock physically moved | Full internal transfer workflow (INV-11) |

Examples of refinement: stock recorded at plot level confirmed to be in Godown 2; godown-level
stock confirmed to be in Bay B; commodity "Tur" confirmed as "Lemon Tur".

Getting this wrong corrupts movement history — a warehouse that appears to be constantly
moving stock that never moved, or moved stock with no record of the movement.

## Partial refinement

Supported and normal: part to Godown 1, part to Godown 2, balance still at plot level
(DR-14).

## Precision only increases

Refinement makes location more precise, never less (DR-18). Coarsening requires a correction
with a reason.

## Capacity

Nodes carry approved capacity, operational capacity, current occupancy and available
capacity. Exceeding capacity is an override, not a hard block — real warehouses overfill,
and hiding that helps no one.

## Checklist

- [ ] Can stock post at facility, plot and godown level without a leaf node?
- [ ] Is the "did it physically move?" question explicit and mandatory?
- [ ] Does refinement write a refinement event and no transfer?
- [ ] Does movement route to the transfer workflow?
- [ ] Is partial refinement supported?
- [ ] Is location precision recorded and updated?
