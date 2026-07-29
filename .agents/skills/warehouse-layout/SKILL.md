---
name: warehouse-layout
description: The 2D interactive warehouse layout, layout editor, occupancy display, uncertainty visualisation and versioning. Use when working on the map, spatial features or layout geometry.
---

# Warehouse Layout (2D)

Konva via React Konva. Layout-local coordinates in ordinary columns; **no PostGIS**
(ADR-0003). 3D is Phase 14, generated from the same location data.

## The rule that must never break

> **Moving a graphical object never moves stock** (FR-46).

The map edits *locations*, never *stock*. Stock movement requires an approved transfer
transaction. This must have an end-to-end test.

## The layout must show uncertainty

This is what distinguishes it from a generic warehouse map:

- Exact stack-level stock
- Godown-level unallocated stock
- Plot-level stock
- Unplaced stock
- Mixed stock
- Identification pending
- Location pending
- Uninsured and underinsured stock

**Stock that is only known to plot level must look different from stock pinned to a stack.**
Rendering an approximate location as though it were exact is a correctness failure, not a
cosmetic one.

## Visual states

Empty · partially occupied · full · overcapacity · fumigation due · under fumigation ·
quarantined · damaged · discrepancy · provisional · uninsured · underinsured.

## Clicking a location shows

Commodity · lot · provisional stock · owner · quantity · bag count · ageing · fumigation ·
quality · physical verification · discrepancy · insurance coverage · coverage ratio ·
responsible person · active alerts.

## Editor

Create plot · draw godown, yard, bay, stack, bin · draw pathways · mark gates, weighbridge,
loading points, restricted zones · upload a floor plan and draw over it · resize · rotate ·
lock · publish a version.

Publishing freezes geometry. Historical views render against the layout version current at
the time.

## Accessibility — not optional

Canvas is not in the DOM. **Every location reachable on the map must be reachable in a
keyboard-navigable, screen-reader-usable list or tree showing the same information**
(NFR-09). This ships **with** the map, not after it.

## Checklist

- [ ] Map interaction cannot alter stock — tested
- [ ] All uncertainty states rendered distinctly
- [ ] Approximate location visually distinct from exact
- [ ] Layout versioned; publishing freezes geometry
- [ ] Accessible equivalent view exists and is current
- [ ] Performs acceptably on a mid-range phone
