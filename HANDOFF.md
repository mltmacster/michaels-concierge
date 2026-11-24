---
document_id: MGECS-REBUILD-HANDOFF
version: 1.0.0
status: phase0-in-progress
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

## Current state

A managed full-stack scaffold exists. The foundation UI/status API, startup config validation, mutation-free app factory, health/readiness and portable tests were implemented. All concierge/business capabilities remain disabled. Phase 0 gate results are recorded in the evidence ledger; do not call the product completed or shipped to customers.

## Stop/resume rules

Read the latest evidence before coding. Confirm branch/commit, runtime and migration state anew; never assume session-installed tools, current model catalog or preview services persist. Run the portable suite and check the same commit's CI before beginning Phase 1. Do not weaken gates or substitute a screenshot for an end-to-end trace.

## Required next work

Finish Phase 0 evidence/CI/protection/clean-clone/artifact gates. Then implement reviewed Phase 1 identity/data/contracts before request UI. Backlog must cover session audience/expiration/revocation, CSRF/origin, trusted proxy and storage-failure handling, RBAC/ownership denial, explicit migrations and restore, guarded disposable integration tests, UTC/data constraints, and deployment/security review. Customer/operator acceptance and commercial policies remain unassigned gates; do not invent service hours, SLA, pricing or supplier agreements.

Before stopping append exact work, known failures, skipped tests, commit/checkpoint, next action and rollback. Source-control and artifact delivery are not automatic production service launch.

## Change log

| Date       | Version | Change                                   |
| ---------- | ------- | ---------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record. |

---

**Document footer — MGECS-REBUILD-HANDOFF v1.0.0 | Status: phase0-in-progress | Next review: phase-exit evidence or material change.**
