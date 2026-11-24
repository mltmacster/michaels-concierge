---
document_id: MGECS-CONTRIBUTING
version: 1.0.0
status: active
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append dated decisions and evidence; preserve superseded records
---

# Contributing

Read [HANDOFF.md](HANDOFF.md), the [documentation index](docs/README.md), and the phase plan before editing. Work in one bounded vertical slice. Define the affected journey, authorization/data/API/event contracts, failure states, tests, telemetry and rollback before code. No mock provider results in product paths.

Use a branch and pull request. Run `pnpm verify`, `pnpm test:browser`, the production dependency audit and Gitleaks. Do not bypass protected-main checks, weaken tests to merge, or use production/customer data for tests. Portable tests must not require service credentials; integration tests require a separately approved disposable database and guard.

All tests/configuration are included in the strict type check. Lint scans the source tree with zero warnings, but explicit `any` in inherited managed adapters is separately tracked for Phase 1. Treat that as technical debt, not full end-to-end runtime schema validation.

Add a dated evidence entry and update HANDOFF before pausing. Every public capability claim requires repeatable verification and intended-user/operator acceptance. A passing foundation build is not a working concierge product.

Branch policy: pull requests into main; the quality status is required once its first run exists. Do not publish personal data, runtime configuration, internal audit logs, raw provider responses or secret values. Preserve failed tests and document the preventive control. No license is granted until the owner assigns one.

## Change log

| Date       | Version | Change                                   |
| ---------- | ------- | ---------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record. |

---

**Document footer — MGECS-CONTRIBUTING v1.0.0 | Status: active | Next review: phase-exit evidence or material change.**
