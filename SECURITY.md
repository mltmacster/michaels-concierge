---
document_id: MGECS-SECURITY
version: 1.1.0
status: development-controls-live-acceptance-pending
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append dated decisions and evidence; preserve superseded records
---

# Security boundaries

Never disclose credentials, customer records, signing secrets, tokens or private provider data in public issues, commits, logs or release artifacts. Use GitHub private vulnerability reporting when available; otherwise contact the repository owner privately before sharing details. No public email address is invented here.

The foundation provides fail-closed configuration at process start, a signed managed cookie-session scaffold, bounded request bodies, basic HTTP security headers, a non-writing application factory and secret/dependency checks. This is not a complete security audit. Phase 1 must verify session expiration/revocation, application audience checks, CSRF/origin policy, cross-role and cross-client authorization, trusted proxy configuration, rate limits, and storage-failure behavior.

CSP is deliberately not enforced until required asset/provider origins are reviewed; no Phase 0 customer-service launch is permitted on that basis. Production OAuth URLs require HTTPS. Do not infer TLS/database transport compliance solely from a syntactically valid DATABASE_URL; verify the provider's network/transport policy before customer data.

Runtime environment files, managed project state, logs, database files and private key material are excluded by ignore rules. Scan full Git history and proposed files before pushing. Test-generated random secrets must never be used for production. Dependency audit fails on high/critical production findings; lower-severity findings must remain visible and be reviewed before service launch.

## Phase 1 controls and remaining release blockers — 2026-11-24

The earlier scaffold-only summary is superseded by [Identity_Runbook.md](docs/Identity_Runbook.md). Application sessions require exact issuer/audience and mandatory bounded lifetime/subject/random ID; ledger registration, absolute/idle checks, current stored role and revocation are enforced. Tokens carry no profile/role. Customer/operator guards and numeric self-ownership deny independently of navigation. Unknown stored roles, legacy tokens, JavaScript bearer fallback and synthetic cron identities cannot gain access. New OAuth identities cannot auto-promote the owner; SQL collation collisions cannot substitute another identity.

Host-only HttpOnly Secure/Lax cookies do not trust forwarded scheme. OAuth preserves browser nonce binding, rejects malformed/Unicode nonce input and unapproved callback origins, and fixes redirect to /identity. State-changing RPC requires strict configured Origin, Fetch Metadata when present, custom header and JSON. Outage is distinct from anonymous; logout failure cannot claim revocation. Errors/logs contain stable event codes/request IDs, not stacks, tokens/provider responses or PII. Browser profile/token storage writes and invisible redirects are removed.

Portable, intercepted-browser and guarded disposable SQL tests establish development controls only. Managed origin configuration/ledger migration, actual OAuth/cookie/account acceptance and backup/restore remain unverified. CSP, database/provider transport verification, distributed abuse controls and approved proxy policy, MFA/step-up operator auth, account recovery/deletion/retention, centralized tracking/alerts and operational security acceptance remain release blockers. Process-local socket-IP limits may share a proxy bucket; they are not a customer-launch abuse solution. No live identity or customer-service security-completeness claim is made.

## Change log

| Date       | Version | Change                                   |
| ---------- | ------- | ---------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record. |

---

**Document footer — MGECS-SECURITY v1.1.0 | Status: development-controls-live-acceptance-pending | Next review: phase-exit evidence or material change.**
