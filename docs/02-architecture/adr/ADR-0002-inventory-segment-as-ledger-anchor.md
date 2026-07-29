# ADR-0002 — The inventory segment, not the lot, anchors the stock ledger

- **Status:** Accepted
- **Date:** 2026-07-29
- **Deciders:** Rajguru Foods (product owner), platform architect

## Context

Conventional inventory systems anchor stock to a lot or batch: every quantity has a
`lot_id`, and the lot is known when stock is received.

**That assumption is false in this business.** Stock arrives from farmers, traders,
auctions and government sources under conditions where, at the moment of inward:

- the final lot may not be decided
- the grade may not be assessed
- the commodity may be known only broadly ("Tur", not yet "Lemon Tur")
- the exact storage location may be a plot, not a stack
- one vehicle's load may end up split across several eventual lots
- stock may be mixed and require later segregation

The blueprint's core principle — "record what is known, clearly identify what is not
known" — forbids the usual workaround of inventing a placeholder lot number. A placeholder
lot is a lie in the ledger, and it destroys the distinction between stock that is genuinely
identified and stock that is not.

## Decision

Introduce the **inventory segment** as the permanent anchor of stock identity.

- `stock_ledger.inventory_segment_id` is `NOT NULL`. Every posted quantity has one.
- `stock_ledger.lot_id` is **nullable** and stays null until identification genuinely
  happens.
- An inventory segment carries its own `identification_status`, `identification_confidence`
  and `location_precision`, all `NOT NULL`.
- A segment may later be assigned to a lot, split across several lots, merged, reclassified,
  refined to an exact location, transferred, dispatched, reconciled or closed — while
  remaining traceable to the original inward.

This is invariants INV-03, INV-04, INV-06 and INV-07.

## Rationale

The segment separates two things the conventional model conflates: **the existence and
quantity of stock**, which is always known, and **the identity of that stock**, which
matures over time.

Because the ledger anchors on the segment, the ledger is complete and correct from the
first posting. Identity improves later without any ledger rewrite — identification is a new
event, not an edit to history. That is what makes INV-02 (immutable ledger) compatible with
progressive identification.

It also makes uncertainty *queryable*. "How much stock has no final lot, and how long has it
been that way?" is a straightforward query over segments. Under a placeholder-lot model that
question is unanswerable, which is precisely why provisional stock goes unmanaged in
spreadsheet-based operations today.

## Consequences

**Positive.** No user is ever asked to invent a lot number, a grade or a stack. Provisional,
unidentified and mixed stock become first-class, reportable, ageing-tracked states. Partial
identification and partial location refinement work naturally. The ledger never needs
rewriting as identity improves.

**Negative.** More conceptual surface — "segment" is a term staff must learn, and training
must cover it. Reporting must always be capable of grouping by segment *and* by lot, since
lot may be absent. Every query that joins to lots must handle the null case correctly; a
careless inner join silently hides all provisional stock, which would be a serious defect.

**Follow-on obligations.**
- Never add `NOT NULL` to `stock_ledger.lot_id`. A test asserts this (INV-04).
- Never create a placeholder, default or "unknown" lot record.
- Reports joining lots use outer joins by default; inner joins require justification.
- Segment splits and merges must conserve quantity exactly (INV-08, INV-15, INV-16).

## Alternatives considered

**Mandatory lot with placeholder values.** Rejected. It creates false certainty, makes
genuinely-identified stock indistinguishable from unidentified stock, and violates the
product's central principle.

**Nullable `lot_id` with no segment concept.** Rejected. Without a permanent anchor there is
nothing to attach identification status, confidence, location precision, responsible person
or fumigation history to before a lot exists — and nothing stable to trace back to after the
lot is assigned.

**A separate "provisional stock" table parallel to the main ledger.** Rejected. Two ledgers
means two sources of truth, reconciliation between them, and the certainty that they will
eventually disagree. One ledger, with identity as an attribute, is the safer design.
