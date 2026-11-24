---
document_id: MGECS-REBUILD-EVIDENCE
version: 1.0.0
status: active
owner: Michael Thomas
maintainer: Manus AI
created: 2026-11-24
updated: 2026-11-24
append_protocol: append dated decisions and evidence; preserve superseded records
---

# Evidence ledger

## Observed baseline

P0-EV-001: The new managed scaffold was initialized independently of the old prototype. Initial type check, one logout test and client/server build passed. The template initially lacked public CI, safe startup failure, readiness and a tested application factory. Its demo-page import produced an unnecessarily large browser bundle.

P0-EV-002: Expanded lint found seven inherited dead-code/empty-handler issues. They were corrected rather than disabling the failing rules. TypeScript coverage was expanded to tests/configuration; 22 unit/HTTP tests passed after the foundation changes. Managed explicit-any adapter debt remains separately documented.

P0-EV-003: Initial production dependency audit reported high/critical findings. Dependencies were updated within their declared ranges. One high Drizzle ORM advisory remained and required a specific security upgrade beyond the original 0.44 range. Do not mark the security gate passed until the final audit is recorded.

P0-EV-004: Gitleaks 8.30.1 official archives were checksum-verified. The first downloaded x64 executable did not run on the arm64 sandbox; the architecture-aware installer corrected this tooling issue. This was not an application defect.

## Evidence rules

Append exact commands, source commit, timestamp, environment, outcome, artifact/CI link and limitations. Keep failed runs and link their corrective evidence. Portable isolated fixtures are tests, not product data. Local build/API/browser smoke does not prove database persistence, customer authentication, provider discovery, AI quality, real-time delivery, payments or production acceptance.

## Pending gate records

Final format/lint/type/doc/test/build/security/browser/clean-clone results, public CI and its intentional failure canary, protected main and baseline tag, and artifact delivery must be appended before Phase 0 is called complete.

## Verified Phase 0 checks — 2026-11-24

P0-EV-005: `pnpm verify` passed locally: formatting, zero-warning lint, strict types including tests/configuration, 10-document integrity, 22 unit/HTTP tests, client/server build and isolated production smoke. `pnpm test:browser` passed 3 desktop/mobile/error-state checks. Source snapshot scan passed. Full-history Gitleaks passed on 2 commits after forcing medium Git log formatting; the initial zero-commit scanner result was insufficient and not accepted as history proof.

P0-EV-006: An independent GitHub clone of baseline `ab232288ac276594b6b245be26b2e2dd16affa0e` installed with `--frozen-lockfile` and passed verify/browser/audit with a cleared environment and no application credentials. This validates clean onboarding at that baseline, not customer login/persistence.

P0-EV-007: Public GitHub repository creation and main protection were verified. Main requires the `quality` check, up-to-date branches, pull requests and resolved conversations; admins cannot bypass it and force pushes/deletions are disabled. The initial public CI run failed because packageManager and action config both declared a pnpm version. Corrected by using packageManager as the single version source, not bypassing the setup step. Failed run: https://github.com/mltmacster/michaels-concierge/actions/runs/45454429204 .

P0-EV-008: The deliberate test-only canary failed in public CI at the expected assertion, while all 22 foundation tests passed. The failure proves the test gate blocks broken code. The canary is removed in a superseding revision, not weakened. Failed run: https://github.com/mltmacster/michaels-concierge/actions/runs/45454729231 ; PR: https://github.com/mltmacster/michaels-concierge/pull/1 .

P0-EV-009: After dependency updates and Drizzle 0.45.4, the production audit reported zero high/critical/moderate findings and one low KaTeX advisory (GHSA-238p-pmpm-9mq7). The low-severity item remains visible for Phase 1 review; the unused rich-content component is not exposed on foundation pages. Node container base was pinned to a verified multi-platform registry digest. No security-audit completeness claim is made.

Final corrected-commit CI/container/artifact evidence remains pending and must be appended after completion.

## Change log

| Date       | Version | Change                                   |
| ---------- | ------- | ---------------------------------------- |
| 2026-11-24 | 1.0.0   | Established the approved Phase 0 record. |

---

**Document footer — MGECS-REBUILD-EVIDENCE v1.0.0 | Status: active | Next review: phase-exit evidence or material change.**
