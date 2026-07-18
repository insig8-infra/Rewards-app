# Phase 20 Execution Plan - Manual UAT 1 Product Recovery Contract

Status: Completed
Created: 2026-07-06

## Goal

Convert Manual UAT 1 findings into product-grade implementation contracts before any more feature breadth is built.

This phase is intentionally documentation/design-contract first. It does not implement product code. It creates the corrected contracts that later implementation phases must follow.

## Inputs

- `AGENTS.md`
- `ManulUAT1.md`
- `MANUAL_UAT1_TRIAGE.md`
- `APPROACH.md`
- `ROADMAP.md`
- `REQUIREMENTS_LEDGER.md`
- `OPEN_QUESTIONS.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `APPROVED_STITCH_UI_CONTRACT.md`
- `architecture/DECISIONS.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `integrations/BUSY_API_HANDOFF.md`
- `client-deliverables/BUSY_API_INTEGRATION_SPEC.md`

## Requirement Areas

- Admin Web: dashboard, QR print, invoice ledger, print history, contractors, staff, auth.
- Admin Mobile: OWNER/STAFF login, dashboard, contractor leaderboard/directory, staff management, return scan, role limits.
- End-User Mobile: Contractor login/dashboard, site selection, scan, rewards, history, Balance Book, Team Member limited flow.
- BUSY/QR: linked return voucher behavior and return allocation contract.

## Non-Goals

- Do not implement UI code in this phase.
- Do not add new feature breadth.
- Do not change database schema until Phase 21 or later implementation plans define migrations.
- Do not claim mobile app-store readiness from Expo Web checks.

## Phase-Relevant Decisions Already Locked

- `DEC-040`: Approved Stitch screenshots are the mobile visual source of truth.
- `DEC-041`: QR reversal revokes newest chosen/unfulfilled claims until balance recovers.
- `DEC-042`: BUSY returns arrive as linked Return of Sale vouchers.
- `DEC-043`: Contractor name and mobile are immutable after registration.
- `DEC-044`: Manual UAT 1 blocks further feature breadth until recovery phases.

## Open Questions To Bring Forward Before Implementation Phases

These do not block Phase 20 documentation, but they must be answered or explicitly deferred before implementation starts:

1. First-pass list tooling:
   - Contractor Directory filters/sorts/search fields.
   - Staff Directory filters/sorts/search fields.
   - Invoice Ledger filters/sorts/search fields.
   - Print History filters/sorts/search fields.
   - Scan History filters/sorts/search fields.
   - Balance Book filters/sorts/search fields.
2. Admin dashboard drilldowns:
   - Should Admin Web and Admin Mobile use identical metric definitions and drilldown destinations?
   - Or should Admin Web optimize for desk operations while Admin Mobile optimizes for counter/field actions?
3. BUSY return duplicate matching:
   - If original invoice has multiple lines with the same `tmpItemCode`, should return allocation be pooled across those lines unless BUSY gives a stronger line reference?
4. Admin Web auth:
   - Recommended default: use the same backend OWNER/STAFF mobile + PIN auth as Admin Mobile, with real sessions.

## Deliverables

1. `PHASE_20_UI_RECOVERY_CONTRACT.md`
   - Cross-surface screen map.
   - Dashboard behavior.
   - List/detail behavior.
   - Navigation/back behavior.
   - Empty/loading/error/success states.
   - Role differences.
   - Data identity and raw-ID replacement rules.

2. `PHASE_20_ADMIN_WEB_CONTRACT.md`
   - Real Admin Web login.
   - Dashboard drilldowns.
   - Invoice Ledger vs QR Print Queue split.
   - Separate Print History route.
   - Contractor and Staff directory redesign.
   - Contractor immutable identity update contract.

3. `PHASE_20_MOBILE_CONTRACT.md`
   - End-User Mobile product-grade correction contract.
   - Admin Mobile product-grade correction contract.
   - PIN reveal/hide.
   - Native-app readiness notes.
   - Site selection/create/manage path.
   - Rewards/history/Balance Book list behavior.

4. `PHASE_20_BUSY_RETURN_CONTRACT.md`
   - Linked return voucher model.
   - Return allocation state/action/outcome scenarios.
   - Mock BUSY fixture requirements.
   - API/domain test cases required for Phase 21.

## Verification Gate

Phase 20 is complete only when:

- All four deliverables exist.
- Each Manual UAT 1 issue is mapped to an implementation phase or explicit deferral.
- The next implementation phase has no silent product decisions.
- `ROADMAP.md`, `OPEN_QUESTIONS.md`, and `architecture/DECISIONS.md` remain consistent.
- No code changes are required or claimed in this phase.

## Recommended Next Implementation Order After Phase 20

1. Phase 21 - BUSY Return Voucher Domain Correction.
2. Phase 22 - Admin Web Product-Grade Recovery.
3. Phase 23 - End-User Mobile Product-Grade Recovery.
4. Phase 24 - Admin Mobile Product-Grade Recovery.
