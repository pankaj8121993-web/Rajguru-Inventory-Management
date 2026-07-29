---
name: ui-ux-review
description: Review procedure for any user-facing screen — required states, accessibility, mobile behaviour and honest display of uncertainty. Use when building or changing any screen.
---

# UI/UX Review

Design principles: `docs/05-design/DESIGN_SYSTEM.md`. Screens: `SCREEN_REGISTER.md`.

## Required states — all of them

Every screen implements: **loading · empty · error · validation · success ·
permission-denied · mobile.**

Plus, where relevant: audit timeline · related records · attachments · approval status.

A screen missing an applicable state is incomplete, not "polished later".

## Honesty about uncertainty

This is the review point unique to this product.

- Provisional, unidentified and mixed stock must be **visually distinct** from confirmed stock
- Approximate quantities must not be rendered like measured ones
- Plot-level location must not look like stack-level location
- Estimated physical quantity must never be presented as book quantity
- Insurance figures must carry their advisory label

**Provisional stock is not an error state.** Style it as ordinary. If the UI makes it look
like a problem to clear, staff will invent lot numbers — the exact failure the product
exists to prevent.

## Minimise typing

Smart defaults · remembered last values · copy-paste grids · row duplication · common-value
application. Every field the user does not type is a field they cannot mistype.

## Quantities

Right-aligned · tabular figures so columns align · fixed decimal places · thousands
separators · unit always shown.

## Accessibility — WCAG 2.1 AA

Keyboard reachable · visible focus · labelled controls · errors announced and associated
with their field · contrast met · screen-reader-usable tables · `prefers-reduced-motion`
respected.

The 2D map needs an accessible equivalent view (ADR-0003).

## Mobile

Test at 360px. Touch targets at least 44×44px. The primary user is on a mid-range Android
phone in daylight — verify it is actually usable there, not merely that it renders.

## Test data

Realistic agricultural data — Tur, Chana, real vehicle formats, plausible weights and bag
counts. **Never `foo` or `test123`.** Unrealistic data hides layout, rounding and validation
bugs that real data exposes immediately.

## Checklist

- [ ] All seven states implemented
- [ ] Uncertainty displayed honestly
- [ ] Provisional styled as normal, not as an error
- [ ] Typing minimised
- [ ] Quantities aligned with tabular figures and units
- [ ] Keyboard navigable, focus visible
- [ ] axe-core clean
- [ ] Usable at 360px on a real device
- [ ] Realistic data used in verification
- [ ] Strings externalised for translation
- [ ] Not a generic admin template
