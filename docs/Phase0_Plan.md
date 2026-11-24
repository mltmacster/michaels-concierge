---
document_id: MGECS-PHASE0
version: 1.3.0
status: phase0-foundation-verified
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append gate evidence and superseding decisions; preserve failures
---

# Phase 0 — Trusted rebuild foundation

Michael Thomas explicitly approved the recommended rebuild and starting Phase 0 on 2026-11-24. The approved target is a public `mltmacster/michaels-concierge` repository, React/TypeScript + typed Node API + Manus-managed MySQL/TiDB, with human-operated dining/local experiences as the first service scope. Live billing, autonomous booking, and untested provider/AI capabilities remain excluded.

## Plan and boundaries

1. Preserve the old prototype privately and record its source checksums. Do not copy its implementation, hardcoded secrets, internal logs, or customer records into the public rebuild.
2. Establish this clean managed scaffold as the new source baseline. Document the stack change in ADR-007; retain the legacy audit as historical evidence rather than treating PostgreSQL/Flask instructions as current implementation requirements.
3. Add a testable API application factory, validated production configuration, liveness/readiness endpoints, and deterministic failed startup. Startup must never create schema or demo users. Keep framework changes narrow and documented.
4. Replace the demonstration page with a truthful mobile-friendly foundation page and functioning navigation/status controls. No request forms, customer bookings, fake statistics, prices, provider listings, or payment buttons in Phase 0.
5. Establish reproducible scripts for format, lint, types (including tests), unit/HTTP tests, build, dependency audit, documentation checks, browser smoke, and secret scans. Test fixtures exist only in tests.
6. Create the approved public repository only after scanning the proposed source and full history. Add public CI on push/PR, a deliberate failure canary, protected main, issue backlog, and tagged source baseline.
7. Verify a clean clone independently from the working directory. CI builds an artifact from the same commit that passed its checks. Managed deployment remains a separate promotion gate; do not substitute GitHub build success for deployed customer acceptance.
8. Update evidence, README, HANDOFF, resource states, and recovery decisions before stopping. Complete Phase 0 only with recorded gate outcomes; document blocked controls rather than weakening checks.

## D3V × VVV gate mapping

Design is visualized in ADR-007 and the route/runtime map, verified against the approved scope and platform constraints, and validated by the sponsor's explicit selection. Development is visualized in changed-file/test mapping and verified through local/CI gates. Its independent clean-clone smoke tests validate reproducible onboarding, not customer concierge operations. Deployment is visualized as artifact → managed promotion → health/readiness/rollback; build artifact proof and smoke checks do not yet validate a money-making service.

## Failure and recovery rules

Missing secrets/config must stop production before listening and must never leak secret values. Readiness returns 503 when the database cannot be checked; liveness is not database or service readiness. Unknown API routes return JSON 404, not a successful HTML page. No integration returns invented results after failure. Roll back Phase 0 through a recorded Git/checkpoint version; no legacy database migration is performed.

## Initial findings — historical record

The managed scaffold's initial syntax/type check, one logout test, and build passed. The template startup catches and logs failures without setting a failing exit code; it lacks an application factory, readiness, and a complete CI foundation. Demonstration imports enlarge the initial browser bundle. These are observations to repair, not evidence of a completed product.

Autoscale hosting runs one request-serving Node process with an approximately 180-second request limit and scales to zero. Do not implement a durable worker as an in-process timer or assume one replica. SSE/outbox delivery will need a separate reviewed architecture and reconnect strategy in Phase 3.

## Gate update — 2026-11-24, v1.1.0

**Phase 0 release is pending; foundation-built-runtime-blocked.** This dated update supersedes initial pending-gate language only where actual evidence is recorded. See [the evidence ledger](evidence/Evidence_Ledger.md) for retained failures, exact CI links and public backlog issues #2–#9.

| Gate                              | Verified outcome and limitation                                                                                                                                                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preservation and source safety    | 18 legacy application-source hashes unchanged on recheck at 13:06 EST, 2026-11-24. Source and full-history scans passed. No legacy migration or schema/seed mutation performed.                                                                                                              |
| Independent onboarding            | Credential-free `--frozen-lockfile` install, verify/browser/audit passed at clone baseline `ab232288ac276594b6b245be26b2e2dd16affa0e`; not proof for the pending override revision or customer persistence/authentication.                                                                   |
| Public repository and controls    | [Public repository](https://github.com/mltmacster/michaels-concierge); main protection enforces admins, strict `quality`, PRs and resolved conversations; no force push/delete. Private vulnerability reporting enabled. Public issues #2–#9 created.                                        |
| Failure/correction evidence       | Duplicate pnpm version failure 45454429204 corrected; intended failing canary 45454729231 removed rather than weakening its assertion. Both failures retained.                                                                                                                               |
| Protected merge and exact-main CI | [PR #1](https://github.com/mltmacster/michaels-concierge/pull/1) merged as `c198d139384e135873ab3732dd7c13ed1143e12c`. Corrected PR run 45455075575 and exact-main run 45455387123 succeeded. Main evidence includes Docker build, 22 unit/HTTP tests, 3 browser checks and artifact upload. |
| Dependency security               | Drizzle 0.45.4 patches `GHSA-gpj5-g38j-94v9`. Audit: 0 critical/high/moderate, 1 low KaTeX `GHSA-238p-pmpm-9mq7` remains for review; no blanket security-completeness claim.                                                                                                                 |
| Tagged delivery                   | Foundation delivery job correctly skipped on main, because only `v*` tags publish a prerelease. Final tag/prerelease and its pipeline are pending.                                                                                                                                           |
| Managed runtime/config            | Blocked: managed `JWT_SECRET` is shorter than the approved 32-character minimum; startup correctly refuses to listen. Preview is not live. Application-owned `MGECS_SESSION_SECRET` override added to the same existing auth SDK; new tests and actual managed-config validation pending.    |
| Final promotion record            | Final docs/config PR CI, restart/health/read-only DB readiness and exactly one final managed checkpoint are pending. Earlier main CI is not proof for these later changes.                                                                                                                   |

### Remaining ordered exit work

1. The authorized owner must securely configure a new cryptographically random application-owned `MGECS_SESSION_SECRET` of at least 32 characters. Preserve the managed `JWT_SECRET` and strict validation; never publish or log secret values. This reuses the existing session implementation and is not a second auth system.
2. Run `NODE_ENV=production MGECS_VERIFY_CONFIG=true pnpm exec vitest run server/config.test.ts` in the actual configured managed environment. Record the non-skipped actual-config test and override regression results, then full portable verification. Those new results are currently pending; do not equate fixture tests with managed configuration proof.
3. Restart the server and record `/api/health` plus `/api/ready`. The readiness check is read-only `SELECT 1`; a healthy process alone does not prove database readiness, customer persistence or authentication. Do not create schema, migrate or seed for this step.
4. Deliver the final docs/config changes through a protected PR and inspect the exact-commit CI through completion. Verify the final `v*` tag/prerelease pipeline and artifact/commit linkage, then record exactly one final managed checkpoint after actual verification. Do not claim any pending gate passed.
5. Review Phase 0 exit evidence against [Recovery_Gates.md](Recovery_Gates.md) before Phase 1. Phase 1 must establish reviewed identity/data/API contracts, one secure identity path, session and authorization security, explicit migrations, backup/restore rehearsal and guarded disposable-database tests before request UI.

### Recovery and release boundary

Source rollback target: `c198d139384e135873ab3732dd7c13ed1143e12c` (`c198d13`), which remains blocked by the known short managed key. Initial scaffold checkpoint `348e85b8` is a recovery reference, not a customer release. Final managed checkpoint is pending; no migration or database restore is implied by source rollback.

This foundation does not establish a completed Phase 0 release, live preview, customer authentication/persistence, requests, provider integration, AI assistance, payments or revenue. Work remains human-operated dining/local experiences first. No automatic revenue, service-hours or pricing promises are permitted; customer/operator and commercial launch gates require later explicit review and evidence.

## Runtime gate resolution — 2026-11-24, v1.2.0

The v1.1.0 runtime/config blocker is now resolved. The owner generated and securely supplied the application-only key. The actual-environment production config/signature/HTTP gate passed 17 cases; portable tests passed 26 with that single opt-in case skipped, and 3 browser checks passed. The managed preview restarted successfully, with HTTP 200 liveness and real read-only database readiness. No customer authentication, migration/restore or write-based persistence gate is implied.

The foundation is ready for final protected PR/main verification and the explicitly labelled `v0.0.1-phase0` prerelease pipeline. These final delivery and single managed-checkpoint outcomes are not yet recorded as passed. Preserve all earlier failed and blocked records; use the later dated ledger entries to determine current state. Phase 1 remains identity/data/security and guarded disposable integration testing before requests.

## Verified foundation delivery — 2026-11-24, v1.3.0

Protected [PR #10](https://github.com/mltmacster/michaels-concierge/pull/10) passed [CI 45460764458](https://github.com/mltmacster/michaels-concierge/actions/runs/45460764458) and merged as `540ab1f733a2a8d562e7fe6febd34b7c5195d49a`. Exact [main CI 45461104591](https://github.com/mltmacster/michaels-concierge/actions/runs/45461104591) passed, including container build and verified artifact upload. [Tag CI 45461542649](https://github.com/mltmacster/michaels-concierge/actions/runs/45461542649) passed both quality and same-run prerelease delivery. [Foundation prerelease v0.0.1-phase0](https://github.com/mltmacster/michaels-concierge/releases/tag/v0.0.1-phase0) is explicitly marked prerelease, not customer production.

The downloaded archive passed SHA-256 verification and its embedded source identity matches the tagged commit. Independent cleared-environment validation passed against the identical source tree. The earlier source/protection/canary/security/actual signing-key/read-only readiness gates remain valid within their recorded limits. The receipt update is docs-only; its protected PR/main checks and one final managed checkpoint must be completed before handing this foundation to the owner. Checkpoint identity belongs to the platform receipt, not a fabricated pre-snapshot value.

Phase 0 establishes a reproducible, observable engineering foundation and artifact delivery. It does not validate customer login/persistence, migrations/restore, request fulfilment, real-time delivery, provider results, AI quality, payments or profitability. Phase 1 starts with identity/security and data/contracts; all later commercial gates remain open.

## Change log

| Date       | Version | Change                                                                                                                                            |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Recorded approved rebuild scope, ordered Phase 0 work, safety gates, and limitations before implementation.                                       |
| 2026-11-24 | 1.1.0   | Preserved initial plan; appended verified CI/source/control gates, runtime blocker, pending release sequence and bounded rollback.                |
| 2026-11-24 | 1.2.0   | Recorded actual signing-key, runtime and read-only readiness verification while retaining final release gates.                                    |
| 2026-11-24 | 1.3.0   | Recorded passing tagged foundation delivery and immutable-source/archive provenance; retained final handoff/checkpoint and commercial boundaries. |

---

**Document footer — MGECS-PHASE0 v1.3.0 | Status: phase0-foundation-verified | Next review: actual config/runtime validation, final PR/tag pipeline and managed checkpoint.**
