# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning is [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added — 2026-07-29 — Phase 0 governance foundation

- `AGENTS.md` and `CLAUDE.md` agent contracts
- Master blueprint installed as `docs/00-product/MASTER_BLUEPRINT.md`, the product authority
- Product requirements (FR-01..56, NFR-01..15) and scope
- Domain glossary, domain rules (DR-01..54), inventory invariants (INV-01..25),
  workflows (W1..W14), master data catalogue
- Architecture, dependency register and four ADRs
- Data model design and an empty migration register
- Security model, permission / approval / override matrices, threat model
- Test strategy, UAT plan, test register
- Deployment, backup and restore, incident response
- Current state, capability register, MCP register, decision log, phased backlog
- 20 project skills with a sync script
- GitHub issue and PR templates, CI workflow, CodeQL, Dependabot, Gitleaks, Semgrep

**No application code, database schema or tests.** Phase 0 is governance only.
