# Dependency Register

Every third-party dependency must be recorded here **before** it is added, with the
evaluation below completed. This is required by development prompt §5.

**Required evaluation for any new dependency:** repository · purpose · license ·
maintainer · latest stable release · release activity · security advisories ·
compatibility · bundle impact · transitive dependency impact · alternative considered ·
reason selected.

---

## Status

No dependencies are installed yet. The repository is at Phase 0 (governance only) and
contains no application code, no `package.json` and no lockfile.

The table below is the **approved candidate list** — dependencies pre-cleared by the
blueprint and development prompt §5. Each still requires its evaluation row completed at
the moment of installation, because license, advisories and release activity must be
checked against reality on that date rather than assumed from this list.

---

## Approved candidates

### Core

| Package | Purpose | License | Notes |
|---|---|---|---|
| `next` | Application framework, App Router, server actions | MIT | Vercel. Pin major; upgrade deliberately. |
| `react`, `react-dom` | UI runtime | MIT | Version must match Next.js support matrix. |
| `typescript` | Type safety | Apache-2.0 | `strict: true` required. |
| `@supabase/supabase-js` | Database, auth and storage client | MIT | Server and browser clients configured separately — see ADR-0004. |
| `@supabase/ssr` | Cookie-based session handling in Next.js | MIT | Required for correct server-side auth. |

### UI

| Package | Purpose | License | Notes |
|---|---|---|---|
| `tailwindcss` | Styling | MIT | |
| shadcn/ui | Component source, copied in | MIT | Not a runtime dependency — source is vendored and owned. Must be customised, not used as a generic admin template. |
| Radix primitives | Accessible primitives underlying shadcn/ui | MIT | Pulled in per component actually used, not wholesale. |
| `react-hook-form` | Forms | MIT | |
| `zod` | Schema validation | MIT | Shared between client and server; server validation is the authoritative one. |
| `@tanstack/react-query` | Server state | MIT | |
| `@tanstack/react-table` | Dense grids for bulk entry and reports | MIT | Headless — required for the copy-paste grid in FR-02. |

### Decimal arithmetic — mandatory

| Package | Purpose | License | Notes |
|---|---|---|---|
| `decimal.js` *or* `big.js` | Exact decimal arithmetic for quantities | MIT | **Required by NFR-01 and INV cross-cutting rules.** JavaScript `number` must never be used for a stock quantity. Choose one at Phase 4 and record an ADR; do not use both. |

### Spatial

| Package | Purpose | License | Notes |
|---|---|---|---|
| `konva`, `react-konva` | 2D warehouse layout | MIT | Phase 11. See ADR-0003. |
| `three`, `@react-three/fiber`, `@react-three/drei` | 3D layout | MIT | Phase 14 only. Do not install earlier. |

### Testing

| Package | Purpose | License | Notes |
|---|---|---|---|
| `vitest` | Unit and service tests | MIT | |
| `@testing-library/react` | Component tests | MIT | |
| `@playwright/test` | End-to-end tests | Apache-2.0 | |
| `axe-core`, `@axe-core/playwright` | Accessibility testing | MPL-2.0 | MPL-2.0 is file-level copyleft; used as a test-time dependency only, not distributed. Acceptable. |

### Security and quality

| Tool | Purpose | License | Notes |
|---|---|---|---|
| `@sentry/nextjs` | Error tracking | MIT | Must scrub quantities, party names and personal data from payloads. |
| Gitleaks | Secret scanning | MIT | CI. |
| Semgrep | Static analysis | LGPL-2.1 (CLI) | CI. Run as a tool, not linked — no distribution obligation. |
| CodeQL | Static analysis | GitHub terms | Free for this repository. |
| Dependabot | Dependency updates | GitHub | Configured. |
| `eslint`, `prettier` | Linting and formatting | MIT | |

---

## Prohibited

Do not add, and do not propose without an ADR overturning ADR-0001:

- MongoDB or any second primary database
- Kafka or any event-streaming platform
- Kubernetes or a microservice runtime
- Redis, unless a measured performance need is demonstrated first
- Any SaaS starter kit, billing library, subscription library or marketing template
- Any generic multi-tenancy framework
- Any package under AGPL, SSPL or a commercial license without written approval
- Any package pulling a headless browser or native binary into the production runtime

---

## Adding a dependency

1. Complete the evaluation checklist above.
2. Add a row to this register with the evaluation filled in and the date.
3. Prefer the platform or an existing dependency over a new one. A dependency for something
   the standard library or an installed package already does is not approved.
4. Check bundle impact for anything reaching the client.
5. Record the alternative considered and why it was rejected — an empty "alternative
   considered" field means the evaluation was not done.
6. If the choice is architecturally significant, raise an ADR.

## Review cadence

Reviewed at every release closeout (`release-closeout` skill) and whenever Dependabot or a
security advisory raises an alert. Unmaintained dependencies — no release in 12 months with
open security issues — are flagged for replacement in `docs/08-releases/KNOWN_ISSUES.md`.
