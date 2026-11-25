---
document_id: MGECS-REBUILD-EVIDENCE
version: 1.7.0
status: phase1-source-verified-live-acceptance-pending
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-25
append_protocol: append dated decisions and evidence; preserve superseded records
---

# Evidence ledger

## Observed baseline

P0-EV-001: The new managed scaffold was initialized independently of the old prototype. Initial type check, one logout test and client/server build passed. The template initially lacked public CI, safe startup failure, readiness and a tested application factory. Its demo-page import produced an unnecessarily large browser bundle.

P0-EV-002: Expanded lint found seven inherited dead-code/empty-handler issues. They were corrected rather than disabling the failing rules. TypeScript coverage was expanded to tests/configuration; 22 unit/HTTP tests passed after the foundation changes. Managed explicit-any adapter debt remains separately documented.

P0-EV-003: Initial production dependency audit reported high/critical findings. Dependencies were updated within their declared ranges. One high Drizzle ORM advisory remained and required a specific security upgrade beyond the original 0.44 range. Do not mark the security gate passed until the final audit is recorded.

P0-EV-004: Gitleaks 8.30.1 official archives were checksum-verified. The first downloaded x64 executable did not run on the arm64 sandbox; the architecture-aware installer corrected this tooling issue. This was not an application defect.

## Evidence rules

Append exact commands, source commit, timestamp, environment, outcome, artifact/CI link and limitations. Keep failed runs and link their corrective evidence. Portable isolated fixtures are tests, not product data. Local build/API/browser smoke does not prove database persistence, customer authentication, provider discovery, AI quality, real-time delivery, payments or production acceptance.

## Pending gate records — historical record, superseded below

Final format/lint/type/doc/test/build/security/browser/clean-clone results, public CI and its intentional failure canary, protected main and baseline tag, and artifact delivery must be appended before Phase 0 is called complete.

## Verified Phase 0 checks — 2026-11-24

P0-EV-005: `pnpm verify` passed locally: formatting, zero-warning lint, strict types including tests/configuration, 10-document integrity, 22 unit/HTTP tests, client/server build and isolated production smoke. `pnpm test:browser` passed 3 desktop/mobile/error-state checks. Source snapshot scan passed. Full-history Gitleaks passed on 2 commits after forcing medium Git log formatting; the initial zero-commit scanner result was insufficient and not accepted as history proof.

P0-EV-006: An independent GitHub clone of baseline `ab232288ac276594b6b245be26b2e2dd16affa0e` installed with `--frozen-lockfile` and passed verify/browser/audit with a cleared environment and no application credentials. This validates clean onboarding at that baseline, not customer login/persistence.

P0-EV-007: Public GitHub repository creation and main protection were verified. Main requires the `quality` check, up-to-date branches, pull requests and resolved conversations; admins cannot bypass it and force pushes/deletions are disabled. The initial public CI run failed because packageManager and action config both declared a pnpm version. Corrected by using packageManager as the single version source, not bypassing the setup step. Failed run: https://github.com/mltmacster/michaels-concierge/actions/runs/45454429204 .

P0-EV-008: The deliberate test-only canary failed in public CI at the expected assertion, while all 22 foundation tests passed. The failure proves the test gate blocks broken code. The canary is removed in a superseding revision, not weakened. Failed run: https://github.com/mltmacster/michaels-concierge/actions/runs/45454729231 ; PR: https://github.com/mltmacster/michaels-concierge/pull/1 .

P0-EV-009: After dependency updates and Drizzle 0.45.4, the production audit reported zero high/critical/moderate findings and one low KaTeX advisory (GHSA-238p-pmpm-9mq7). The low-severity item remains visible for Phase 1 review; the unused rich-content component is not exposed on foundation pages. Node container base was pinned to a verified multi-platform registry digest. No security-audit completeness claim is made.

Historical pending statement, superseded by P0-EV-010 and P0-EV-011 only for the verified PR/main revisions: Final corrected-commit CI/container/artifact evidence remains pending and must be appended after completion.

## Release evidence update — 2026-11-24, v1.1.0

**Current status: foundation-built-runtime-blocked / phase0-release-pending.** The following records use the verified release facts supplied by the release operator on 2026-11-24. They do not assert that the pending override revision or final release gates have run. Only the legacy hash recheck has a supplied exact observation time; no other precise completion time is invented.

P0-EV-010 — **Corrected PR CI: SUCCESS.** Public repository: https://github.com/mltmacster/michaels-concierge . Corrected [PR #1](https://github.com/mltmacster/michaels-concierge/pull/1) CI run [45455075575](https://github.com/mltmacster/michaels-concierge/actions/runs/45455075575) succeeded after the duplicate pnpm version fix and removal of the intended failing canary. P0-EV-007/008 remain failed-run history, not erased or reclassified as passes. Protected PR #1 merged to main at `c198d139384e135873ab3732dd7c13ed1143e12c`.

P0-EV-011 — **Exact-main CI: SUCCESS; tag delivery skipped as designed.** [Run 45455387123](https://github.com/mltmacster/michaels-concierge/actions/runs/45455387123) verified exact main commit `c198d139384e135873ab3732dd7c13ed1143e12c`, including Docker build, 22 unit/HTTP tests, 3 browser checks and artifact upload. The foundation delivery job correctly skipped on main, because only `v*` tags publish a prerelease. Artifact upload is build evidence, not managed runtime/promotion or customer acceptance. The final tag/prerelease pipeline remains pending.

P0-EV-012 — **Source preservation and scans: PASS within recorded scope.** Source and full-history scanner checks passed; the earlier zero-commit result in P0-EV-005 remains explicitly insufficient. All 18 legacy application-source hashes were rechecked unchanged at **13:06 EST on 2026-11-24**. No legacy application migration, schema mutation or seed mutation was performed. The independent credential-free locked-install/verify/browser/audit result remains scoped to baseline `ab232288ac276594b6b245be26b2e2dd16affa0e`, not the later pending docs/config revision.

P0-EV-013 — **Repository controls and dependency follow-up.** Main protection enforces administrators, strict/up-to-date `quality`, pull requests and resolved conversations; force pushes and deletions are disabled. Private vulnerability reporting is enabled. Drizzle was upgraded to 0.45.4 to patch `GHSA-gpj5-g38j-94v9`. Production dependency audit: **0 critical, 0 high, 0 moderate, 1 low**. Remaining low advisory: KaTeX `GHSA-238p-pmpm-9mq7`; retain for Phase 1 review. This is not a claim of complete application security.

P0-EV-014 — **Public backlog created, not completed.** Actual public issues #2–#9 were created in the approved repository. Titles below map in creation order from the release operator's existing `create_backlog.py`; issue existence does not establish implementation or acceptance.

| Issue                                                           | Actual public title                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [#2](https://github.com/mltmacster/michaels-concierge/issues/2) | Phase 1: secure one customer/operator identity and authorization contract     |
| [#3](https://github.com/mltmacster/michaels-concierge/issues/3) | Phase 1: schema, explicit migrations and guarded disposable integration tests |
| [#4](https://github.com/mltmacster/michaels-concierge/issues/4) | Phase 2: client to administrator to client request vertical slice             |
| [#5](https://github.com/mltmacster/michaels-concierge/issues/5) | Phase 3: durable events, measured delivery and operating controls             |
| [#6](https://github.com/mltmacster/michaels-concierge/issues/6) | Phase 4: approved provider-backed dining/local discovery                      |
| [#7](https://github.com/mltmacster/michaels-concierge/issues/7) | Phase 5: grounded AI assistance and evaluation                                |
| [#8](https://github.com/mltmacster/michaels-concierge/issues/8) | Phase 6: Stripe payment and reconciliation boundary                           |
| [#9](https://github.com/mltmacster/michaels-concierge/issues/9) | Commercial launch: customer/operator acceptance and viable service operations |

P0-EV-015 — **Managed runtime: BLOCKED; override tests: PENDING.** The managed `JWT_SECRET` is too short for the approved minimum of 32 characters. The server correctly refuses to listen, so the managed preview is **not live**. The release operator added application-owned `MGECS_SESSION_SECRET` resolution to the same existing auth SDK/session path, not a second authentication system. The strict minimum is preserved and no managed system variable was mutated. New override/config tests are pending; neither the earlier 22-test result nor exact-main run 45455387123 validates this later revision. The authorized owner must securely provide the fresh application key through managed configuration; no secret value belongs in this ledger.

P0-EV-016 — **Outstanding exit gates and exact next action.** Securely configure a new cryptographically random `MGECS_SESSION_SECRET` of at least 32 characters without changing managed `JWT_SECRET`. In the actual configured environment run `NODE_ENV=production MGECS_VERIFY_CONFIG=true pnpm exec vitest run server/config.test.ts`; require the actual-config test to execute and pass, not skip, and verify override regressions plus full portable checks. Restart the managed server; record `/api/health` and `/api/ready`, whose database probe is read-only `SELECT 1`. No schema/seed/migration writes are authorized. Then verify the protected final docs/config PR's exact-commit CI, final `v*` tag/prerelease pipeline and artifact linkage, and exactly **one final managed checkpoint** after actual validation. Every gate in this record is pending; fixture-only tests, screenshots or earlier main build success do not substitute for it.

P0-EV-017 — **Rollback and Phase 1 boundaries.** Source rollback: main `c198d139384e135873ab3732dd7c13ed1143e12c` (`c198d13`), which remains blocked under the known short managed key. Initial scaffold checkpoint `348e85b8` is a recovery reference, not a customer release. Final checkpoint is pending. No legacy migration or schema/seed mutation occurred; source rollback is not a database restore. After reviewed Phase 0 exit evidence, Phase 1 must establish reviewed identity/data/API contracts, session audience/expiration/revocation, CSRF/origin, trusted proxy/storage-failure behavior, RBAC/ownership denial, explicit migrations, backup/restore rehearsal and guarded disposable-database integration tests before customer request UI.

No record above establishes Phase 0 completion, customer authentication/persistence, requests, providers, AI assistance, payments, production acceptance or revenue. The first service scope remains human-operated dining/local experiences. Automatic revenue, service-hours and pricing promises are prohibited; later customer/operator and commercial gates remain unfulfilled.

## Runtime gate resolution — 2026-11-24, v1.2.0

P0-EV-018 — **Application-owned key/configuration: PASS.** The owner generated a fresh cryptographically random app-only signing key and supplied `MGECS_SESSION_SECRET` through secure managed configuration. No value is included in source, logs or this record; managed `JWT_SECRET` was unchanged. Production-mode opt-in Vitest command `NODE_ENV=production MGECS_VERIFY_CONFIG=true pnpm exec vitest run server/config.test.ts` passed all 17 cases at 18:28 UTC. Actual SDK signature verification and wrong-key rejection plus a lightweight HTTP health request passed. This short-lived isolated proof did not create/authenticate a customer or write to a database. Earlier fixture-only test results did not clear this gate.

P0-EV-019 — **Managed preview liveness/readiness: PASS.** After the supported restart at 18:27 UTC, `GET /api/health` returned 200 with `status: ok`, `phase: foundation`; `GET /api/ready` returned 200 with `status: ready`. The live readiness implementation uses read-only `SELECT 1`. The managed development preview is live; it is not a customer production launch. No seed/migration/schema/customer writes were performed. Desktop homepage and mobile status captures were reviewed in an isolated browser without personal login.

P0-EV-020 — **Portable override regressions: PASS before final release.** `pnpm test` passed 26 portable cases; the one actual-environment acceptance case intentionally skipped without `MGECS_VERIFY_CONFIG=true`. The separate opt-in run executed that case successfully. `pnpm lint`, `pnpm check`, build and isolated production smoke passed; 3 browser tests passed. Final full verification and exact-commit final PR/main/tag evidence are still required before delivery. P0-EV-015/016 remain historical blocked/pending records, superseded only by these observed outcomes.

## Verified foundation delivery — 2026-11-24, v1.3.0

P0-EV-021 — **Final configuration/docs PR and main: PASS.** Protected [PR #10](https://github.com/mltmacster/michaels-concierge/pull/10) passed [CI 45460764458](https://github.com/mltmacster/michaels-concierge/actions/runs/45460764458) and merged as `540ab1f733a2a8d562e7fe6febd34b7c5195d49a`. Exact [main CI 45461104591](https://github.com/mltmacster/michaels-concierge/actions/runs/45461104591) passed, including container build and verified artifact upload. [Tag CI 45461542649](https://github.com/mltmacster/michaels-concierge/actions/runs/45461542649) passed both quality and same-run prerelease delivery. [Foundation prerelease v0.0.1-phase0](https://github.com/mltmacster/michaels-concierge/releases/tag/v0.0.1-phase0) is explicitly marked prerelease, not customer production.

P0-EV-022 — **Final clean-clone validation: PASS.** Independent public-clone source `f3d2d0780b9be904bedf6bcf319bd3f68b805b80` passed `--frozen-lockfile` installation, full verify, browser and production audit in an environment cleared of application credentials. Its Git tree equals the tagged merge `540ab1f733a2a8d562e7fe6febd34b7c5195d49a`. Portable CI passed 26 tests with exactly one opt-in actual-environment case skipped; the separately configured managed production-mode run executed all 17 configuration cases. These are not customer login or persistence acceptance tests.

P0-EV-023 — **Tagged artifact CD/provenance: PASS.** Tag `v0.0.1-phase0` resolves to `540ab1f733a2a8d562e7fe6febd34b7c5195d49a`. Tag run `45461542649` passed quality and the same-run foundation delivery job. The released `foundation-build.tar.gz` and checksum downloaded successfully; `sha256sum --check foundation-build.sha256` passed. Embedded `VERIFIED_SOURCE.txt` equals `540ab1f733a2a8d562e7fe6febd34b7c5195d49a`. Archive SHA-256: `fa003e9e523946322ceb67b0dd0ef14837cfea77e920c1d5e9219847b38f58b5`. Linked docs are included; runtime secret files are absent. The release is explicitly a prerelease and is not a customer service launch.

P0-EV-024 — **Packaging-tool failure corrected without waiving verification.** An auxiliary local Python packaging check initially could not import PyYAML. Verification was rerun with the repository's already installed `yaml` parser and passed archive checksum/source identity/complete local docs/no runtime secret file. No application rule or CI test was disabled. Public CI then assembled and delivered the verified archive successfully.

P0-EV-025 — **Final documentation/checkpoint boundary.** These final receipts are appended after the immutable tag artifact, in a docs-only follow-up. Their exact protected PR/main checks and the single final managed checkpoint remain required before delivery. The final platform checkpoint receipt and any later exact-main CI pointer are delivered separately. Do not invent a self-referential checkpoint/source identifier or reinterpret artifact CD as live customer deployment.

## Phase 1 source/integration evidence — 2026-11-24

P1-EV-001 — Baseline `53ba1a3` passed tests/types/build before implementation. Read-only published GET health was 200; separate managed metadata/aggregate showed users + migration journal and zero accounts. No identity/role/fixture writes occurred. Independent review found missing claim/lifetime enforcement, year-long sessions, owner auto-promotion/read-time sync, cookie-only logout, CSRF/forwarded-scheme trust and raw error/outage masking; bounded corrections were planned first.

P1-EV-002 — Codec-only suite passed 114/114 with isolated random keys. Later portable run passed 323 tests across 9 files, one actual-environment proof skipped by default; tests include exact claims, mandatory expiry, invalid/legacy/wrong-key/alg/token, ledger/idle/revoked, roles/self ownership, OAuth origin/nonce/Unicode cookie, mutation policy, outage, redaction and rate-limit checks. No managed test writes occurred.

P1-EV-003 — Initial local DB package fetch lacked package metadata; refreshing it resolved the environment issue. Runtime was privately extracted rather than installing a system/public DB service. Generated SQL was reviewed, then applied by the guard to an empty private loopback MariaDB10.11.14 schema. First 18 SQL cases passed. Added collation tests initially expected an outage for a rejected/absent subject; the contract was corrected to explicit invalid-provider-identity rejection, retaining full no-profile/role-mutation assertions. Final 20/20 integration cases passed. Independent SQL observations/service reconstruction establish durable persistence, not real provider/physical restart/customer UAT.

P1-EV-004 — Isolated portal browser suite passed 22/22 after correcting test-selector and refresh synchronization mistakes, not production behavior. Parent's first simultaneous full browser command was refused because the agent harness owned port4179; no reuse/kill bypass was used. The agent exited its harness before parent full rerun. Twenty-eight low-resolution DTO-fixture screenshots were created; final full-suite/visual inspection receipts follow when observed. No personal browser/provider/DB session was used.

P1-EV-005 — Managed migration, exact-origin configuration, actual production-mode config acceptance and real-account OAuth/operator UAT remain pending. No live operator was created, no Phase 1 deployment was promoted and backup/restore is not claimed. Final pre-commit/secret/dependency scans, protected PR/main CI/container and checkpoint outcomes must be appended as observed; earlier successful tests do not prove a later untested commit.

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

## Approved-origin configuration resolution — 2026-11-24, v1.6.0

P1-EV-013 — Immutable source/checkpoint: `a27a964537b56741daf0caf7afc6731e90a64017` / `a27a9645`. Authoritative private evidence: `/home/ubuntu/mgecs-phase1-private-evidence/deployment-approved-origin-config.log`, `deployment-approved-origin-build.log`, and `deployment-approved-origin-startup.json`/log. Production rollout logs at 21:07:05 and 21:32:53 UTC showed `Invalid runtime configuration MGECS_APP_ORIGINS`, exit 1 before port 3000 startup. The owner approved only `https://michaelconci-l64nfwm.manus.space`; the initial call was interrupted, its retry rejected, and the 21:48:44 actual-environment run recorded 35 portable passes and 1 actual-environment failure.

P1-EV-014 — Reauthorization occurred at 22:27:04 UTC; managed configuration confirmed `MGECS_APP_ORIGINS` saved at 22:27:37 UTC. No signing-key or GitHub-secret change is claimed. Development preview remains unallowlisted. No hardcoded origin, host-derived security default or guard relaxation was introduced.

P1-EV-015 — `NODE_ENV=production MGECS_VERIFY_CONFIG=true` Vitest config tests passed all 36 cases at 22:27:44 UTC; the actual-environment case executed with no skip, using an isolated token and lightweight health only, with no customer/DB writes. The new production build passed at 22:28:18 UTC. A bounded production-dist process using the real saved configuration confirmed the exact approved published-only origin, listening, static page 200, health 200 and actual managed DB readiness 200 via read-only `SELECT 1`; the probe stopped at 22:29:15 UTC.

This clears approved-origin configuration and demonstrates startup-blocker resolution only, not managed rollout success or real identity acceptance. Managed migration, real OAuth/HTTPS/exact-approved-operator UAT, backup/restore/security and requests remain pending. On resume, re-confirm stored configuration without re-requesting this origin. Complete reviewed migration/account/recovery gates before calling live identity functional. Parent-run precommit/PR/main CI and the external receipt remain separate follow-up evidence; no future IDs are embedded here.

## Phase 1 continuation — 2026-11-25, v1.7.0

P1-EV-016 — At resumption the workspace was clean `main` at `2309ae13854f5704dac61fbe78a968b200b78c48`, tree `75b7e664a55755c86c14d6d8169ea607a3ca805b`; managed status reported `2309ae13` and a running development service. Public main and [CI 45502249693](https://github.com/mltmacster/michaels-concierge/actions/runs/45502249693) were rechecked, both required jobs successful. This historical exact-main check does not validate new handoff/document changes. At 22:27 UTC the portable suite reran: 323 passed, one opt-in actual-config case skipped. A separate production-config run passed all 36 cases with no skip and checked the exact saved published-only allowlist without changing or printing keys.

P1-EV-017 — At 22:27 UTC anonymous public HTTPS health/readiness probes returned 200, foundation/ready. The platform previously reported rollout success, but deployed backend-source identity and live account acceptance were not inferred. Fresh managed read-only aggregate: one account, zero operators, one migration entry and absent `userSessions`. Subsequent metadata identified TiDB v8.5.3/InnoDB, signed `users.id` and existing provider-key/role contract. Runtime Phase 0 journal hash/timestamp match the tracked migration. No personal profile fields, fixtures, role changes or DDL were accessed/written. Current one-account inventory supersedes historical zero-account counts. `SELECT 1` still is not ledger readiness.

P1-EV-018 — Independent read-only review confirmed the exact additive ledger SQL/hash, runtime-journal/partial-DDL caveats and recovery gaps. A restored old ledger can erase later revocation; restored users can erase demotion/deletion. The new [migration/recovery runbook](../Phase1_Migration_Recovery.md) requires restored-session invalidation and role/deletion reconciliation before reopening. The correct actual approved origin is `https://michaelconci-l64nfwmv.manus.space`; v1.6 handoff/README/evidence prose omitted the final `v`, while Resources and the external receipt were correct. This correction did not change configuration. Incremental/backup-restore rehearsal is a separate in-progress proof, not yet marked passed here.

The initial handoff update passed full verify, cold strict types, production build/smoke, all 25 browser tests, audit and diff checks; audit remains one low finding, no high/critical/moderate. Later documentation additions require their own final verification and protected PR/main receipts. Managed backup, exact migration approval/application, real OAuth/HTTPS/operator and operating-security acceptance remain pending; no customer request capability is enabled.

P1-EV-019 — At 22:37:19–22:37:22 UTC a fresh isolated MariaDB10.11.14 rehearsal passed: actual Drizzle incremental migration preserved one synthetic existing Phase 0 customer; exact ledger/FK/indexes and two correct journal entries; safe migrator rerun made no duplicate/data/schema change; unmodified codec/service with local SQL adapter authenticated one hashed-ledger session. Real private logical users/ledger/journal backup/restore used a separately guarded target. The stale snapshot actually resurrected one active session and one admin; atomic restored-session revocation/post-backup role reconciliation produced zero active sessions/admins, replay denial and preserved demotion. A third schema with only first ledger CREATE was detected incomplete (no FK/two indexes/Phase 1 journal), with no blind rerun/reset/DROP.

Authoritative sanitized private receipt: `/home/ubuntu/mgecs-phase1-private-evidence/independent-completion-wwjgh6ur/proof.json`, with retained runner/progress/failure/cleanup records. Three earlier fresh helper attempts failed on SQL-vs-JavaScript table ordering; exact order-independent comparison corrected the helper, preserving all metadata/security assertions. Every owned engine stopped by bounded SIGTERM, port3307 is closed, and fixture data/password/raw backup were deleted. No actual application/managed record, Git/CI/config or key was changed by that rehearsal. It did not rerun the full 20-case integration suite or prove managed TiDB/provider/HTTPS/operator/physical-restart acceptance. Migration hash remains `eb3eab3601989e238f639a25dd96f3e0258d60078e2762b7760068f24e62d567`. A separate read-only managed query verified `tidb_enable_foreign_key=ON`; no setting was changed.

This satisfies the newly scoped isolated incremental/recovery procedure, not live backup/migration or Phase 1 completion. The exact next gate is verified private managed backup and approved additive migration, then managed metadata/journal/account acceptance. Final source checks/PR/main/checkpoint receipts remain separate observations.

## Change log

| Date       | Version | Change                                                                                                                                                  |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record.                                                                                                                |
| 2026-11-24 | 1.1.0   | Preserved baseline and failures; appended exact PR/main CI, preservation/security/backlog evidence, runtime blocker and pending release/rollback gates. |
| 2026-11-24 | 1.2.0   | Appended actual managed signing-key/HTTP and read-only readiness results and override regressions; preserved previous blocked records.                  |
| 2026-11-24 | 1.3.0   | Appended final PR/main/tag/clone/archive evidence and visible corrected packaging-tool failure; retained exact checkpoint and customer boundaries.      |

| 2026-11-24 | 1.4.0 | Added bounded identity implementation and local tests; retained live-pending state. |
| 2026-11-24 | 1.5.0 | Appended corrective PR/main/clone, protection, browser and cleanup evidence without erasing failures. |
| 2026-11-24 | 1.6.0 | Appended approved-origin configuration resolution, actual 36-case validation and bounded startup/readiness evidence while preserving rollout and identity limitations. |
| 2026-11-25 | 1.7.0 | Appended exact resumption/source/CI/config/probe evidence, current existing-account baseline, historical origin correction and secure migration/recovery review. |

---

**Document footer — MGECS-REBUILD-EVIDENCE v1.7.0 | Status: phase1-source-verified-live-acceptance-pending | Next review: incremental migration/recovery proof, final source gates and exact managed approval.**
