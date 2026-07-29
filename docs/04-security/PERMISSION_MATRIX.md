# Permission Matrix

Roles from blueprint §5.4, permission types from §5.2.

**Status:** Draft for business approval. Blueprint §33 requires an approved role matrix
before go-live. Every cell must be confirmed by Rajguru Foods management before Phase 3
implementation begins.

---

## Permission types

View · Create · Edit draft · Submit · Verify · Approve · Reject · Reverse · Adjust ·
Override · Export · Print · Upload · Download · Allocate · Reclassify · Transfer · Close ·
Reopen · Manage master · Manage user · View valuation · View insurance · Edit insurance ·
View audit history

---

## Roles and core capability

Legend: **●** full · **◐** within scope and limit · **○** none · **▲** requires approval

| Role | View stock | Weighment | Inward | Identify | Transfer | Outward | Adjust | Override | Masters | Users | Insurance | Audit |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Super Administrator | ● | ● | ● | ● | ● | ● | ▲ | ▲ | ● | ● | ◐ | ● |
| Business Administrator | ● | ● | ● | ● | ● | ● | ▲ | ▲ | ● | ◐ | ● | ● |
| Management Viewer | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ◐ |
| Warehouse Manager | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ▲ | ○ | ○ | ○ | ○ | ◐ |
| Warehouse Operator | ◐ | ◐ | ◐ | ◐ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Weighment Entry Operator | ◐ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Weighment Verifier | ◐ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ◐ |
| Gate Operator | ◐ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Quality Inspector | ◐ | ○ | ○ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Fumigation Operator | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Fumigation Approver | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ◐ | ○ | ○ | ○ | ◐ |
| Stock Accountant | ● | ◐ | ◐ | ◐ | ◐ | ◐ | ▲ | ○ | ○ | ○ | ◐ | ● |
| Dispatch Executive | ◐ | ◐ | ○ | ○ | ○ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ |
| Physical Verification Team | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Discrepancy Reviewer | ● | ○ | ○ | ○ | ○ | ○ | ▲ | ○ | ○ | ○ | ○ | ● |
| Insurance Manager | ● | ○ | ○ | ○ | ○ | ○ | ○ | ▲ | ○ | ○ | ● | ◐ |
| Insurance Viewer | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ◐ | ○ |
| Auditor | ● | ◐ | ◐ | ◐ | ◐ | ◐ | ○ | ○ | ◐ | ○ | ◐ | ● |
| Report Viewer | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Read-Only User | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |

**Auditor is read-only across the board.** The ◐ marks in operational columns mean *view and
export within scope*, never create or edit.

---

## Non-negotiable rules

**No role can edit posted stock.** There is no permission that permits direct modification
of a posted ledger entry. `Adjust` creates a new, reasoned, approved transaction — it never
edits history (INV-02, DR-41).

**Override is separate from administration.** Holding Super Administrator does not confer
commercial override rights; override is granted explicitly and separately (DR-50).

**Approve never combines with self-made work.** A user may hold both maker and approver
roles, but the system rejects approval of their own transaction regardless of role (INV-24).

**Insurance never writes stock.** Every insurance role has read-only access to stock tables,
enforced by grant (INV-21).

**View valuation is separate from view stock.** Quantity visibility and value visibility are
different permissions — most operational roles see quantities without seeing money.

---

## Scope dimensions

Every assignment is bounded by: company · facility · plot · godown · department ·
commodity · ownership type · transaction type · value limit · quantity limit.

The same user may hold the same role at several scopes, and different roles at the same
scope. Example (blueprint §5.1):

| User | Role | Scope |
|---|---|---|
| Ramesh | Warehouse Supervisor | Aliyabad Godown 1 |
| Ramesh | Fumigation Approver | Aliyabad Facility |
| Ramesh | Stock Viewer | All facilities |

Effective permission is the **union** of granted permissions across assignments, with each
permission constrained to the scope of the assignment that granted it. Ramesh can approve
fumigation across the Aliyabad facility, but supervise only Godown 1, and view everywhere.

---

## Open items for business approval

1. Confirm the role list matches the actual organisation; add or remove roles.
2. Set the value and quantity limits for each approval-capable role.
3. Confirm who holds override authority, and which overrides need dual approval.
4. Confirm which roles may view valuation and insurance figures.
5. Confirm whether Auditor may export, and whether exports are watermarked.
6. Confirm the leaver process — how quickly access is revoked, and by whom.
