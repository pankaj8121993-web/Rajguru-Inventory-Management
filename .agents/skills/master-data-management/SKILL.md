---
name: master-data-management
description: Procedure for creating and maintaining master and reference data — commodities, parties, locations, vehicles, employees, reason codes, statuses and thresholds. Use when adding or changing any master.
---

# Master Data Management

Catalogue: `docs/01-domain/MASTER_DATA_CATALOGUE.md`.

## The rule

**No business master is hard-coded in source** (DR-52). Commodities, reason codes, document
types, statuses and thresholds are configuration the business can change without a
developer.

## Every master needs

Unique code (human-meaningful, alongside the UUID key) · name · description · active flag ·
effective date · expiry where relevant · created by · approved by · change history ·
attachments · notes · import · export · duplicate prevention · maker-checker where required.

## Two rules that are easy to get wrong

**Changing a master never rewrites history** (DR-53). A posted transaction retains the
values that applied when it posted. If renaming a commodity changes what an old transaction
says, the model is wrong.

**A master in use is deactivated, never deleted** (DR-54). Deletion breaks traceability.

## Enum or table?

| Use an enum | Use a table |
|---|---|
| Structural, appears in invariant logic | Anything the business may extend |
| Identification confidence, location precision | Reason codes, document types, statuses |
| Changing it is a schema decision | Changing it is a business decision |

**The business must be able to add a loss reason without a developer and a migration.**
When unsure, choose a table.

## Import and export

Every master supports Excel and CSV import with row-level validation and an error export.
Opening-stock migration (Phase 13) depends on this working properly.

## Checklist

- [ ] Nothing hard-coded that the business might change
- [ ] Code plus UUID key
- [ ] Effective dating, and history preserved
- [ ] Deactivate rather than delete
- [ ] Duplicate prevention
- [ ] Import with validation and error export
- [ ] Maker-checker where the master affects valuation, insurance or access
- [ ] RLS enabled
