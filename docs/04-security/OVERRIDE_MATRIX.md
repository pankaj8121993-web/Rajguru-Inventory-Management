# Override Matrix

Blueprint §22. Overrides exist because real warehouse operations produce genuine exceptions.
They are permitted, controlled and visible — never silent.

**Status:** Draft for business approval.

---

## The rule that governs all overrides

> **An override can never silently change a quantity** (INV-19).

An override lifts a *restriction*. It never rewrites a *number*. If stock quantity must
change, that is a stock adjustment — a separate, reasoned, approved transaction with its own
audit trail. An override that appears to change a quantity is a defect.

---

## Universal controls

Every override, without exception, requires:

1. A **separate override permission** — never implied by administrative access (DR-50)
2. **Maker-checker** — the requester is never the approver
3. A **mandatory reason** from the configured reason list, plus free text
4. **Supporting documentation** where the matrix requires it
5. **Retention of the original value** — always visible afterwards
6. An **effective period** — temporary or permanent, with an expiry date where temporary
7. A **complete audit record**
8. **Alerting** on repeated overrides of the same type, and on overrides nearing expiry

---

## Override areas

Risk levels: **Low** single approval · **Medium** senior approval · **High** dual approval

| Override area | Risk | Approver | Document | Time-boxed |
|---|---|---|---|---|
| Backdated transaction | High | Business Administrator ×2 | Required | Per transaction |
| Location restriction | Medium | Warehouse Manager | Optional | Yes |
| Capacity limit exceeded | Medium | Warehouse Manager | Optional | Yes |
| Fumigation due date extension | Medium | Fumigation Approver | Required | Yes |
| Fumigation safety-period restriction | **High** | Fumigation Approver ×2 | Required | Per dispatch |
| Quality status | Medium | Warehouse Manager | Required | Per lot |
| Reservation release | Low | Warehouse Manager | Optional | Per reservation |
| Ownership classification | High | Business Administrator ×2 | Required | Permanent |
| Party allocation | Medium | Stock Accountant | Required | Per transaction |
| Weighment allocation | Medium | Stock Accountant | Required | Per transaction |
| Lot closure precondition | **High** | Business Administrator ×2 | Required | Per lot |
| Approval routing | High | Super Administrator + Business Administrator | Required | Yes |
| Physical verification status | Medium | Stock Accountant | Required | Per session |
| Insurance coverage allocation | High | Business Administrator ×2 | Required | Per policy period |
| Insurance valuation assumption | High | Business Administrator ×2 | Required | Per period |
| Dispatch restriction — blocked stock | High | Business Administrator ×2 | Required | Per dispatch |
| Dispatch restriction — pledged stock | **High** | Business Administrator ×2 | Required + lender release | Per dispatch |
| Expired chemical use | High | Business Administrator ×2 | Required | Per event |
| Duplicate weighment acceptance | Low | Warehouse Manager | Optional | Per slip |

---

## What can never be overridden

No override, at any authority level, can:

- Make stock negative (INV-01)
- Edit or delete a posted ledger entry (INV-02)
- Post a quantity without an inventory segment (INV-03)
- Permit a maker to approve their own transaction (INV-24)
- Make an approximate physical verification alter book stock (INV-13)
- Change a quantity without an adjustment transaction (INV-19)
- Remove or bypass an audit event
- Grant a user a permission or scope they do not hold

These are structural. There is no permission that unlocks them, and no code path that
implements them.

---

## Lifecycle

Request → state the restriction being overridden → mandatory reason → attach documentation →
approval (dual where required) → apply with effective period → monitor → expire → audit.

An expiring override alerts its holder and approver before expiry. On expiry the restriction
returns automatically; nothing is left permanently open by inaction.

---

## Monitoring

The exception dashboard (blueprint §23.6) surfaces:

- Overrides by type, frequency and user
- Repeated overrides of the same type at the same location
- Overrides nearing expiry
- Expired overrides that were relied upon
- Overrides applied outside business hours
- Users with a materially higher override rate than peers

**A high override rate is a process signal, not just a compliance one.** If a restriction is
overridden constantly, either the restriction is wrong or the process around it is — both
deserve investigation rather than more overrides.

## Open items for business approval

1. Confirm the risk level assigned to each area.
2. Confirm who holds override authority, per area.
3. Set the default effective period for each time-boxed override.
4. Set the repeat-override alert threshold.
5. Confirm the review cadence for the override report.
