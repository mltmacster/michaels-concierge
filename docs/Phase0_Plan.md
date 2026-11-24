---
document_id: MGECS-PHASE0
version: 1.0.0
status: implementation-in-progress
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

## Initial findings

The managed scaffold's initial syntax/type check, one logout test, and build passed. The template startup catches and logs failures without setting a failing exit code; it lacks an application factory, readiness, and a complete CI foundation. Demonstration imports enlarge the initial browser bundle. These are observations to repair, not evidence of a completed product.

Autoscale hosting runs one request-serving Node process with an approximately 180-second request limit and scales to zero. Do not implement a durable worker as an in-process timer or assume one replica. SSE/outbox delivery will need a separate reviewed architecture and reconnect strategy in Phase 3.

## Change log

| Date       | Version | Change                                                                                                      |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Recorded approved rebuild scope, ordered Phase 0 work, safety gates, and limitations before implementation. |

---

**Document footer — MGECS-PHASE0 v1.0.0 | Status: implementation-in-progress | Next review: gate evidence and baseline delivery.**
