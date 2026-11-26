---
document_id: MGECS-PHASE1-MIGRATION-RECOVERY
version: 1.1.0
status: managed-backup-and-ledger-verified-live-acceptance-pending
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-25
updated: 2026-11-26
append_protocol: append observed rehearsal, backup, approval, statement and recovery receipts; preserve failures and never include personal records or credentials
---

# Phase 1 — managed migration and secure recovery

## Scope and current state

Continue the already implemented identity contract in [Identity_Runbook.md](Identity_Runbook.md), not a second identity implementation or Phase 2 request UI. Read [../HANDOFF.md](../HANDOFF.md) first.

On 2026-11-25, the authoritative source resumed at `2309ae13854f5704dac61fbe78a968b200b78c48`, checkpoint `2309ae13`. The public repository and exact-main quality/disposable MySQL jobs were rechecked successful. Current managed read-only inventory: one customer account, no operators, one migration journal entry and no `userSessions` ledger. This is not an empty managed database; existing customer data must be preserved. No personal fields were fetched during inventory.

The managed engine reports TiDB v8.5.3 serverless/MySQL compatibility and InnoDB. `users.id` is signed `int`; the existing `openId` unique/collation and `user`/`admin` role contract are retained. Public HTTPS health/readiness returned 200, but readiness only uses `SELECT 1`; it cannot certify identity schema. Real provider/cookie/operator and data-recovery acceptance are not established.

The correct already approved origin is `https://michaelconci-l64nfwmv.manus.space`. Historical v1.6 prose omitted its final `v`; Resources and the original configuration receipt are correct. The actual allowlist was rechecked as published-only; no key, origin or preview setting was changed.

## Exact migration contract

Use the existing reviewed Drizzle migration chain, not shared `db:push`, startup seeding or untracked manual journal writes.

| Migration                | File SHA-256                                                       | Runtime journal timestamp |
| ------------------------ | ------------------------------------------------------------------ | ------------------------- |
| `0000_lucky_mojo`        | `814a08e40d7fc2bcfd458759d18319198ca8ae394f2fa15617a78678e9c9c93b` | `1795542209649`           |
| `0001_mature_vindicator` | `eb3eab3601989e238f639a25dd96f3e0258d60078e2762b7760068f24e62d567` | `1795552224810`           |

The first hash/timestamp matches the observed managed runtime journal. The second migration has four ordered DDL statements: create `userSessions`; add its user FK with delete cascade/no-action update; create user and expiry indexes. It does not change existing users, promote roles, create fixture accounts or backfill bearer tokens. Drizzle breakpoint comments are statement delimiters, not a transaction guarantee.

MySQL-compatible DDL can commit partially. Do not promise that `ROLLBACK` will undo a completed table creation. The SQL is not idempotent: stop on existing or partial ledger objects; never hide a mismatch with `IF NOT EXISTS`, blindly rerun the full chain, fabricate a journal row or reset shared data.

## Pre-execution gates

1. Confirm current source/checkpoint, exact migration bytes, actual managed target and journal. Inspect metadata only; keep personal records out of public evidence. Stop if another writer/migrator or unexpected object/journal appears.
2. Define a recoverable private backup covering users, ledger when present and the runtime journal. Record consistent capture method, restricted storage, checksum, retention/access owner, restore procedure and partial-DDL response. A code checkpoint is not a database backup. No private dump is an application artifact or public attachment.
3. Rehearse incremental migration over a synthetic existing Phase 0 account/journal in a newly owned disposable schema. Existing integration proof of a freshly empty database is insufficient for this case.
4. Rehearse isolated logical backup/restore, revocation/role reconciliation and partial-DDL detection. Use only synthetic records, newly generated keys and restricted loopback test users; clear managed credentials from child environments. Inspect actual server/account/empty objects after connection and before fixtures. Never reset or drop shared data.
5. Confirm actual managed-engine FK/journal behavior and approved backup/recovery controls. Obtain approval for the exact managed change. A passing rehearsal or the general continuation request is not a role grant, live DDL approval or public service launch.

## Execution and postconditions — pending approval

Through the approved migration runner, apply only the reviewed pending migration after a verified backup. Capture ordered statement outcomes and final runner journal. After any failure, stop and inspect the partial physical schema; request only a reviewed corrective action. Do not alter the existing migration file to make a rerun appear successful.

Verify exact ledger columns/types/nullability, hash primary key, named user FK and enforced delete/update semantics, both indexes and the correct journal entry. Before permitted identity acceptance, the ledger must be empty and existing users/aggregate role distribution preserved. Compare an appropriately frozen or consistently captured baseline; changing counts from normal concurrent activity are not automatically a migration defect or permission to delete data.

Then verify actual HTTPS sign-in, fixed return navigation, minimal self profile, current role, logout and rejected cookie replay using permitted accounts. Obtain separate exact verified-account approval before operator promotion/session revocation. Fixtures, health endpoints and a platform rollout report cannot substitute for that acceptance.

## Secure restoration boundary

Restoring an older ledger may restore an active row for a token revoked after backup. A restored user snapshot may undo a later demotion or deletion. The current session codec has no independent restore-generation fence; this is an operating recovery obligation, not a claim that restoration automatically remains secure.

Keep customer identity closed during recovery. Verify the private backup/checksum and restore only to the approved target. Reconcile post-backup role/deletion decisions and invalidate restored sessions before reopening. Choose explicit ledger-wide revocation or separately approved key rotation as appropriate; do not rotate the signing key routinely for an additive migration. Re-test that previously revoked and pre-restore tokens fail and no stale elevated role is accepted. A synthetic rehearsal demonstrates this procedure locally, not managed recovery or real operator acceptance.

Record recovery owner, intended RPO/RTO/retention and measured restore results before customer launch. Do not invent service hours, retention promises or an SLA to fill these unassigned policies.

## Observed evidence and next gate

The continuation already reran 323 portable cases (one default opt-in skip), all 36 actual production configuration cases with no skip, and public HTTPS health/readiness. Full local format/lint/types/docs/build/smoke and all 25 browser cases passed for the initial handoff update; later documents require their own final verification. One low production dependency advisory remains, with no high/critical/moderate finding.

The initial pending rehearsal statement is superseded within the isolated scope by the receipt below. Managed backup/application, real customer/operator UAT and operating acceptance remain pending. Do not mark Phase 1 complete or begin requests/notifications/AI/billing from these source checks.

### Completed isolated rehearsal — 2026-11-25, 22:37 UTC

The final passing attempt used a newly owned unprivileged loopback MariaDB 10.11.14 engine and three fresh guarded test schemas. Three unsafe inputs were refused before connection; actual account/owned datadir/server and zero objects were verified after connection before fixture writes. Actual Drizzle mysql2 migrator, copied reviewed Phase 0-only folder and then full reviewed migration chain were used. No managed credentials or records were passed to the engine/helper.

| Case                         | Observed result                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Existing Phase 0 baseline    | One synthetic customer and one journal entry; user identity/profile/role/timestamps retained after incremental migration.                                                            |
| Incremental schema and rerun | Exact three tables, six ledger columns, one PK, two secondary indexes, one CASCADE/NO ACTION FK and two matching journal entries; rerun caused no duplicates or data/schema changes. |
| Durable session              | One hashed session registered and authenticated using unmodified service/codec with a local SQL-injected SessionStore; token/key not persisted.                                      |
| Logical backup               | Actual private mariadb-dump of users/ledger/journal, single transaction, 4,558-byte mode-0600 SQL backup with checksum; restored into a different freshly guarded target.            |
| Restore risk demonstrated    | After source revocation/demotion, old backup restored one active session and one admin; old token actually authenticated.                                                            |
| Secure reopening             | One restored session revoked and one post-backup role reconciled atomically; zero active sessions/admins; replay denied and demotion preserved.                                      |
| Partial DDL                  | First ledger CREATE left six columns/PK but no FK/two indexes/Phase 1 journal; mismatch detected, completion/blind rerun refused, no reset/DROP.                                     |

Three earlier fresh attempts failed in the proof helper's expected table-sort order. MariaDB collation order differs from JavaScript case-sensitive order; the corrected exact set comparison is order-independent and retains full column/FK/index/journal assertions. Failure receipts remain preserved; only the final attempt exercised the full backup/restore/reopening/partial cases.

Cleanup confirmed the owned engine stopped with SIGTERM, no port-3307 listener, and fixture databases/data/password/raw-backup files deleted. Sanitized private receipts and proof runner remain. The helper calls the actual migrator but does not claim to rerun the repository's complete 20-case integration suite or the global SessionStore pool. This is MariaDB/synthetic evidence, not TiDB/live recovery, real provider/HTTPS/operator acceptance or physical engine-restart replay.

The managed TiDB FK variable was read-only verified ON. The next action is a verified private managed backup and exact additive-migration approval, followed by observed managed postconditions and permitted account acceptance. No live schema, role or key change has been authorized or performed here.

## Managed backup and migration — 2026-11-26, v1.1.0

The owner approved the exact unchanged additive migration at 00:35:34 UTC conditional on prerequisites, then private Michael-only Drive custody and 120 days at 12:46:14 UTC. On clean source/checkpoint `7ecf541c55e3ca374c1a0030ba8d5c360231ba8c` / `7ecf541c`, consistent capture, owner-only durable upload/ACL read-back, downloaded checksum and actual isolated recovery passed before managed DDL. See [../HANDOFF.md](../HANDOFF.md) and [evidence/Evidence_Ledger.md](evidence/Evidence_Ledger.md).

### Captured and recovered data scope

The bounded certificate-verified TiDB capture used documented SHOW MASTER STATUS Position as a fixed session tidb_snapshot, UTC, and repeated actual schema/rows under that same snapshot. The 4,373-byte typed JSON contains native users/Phase 0 journal DDL, ordered columns and actual rows, not credentials. The first unavailable timestamp-function attempt stopped before customer capture. One owner-private Drive file and owner-private recovery instructions/reference helper were verified with no public/link/group access. No raw backup or destination ID belongs in public source.

The actual downloaded bytes restored at 12:58:14.946–12:58:16.744 UTC into a fresh guarded MariaDB 10.11.14 target. Six unsafe target inputs were refused; account/server/owned datadir/empty objects were checked. Native captured CREATE statements were executed unchanged (the inert TiDB clustered-index hint was ignored by MariaDB), followed by parameterized rows. Exact saved rows and normalized metadata for both tables passed. Engine/data/log cleanup and closed port3307 were verified. This is actual-backup isolated logical recovery, not live TiDB restore or a provider-native backup; later role/deletion reconciliation remains mandatory.

A JSON-media CLI download unexpectedly echoed customer fields into the owner's private task terminal despite its binary-output flag. The raw saved output was restricted outside app source; no credentials or public GitHub/artifact upload occurred. Supported binary transfer corrected the download and preserved exact SHA-256. Public evidence must acknowledge this handling error without copying the records.

### Applied migration and actual TiDB physical outcome

Actual Drizzle mysql2 migration returned four ordered DDL successes and the approved journal insert at 13:12:48.843–13:12:50.220 UTC; commit succeeded. Live complete users/journal schemas and saved rows were checked twice immediately before DDL. The earlier URL-option guard stop occurred before connection and was corrected to accept only the managed URL's exact certificate-verifying SSL option; two safe/ten unsafe actual-guard tests passed, with TLS retained.

The initial postcheck stopped because TiDB reports four physical index objects, not the three observed in the portable rehearsal: PRIMARY, the approved `userSessions_userId_idx` and `userSessions_expiry_idx`, and `userSessions_userId_users_id_fk` on userId. [TiDB v8.5 documents automatic creation of a same-name child FK index](https://docs.pingcap.com/tidb/v8.5/foreign-key/) when none exists at FK addition. This migration adds its FK before its explicit index; the actual engine retained both. The reviewed SQL/hash is unchanged. Do not reorder its already applied statements, drop indexes, add IF NOT EXISTS or rerun DDL to alter evidence.

A separate read-only postcondition verifier passed at 13:15:26.983–13:15:28.187 UTC. It required exactly that documented four-object index set with exact columns/uniqueness/order/prefix/type; the six correct ledger columns, named FK/reference/CASCADE/NO ACTION, enabled TiDB FK, three native tables/no extra routines/events/triggers, empty ledger, exact unchanged complete customer values/users schema and two correct journal entries. ENFORCED is not exposed by this server; no synthetic managed FK DML was performed. The extra supporting index is retained as an observed redundancy/performance consideration, not an authorization for optimization DDL.

### Retention and remaining recovery/identity acceptance

Retain until `2027-03-26T12:53:28.303Z`. One-shot review/exact-backup-file-and-companion Trash instructions are active for `2027-03-26T12:54:28Z`, confined to the verified owner account/file IDs/checksums, never the parent folder or unrelated files. The native scheduler is ask_user; owner action may be needed. This is not guaranteed automatic expiry, permanent deletion, recurring backup coverage or an assigned RPO/RTO. Continued connector authorization and service availability are necessary.

No live restore, user/profile/role/session DML, key/origin/GC/config change, operator provision or request launch occurred. Preserve stopped/failed receipts. Verify permitted real-account HTTPS identity/logout replay and deployed-source identity next; obtain exact operator approval separately. On any future restore keep identity closed, reconcile later role/deletion decisions and invalidate restored sessions before reopening. Existing source rollback may retain this empty additive ledger; it is not an automatic database rollback.

## Change log

| UTC date   | Version | Change                                                                                                                                                |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-25 | 1.0.0   | Established current managed baseline, exact migration/journal binding and secure recovery-before-activation procedure.                                |
| 2026-11-26 | 1.1.0   | Appended actual private snapshot/recovery and approved managed execution, exact TiDB supporting-index evidence, retention mode and preserved failures |

---

**Document footer — MGECS-PHASE1-MIGRATION-RECOVERY v1.1.0 | Status: managed-backup-and-ledger-verified-live-acceptance-pending | Next review: real HTTPS identity and separately approved secure restoration.**
