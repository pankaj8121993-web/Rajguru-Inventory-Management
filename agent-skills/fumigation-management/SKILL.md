---
name: fumigation-management
description: Fumigation events, chemicals, safety periods, dispatch restrictions and fumigation history flowing to lots. Use when working on fumigation or chemical inventory.
---

# Fumigation Management

## Scope

Fumigation may be recorded against: facility · plot · godown · bay · stack · bin ·
**provisional batch** · **unidentified pool** · final lot.

Provisional and unidentified stock get fumigated in reality, so they must be fumigable in
the system.

## Record

Fumigation number · date · location · lots or segments · quantity covered · chemical ·
batch · dosage · quantity consumed · vendor · operator · supervisor · start · exposure ·
opening date · safety period · result · follow-up · next due · photographs · certificate ·
remarks.

## Controls

- Due and overdue alerts
- **Dispatch restricted during the safety period** — lifting it early is a high-risk
  override with dual approval (DR-32)
- Chemical stock decremented on use
- Expired chemical requires an override (DR-33)
- Repeat infestation at the same location within the configured window raises an alert
- Coverage certainty recorded
- Cost per tonne

## History must follow the stock

When provisional stock later becomes final lots, **fumigation history flows to those lots in
proportion to quantity and location coverage** (DR-22).

This is easy to miss and matters: a lot that appears never to have been fumigated, because
its fumigation happened while it was still a provisional batch, will trigger a false
overdue alert and possibly an unnecessary re-fumigation.

## Checklist

- [ ] Can provisional batches and unidentified pools be fumigated?
- [ ] Does the safety period restrict dispatch?
- [ ] Does early release require override with dual approval?
- [ ] Is chemical inventory decremented?
- [ ] Is expired chemical blocked without override?
- [ ] Does history flow through on identification?
- [ ] Do due and overdue alerts fire correctly?
