# ADR-0003 — Konva for 2D layout; no PostGIS initially

- **Status:** Accepted
- **Date:** 2026-07-29
- **Deciders:** Platform architect

## Context

The platform needs an interactive 2D warehouse layout (FR-42 to FR-46): drawing plots,
godowns, yards, bays, stacks and bins; uploading and tracing over floor plans; clicking a
location to see its stock; showing occupancy and uncertainty states; and versioning
published layouts.

Two questions needed answering: what renders and edits the layout in the browser, and how
geometry is stored.

## Decision

**Rendering and editing: Konva via React Konva.** Canvas-based, with built-in support for
dragging, transforming, hit detection and layering.

**Storage: plain coordinates in ordinary Postgres columns, relative to a layout version.**
PostGIS is **not** adopted.

Geometry lives in `layout_geometry` as coordinates in a layout-local coordinate space,
tied to a `layout_version`. Real-world dimensions (length, width, height, area, volume) stay
on the location node as ordinary `numeric` columns, where capacity calculations need them.

## Rationale

**On Konva.** The layout editor is an object-manipulation problem — draw a rectangle,
resize it, rotate it, lock it, click it — not a mapping problem. Konva is built for exactly
that. SVG with hand-written interaction would mean reimplementing transform handles and hit
testing. A mapping library such as Leaflet or MapLibre is built around geographic projections
and tile layers, which a godown floor plan does not have.

**On not adopting PostGIS.** The spatial queries this product actually needs are: "what is
in this location?" and "what is inside this parent location?" Both are answered by the
location hierarchy — a foreign key walk — not by geometry. Geometry is used for *drawing*,
not for querying.

PostGIS would add an extension dependency, a specialised type system, and a body of
knowledge the team would need to maintain, in exchange for capability the product does not
use. The blueprint says "PostGIS only where justified" (§29.3); it is not justified yet.

If genuine geospatial need appears — surveying against real coordinates, GPS-tagged stack
positions, area calculation from irregular polygons — PostGIS can be added later. Adding an
extension to PostgreSQL is straightforward; the coordinates already stored are convertible.
The decision is reversible, which is exactly why deferring is correct.

## Consequences

**Positive.** No extension dependency. Geometry is simple, portable and readable. Konva
handles interaction natively. 3D in Phase 14 reads the same location data, so there is one
spatial model, not two.

**Negative.** Canvas is not part of the DOM, so accessibility must be handled deliberately —
the map needs a keyboard-navigable, screen-reader-accessible equivalent view. This is a real
obligation, not a footnote: **every location reachable on the map must be reachable in an
accessible list or tree view showing the same information** (NFR-09). Area calculations for
irregular shapes must be implemented in application code rather than delegated to PostGIS.

**Follow-on obligations.**
- Layout geometry is versioned. Publishing a version freezes its geometry; historical stock
  views render against the layout version that was current at the time.
- **Moving an object on the map never moves stock** (FR-46, blueprint §20). The map is a
  view and an editor of *locations*, never of *stock*. Stock movement requires an approved
  transfer transaction. This must be covered by an end-to-end test.
- The accessible equivalent view ships **with** the map, not after it.

## Alternatives considered

**PostGIS from the start.** Rejected. Capability without a use case, plus an extension
dependency and specialist knowledge burden. Reversible decision, so defer.

**SVG with custom interaction handling.** Rejected. Would mean writing transform handles,
snapping and hit testing by hand — a large amount of well-solved code to own.

**Leaflet or MapLibre.** Rejected. Designed around geographic projections and tiles;
awkward for an arbitrary floor-plan coordinate space.

**Three.js for both 2D and 3D.** Rejected for the first release. A 3D engine for a 2D
editing task is unnecessary complexity, and the blueprint explicitly sequences 2D before 3D.
