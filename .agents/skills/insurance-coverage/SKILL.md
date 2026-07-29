---
name: insurance-coverage
description: Insurance policies, location and commodity coverage, sub-limits, coverage ratio, underinsurance analysis, alerts and claims. Use when working on any insurance feature.
---

# Insurance Coverage

## Three rules that govern everything here

1. **Insurance data never alters stock quantity** (INV-21). The module holds read-only
   grants on stock tables, enforced by grant, not convention.
2. **Every figure is a management indicator, not a legal determination** (INV-22). It does
   not replace interpretation of the policy wording. Label it accordingly.
3. **Stock at uncovered locations must always be visible** (INV-23). Coverage queries
   outer-join from stock to policy so uncovered stock can never be silently filtered out.

## Define before calculating

Development prompt §14 requires these decided first:

1. Valuation basis
2. Policy allocation method
3. Sub-limits
4. Average-clause treatment
5. Ownership eligibility
6. Location eligibility
7. Commodity eligibility
8. Tests for underinsurance and exclusions

**The valuation basis is currently undecided** (blocker 4 in `CURRENT_STATE.md`). Do not
build coverage calculations before it is chosen — every figure depends on it.

## Calculations

- **Coverage ratio** = available valid cover ÷ current insurable stock value
- **Uninsured value** = insurable stock value − available valid cover
- **Potential underinsurance** where stock value exceeds cover
- **Expiry risk** — policies expiring within the configured window
- **Unendorsed location risk** — stock at a location the policy does not name
- **Excluded commodity risk** — commodity present but not covered

## What counts as valid cover

Only where **all** hold: the policy is active on the date · the location is endorsed · the
commodity is not excluded · the ownership type is eligible (DR-44).

Anything failing these is **reported as a risk**, never silently treated as covered. This is
the difference between a useful tool and a dangerous one.

## The average clause

Where sum insured is below value at risk, the insurer reduces claims proportionately. This
is what makes underinsurance expensive, and it is the main reason this module exists.
Model it explicitly.

## Overrides

Preserve the original calculation, the revised allocation, the reason, the document, the
approver and the effective period (DR-47).

## Snapshots

`insurance_valuation_snapshots` stores the assumption set with each calculation so figures
are reproducible and auditable months later.

## Checklist

- [ ] Is the valuation basis decided and recorded?
- [ ] Does the module hold only read grants on stock? — verified by test
- [ ] Do coverage queries outer-join so uncovered stock stays visible?
- [ ] Is every figure labelled advisory with its assumptions?
- [ ] Are eligibility rules applied for date, location, commodity and ownership?
- [ ] Is the average clause modelled?
- [ ] Are snapshots stored for reproducibility?
