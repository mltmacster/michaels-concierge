---
document_id: MGECS-REBUILD-RESOURCES
version: 1.1.0
status: active-inventory
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append dated decisions and evidence; preserve superseded records
---

# Resource and approval inventory

GitHub repository/account access was verified for `mltmacster`; the sponsor approved public source and CI. Credentials remain task-scoped and must not be embedded in the deployed application. Public repository creation/quality/protection evidence is recorded in the ledger.

Manus-managed scaffold provides Node hosting, MySQL-compatible database, OAuth and optional file/integration APIs. Phase 0 uses the hosting/development foundation and a read-only readiness probe. Customer identity, migration/restore, runtime provider terms, data retention, TLS and operational acceptance remain Phase 1/release gates.

Gitleaks 8.30.1 is pinned to verified official release archive checksums. Source/history scanning is a preventive control, not proof that no secret can ever leak. Reference: https://github.com/gitleaks/gitleaks . GitHub action revisions are pinned to full commit hashes retrieved from their official repositories.

A warm dining-interior visual was collected as an editorial reference from the Unsplash restaurant-interior catalog (https://unsplash.com/s/photos/restaurant-interior), search position 2, and retained outside the project. It is not used as a provider listing or shipped photo. Exact photo/author/licensing approval is required before publication; no licensing claim is inferred from the catalog search result.

Google Places/Routes and AI are approved directions, not configured/live integrations. Before use record owner, application-owned credentials, official contract/terms, quotas/cost, source attribution, retention, failure path and tests. Stripe remains disabled pending commercial/security policies. Email/SMS and supplier booking accounts are unselected and unconfigured. No placeholder keys are stored in this inventory.

## App signing-key configuration — 2026-11-24

`MGECS_SESSION_SECRET` is configured through the secure managed project store, owned by Michael Thomas and used server-side by the existing OAuth/session SDK. It is a freshly generated application key, not a GitHub token, API key or reused password. No value is recorded here. The managed built-in key remains untouched. Actual config/signature/wrong-key/HTTP acceptance passed; rotation requires new secure configuration and invalidates old session signatures. Phase 1 must establish expiration/revocation policy and reviewed rotation/runbook behavior before customer use.

The pinned GitHub v4 actions currently produce an upstream Node20-to-Node24 deprecation annotation while passing. Review official supported action revisions in Phase 1; do not silently upgrade or waive checks solely to remove an annotation.

## Change log

| Date       | Version | Change                                                                                                        |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record.                                                                      |
| 2026-11-24 | 1.1.0   | Recorded securely configured app-owned session key and visible upstream action-runtime maintenance follow-up. |

---

**Document footer — MGECS-REBUILD-RESOURCES v1.1.0 | Status: active-inventory | Next review: phase-exit evidence or material change.**
