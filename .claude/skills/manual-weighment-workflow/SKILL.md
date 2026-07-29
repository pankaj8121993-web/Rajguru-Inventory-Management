---
name: manual-weighment-workflow
description: Procedure for weighment slip entry, day-wise and invoice-wise bulk entry, Excel and CSV import, duplicate detection, verification, correction and reversal. Use when working on any weighment feature.
---

# Manual Weighment Workflow

Entry is **manual**, from physical, photographed, scanned or PDF slips. **No weighbridge
hardware integration** may be built without separate written approval (DR-07).

## The five weights

Persist all five as separate columns. None overwrites another (DR-02).

`gross_weight` · `tare_weight` · `calculated_net_weight` (= gross − tare, system-computed) ·
`printed_net_weight` (as transcribed from the slip) · `net_difference`

The user never types the calculated net. Where calculated and printed differ: show the
difference and the percentage, require a reason beyond tolerance, require approval beyond
the escalation threshold, and preserve both values permanently.

## Statuses

draft → awaiting document → awaiting verification → verified → partially allocated →
fully allocated → posted. Plus disputed, reversed, cancelled.

Correction is free **before** posting. After posting, contra entry only (DR-06).

## Bulk entry — the highest-value screen

Must support: spreadsheet grid · paste from Excel · Excel import · CSV import ·
common-value application down a column · row duplication · row-level validation ·
batch-level validation · save draft · bulk attachment upload · partial posting ·
error export.

**If bulk entry is slower than the spreadsheet it replaces, staff will keep using the
spreadsheet.** Optimise for keyboard throughput.

## Duplicate detection

Compare across all nine: slip number · weighbridge · date · vehicle · gross · tare · net ·
party · commodity · direction.

Outcomes are explicit choices — warning, reviewed and accepted, confirmed duplicate,
cancelled, or linked to the earlier record. **Never auto-merge.**

## Relationships are many-to-many

One inward may draw on many slips. One invoice may relate to many slips. One slip may split
across several inventory segments. Never model any of these as one-to-one (DR-04).

## Checklist

- [ ] All five weight values persisted separately
- [ ] Calculated net computed, never typed
- [ ] Tolerance from configuration, not hard-coded
- [ ] Duplicate check covers all nine fields
- [ ] Bulk grid supports paste and keyboard navigation
- [ ] Error export works on a failed import
- [ ] Attachment linked to the slip
- [ ] Decimal arithmetic throughout
