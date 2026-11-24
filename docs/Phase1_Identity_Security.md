---
document_id: MGECS-PHASE1-IDENTITY
version: 1.1.0
status: development-implemented-live-acceptance-pending
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append dated decisions, failures and observed evidence; preserve superseded outcomes
---

# Phase 1 — Customer/operator identity and session security

Michael authorized this priority on 2026-11-24 after the verified Phase 0 foundation. This is identity/security development, not a customer concierge launch. Requests, provider/AI integrations, reservations and billing remain disabled.

## Observed baseline

Source `53ba1a3876c026b61220f9aa60f6b583cd4f89d0` passed 26 portable tests, strict types and production build on resumption. The published foundation health endpoint returned HTTP 200. Live read-only metadata showed a users table and migration journal; a separate aggregate query showed zero customer/operator accounts. No personal records were retrieved or changed.

The scaffold signs sessions for one year, does not verify application audience/issuer, deletes the cookie without revoking the stolen token, auto-syncs unknown identities and writes last-sign-in on reads, automatically promotes the configured owner during upsert, trusts forwarded scheme headers, and masks every authentication/storage error as anonymous. The client mirrors bearer tokens in JavaScript-accessible storage and writes profile data during render. These are implementation findings, not accepted customer security behavior.

## Bounded implementation contract

Use the existing managed Manus OAuth exchange, not a second provider or parallel token system. Keep numeric `users.id` as the canonical owner key. Stored role `user` maps to customer and `admin` maps to operator; keep the existing database enum to avoid a needless destructive migration. New OAuth identities are always customers. Authentication must never promote an account from client input, email, provider role claims or a read-time upsert. Operator provisioning requires a named verified account and explicit owner approval; no operator is invented or seeded.

Replace legacy tokens with bounded HS256 application sessions containing issuer, audience, subject, issued-at, expiration, and a random session identifier. Reject legacy, tampered, wrong-key, wrong-app, future-issued, overlong, expired and unregistered sessions. Proposed conservative defaults are a one-hour absolute limit and a fifteen-minute idle limit; these are configurable security defaults, not business service-hour promises. Reauthentication creates a new session and revokes an old valid browser session. Server-side expiry and revocation must survive restart and multiple replicas through a durable database ledger. Store a hash of the session identifier, not the raw cookie/token. Do not store roles or personal profile data in token claims; read the current database role for authorization.

Session authentication is cookie-only with host-only HttpOnly, Secure, SameSite=Lax cookies. Production cookie security does not trust forwarded request headers. Local HTTP testing may use a distinct development cookie; production must never use an insecure fallback. Remove JavaScript storage bearer fallback and invisible automatic login redirects. Browsers that block cookies must show a clear sign-in/error screen rather than using an unreviewed alternate identity channel.

All state-changing API operations require strict source-origin validation and Fetch Metadata defense against cross-site/sibling-site requests, with an explicit same-origin fallback for older clients. OAuth remains bound to a one-time browser nonce, requires an approved callback origin and redirects only to a fixed in-app identity page. The browser supplies its actual origin; the backend validates it against server-owned origins rather than trusting Host/X-Forwarded headers. Invalid OAuth/storage errors use generic public messages and structured redacted event codes/request IDs. No tokens, authorization codes, cookies, email or provider responses are logged.

Expose only the authenticated principal's minimal identity and permissions. Customer and operator identity pages have working home/identity navigation, loading/anonymous/expired/forbidden/storage-failure states and explicit sign-out. Backend operator access is checked independently of navigation. A requested profile ID must match the principal ID; no client-supplied role or user ID grants access. No concierge dashboard is implied by an identity portal.

Authentication storage failure is SERVICE_UNAVAILABLE, not a successful anonymous response. Anonymous access to public foundation remains available. Logout must revoke on the server before reporting success; failures must not pretend a stolen session is invalidated. Login/security failure rate controls must be explicit; per-process counters are not described as durable distributed enforcement.

## Schema and live-action boundaries

A minimal session ledger is an additive reviewed migration. Do not mutate users or initialize schema during startup. Generate and review SQL, test it and revocation/expiry against a guarded disposable MySQL-compatible database, and record the live migration separately before enabling production identity. Do not insert test fixtures through the managed SQL tool. Backups/restore rehearsal and full data-lifecycle acceptance remain the separate Phase 1 data gate; do not claim them from SELECT 1 or mocked persistence.

No live privilege changes occur without explicit approval for the exact verified identity. Real customer/operator OAuth acceptance needs permitted accounts and separate evidence. Isolated fixtures are tests only, never product records or demo links. The existing published foundation remains the rollback baseline; development changes are not an automatic production promotion.

## Acceptance evidence

Record portable cryptographic, permission/ownership, cookie, OAuth nonce/origin, mutation-CSRF, expiry/idle/revocation and storage-failure tests. Run guarded database integration tests without production credentials, verify migration rejection safeguards and multi-request logout replay behavior, and test the frontend at mobile/desktop sizes. Save low-resolution link-destination snapshots in an isolated browser without personal sessions. Verify strict types, lint/format, docs, build, startup smoke, dependency/secret scans and exact public PR/main CI before release. Independent review findings must be resolved or recorded as explicit blockers.

Real OAuth login, approved operator provisioning, durable managed migration, HTTPS/cookie behavior, and actual customer/operator UAT remain unverified until observed. Report these separately from code/integration tests. Keep README, HANDOFF, security/resource records and this plan synchronized, and save a final managed checkpoint only after the bounded work and observed evidence settle.

## References

Session policy follows server-side expiration/logout and cookie recommendations [1]. Mutation defenses follow Origin/Fetch Metadata guidance, including conservative sibling-domain handling and trusted-proxy requirements [2]. The existing managed OAuth nonce flow is retained and strengthened; application credentials remain server-owned.

[1]: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html "OWASP Session Management Cheat Sheet"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html "OWASP Cross-Site Request Forgery Prevention Cheat Sheet"

## Implemented controls and acceptance split — 2026-11-24

The proposed controls above are now implemented in development and specified in [Identity_Runbook.md](Identity_Runbook.md). Codec, durable SQL ledger, current-role/self-ownership, nonce/origin/cookie/mutation controls, redaction/outage behavior and honest portal/logout states have portable, disposable-SQL and intercepted-browser coverage. Absolute/idle defaults are enforced; authenticated activity updates only ledger state. Exact-subject SQL collision and malformed Unicode nonce regressions were added.

Managed origin configuration and ledger migration are still pending; no live account/privilege/fixture writes or Phase 1 promotion occurred. No real customer/operator OAuth or physical restart/replica UAT, backup/restore, commercial launch or later concierge capability is claimed. Actual final local/CI/checkpoint receipts belong in the evidence ledger after observation, not in a plan before they run.

## Change log

| Date       | Version | Change                                                                                                                                              |
| ---------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Recorded approved identity/security scope, factual baseline, proposed controls, live-action boundaries and required evidence before implementation. |

---

**Document footer — MGECS-PHASE1-IDENTITY v1.1.0 | Status: development-implemented-live-acceptance-pending | Next review: implementation and observed acceptance evidence.**
