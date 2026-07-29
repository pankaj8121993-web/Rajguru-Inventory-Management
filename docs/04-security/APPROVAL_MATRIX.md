# Approval Matrix

Which transactions require approval, from whom, and at what threshold.

**Status:** Draft for business approval. Thresholds marked `TBD` must be set by Rajguru
Foods management before Phase 3. They are **configuration**, not code — changing a threshold
must never require a deployment.

---

## Universal rules

1. **A maker can never approve their own transaction** (INV-24). Enforced in the service
   layer, by `CHECK` constraint, and by RLS policy — all three.
2. Approval is scoped. An approver can only approve within their own scope.
3. Approval limits are per role assignment, by value or quantity.
4. Where no eligible approver exists in scope, the request escalates to the next level
   rather than silently blocking or auto-approving.
5. Every approval action is audited with approver, timestamp, decision and comments.
6. Rejection requires a reason. A rejected transaction returns to draft for amendment; it is
   never deleted.
7. Delegation is explicit, time-boxed and audited. A delegate is subject to the same
   self-approval prohibition.

---

## Approval requirements

| Transaction | Maker | Approver | Threshold | Dual approval |
|---|---|---|---|---|
| **Weighment** |
| Weighment entry | Weighment Entry Operator | Weighment Verifier | All | No |
| Net difference within tolerance | Operator | — | Auto | No |
| Net difference beyond tolerance | Operator | Warehouse Manager | > TBD % | No |
| Duplicate accepted as genuine | Operator | Warehouse Manager | All | No |
| Weighment reversal after posting | Operator | Stock Accountant | All | No |
| **Inward** |
| Standard inward | Warehouse Operator | Warehouse Manager | All | No |
| Inward with no final lot | Warehouse Operator | Warehouse Manager | All | No |
| Backdated inward | Warehouse Operator | Business Administrator | > TBD days | Yes |
| **Identification** |
| Identify provisional stock | Warehouse Supervisor | Stock Accountant | All | No |
| Reclassify commodity or grade | Quality Inspector | Warehouse Manager | All | No |
| Correction of a posted entry | Originator | Stock Accountant | All | No |
| Location refinement | Warehouse Operator | Warehouse Manager | All | No |
| **Movement** |
| Internal transfer | Requestor | Warehouse Manager | All | No |
| Inter-facility transfer | Requestor | Business Administrator | All | No |
| Outward — standard | Dispatch Executive | Warehouse Manager | All | No |
| Outward — from provisional stock | Dispatch Executive | Business Administrator | All | **Yes** |
| Outward — pledged stock | Dispatch Executive | Business Administrator | All | **Yes** |
| Outward — blocked or fumigation-restricted | Dispatch Executive | Warehouse Manager + override holder | All | **Yes** |
| Ownership transfer | Stock Accountant | Business Administrator | All | No |
| **Quality and fumigation** |
| Quality result | Quality Inspector | — | All | No |
| Quality override | Quality Inspector | Warehouse Manager | All | No |
| Conditional acceptance | Quality Inspector | Warehouse Manager | All | No |
| Fumigation execution | Fumigation Operator | Fumigation Approver | All | No |
| Early release from safety period | Fumigation Operator | Fumigation Approver | All | **Yes** |
| Use of expired chemical | Fumigation Operator | Business Administrator | All | **Yes** |
| **Verification and adjustment** |
| Physical verification | Verification Team | Warehouse Manager | All | No |
| Discrepancy closed without adjustment | Discrepancy Reviewer | Stock Accountant | All | No |
| Stock adjustment — gain | Stock Accountant | Warehouse Manager | ≤ TBD | No |
| Stock adjustment — gain | Stock Accountant | Business Administrator | > TBD | **Yes** |
| Stock adjustment — loss | Stock Accountant | Warehouse Manager | ≤ TBD | No |
| Stock adjustment — loss | Stock Accountant | Business Administrator | > TBD | **Yes** |
| Damage write-off | Stock Accountant | Business Administrator | All | **Yes** |
| Lot closure | Warehouse Manager | Stock Accountant + Business Administrator | All | **Yes** |
| Lot reopening | Stock Accountant | Business Administrator | All | **Yes** |
| **Insurance** |
| Policy creation or renewal | Insurance Manager | Business Administrator | All | No |
| Coverage allocation override | Insurance Manager | Business Administrator | All | **Yes** |
| Valuation basis change | Insurance Manager | Business Administrator | All | **Yes** |
| Claim submission | Insurance Manager | Business Administrator | All | No |
| **Masters and access** |
| Commodity, party, location master | Business Administrator | Super Administrator | All | No |
| Reason code or threshold change | Business Administrator | Super Administrator | All | No |
| User creation | Super Administrator | Business Administrator | All | No |
| Role assignment | Super Administrator | Business Administrator | All | No |
| Grant of override authority | Super Administrator | Business Administrator | All | **Yes** |
| **Override** |
| Standard override | Any override holder | Business Administrator | All | No |
| High-risk override | Any override holder | Business Administrator ×2 | All | **Yes** |

---

## Escalation

Pending approvals escalate after a configured period. Escalation notifies the approver's
reporting manager; it **never auto-approves**. An approval that no one grants stays pending
and appears on the exception dashboard.

## Delegation

An approver may delegate for a defined period with a stated reason. The delegate must hold
an equal or higher approval limit. Delegated approvals are marked as such in the audit
trail. The self-approval prohibition applies to the delegate exactly as it does to the
original approver.

## Open items for business approval

1. Set every `TBD` threshold, by commodity where the business wants different limits.
2. Set the net-weight difference tolerance percentage.
3. Set the backdating window before extra approval is required.
4. Confirm the escalation period and the escalation path.
5. Confirm whether inter-facility transfers need approval at both ends.
6. Confirm who may act as second approver on dual-approval transactions.
