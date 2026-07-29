---
name: project-startup-audit
description: Read-only audit that must run at the start of every session before any code is written. Use when beginning any session on the Rajguru Foods platform, when asked to continue previous work, or when the state of the project is unclear.
---

# Project Startup Audit

**This is the mandatory first action of every session.** It is read-only. Do not edit
anything until the report is produced.

## Read, in order

1. `AGENTS.md`
2. `CLAUDE.md`
3. `README.md`
4. `docs/09-ai-governance/CURRENT_STATE.md` — the honest status
5. `docs/00-product/MASTER_BLUEPRINT.md` — the product authority
6. `docs/00-product/PRODUCT_REQUIREMENTS.md`
7. `docs/01-domain/DOMAIN_RULES.md`
8. `docs/01-domain/INVENTORY_INVARIANTS.md`
9. `docs/01-domain/WORKFLOWS.md`
10. `docs/02-architecture/ARCHITECTURE.md`
11. `docs/02-architecture/DEPENDENCY_REGISTER.md`
12. `docs/03-database/DATA_MODEL.md`
13. `docs/03-database/MIGRATION_REGISTER.md`
14. `docs/04-security/SECURITY_MODEL.md`
15. `docs/04-security/PERMISSION_MATRIX.md`
16. `docs/04-security/APPROVAL_MATRIX.md`
17. `docs/04-security/OVERRIDE_MATRIX.md`
18. `docs/08-releases/BUGS.md`
19. `docs/08-releases/KNOWN_ISSUES.md`
20. `docs/08-releases/CHANGELOG.md`

Then check: recent git history · worktree status · open issues and PRs · installed skills ·
connected MCP servers · available subagents · current test status · migration status.

## Report

- Current project phase
- Existing implementation — what actually runs, not what exists as files
- Missing modules
- Relevant files for the requested task
- Existing bugs
- Security risks
- Data migration risks
- Test status — exact commands and results
- Proposed task plan
- Acceptance criteria
- Relevant skills, MCPs, repositories, subagents
- Assumptions
- Risks

## Rules

- **Do not ask questions the repository or blueprint already answers.**
- Where a minor detail is missing, make a reasonable documented assumption and state it.
- Where a decision materially affects stock accuracy, insurance reporting, security or
  architecture, create an ADR rather than deciding silently.
- If code and blueprint conflict: stop, document the conflict, identify which is outdated,
  raise an ADR if architectural, update both together. **Never silently pick one.**
- Distinguish "file exists" from "feature works". `CURRENT_STATE.md` records actual status;
  trust it over the presence of code.
