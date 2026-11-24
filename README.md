---
document_id: MGECS-REBUILD-README
version: 1.0.0
status: phase0-foundation
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append dated changes and evidence; preserve superseded claims
---

# Michaels Concierge

A clean rebuild of Michaels Global Executive Mobile Concierge Service. The first commercial scope is human-operated dining and local-experience concierge requests. **This version is the engineering foundation, not an open customer service or a finished revenue-generating product.**

[![Foundation CI](https://github.com/mltmacster/michaels-concierge/actions/workflows/ci.yml/badge.svg)](https://github.com/mltmacster/michaels-concierge/actions/workflows/ci.yml)

Read [HANDOFF.md](HANDOFF.md) first, then the [documentation index](docs/README.md). The legacy prototype is retained separately, not imported into this public repository.

## What works now

The project has a buildable React client and typed Node API, a responsive foundation page, functioning home/status/not-found navigation, a server-backed capability status screen with refresh/error handling, a mutation-free application factory, configuration validation before startup, liveness/readiness endpoints, and automated foundation tests. The managed OAuth/session and MySQL/Drizzle scaffold are present, but full customer authentication/authorization and data lifecycle acceptance belong to Phase 1.

Customer requests, client/admin concierge dashboards, messages, real-time delivery, live provider discovery, AI recommendations, reservations, memberships, and payments are **not enabled**. There are no mock listings, fabricated reviews/prices, sample customers, or working demo-account claims. Test-only fixtures do not represent product capabilities.

## Architecture

React + TypeScript + Tailwind client → Express/tRPC API → Drizzle/MySQL-compatible managed database. The application factory lives in `server/app.ts`; the process entry point validates config before opening a listener. Request middleware and cookie authentication are server-owned. The browser cannot authorize itself.

[ADR-007](docs/adr/ADR-007-Managed-Rebuild.md) records the sponsor-approved change from the historical Flask/PostgreSQL proposal to the managed TypeScript/MySQL stack. Type-safe tRPC is the initial internal API contract; a public REST/OpenAPI surface is deferred until there is a consumer requirement. The original audit diagrams are not claims about this implementation.

## Prerequisites

Use Node.js 22, pnpm 10.4.1, Git, and a Linux shell or Windows WSL2 for the documented development/start commands. `pnpm check`, tests, and smoke harness are portable Node commands; the current `dev`/`start` scripts use POSIX environment syntax. Do not assume native Windows shell support for those two scripts.

A clean clone can install, lint, type-check, test, build, and run the isolated smoke tests **without service credentials or a database**:

```bash
git clone https://github.com/mltmacster/michaels-concierge.git
cd michaels-concierge
corepack pnpm install --frozen-lockfile
corepack pnpm verify
corepack pnpm exec playwright install chromium
corepack pnpm test:browser
corepack pnpm audit:production
```

The smoke and browser harnesses use generated test session secrets, reserved non-provider endpoints, and an unreachable database endpoint. They verify liveness/error behavior, not customer login or successful persistence. They never create users or modify a managed database.

## Development with approved service configuration

Copy `.env.example` to `.env` locally, then configure credentials through the approved secret store/environment. Never commit the filled file. A session signing secret must have at least 32 characters; use a cryptographically generated value, not an example string. Managed projects provide these settings through their configuration UI.

Required runtime settings: `DATABASE_URL` using `mysql://`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, and `VITE_OAUTH_PORTAL_URL`. Production OAuth URLs must use HTTPS. `PORT` defaults to 3000. Optional platform AI/storage keys are not required or used by the Phase 0 customer-facing paths.

```bash
pnpm dev
# In a separate shell, verify liveness/readiness:
curl --fail http://localhost:3000/api/health
curl --fail http://localhost:3000/api/ready
```

Do not run `db:push` against any shared or production database. Schema initialization/migration is an explicit reviewed operation, never part of process startup. The generated identity migration is retained, but migration/restore rehearsal is a Phase 1 gate.

## Quality commands

- `pnpm format:check`: repository formatting.
- `pnpm lint`: source safety/unused-variable/hook rules with zero warnings. Managed explicit-`any` adapter debt is documented, not disguised as a type-safety guarantee.
- `pnpm check`: strict TypeScript including tests/configuration.
- `pnpm docs:check`: controlled-document metadata, unique IDs, footer versions and local links.
- `pnpm test`: portable unit and HTTP regression tests.
- `pnpm build`: production client and server artifacts.
- `pnpm smoke`: production startup/static/API/error probe with isolated configuration.
- `pnpm test:browser`: desktop/mobile navigation and API failure UI.
- `pnpm audit:production`: fails on high/critical production dependency advisories.
- `bash scripts/install-gitleaks.sh`: checksum-verified Linux scanner install. Run `gitleaks git --redact .` before pushing; use the same pinned version as CI.

`pnpm verify` combines format, lint, types, docs, tests, build and production smoke. Browser and security scans are separate required gates. A passing liveness probe is not a readiness check, customer acceptance, or a production release.

## Build, delivery, and deployment

```bash
pnpm build
pnpm start
```

`pnpm start` requires valid runtime configuration and fails before listening if it is absent. `/api/health` reports process liveness. `/api/ready` performs a real read-only `SELECT 1`, returns 503 on failure/timeout, and exposes no provider/credential detail. Unknown `/api` routes return JSON 404. Startup never applies migrations or seeds accounts.

The public GitHub workflow checks pull requests and pushes. It retains build artifacts after passing quality gates. Version tags publish clearly labelled **foundation prerelease artifacts**, not automatic customer-production deployment. Production promotion through the managed platform requires a reviewed checkpoint, secrets, database/migration acceptance, smoke/readiness, and rollback evidence. Live billing and public service launch remain separately gated.

The [Dockerfile](Dockerfile) provides a local production-container profile. Pass secrets at runtime, never as image build arguments. This Phase 0 profile retains build-tool dependencies needed by managed Vite plumbing; reducing runtime dependency surface is tracked for Phase 1. Autoscale containers cannot safely host a permanent outbox worker or assume one replica; event delivery needs a separate Phase 3 design.

## Source map

```text
client/src/pages/       Foundation UI, then future client/operator journeys
server/app.ts          Testable API application factory
server/config.ts       Validated runtime configuration
server/_core/          Managed framework plumbing; changes must be reviewed
server/routers.ts      Typed API contracts
server/db.ts           Existing identity persistence scaffold
shared/                Shared types/constants
drizzle/               Schema and generated migrations
e2e/                   Browser smoke tests
scripts/               Portable verification/tooling
.github/workflows/     Public CI and artifact delivery
docs/                  Decisions, evidence, recovery gates
```

## Security and contributions

Follow [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Do not put credentials or personal records into public issues or artifacts. The original prototype source/logs and current managed secrets are excluded from this repository. Public source visibility does not grant an open-source license; licensing is not yet assigned by the owner.

## Change log

| Date       | Version | Change                                                                                                                              |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Documented the approved Phase 0 rebuild, runnable foundation, portable checks, deployment boundaries, and non-enabled capabilities. |

---

**Document footer — MGECS-REBUILD-README v1.0.0 | Status: phase0-foundation | Next review: Phase 0 gate evidence and Phase 1 contract work.**
