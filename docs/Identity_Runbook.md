---
document_id: MGECS-IDENTITY-RUNBOOK
version: 1.1.0
status: development-controls-live-acceptance-pending
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append dated approvals, migration receipts, failures and acceptance evidence; never include credentials or personal records
---

# Identity contract and operating runbook

This implements the bounded authorization in [Phase1_Identity_Security.md](Phase1_Identity_Security.md). It is not the concierge request workflow. Phase 1 data backup/restore and actual customer/operator acceptance remain gates in [Recovery_Gates.md](Recovery_Gates.md).

## Product and design contract

The public foundation, customer identity portal and operator access check share working Home, Identity and Foundation return paths. Identity is a minimal account view, not a booking dashboard. There are no demo links or production fixtures. New OAuth accounts are customers. Operators are existing verified identities approved individually by Michael; no email, owner environment variable or client role can create an operator.

Design → Visualize: cream/forest identity pages expose loading, anonymous, signed-in, forbidden, unavailable and logout-failure states. Development → Verify: credential-free crypto, HTTP and permission tests are separated from disposable SQL integration and intercepted browser DTO tests. Deployment → Validate: exact-source CI/checkpoint is necessary but insufficient; managed migration, HTTPS cookies and real-account acceptance must be observed separately before promotion.

## Technical and schema contract

The existing managed OAuth provider exchanges the browser-bound callback code. The application owns one HS256 session codec and a durable session ledger; there is no bearer-header fallback, read-time user sync, synthetic cron principal or parallel provider. Numeric positive safe `users.id` is canonical. Existing role enum `user`/`admin` remains, mapped to customer/operator. Provider `openId` remains an opaque unique external identifier; case-insensitive or padded SQL collisions are explicitly rejected without changing the original profile.

Migration `drizzle/0001_mature_vindicator.sql` adds only `userSessions`: hashed session ID primary key, numeric user FK, UTC millisecond creation/absolute expiry/last activity/revocation, and user/expiry indexes. User deletion cascades the ledger. Tokens contain exactly `sub`, random `jti`, `iat`, `exp`, issuer `mgecs:session` and application audience, not profile data or role. Only the SHA-256 hash of `jti` is persisted. Startup never migrates, seeds or promotes accounts.

Default absolute lifetime is 3,600 seconds and idle lifetime 900 seconds. Absolute is configurable within 60–86,400 seconds; idle within 60–1,800 seconds and no longer than absolute. Valid authentication reads the current stored role and conditionally advances ledger activity, never user profile/role/last-sign-in. Activity updates are monotonic; revoked/expired/wrong-owner rows cannot be touched. This is a deliberate session-ledger write on authenticated activity, not an assertion that every authenticated GET is mutation-free. Public health/readiness remains read-only.

Persistence must succeed before a session cookie is issued. Reauthentication revokes the previous valid browser token and issues a fresh ID. Logout revokes its browser session before reporting success; other browser sessions remain independent. Expired signatures cannot authenticate even if an expired ledger row has not been cleaned up. Ledger retention/cleanup scheduling is not implemented or authorized by this work.

## API and permission contract

`foundation.status` is public and keeps requests, provider discovery, AI and billing false. `auth.me` returns null for missing/invalid credentials, the minimal self-principal for a valid ledger-backed session, or SERVICE_UNAVAILABLE for identity validation/storage failure. The DTO contains numeric id, nullable name/email, stored role, customer/operator label and permissions; no openId or sign-in timestamps.

`auth.profile({userId})` requires authentication, a positive safe numeric ID and exact self-ownership, including for operators. Unknown input properties are rejected. No role-management or cross-customer profile endpoint exists. `auth.logout` requires the mutation boundary and confirms `{success:true}` only after revocation. `operator.access` independently requires the current stored admin and returns only `{identityRole:'operator',accessVerified:true}`. UNAUTHORIZED, FORBIDDEN and SERVICE_UNAVAILABLE remain distinct. All tRPC errors use generic public messages without stack, provider responses or raw SQL exceptions.

Customer permissions are `identity:read:self` and `session:revoke:self`; operators also have `operator:access`. Unknown stored roles cannot gain access. Permission labels are explanatory DTO data; backend guards, not labels/navigation, enforce authorization. No existing concierge ownership endpoint is claimed to have been tested because none exists yet.

## Browser and hook contract

`useAuth` uses cookie requests, explicit identity/error/logout states and no invisible automatic login. `startLogin` is called only from a user action, uses the actual browser origin and the existing `/app-auth` portal, and checks cookie availability. The callback validates the actual browser-supplied URI against a server-owned exact-origin allowlist, not Host or forwarded headers, and redirects to fixed `/identity`.

Production cookies are host-only `__Host-mgecs_session`, HttpOnly, Secure, Path=/ and SameSite=Lax. The browser-generated `__Host-oauth_state` nonce is Secure/Lax and consumed on callback. A separate insecure cookie exists only for actual loopback HTTP development, never production. Legacy cookies/tokens and JavaScript bearer auto-login are not accepted. The client does not write profile/token data to localStorage/sessionStorage, and failed logout keeps identity/cache rather than pretending success.

Every tRPC mutation requires an exact allowed Origin, `X-MGECS-Request: 1`, application/json and same-origin Fetch Metadata when supplied. Missing Fetch Metadata falls back to the strict Origin/header checks; sibling-site, null and missing origins fail closed. GET cannot invoke logout. Cookie-blocked embedded browsers must open the app directly in a full browser; no insecure fallback supports authenticated cross-origin iframes.

## Configuration and deployment sequence

1. Keep the verified published Phase 0 checkpoint `53ba1a38` as the rollback baseline. A new source commit/checkpoint does not automatically promote development to that domain.
2. Keep the already configured app-owned signing key private. Do not rotate it unnecessarily or modify managed JWT_SECRET. Rotation invalidates all old signatures; there is no overlapping-key grace period.
3. Explicitly approve and securely configure `MGECS_APP_ORIGINS` as comma-separated canonical HTTPS app origins, with no path, credentials or trailing slash. Production startup rejects missing/unsafe origins. Local defaults permit only loopback HTTP. Revalidate using `NODE_ENV=production MGECS_VERIFY_CONFIG=true pnpm exec vitest run server/config.test.ts`; this proof does not create accounts or write a ledger row.
4. Inventory live schema/version/counts read-only and preserve a private backup/restore plan. Review the generated additive SQL and rehearse on a fresh disposable DB. Do not execute test fixtures through the managed SQL tool or use `db:push` against shared data. A managed migration receipt must record exactly which statements ran and post-migration metadata/counts; startup/readiness will not create the ledger.
5. Verify actual HTTPS sign-in, cookie attributes, return navigation, own profile, current role, logout and replay with permitted accounts. Verify storage failure without corrupting live records. A fixture/intercepted browser result is not real OAuth acceptance.
6. For operator provisioning, obtain Michael's explicit approval for the exact verified account. Privately check the numeric ID/provider identity, then perform a reviewed role change and revoke all that account's existing sessions in one transaction. Record a redacted approval/result. Never invent an operator, use OWNER_OPEN_ID as authorization, or publish email/openId. No role-management UI is shipped here.
7. Verify both exact-source GitHub jobs and container before saving a source-only development checkpoint. This does not publish or clear live acceptance. Obtain production promotion approval only after migration/config/account acceptance, data recovery and rollback gates are settled.

## Disposable testing and safety

`pnpm test` never runs database integration. `pnpm test:database` requires `AI_UNK_TEST_DATABASE=true`, `RUN_DATABASE_TESTS=true` and explicit DATABASE_URL. It accepts only the `mgecs_test` user on localhost/127.0.0.1, with a fresh database named `mgecs_test` or a safe test suffix. Production/staging/live/managed names, remote hosts, root, missing acknowledgements and URL tricks are rejected before drivers connect. The launcher checks the actual server/account/schema and refuses any preexisting tables/views/routines/events/triggers. It never drops a database. Provision/reset only a known disposable fixture DB outside managed data.

The isolated GitHub MySQL service uses publicly visible fixture-only credentials, not secrets or production credentials. The launcher supplies a newly random session key and an allowlisted child environment. Integration fixtures are deleted with their FK sessions; the DB service is destroyed by CI. Child and whole-run deadlines bound hangs. Intercepted Playwright DTO fixtures exist only in tests, not a query flag or production backdoor. Browser audit screenshots are retained as test artifacts, without personal sessions.

## Security/operating limitations and post-mortem

The old year-long signature path, automatic owner promotion, cookie-only logout, raw provider logging and anonymous-outage masking are removed. Unicode/malformed nonce input must return a generic denial, not crash the Express async handler. Independent review drove these concrete regressions rather than a generic security-completeness claim.

OAuth callback rate limiting is 10 requests per 10 minutes per socket-address bucket per process; tRPC is 180 per minute. Counters are bounded and expire lazily, ignore untrusted forwarded IP and are not durable/distributed. Behind an unconfigured proxy, legitimate users may share its bucket. Approved edge/proxy policy and distributed abuse controls remain required before customer launch. CSP enforcement, verified provider/database transport, central error tracking/alerts, MFA/step-up operator authentication, account recovery/deletion, retention and actual backup/restore remain open. Redacted stable events/request IDs are implemented, not an assertion that monitoring or alerts are installed.

Source rollback is not database restore. An additive empty ledger can remain while the old foundation is restored; do not drop it or restore legacy insecure sessions once identity is in use. A security incident requires revoking affected ledger rows/rotating the app key through the approved store and a separately approved data-recovery plan. Future concierge, notification, provider, AI and billing work must pass their own ownership/idempotency/security gates.

## Briefing for the next agent

Read [../HANDOFF.md](../HANDOFF.md), the latest [evidence ledger](evidence/Evidence_Ledger.md) and this runbook. Confirm current source/checkpoint/CI, origin configuration and whether the managed ledger was actually migrated. Do not infer any of those from a passing local test. Complete named-account OAuth/operator acceptance and Phase 1 data recovery gates before request UI or paid capability. Preserve historical failures and append exact corrective evidence.

## Change log

| Date       | Version | Change                                                                                   |
| ---------- | ------- | ---------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the bounded identity/schema/API/hook/deployment and recovery contract.       |
| 2026-11-24 | 1.1.0   | Clarified verified source-only checkpoints versus separately gated production promotion. |

---

**Document footer — MGECS-IDENTITY-RUNBOOK v1.1.0 | Status: development-controls-live-acceptance-pending | Next review: managed configuration/migration and actual permitted-account acceptance.**
