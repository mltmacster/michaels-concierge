---
document_id: MGECS-REBUILD-README
version: 1.7.0
status: phase1-source-verified-live-acceptance-pending
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-25
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

Configure credentials through the approved secret store/environment. `.env.example` is a blank reference, not a ready-to-run configuration; never commit a filled secret file. A session signing secret must have at least 32 characters; use a cryptographically generated value, not an example string.

Required runtime settings: `DATABASE_URL` using `mysql://`, a session signing key, `VITE_APP_ID`, `OAUTH_SERVER_URL`, and `VITE_OAUTH_PORTAL_URL`. A standalone environment may supply `JWT_SECRET`. Managed hosting must supply the application-owned `MGECS_SESSION_SECRET` through the project's secure configuration when the built-in key does not meet this policy; do not overwrite managed system variables. An explicitly supplied override always takes precedence and is rejected if invalid, even when the legacy key is valid. The existing OAuth/session SDK uses this same resolved key; no second authentication system is introduced. Production OAuth URLs must use HTTPS. `PORT` defaults to 3000. Optional platform AI/storage keys are not required or used by the Phase 0 customer-facing paths.

The initial managed preview correctly refused startup because its built-in signing key did not meet the new minimum. A live preview must not be described as available until the application-owned secret is securely configured and the following opt-in test passes. Ordinary CI skips only this actual-environment gate; its portable configuration tests still run without credentials. Never put the signing key in a `VITE_` variable, command line, screenshot, issue, or release artifact.

```bash
MGECS_VERIFY_CONFIG=true pnpm exec vitest run server/config.test.ts
```

On 2026-11-24, the owner securely configured the application-only signing key. The production-mode actual-configuration test passed, including existing-SDK signing, wrong-key rejection and a lightweight HTTP probe. The managed foundation preview restarted and returned HTTP 200 for liveness and real read-only database readiness. This resolves the initial configuration blocker; it does not prove customer login, persistence, migrations or production launch. See the latest dated [evidence](docs/evidence/Evidence_Ledger.md).

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

## Verified foundation delivery — 2026-11-24, v1.3.0

[The verified foundation prerelease v0.0.1-phase0](https://github.com/mltmacster/michaels-concierge/releases/tag/v0.0.1-phase0) was built and delivered by [tag pipeline 45461542649](https://github.com/mltmacster/michaels-concierge/actions/runs/45461542649) from `540ab1f733a2a8d562e7fe6febd34b7c5195d49a` after its [main container/quality checks](https://github.com/mltmacster/michaels-concierge/actions/runs/45461104591) passed. Download the archive and checksum into one directory, then run `sha256sum --check foundation-build.sha256`. `VERIFIED_SOURCE.txt` inside the archive identifies its exact source. This later main-branch README/HANDOFF appends release receipts; the immutable archive contains the pre-publication documentation state.

The owner securely configured the app-only signing key and verified read-only readiness. Source, CI/artifact delivery and the managed development preview are established; customer operations are not launched. The next implementation gates are [Phase 1 identity/security](https://github.com/mltmacster/michaels-concierge/issues/2) and [data/migrations/disposable tests](https://github.com/mltmacster/michaels-concierge/issues/3).

## Current Phase 1 identity/security scope — 2026-11-24

This section supersedes the earlier Phase 0 “what works” scope. The development source implements a customer identity portal (`/identity`), independent operator verification (`/operator`), minimal self-profile API, explicit self-ownership/role denial, and bounded ledger-backed cookie sessions. The original OAuth transport remains; legacy session/bearer/cron/owner-promotion paths are removed. New accounts are customers. No operator is provisioned without explicit named-account approval.

Sessions use the app-owned key, exact issuer/audience/subject, one-hour absolute/fifteen-minute idle defaults, hash-only durable registration and server-side logout revocation. Current roles are read from SQL; authenticated activity writes only the session ledger, not user profiles/roles. Secure host-only Lax cookies, strict mutation Origin/Fetch Metadata/JSON/custom-header checks, sanitized errors and stable redacted events are implemented. Supplementary rate limits are per process, not distributed or configured proxy/edge protection.

Read the [identity implementation plan](docs/Phase1_Identity_Security.md) and [contract/runbook](docs/Identity_Runbook.md). Production additionally requires `MGECS_APP_ORIGINS`, a comma-separated exact HTTPS allowlist with no path/credentials/trailing slash. The browser supplies its actual origin; the server never authorizes from Host/forwarded headers. Optional `MGECS_SESSION_ABSOLUTE_SECONDS` defaults to 3600 (60–86400) and `MGECS_SESSION_IDLE_SECONDS` defaults to 900 (60–1800, no longer than absolute). An unconfigured preview can serve public pages but cannot complete login from an unapproved origin. Legacy sessions require explicit sign-in; no JavaScript-token fallback or invisible redirect is used.

`pnpm test:database` is a separate, guarded, mutating integration command. It requires both `AI_UNK_TEST_DATABASE=true` and `RUN_DATABASE_TESTS=true`, and a restricted `mgecs_test` user on localhost/127.0.0.1 with a freshly empty test-named MySQL8/MariaDB schema. The launcher refuses preexisting objects, applies reviewed migrations and runs only database tests with a generated isolated key. It never drops a database or targets managed data. The GitHub `identity-database` job provides its own disposable MySQL service. Browser fixtures intercept DTO responses inside tests only; no mock/demo accounts or fixture mode are shipped.

The additive ledger migration is generated/reviewed and tested on disposable SQL, but **not yet applied to the managed database**. Exact origins await owner approval/configuration; production-mode actual configuration acceptance, real OAuth/HTTPS cookie UAT, approved operator provisioning and backup/restore remain pending. No Phase 1 production promotion occurred; the published Phase 0 foundation remains the rollback baseline. Customer requests, operator queues, notification/real-time delivery, provider/AI integrations, billing and commercial readiness are not enabled. Verified source/CI is not evidence of live identity acceptance.

## Verified Phase 1 implementation — 2026-11-24

[PR #12](https://github.com/mltmacster/michaels-concierge/pull/12) passed both [corrected PR checks](https://github.com/mltmacster/michaels-concierge/actions/runs/45485100254) and merged as `6b5d83f32440885e5d44f86847766082e90b6d17`. [Exact-main CI](https://github.com/mltmacster/michaels-concierge/actions/runs/45485475948) passed quality, MySQL8 integration, Docker build and artifact upload. Both quality and identity-database are required main checks; existing protections remain unchanged.

Independent credential-cleared public-clone verification passed locked install, full verify, cold strict types, production build/smoke, 323 portable tests (one actual-environment gate skipped), all 25 browser tests and production audit. All 20 guarded persistence cases passed on disposable MariaDB and in public MySQL8 CI. A separate loopback HTTP restart/logout replay proof passed; 28 fixture-only low-resolution browser captures were retained. One low KaTeX advisory remains, with zero critical/high/moderate production advisories. Detailed immutable receipts and the preserved failed selector run are in [the handoff](HANDOFF.md) and [evidence ledger](docs/evidence/Evidence_Ledger.md).

This is verified development source, not live customer identity acceptance. The receipt-only follow-up requires its own checks and the final source-only checkpoint is delivered separately. The published Phase 0 domain is unchanged. Exact origin approval/configuration, managed additive migration, real permitted-account OAuth/HTTPS/operator acceptance and backup/restore must precede request workflows or production promotion.

## Approved-origin configuration resolution — 2026-11-24, v1.6.0

The immutable source/checkpoint is `a27a964537b56741daf0caf7afc6731e90a64017` / `a27a9645`. Production rollout attempts at 21:07:05 and 21:32:53 UTC failed before port 3000 startup with `Invalid runtime configuration MGECS_APP_ORIGINS`, exit 1. The owner approved only `https://michaelconci-l64nfwm.manus.space`; the interrupted initial configuration call and rejected retry remain in evidence history. The 21:48:44 actual-environment attempt had 35 portable passes and 1 actual-environment failure.

Following reauthorization at 22:27:04 UTC, managed configuration confirmed `MGECS_APP_ORIGINS` saved at 22:27:37 UTC. No signing-key or GitHub-secret change is claimed. The development preview remains outside the allowlist; no origin was hardcoded, no host-derived security default was added, and no guard was relaxed. Actual production-mode configuration tests passed all 36 cases at 22:27:44 UTC with the actual-environment case executed. The new production build passed at 22:28:18 UTC. A bounded production-dist probe confirmed the exact approved published-only origin, startup, static page 200, health 200 and read-only managed DB readiness 200, then stopped at 22:29:15 UTC.

This resolves the approved-origin startup blocker only, not managed rollout success or real identity acceptance. Managed migration, real OAuth/HTTPS/exact-approved-operator UAT, backup/restore/security acceptance and requests remain pending. On resume, re-confirm stored configuration rather than requesting this origin again; finish reviewed migration, account and recovery gates before describing live identity as functional. Parent-run precommit/PR/main CI and the external source/checkpoint receipt remain separate follow-up evidence.

## Phase 1 continuation — 2026-11-25, v1.7.0

Phase 1 identity/security source is already implemented; continuation starts with [HANDOFF.md](HANDOFF.md) and the [migration/recovery runbook](docs/Phase1_Migration_Recovery.md), not a duplicate rebuild or request dashboard. Source `2309ae13854f5704dac61fbe78a968b200b78c48`, managed checkpoint `2309ae13` and both exact-main CI jobs were rechecked. Current public HTTPS health/readiness returned 200, and the platform previously reported rollout success. These observations do not independently prove deployed backend-source identity or customer/operator acceptance.

The correct approved origin is `https://michaelconci-l64nfwmv.manus.space`; historical v1.6 prose omitted the final `v`. The actual saved allowlist was rechecked as published-only and remains unchanged. The new production-configuration run passed all 36 cases with no skip; 323 portable cases passed with the separate actual-env case skipped by default. Full verification and 25 browser checks passed for the first handoff update; subsequent documentation needs its own final gates.

Managed read-only inventory now has one customer account, no operators, one migration entry and no session ledger. Preserve that account. Complete verified private backup, incremental migration/secure restore rehearsal and exact managed migration approval, then real permitted-account HTTPS identity/logout/replay and separately approved operator acceptance. An older restore can resurrect revoked sessions or stale roles; invalidate restored sessions and reconcile role/deletion decisions before reopening. No managed migration, role grant, key change, concierge workflow or customer launch is implied.

The subsequent isolated MariaDB rehearsal passed actual incremental migration, unchanged migrator rerun, private logical backup/restore, stale-session/role risk demonstration, secure reopening and partial-DDL detection. Fixture data/raw backup and the owned test engine were cleaned. The current next gate is a verified private **managed** backup and approval for the exact additive ledger migration; the isolated result does not establish TiDB/live identity acceptance. See the latest handoff and recovery runbook for the scoped receipt and failures/corrections.

## Change log

| Date       | Version | Change                                                                                                                              |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Documented the approved Phase 0 rebuild, runnable foundation, portable checks, deployment boundaries, and non-enabled capabilities. |
| 2026-11-24 | 1.1.0   | Documented application-owned signing-key precedence and the explicit live configuration acceptance gate.                            |
| 2026-11-24 | 1.2.0   | Recorded actual app-key/signature/HTTP validation and restored development preview with read-only readiness.                        |
| 2026-11-24 | 1.3.0   | Added verified prerelease, exact source/checksum usage, immutable documentation boundary and Phase 1 entry points.                  |

| 2026-11-24 | 1.4.0 | Documented bounded identity controls and pending live configuration/migration acceptance. |
| 2026-11-24 | 1.5.0 | Appended verified implementation PR/main/clone and explicit source-only delivery boundary. |
| 2026-11-24 | 1.6.0 | Documented approved-origin configuration resolution, actual 36-case validation and bounded readiness proof without claiming rollout or live identity acceptance. |
| 2026-11-25 | 1.7.0 | Added current Phase 1 continuation state, corrected historical origin prose and linked migration/secure recovery-before-activation gates. |

---

**Document footer — MGECS-REBUILD-README v1.7.0 | Status: phase1-source-verified-live-acceptance-pending | Next review: incremental migration/recovery, exact managed approval and permitted-account acceptance.**
