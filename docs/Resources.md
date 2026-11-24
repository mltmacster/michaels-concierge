---
document_id: MGECS-REBUILD-RESOURCES
version: 1.3.0
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

## Phase 1 resource state — 2026-11-24

The existing published origin is `https://michaelconci-l64nfwmv.manus.space`; the development origin is `https://3000-ipzieqzej1k3obkrjrs1e-0388ca72.us5.manus.computer`. Approval/configuration of their exact server allowlist is pending; never infer it from request headers. The already approved app signing key stays private and unchanged. Conservative session timeout defaults require no extra paid service.

A finite private MariaDB 10.11.14 runtime was extracted in the sandbox, run unprivileged on loopback only and used exclusively for guarded fixture tests. It is not a purchased VM, hosted product database or persistent service deployment. GitHub's independent MySQL8 integration service uses fixture-only credentials and a generated app key; no managed credentials enter it. Managed user/session fixtures were not inserted and additive live ledger migration is pending. Real operator identity/approval, backup/restore, proxy/edge abuse policy, transport, centralized monitoring and account lifecycle remain unassigned acceptance resources.

## Approved origin configuration — 2026-11-24, 22:27 UTC

Michael approved only `https://michaelconci-l64nfwmv.manus.space`. Managed configuration confirmed `MGECS_APP_ORIGINS` saved at 22:27:37 UTC; the development preview is intentionally excluded. This is public URL configuration, not a new signing key or GitHub Actions secret. Earlier interrupted/rejected requests and failed actual-environment tests are preserved in the handoff/evidence history.

All 36 production configuration cases passed with the actual-environment case executing. A fresh production build and bounded sandbox production process passed listening/static/health and real read-only database readiness (`SELECT 1`). The probe was stopped. This clears the saved-origin configuration/startup blocker, not the failed managed rollout itself or ledger/OAuth/operator/recovery acceptance. Re-confirm stored configuration on resumption; do not re-request the same approved origin or expand it without approval.

## Change log

| Date       | Version | Change                                                                                                                     |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record.                                                                                   |
| 2026-11-24 | 1.1.0   | Recorded securely configured app-owned session key and visible upstream action-runtime maintenance follow-up.              |
| 2026-11-24 | 1.2.0   | Recorded bounded Phase 1 runtime/testing resources and historically pending exact origins.                                 |
| 2026-11-24 | 1.3.0   | Recorded approved published-only managed configuration and actual production startup proof; live identity remains pending. |

---

**Document footer — MGECS-REBUILD-RESOURCES v1.3.0 | Status: active-inventory | Next review: phase-exit evidence or material change.**
