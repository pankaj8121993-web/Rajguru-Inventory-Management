---
name: report-development
description: Procedure for building reports and dashboards, including reconciliation to the ledger and correct handling of provisional stock. Use when building any report, dashboard or export.
---

# Report Development

50 reports and 6 dashboards: blueprint §23, §24.

## The gate

> **Every report must reconcile to the stock ledger.**

A report that does not reconcile is a defect, not a rounding difference. Reconciliation is
part of the report's test, not a manual check afterwards.

## The join trap — the most likely defect

**A careless inner join to `lots` silently hides every provisional segment.**

```sql
-- WRONG: drops all stock without a final lot
FROM stock_ledger s JOIN lots l ON l.id = s.lot_id

-- RIGHT: provisional stock stays visible
FROM stock_ledger s LEFT JOIN lots l ON l.id = s.lot_id
```

Outer join by default. An inner join needs justification. The same applies to insurance
coverage — outer-join from stock to policy so uncovered stock cannot vanish (INV-23).

## Show uncertainty

Reports must distinguish: confirmed versus provisional versus unidentified stock ·
exact versus approximate location · book versus estimated physical quantity ·
covered versus uncovered stock.

**Never present an estimate in a column that reads as a fact.** Label the basis.

## Every report needs

Filters · saved views · Excel export · PDF export · scheduled delivery · drill-down to the
source record.

Drill-down matters most: a number nobody can trace back is a number nobody will trust.

## Security

Reports respect scope — a user's report contains only rows they could read directly.
Exports are generated server-side. Every query is bounded and paginated (NFR-07).

## Performance

Report queries run against real volumes. Check the query plan. Add indexes with evidence,
not by guess, and register them.

## Checklist

- [ ] Reconciles to the ledger — tested
- [ ] Outer joins so provisional and uncovered stock stay visible
- [ ] Uncertainty distinguished and labelled
- [ ] Filters, saved views, Excel, PDF, scheduling, drill-down
- [ ] Scope-respecting; export cannot exceed the user's read access
- [ ] Query bounded and indexed
- [ ] Tested with realistic volumes
