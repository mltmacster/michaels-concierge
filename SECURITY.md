---
document_id: MGECS-SECURITY
version: 1.0.0
status: active
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

## Change log

| Date       | Version | Change                                   |
| ---------- | ------- | ---------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record. |

---

**Document footer — MGECS-SECURITY v1.0.0 | Status: active | Next review: phase-exit evidence or material change.**
