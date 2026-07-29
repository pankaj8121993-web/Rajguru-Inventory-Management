# Dependency Register

Every third-party dependency must be recorded here **before** it is added, with the
evaluation below completed. This is required by development prompt §5.

**Required evaluation for any new dependency:** repository · purpose · license ·
maintainer · latest stable release · release activity · security advisories ·
compatibility · bundle impact · transitive dependency impact · alternative considered ·
reason selected.

---

## Installed — evaluated 2026-07-29

| Package | Version | Purpose | License | Advisories | Notes |
|---|---|---|---|---|---|
| `next` | 15.5.22 | Framework | MIT | **Clean at this version.** 15.5.4 carried CVE-2025-66478 and was upgraded before any code was written against it | Major upgrades held from Dependabot for deliberate review |
| `react`, `react-dom` | 19.1.1 | UI runtime | MIT | Clean | Matches the Next.js support matrix |
| `typescript` | 5.7.2 | Types | Apache-2.0 | Clean | `strict: true` |
| `pg` | 8.13.1 | PostgreSQL driver | MIT | Clean | Server-only. Replaced by `@supabase/supabase-js` when Supabase is provisioned (decision 10) |
| `zod` | 3.24.1 | Validation | MIT | Clean | Server boundary is authoritative |
| `decimal.js` | 10.4.3 | Exact decimal arithmetic | MIT | Clean | **Installed, not yet used** — no quantity arithmetic exists. Required from Phase 4 (NFR-01) |
| `tailwindcss` | 3.4.17 | Styling | MIT | Clean | |
| `postcss` | 8.5.18 | CSS pipeline | MIT | Pinned via override to clear three advisories reaching in through Next | |
| `sharp` | 0.35.0 | Image optimisation (Next transitive) | Apache-2.0 | Pinned via override; <0.35.0 inherits libvips CVEs | |
| `vitest` | 2.1.8 | Unit tests | MIT | Clean | dev |
| `@playwright/test` | latest | End-to-end tests | Apache-2.0 | Clean | dev; uses the pre-installed Chromium |
| `eslint` + `eslint-config-next` | 9 / 15.5.22 | Linting | MIT | Clean | dev |
| `server-only` | latest | Build-time guard against client imports | MIT | Clean | Enforces ADR-0004 at compile time |

`npm audit --omit=dev` reports **0 vulnerabilities**.

### Not yet installed

`konva` / `react-konva` (Phase 11), `three` / `@react-three/*` (Phase 14),
`@tanstack/react-query` and `@tanstack/react-table` (needed for the Phase 4 bulk-entry
grid), shadcn/ui components, `@axe-core/playwright`, `@sentry/nextjs`,
`@supabase/supabase-js` and `@supabase/ssr` (blocked on blocker 11).

---

## Approved candidates — not yet installed

Pre-cleared by the blueprint and development prompt §5. Each still requires its evaluation
row completed **at the moment of installation** — license, advisories and release activity
must be checked against reality on that date, not assumed from this list.

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
