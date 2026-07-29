---
name: rls-security-review
description: Review procedure for Row Level Security policies, grants and access control on any new or changed table. Use whenever a table, policy, grant or role is created or modified.
---

# RLS Security Review

## Baseline

**Every business table has RLS enabled from creation** (NFR-03). Not "added later" — a table
must never exist without it, even briefly.

The anon and publishable keys are public by design. **RLS and grants are the protection —
never key secrecy.**

## The write boundary

`INSERT`, `UPDATE` and `DELETE` are **not granted** to `anon` or `authenticated` on
`stock_ledger`, `stock_transactions`, `inventory_segments` or any balance table (ADR-0004).

Stock posting happens only through the server-side service and its transactional function.
The service-role key is server-only and never enters a client bundle (INV-25).

## Review every policy for

| Check | Question |
|---|---|
| Enabled | Is RLS actually on? A policy on a table without RLS enabled does nothing |
| Scope | Does it filter by the user's effective scope — company, facility, plot, godown, commodity, owner? |
| Operation | Separate policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE`? |
| Negative case | Is there a test proving a user **cannot** see or write outside their scope? |
| IDOR | Is access authorised by scope, not by knowing an identifier? **A UUID is not an access control** |
| Escalation | Can a user modify their own roles or scopes? (Must be no) |
| Self-approval | Is it blocked in the policy as well as in the service and the constraint? |
| Insurance | Does the insurance role hold only read access to stock tables? (INV-21) |
| Performance | Does the policy's predicate use an index? A slow policy runs on every row |

## Testing

Every policy needs **both**: a positive test proving authorised access works, and a negative
test proving unauthorised access fails.

A policy with only positive tests is untested — the failure mode that matters is the one
where someone sees data they should not.

## Defence in depth

Authorisation is enforced in RLS **and** in the service layer. The duplication is
deliberate. Never remove one because the other exists.

## Checklist

- [ ] RLS enabled on every new table
- [ ] Policies for every operation
- [ ] Positive and negative tests for each
- [ ] No client write grants on stock tables
- [ ] Service-role key server-only
- [ ] Scope filtering correct
- [ ] Users cannot alter their own access
- [ ] Insurance read-only on stock
- [ ] Policy predicates indexed
