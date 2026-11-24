---
document_id: MGECS-ADR-007
version: 1.0.0
status: accepted-for-phase0
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append dated decisions and evidence; preserve superseded records
---

# ADR-007 — Managed clean rebuild

## Decision and approval

Michael Thomas approved the recommended rebuild and starting Phase 0 on 2026-11-24. Use a new public `mltmacster/michaels-concierge` repository and clean React/TypeScript, Express/tRPC, Drizzle/MySQL-compatible managed database, with one managed OAuth/session scaffold. Preserve the old prototype privately; do not ship its code, secrets or internal logs.

This explicitly supersedes the historical proposed Flask/SQLite implementation, PostgreSQL-specific target, private-repository default, and mandatory initial OpenAPI surface. Historical audit findings remain intact. tRPC types plus runtime input schemas form the initial internal contract; REST/OpenAPI is added only when an external consumer requires it.

## Rationale and consequences

The selected platform provides reproducible client/server/auth/database/hosting primitives. A shared TypeScript contract reduces the component/API drift found in the prototype. MySQL-compatible storage is the platform's provisioned database, not an accidental substitution for PostgreSQL. Review MySQL transactions, row locking, constraints, UTC storage, idempotency, outbox, backup/restore and concurrency in Phase 1.

Manus OAuth is a configured scaffold, not proven customer identity acceptance. Customer login usability and the provider's suitability/terms must be validated before service launch. Do not introduce a second independent token system. Authentication security gaps are tracked in SECURITY.md and the Phase 1 backlog.

## Runtime and delivery

One Node process runs behind managed autoscale hosting, scales to zero, and has bounded request duration. Durable outbox publishing cannot be an in-memory background timer. Phase 3 must select a supported external/event-driven relay and handle reconnect, multiple replicas and platform stream timeouts. Keep durable data in the database, never process memory.

Phase 0 CI produces verifiable build artifacts and foundation prereleases. It does not automatically deploy a paid concierge service. Production requires approved config/migrations, backup/restore, readiness/rollback, observability and user/operator acceptance. Preserve licensing as unassigned rather than auto-licensing the owner's product.

## Reversibility

No customer data migration is performed in Phase 0. The old source remains preserved; a future architecture change requires a superseding ADR and migration/export rehearsal. Revert the foundation through a source tag or managed checkpoint, not destructive database edits.

## Change log

| Date       | Version | Change                                   |
| ---------- | ------- | ---------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record. |

---

**Document footer — MGECS-ADR-007 v1.0.0 | Status: accepted-for-phase0 | Next review: phase-exit evidence or material change.**
