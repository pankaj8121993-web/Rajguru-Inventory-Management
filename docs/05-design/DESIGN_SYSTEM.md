# Design System

Development prompt §17. **Status:** Principles agreed; no components built.

## What this interface must be

Premium, modern, fast, responsive, accessible, easy for basic users, efficient for bulk
entry, clear and consistent, mobile-friendly.

**Do not use an uncustomised generic admin dashboard.** shadcn/ui provides the component
source; it must be shaped into a product that fits warehouse work, not left as a template.

## Who uses it

A warehouse operator on a mid-range Android phone, in daylight, possibly with dusty hands,
entering weighment slips between vehicles. A stock accountant on a desktop working through
a 300-row bulk grid. A manager checking underinsurance exposure on a tablet.

Design for the first of these and the others follow. The reverse is not true.

## Principles

**Minimise typing.** Smart defaults, remembered last values, copy-paste grids, row
duplication, common-value application. Every field a user does not have to type is a field
they cannot mistype.

**Never force false precision.** Where the lot or exact location is unknown, the interface
must make "not yet known" an easy, first-class answer — never a blank the user feels
compelled to fill with something invented.

**Show uncertainty honestly.** Provisional, unidentified, mixed, approximate and
plot-level-only stock must be visually distinct from confirmed stock. Never render an
estimate as though it were a measurement.

**No hidden actions.** Everything a user can do is visible or discoverable. No gestures
that must be taught.

**Status is always legible.** Clear labels, not colour alone. Colour reinforces; it never
carries meaning by itself.

## Required states

Every user-facing screen implements all of: **loading · empty · error · validation ·
success · permission-denied · mobile.** Plus, where relevant: audit timeline, related
records, attachments, approval status.

A screen missing any applicable state is incomplete.

## Visual language

| Element | Rule |
|---|---|
| Typography | One sans-serif family. **Tabular figures for every quantity** — columns of weights must align |
| Quantities | Right-aligned, fixed decimal places, thousands separators, unit always shown |
| Colour | Semantic and paired with text or icon. Sufficient contrast for daylight phone use |
| Density | Comfortable on mobile, dense on desktop grids. Bulk entry is a spreadsheet, not a form |
| Touch targets | Minimum 44×44px |
| Motion | Minimal and purposeful. Respect `prefers-reduced-motion` |

## Status colours

Semantic, never alone:

| Meaning | Use |
|---|---|
| Confirmed / verified / posted | Neutral positive |
| Provisional / pending identification | Distinct attention state, not alarming — this is normal, not an error |
| Approximate / estimated | Visually softer than measured values |
| Blocked / restricted / overdue | Warning |
| Discrepancy / uninsured / overcapacity | Alert |
| Draft | Muted |

**Provisional stock is not an error state.** It is ordinary and expected. Styling it as a
problem would push staff toward inventing lot numbers to make it go away — the exact
behaviour the product exists to prevent.

## Accessibility — WCAG 2.1 AA

Keyboard reachable throughout. Visible focus. Labelled form controls. Errors announced and
associated with their field. Contrast met. Screen-reader-usable tables.

**The 2D map needs an accessible equivalent** — canvas is not in the DOM. Every location
reachable on the map must be reachable in a keyboard-navigable list or tree showing the same
information (ADR-0003, NFR-09).

## Bulk entry

The highest-value interaction in the product. It must support: paste from Excel, keyboard
navigation between cells, row duplication, applying a common value down a column,
per-row validation shown inline, draft save, partial posting and an error export.

If bulk entry is slower than the spreadsheet it replaces, staff will keep using the
spreadsheet and the platform will not become the source of truth.

## Language

Plain operational language. "Weighment slip", not "WeighmentRecord". "Not yet identified",
not "NULL lot_id". Terms match `docs/01-domain/GLOSSARY.md` — the words on screen are the
words staff use.

All strings externalised from day one for multilingual readiness (NFR-11).
