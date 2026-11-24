---
document_id: MGECS-REBUILD-GATES
version: 1.1.0
status: phase1-development-acceptance-pending
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append dated decisions and evidence; preserve superseded records
---

# Recovery and commercial release gates

Phase 0 establishes public source/CI, README and handoff, reproducible client/server builds, validated config, application factory, health/readiness, clean-clone verification, a failure canary and artifact delivery. Feature work waits for the baseline gates or explicitly documented sponsor/platform blockers.

Phase 1 establishes reviewed product/design/spec/schema/API/hook contracts for the chosen stack, one secure identity implementation, RBAC/ownership denial tests, explicit migration and backup/restore rehearsal, config/secret policy and guarded disposable integration testing. No customer request UI before those boundaries are verified.

Phase 2 implements one end-to-end request journey: customer intake → authorized administrator queue → assignment/message/state change → customer notification and canonical timeline. Verify idempotency, cross-role access, invalid transitions, persistence, errors and browser journeys; no direct database edits to make the demo pass.

Phase 3 verifies durable outbox delivery, supported real-time transport/reconnect, metrics, alerts, rollback and operator response policy. Claim real-time only with measured staging delivery evidence; autoscale background timers are not a durable relay.

Phase 4 introduces approved provider-backed dining/local discovery with source IDs, retrieval time, attribution/terms, quotas, failure handling and manual fallback. No invented prices, availability or reservations.

Phase 5 introduces evaluated, schema-validated, tool-grounded AI assistance with logged model/tool versions and human review. The deployed product cannot use this conversation's MCP credentials. It needs its own approved service credentials and tools. No autonomous purchases.

Phase 6 introduces Stripe membership or approved service fees only after pricing, cancellation/refund/fulfillment policies and reconciliation are approved. Verify signatures, duplicate/out-of-order webhooks and refund behavior before live billing. No payment state from browser success callbacks.

Commercial launch requires the actual customer/operator flow, privacy/terms, defined service area/hours/capacity, support and escalation owner, working payments where sold, provider boundaries, monitored deployment and acceptance. Pricing must cover staff effort, service costs, payment fees and acquisition; demand and profit remain unproven. No invented revenue forecast or 24/7 promise.

## Phase 1 identity subgate — 2026-11-24

Identity/security source, denied-access/outage contracts, a reviewed additive ledger and guarded SQL/browser tests are implemented as described in [Identity_Runbook.md](Identity_Runbook.md). This is not completion of the whole Phase 1 data gate: exact managed origin configuration/migration, actual permitted-account customer/operator UAT, backup/restore and remaining release-security policies must still be observed. Keep request UI, notifications, provider/AI and billing disabled until the relevant gates pass. The published foundation remains separate from development source promotion.

## Change log

| Date       | Version | Change                                   |
| ---------- | ------- | ---------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record. |

---

**Document footer — MGECS-REBUILD-GATES v1.1.0 | Status: phase1-development-acceptance-pending | Next review: phase-exit evidence or material change.**
