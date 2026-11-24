---
document_id: MGECS-REBUILD-HANDOFF
version: 1.5.0
status: phase1-source-verified-live-acceptance-pending
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append dated decisions and evidence; preserve superseded records
---

# HANDOFF — Michaels Concierge clean rebuild

## Read first

This is the new authoritative implementation directory. The old incomplete React/Flask prototype and nine audit/design records remain preserved privately in the original workspace; do not import its fake provider data, startup seed logic, conflicting JWT paths or hardcoded hosts/secrets. Follow [docs/README.md](docs/README.md) and [docs/Recovery_Gates.md](docs/Recovery_Gates.md).

## Authorization

Michael Thomas explicitly approved the recommended clean rebuild and starting Phase 0 on 2026-11-24: public `mltmacster/michaels-concierge`, TypeScript/React/Node/tRPC + managed MySQL-compatible database, human-operated dining/local experiences first. ADR-007 supersedes the historical PostgreSQL/private-source proposal. No live billing or autonomous bookings are authorized.

## Current state — initial record, superseded below

A managed full-stack scaffold exists. The foundation UI/status API, startup config validation, mutation-free app factory, health/readiness and portable tests were implemented. All concierge/business capabilities remain disabled. Phase 0 gate results are recorded in the evidence ledger; do not call the product completed or shipped to customers.

## Stop/resume rules

Read the latest evidence before coding. Confirm branch/commit, runtime and migration state anew; never assume session-installed tools, current model catalog or preview services persist. Run the portable suite and check the same commit's CI before beginning Phase 1. Do not weaken gates or substitute a screenshot for an end-to-end trace.

## Required next work — initial record, superseded below

Finish Phase 0 evidence/CI/protection/clean-clone/artifact gates. Then implement reviewed Phase 1 identity/data/contracts before request UI. Backlog must cover session audience/expiration/revocation, CSRF/origin, trusted proxy and storage-failure handling, RBAC/ownership denial, explicit migrations and restore, guarded disposable integration tests, UTC/data constraints, and deployment/security review. Customer/operator acceptance and commercial policies remain unassigned gates; do not invent service hours, SLA, pricing or supplier agreements.

Before stopping append exact work, known failures, skipped tests, commit/checkpoint, next action and rollback. Source-control and artifact delivery are not automatic production service launch.

## Current release handoff — 2026-11-24, v1.1.0

**Status: foundation-built-runtime-blocked; Phase 0 release pending.** The public repository is [mltmacster/michaels-concierge](https://github.com/mltmacster/michaels-concierge). Protected [PR #1](https://github.com/mltmacster/michaels-concierge/pull/1) merged to main at `c198d139384e135873ab3732dd7c13ed1143e12c`. [Corrected PR CI 45455075575](https://github.com/mltmacster/michaels-concierge/actions/runs/45455075575) succeeded. [Exact-main CI 45455387123](https://github.com/mltmacster/michaels-concierge/actions/runs/45455387123) succeeded, including Docker build, 22 unit/HTTP tests, 3 browser checks and artifact upload. The foundation delivery job correctly skipped on main: only `v*` tags publish a prerelease. No final tag/prerelease has been verified.

Credential-free locked install, verify/browser/audit passed in an independent clone of `ab232288ac276594b6b245be26b2e2dd16affa0e`; this is baseline reproducibility evidence, not a clean-clone claim for the pending override revision. Source and full-history scans passed. Main protection enforces admins, strict `quality`, PR review flow and resolved conversations, with force pushes/deletion disabled; private vulnerability reporting is enabled. The audit has zero critical/high/moderate findings and one low KaTeX advisory, `GHSA-238p-pmpm-9mq7`, still open. Drizzle 0.45.4 patches `GHSA-gpj5-g38j-94v9`. All 18 legacy application-source hashes were rechecked unchanged at 13:06 EST on 2026-11-24. No legacy migration or schema/seed mutation was performed. Earlier failed CI runs and the real public issues #2–#9 remain recorded in [the evidence ledger](docs/evidence/Evidence_Ledger.md).

### Runtime blocker and exact next actions

The managed `JWT_SECRET` is shorter than the approved minimum of 32 characters. Startup correctly refuses to listen; **the managed preview is not live**. An application-owned `MGECS_SESSION_SECRET` override has been added to the existing auth SDK's session-key resolution, not a second auth system. The strict minimum remains; no managed system variable was mutated. The override revision and its new tests are pending verification, not covered by the earlier successful main CI.

1. Have the authorized owner securely configure a fresh, cryptographically random `MGECS_SESSION_SECRET` of at least 32 characters in managed configuration. Do not put its value in source, documentation, logs or chat, and do not alter managed `JWT_SECRET`.
2. In that actual configured managed environment, run `NODE_ENV=production MGECS_VERIFY_CONFIG=true pnpm exec vitest run server/config.test.ts`. Require the actual-environment config test to run and pass, not skip; also verify the override regression suite and full portable checks. Fixture-only success does not clear this blocker.
3. Restart the managed server and record `/api/health` and `/api/ready` results. Readiness must verify the database through read-only `SELECT 1`; liveness alone is insufficient. No schema, seed or migration writes are authorized for this gate.
4. Submit the final docs/config PR through protected main and inspect its exact-commit CI. Then run and verify the final `v*` tag/prerelease pipeline and artifact linkage. Record exactly **one final managed checkpoint** after actual validation. These PR, tag, runtime and checkpoint outcomes remain pending.
5. Only after the reviewed Phase 0 gates, proceed to Phase 1 identity/data/contracts: one identity implementation, session/security and RBAC/ownership denial, explicit migrations, backup/restore rehearsal and guarded disposable-database integration tests. Do not begin customer request UI before those contracts are reviewed and verified.

### Rollback and non-claims

The known source rollback is main `c198d139384e135873ab3732dd7c13ed1143e12c` (`c198d13`); it still refuses startup with the short managed key. Initial scaffold checkpoint `348e85b8` is a recovery reference, **not a customer release**. The final managed checkpoint is pending. Source rollback does not solve the secret gate and does not imply a database restore or migration.

No evidence here establishes customer authentication or persistence, requests, providers, AI assistance, payments, production acceptance or revenue. Human-operated dining/local experiences remain the approved first scope. Automatic revenue, service hours and pricing promises are prohibited; operating and commercial acceptance gates remain unfulfilled.

## Runtime gate resolution — 2026-11-24, v1.2.0

This update supersedes the v1.1.0 runtime blocker, not its failure history. Michael generated a fresh application-only signing key and supplied it through secure project configuration. Only `MGECS_SESSION_SECRET` was added; managed `JWT_SECRET` was not changed, and no key value is recorded here. This is not a GitHub credential or a second authentication system.

`NODE_ENV=production MGECS_VERIFY_CONFIG=true pnpm exec vitest run server/config.test.ts` passed all 17 cases at 18:28 UTC. The actual-environment case executed rather than skipping; it validated configuration, signed and verified a short-lived isolated token with the existing SDK, rejected a wrong verification key, and called the lightweight HTTP health endpoint. It never authenticated a customer, wrote a fixture account, or contacted an identity/provider API. Portable tests passed 26 cases with only this actual-environment case skipped; all 3 browser tests passed after the change.

After the managed restart, `/api/health` returned 200 with phase `foundation`, and `/api/ready` returned 200 with status `ready` at 18:27 UTC. Readiness used the real read-only `SELECT 1` probe, not an injected fixture. No migrations or seed/customer writes were performed. Desktop/mobile screenshots were inspected in an isolated unauthenticated browser. Preview: https://3000-ipzieqzej1k3obkrjrs1e-0388ca72.us5.manus.computer . This is a development foundation preview, not customer-production deployment.

**Remaining exit work:** verify the final configuration/docs PR on its exact commit, merge without bypassing protection, verify the final main container/artifact job, tag the verified source as `v0.0.1-phase0`, verify same-run prerelease artifact delivery and checksum, record that receipt, and create exactly one final managed checkpoint. Then Phase 1 starts with public issues #2 and #3 and reviewed identity/data/security contracts, not customer-request UI.

## Verified foundation delivery — 2026-11-24, v1.3.0

Protected [PR #10](https://github.com/mltmacster/michaels-concierge/pull/10) passed [CI 45460764458](https://github.com/mltmacster/michaels-concierge/actions/runs/45460764458) and merged as `540ab1f733a2a8d562e7fe6febd34b7c5195d49a`. Exact [main CI 45461104591](https://github.com/mltmacster/michaels-concierge/actions/runs/45461104591) passed, including container build and verified artifact upload. [Tag CI 45461542649](https://github.com/mltmacster/michaels-concierge/actions/runs/45461542649) passed both quality and same-run prerelease delivery. [Foundation prerelease v0.0.1-phase0](https://github.com/mltmacster/michaels-concierge/releases/tag/v0.0.1-phase0) is explicitly marked prerelease, not customer production.

The downloaded archive checksum passed and its `VERIFIED_SOURCE.txt` equals `540ab1f733a2a8d562e7fe6febd34b7c5195d49a`. SHA-256: `fa003e9e523946322ceb67b0dd0ef14837cfea77e920c1d5e9219847b38f58b5`. The archive includes the linked README/HANDOFF/security/contribution/docs records and blank environment reference, never the actual signing key. Its documentation is the immutable v1.2.0 pre-publication record; this later main-branch handoff appends the observed release result rather than pretending it was known before the artifact existed.

Independent public-clone validation of `f3d2d0780b9be904bedf6bcf319bd3f68b805b80` passed locked install, full verify, 3 browser tests and production audit with the application environment cleared. Its Git tree is identical to the tagged merge. Portable CI runs 26 tests and skips exactly the opt-in actual-environment proof; the separate production-mode managed run executed all 17 configuration cases successfully. One low KaTeX advisory remains; no high/critical/moderate dependency finding remains. Preserve inherited explicit-any/deprecation/CSP and Phase 1 security debt.

The final receipt additions are docs-only and must pass their own protected PR/main checks before delivery. Create exactly one final managed checkpoint after that source settles; the platform receipt is the authoritative checkpoint identifier and is delivered separately because a source snapshot cannot embed its own future identifier. This is a development foundation preview and artifact CD, not automatic managed customer deployment. No customer schema/seed migration or test writes occurred.

**Next agent:** begin Phase 1 with [identity/security issue #2](https://github.com/mltmacster/michaels-concierge/issues/2) and [data/migration/test issue #3](https://github.com/mltmacster/michaels-concierge/issues/3). Inventory the current identity/session/database contract, design denial and outage behavior, reviewed migrations/backup/restore and guarded disposable integration tests, then implement the minimum customer/operator identity vertical slice. Do not activate requests, public dashboards, real-time events, providers, AI or billing until their subsequent gates pass. Ask for business policies instead of inventing pricing, service hours, SLAs or supplier agreements.

**Rollback:** the tagged `v0.0.1-phase0` / `540ab1f733a2a8d562e7fe6febd34b7c5195d49a` is the verified foundation source; final main differs only by evidence documentation. Restore approved app configuration separately; rotating the signing key invalidates signatures. No database rollback is implied. Do not use the broken legacy prototype as a production rollback. Check current source/checkpoint/CI/readiness on resumption rather than assuming this session persists.

## Phase 1 implementation handoff — 2026-11-24, v1.4.0

Michael authorized customer/operator identity, permissions and session security. Work is on `phase1/identity-security`, based on final Phase 0 `53ba1a3876c026b61220f9aa60f6b583cd4f89d0` / managed checkpoint `53ba1a38`. This current entry supersedes prior next-work statements only for the implemented source. [The preimplementation plan](docs/Phase1_Identity_Security.md) records scope and independent review; [the runbook](docs/Identity_Runbook.md) records current schema/API/hook/deployment contracts.

Implemented: one managed OAuth transport with application session codec/SQL ledger; numeric users.id, no role claims/auto-promotion/read-time identity sync/bearer/cron bypass; minimal self identity and permissions, exact self-profile ownership, independent operator access; bounded issuer/audience/absolute/idle/registered/revoked checks; persist-before-cookie/revoke-before-success; strict production/dev cookie separation, Origin/Fetch Metadata/JSON/custom mutation header; distinct outage and redacted public errors/events; customer/operator portal with no production mock records and honest failed-logout states. Authenticated activity may update session lastSeen only, never user profile/role. The FK/indexed UTC-ms ledger migration is additive and reviewed.

Observed local evidence: 114 codec tests; the complete portable suite subsequently passed 323 cases with one actual-environment case intentionally skipped. All 20 guarded SQL integration tests passed on an unprivileged private loopback MariaDB 10.11.14 disposable schema, including role preservation/demotion, hash-only ledger, ownership/FK/cascade, expiry, revocation and closed-pool outage. Independent connections/second service are durable-storage evidence, not a claimed physical process-restart/replica UAT. Targeted browser portal suite passed 22 tests; full final gates/CI are recorded in subsequent exact receipts when observed.

No managed fixtures, identity writes, operator grants or Phase 1 promotion occurred. Live read-only inventory had zero accounts before development. `MGECS_APP_ORIGINS` approval/configuration is pending for the two existing origins; no key value was retrieved or changed. Managed ledger SQL has NOT run. Real OAuth/customer/operator UAT, cookie behavior, data backup/restore, transport/CSP/MFA/central monitoring/distributed abuse acceptance remain pending. No customer request UI should be started.

Next agent: check branch/main/checkpoint and exact CI anew; inspect the latest ledger and runbook. Obtain exact origin approval and configure through the managed store; run actual production-mode config test without printing credentials. Inventory live schema/counts and apply only reviewed additive migration after its guarded rehearsal and checkpoint. Verify resulting metadata/counts, then permitted real-account OAuth/self-profile/logout replay. Request exact verified operator approval and revoke that account's old sessions transactionally with any role change. Complete Phase 1 data recovery before request workflows. Do not infer live completion from fixture tests or auto-publish the development checkpoint.

Rollback remains the published Phase 0 foundation/checkpoint `53ba1a38`; code rollback is not a database restore. An empty additive ledger need not be dropped. Once identity is used, do not restore insecure legacy sessions. Full pre-commit validation, both exact GitHub jobs, main container/artifact evidence and one final managed checkpoint must settle before bounded delivery. No Phase 1 tag/customer launch is implied.

## Final local Phase 1 gates — 2026-11-24, 20:44 UTC

P1-EV-006 — Full `pnpm verify` passed with zero type/lint/format diagnostics, controlled-document checks, 323 portable cases (one actual-environment case skipped), build and isolated production smoke. All 25 desktop/mobile/failure/logout browser checks passed; mobile customer and forged-role denial captures were visually inspected for legibility and Home/Identity/Foundation return paths. All 20 guarded MariaDB persistence/security cases passed. Source/history Gitleaks and diff checks passed; production audit remains 0 critical/high/moderate, 1 low KaTeX finding. The first final verify refused two formatter deviations; formatting was corrected and every gate rerun, not waived.

Exact protected PR/main/container checks and final checkpoint remain future receipts. Managed origins/ledger migration, actual OAuth/operator UAT and backup/restore remain pending; no Phase 1 live promotion occurred.

## CI correction and physical restart evidence — 2026-11-24

P1-EV-007 — Source `46c46e62ef38b59dc6e47f133a45c6c91b8b1ffb` opened [PR #12](https://github.com/mltmacster/michaels-concierge/pull/12). [CI 45484358131](https://github.com/mltmacster/michaels-concierge/actions/runs/45484358131) passed the isolated MySQL8 integration job (20 cases) but failed five browser assertions: a generic status locator matched both the correct identity status and background refresh status after return navigation. Corrected only the ambiguous selectors to identify the exact identity-status text; assertions, retries, tests and production behavior were not weakened. This failed run remains history; final corrective-commit CI must pass separately.

P1-EV-008 — A separate finite loopback fixture probe passed actual HTTP process restart: persisted identity authenticated after a process stop/restart; successful logout remained revoked after another stop/restart and the replayed cookie returned null identity/401 operator access. It used only the guarded disposable DB, generated isolated key and fixture; the fixture was deleted. This is physical process durability evidence, not real OAuth/HTTPS browser-cookie/managed replica UAT. The helper initially had a CJS/top-level-await module error; explicit ESM extension corrected the test helper, not application code. Cold strict `tsc --noEmit --incremental false` passed. Managed status had stale watcher diagnostics for removed SDK methods; the cold check and actual source supersede that stale cache, not a diagnostic waiver. Public development health/anonymous identity probes succeeded; managed migration/origin approval/live account acceptance remain pending.

## Verified Phase 1 source delivery — 2026-11-24, v1.5.0

P1-EV-009 — Corrective source `91fc1550f7a83490f87c34f7ddd20182554965bc` passed [PR CI 45485100254](https://github.com/mltmacster/michaels-concierge/actions/runs/45485100254), both `quality` and `identity-database`. [Protected PR #12](https://github.com/mltmacster/michaels-concierge/pull/12) merged as `6b5d83f32440885e5d44f86847766082e90b6d17`. [Exact-main CI 45485475948](https://github.com/mltmacster/michaels-concierge/actions/runs/45485475948) passed both jobs, including production Docker build and verified artifact upload. The tag-only delivery job correctly skipped. No Phase 1 tag or managed production promotion was created.

P1-EV-010 — Independent public-clone verification of corrective source `91fc1550f7a83490f87c34f7ddd20182554965bc` used an environment cleared to PATH/HOME only, with no inherited NODE_ENV or app credentials. Locked install, full verify, cold strict compiler, production build/smoke, all 25 browser tests and production audit passed. Portable tests: 323 passed, one actual-environment test skipped, nine files; 12 controlled docs and 36 local links passed. Main merge has the same Git tree `65aac8abcdd2cab85f397d4ad642248865d424a8`. This proves that exact implementation tree, not future source edits or live OAuth. Production audit remains zero critical/high/moderate and one low KaTeX advisory.

P1-EV-011 — Both `quality` and `identity-database` are now mandatory main checks bound to the existing GitHub Actions app, with strict/up-to-date checks. Read-back comparison confirmed every other protection control unchanged: administrators, PR flow, resolved conversations and no force/delete. The initial receipt helper rejected ANSI-colored CLI JSON, so the separate narrow protection updater stripped only ANSI formatting and completed a fail-closed read-back verification. Original protection was never removed or bypassed; PR #12 had passed both jobs before merging, and both checks became mandatory before the receipt-only follow-up. Use saved scripts with fail-closed sequencing rather than loosely chained multiline shell snippets.

P1-EV-012 — The audit archive was refreshed from passing public PR CI: 28 low-resolution intercepted-DTO JPEG captures, no personal sessions or production fixture accounts. Mobile customer identity and forged-operator denial were visually checked; Home/Identity/Foundation and Back to Identity remain readable escape paths. The private disposable MariaDB service is stopped and port3307 has no listener. Its supervisor reported exit137 on cleanup; no managed service, paid VM or system/public DB service was installed or stopped.

The following receipt-only documentation update must pass its own protected PR/main checks. Its final exact-main CI and single source-only managed checkpoint are supplied in an external delivery receipt, because a snapshot cannot include its own future identifier. The implementation/first-main IDs above remain immutable evidence. Managed origin approval/configuration, additive ledger migration, real OAuth/HTTPS customer and exact approved-operator acceptance, backup/restore and production/security operating acceptance remain pending. Latest read-only aggregate still had zero managed accounts and one Phase 0 migration entry; no managed identity or role write occurred. Do not begin request workflows or auto-publish Phase 1.

## Change log

| Date       | Version | Change                                                                                                                                            |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record.                                                                                                          |
| 2026-11-24 | 1.1.0   | Preserved initial records; added protected-merge/CI evidence, blocked runtime, secure-config and release gates, rollback and non-claims.          |
| 2026-11-24 | 1.2.0   | Cleared the securely configured signing-key/runtime gate with actual tests and read-only readiness; final source/release/checkpoint gates remain. |
| 2026-11-24 | 1.3.0   | Appended verified main/tag/prerelease/archive receipts, exact clean-clone scope, Phase 1 next actions and foundation rollback boundary.           |

| 2026-11-24 | 1.4.0 | Added bounded identity implementation and local tests; retained live-pending state. |
| 2026-11-24 | 1.5.0 | Appended corrective PR/main/clone, protection, browser and cleanup evidence without erasing failures. |

---

**Document footer — MGECS-REBUILD-HANDOFF v1.5.0 | Status: phase1-source-verified-live-acceptance-pending | Next review: actual config/runtime verification and final release evidence.**
