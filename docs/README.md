---
document_id: MGECS-REBUILD-DOCS
version: 1.2.0
status: active
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-25
append_protocol: append dated decisions and evidence; preserve superseded records
---

# Documentation index

Required read order:

1. [../HANDOFF.md](../HANDOFF.md): current state and next action.
2. [Phase0_Plan.md](Phase0_Plan.md): approved bounded work and gates.
3. [adr/ADR-007-Managed-Rebuild.md](adr/ADR-007-Managed-Rebuild.md): approved stack/runtime changes.
4. [Recovery_Gates.md](Recovery_Gates.md): phase sequencing and commercial launch conditions.
5. [evidence/Evidence_Ledger.md](evidence/Evidence_Ledger.md): observed outcomes, failures, and limitations.
6. [Resources.md](Resources.md), [../CONTRIBUTING.md](../CONTRIBUTING.md), [../SECURITY.md](../SECURITY.md).

[../README.md](../README.md) is the public onboarding entry point. The legacy nine design/audit documents are retained privately as historical discovery, not copied blindly into this public source. Phase 1 must publish reviewed product/design/spec/schema/API/hook contracts for the approved stack before request features. Do not treat the private audit's Flask/PostgreSQL implementation instructions as current.

Documents use YAML IDs, versions, owners, status and append protocol with matching footers. Keep planned, implemented, verified and validated states distinct. Check local links using `pnpm docs:check`; this does not verify external services or customer workflows.

## Current identity read order — 2026-11-24

After the handoff, read [Phase1_Identity_Security.md](Phase1_Identity_Security.md) and [Identity_Runbook.md](Identity_Runbook.md). They supply the current bounded product/design, technical, schema, API, hook, deployment, post-mortem and next-agent briefing contracts. Historical nine prototype documents remain discovery evidence, not instructions for the new stack. Live migration/config/real-account/data recovery acceptance is separate from source/fixture verification.

For the 2026-11-25 continuation, read [Phase1_Migration_Recovery.md](Phase1_Migration_Recovery.md) next. It binds the current existing-account/journal baseline, exact additive migration and backup/restore security boundary. Do not mistake historical empty-database tests or public health for incremental managed migration and live identity acceptance.

## Change log

| Date       | Version | Change                                                                                                     |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record.                                                                   |
| 2026-11-25 | 1.2.0   | Linked the current Phase 1 migration/recovery continuation and its existing-account preservation boundary. |

---

**Document footer — MGECS-REBUILD-DOCS v1.2.0 | Status: active | Next review: phase-exit evidence or material change.**
