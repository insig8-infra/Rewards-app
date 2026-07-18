# Phase 26 Plan - Client Demo 2 Alignment

Status: Complete - Phase 26A/26B/26C PASS
Created: 2026-07-14
Source: `CLIENT_DEMO_2_TRIAGE.md`

## Intent

Implement Client Demo 2 feedback as controlled product slices instead of ad-hoc fixes. Phase 26 updates Admin Web, ItemCodes reward-rule governance, and Scan QR site-selection behavior while preserving the AI-driven SDLC loop.

## Source Contracts

- `client_demo_2.md`
- `CLIENT_DEMO_2_TRIAGE.md`
- `REQUIREMENTS_LEDGER.md`
- `OPEN_QUESTIONS.md`
- `architecture/DECISIONS.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `architecture/DATA_MODEL_DRAFT.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `SECURITY_AND_EVALUATION_PLAN.md`

## Requirements Covered

- `WEB-043` through `WEB-052`
- `ITEM-001` through `ITEM-009`
- `SITE-014`
- `SITE-015`
- `SCAN-024`
- Existing related requirements: `WEB-033`, `WEB-034`, `WEB-036`, `REP-008`, `RWD-023`, `QR-025`, `SCAN-013`, `SCAN-018`, `SCAN-019`

## Open Questions To Bring Forward

Resolved for Phase 26B on 2026-07-15:

1. `% of Price` uses latest synced ItemCode `Price`.
2. Fractional percentages such as `0.25%` are allowed; implementation rounds the resolved point value to the nearest integer unless a later client decision changes rounding.
3. Exactly one ItemCode reward rule is allowed: `Absolute Points` or `% of Price`; `% of Price Points` and `Final Points` are calculated display fields.
4. Printed QR labels show `Collect X points`.
5. OWNER edits ItemCode reward rules; STAFF is read-only.

Remaining follow-up questions not blocking Phase 26 completion:

1. Final label/helper copy for the contractor belongs/association text area.
2. Site analytics export: on-screen drilldown only in Phase 26A unless explicitly approved for export.

## Implementation Waves

### Phase 26A - Admin Web Demo Corrections

Scope:

- Invoice Ledger date-range filter using Reports pattern.
- Contractor registration/edit surface adds belongs/association text area.
- Contractor Detail > Sites opens site analytics with QR scan data, item-wise data, item value, and points collected.
- Reward History date range, per-column sorting, `Claimed Date/Time`, and `Fulfilled Date/Time`.
- Claim Desk refreshes on Rewards tab open and returns only valid fulfillable claims.
- New Reward system-populates Reward Code.
- Promotions adds horizontal marquee text scroller controls with Hindi-safe font list, bold, italic, and color.

Status:

- PASS on 2026-07-14.
- Output and trajectory evidence are recorded in `evals/phase26/OUTPUT_EVAL.md` and `evals/phase26/TRAJECTORY_EVAL.md`.
- Browser proof screenshots are stored in `evals/phase26/screenshots/`.

### Phase 26B - ItemCodes Master

Scope:

- Schema/API/repository for ItemCodes.
- Dummy electrical-shop ItemCodes seed until BUSY API exists.
- Manual refresh and future periodic-refresh contract.
- Status derivation: `In Use`, `Not In Use`, `Not in BUSY`.
- Dashboard Attention Queue integration for blank reward rules.
- QR print-time point resolution from ItemCodes and frozen point value on printed QR units.
- Audit for ItemCode reward-rule edits.

Status:

- PASS on 2026-07-15.
- Detailed plan and spec-to-eval gate: `PHASE_26B_ITEMCODES_MASTER_PLAN.md`.
- `% of Price` base, fractional percentages, exactly-one rule behavior, and OWNER/STAFF permissions are resolved.
- Output and trajectory evidence are recorded in `evals/phase26/OUTPUT_EVAL.md` and `evals/phase26/TRAJECTORY_EVAL.md`.

### Phase 26C - Fresh Scan Site Selection

Scope:

- Contractor and Team Member Scan QR entry starts with no active scan-site selected on every visit.
- Scanner/frame hidden until site selected.
- Batch scans remain allowed after site selection.
- Successful `Add to account` clears active scan-site selection for the next batch.
- Technical `Add to account` failure keeps reserved cart items retryable and does not lose points.

Status:

- PASS on 2026-07-15.
- Detailed plan, spec-to-eval gate, completion notes, and residual risks: `PHASE_26C_SCAN_SITE_SELECTION_PLAN.md`.
- Output and trajectory evidence are recorded in `evals/phase26/OUTPUT_EVAL.md` and `evals/phase26/TRAJECTORY_EVAL.md`.
- Browser proof JSON and screenshots are stored under `evals/phase26/screenshots/`.

### Phase 26D - Verification And Harness

Scope:

- Phase-local output eval.
- Phase-local trajectory eval.
- Admin Web visible proof for changed tables/forms/rewards/promotions.
- End-user mobile viewport proof for Contractor and Team Member scan-site behavior.
- API/database readback for ItemCodes, QR point freezing, claim-desk refresh, contractor field persistence, and site analytics.
- Stale-reference scan after implementation.

Status:

- PASS on 2026-07-15.
- Phase 26 output and trajectory evals pass, with a documented Phase 26B caveat that live seeded data had no blank/missing ItemCodes for a Dashboard Attention fixture.

## Verification

Automated:

- `npm run test --workspace @volt-rewards/api`
- `npm run test --workspace @volt-rewards/admin-web`
- `npm run test --workspace @volt-rewards/mobile`
- `git diff --check` plus direct whitespace/stale-reference checks if the repo still treats files as untracked.

Visible/manual:

- Admin Web `http://127.0.0.1:3001`
- End-user mobile `http://127.0.0.1:3002`
- Mobile viewport matrix: `360x740`, `390x844`, `430x932`, `480x900`

Required proof:

- Invoice Ledger date filter works and preserves layout.
- Reward History date filter/sort/renamed columns work.
- Claim Desk list excludes stale claims before Send OTP.
- New Reward code is generated automatically.
- Promotion marquee controls render without text overlap.
- Dashboard Attention code path covers ItemCodes with blank rules and missing-from-BUSY status; live seeded data had no blank/missing fixture.
- QR printed before ItemCode rule change keeps old points; QR printed after rule change uses new points.
- Contractor and Team Member Scan QR require fresh site selection after entry and after successful `Add to account`.

Recorded proof:

- Phase 26A Admin Web browser screenshots and DB readbacks.
- Phase 26B automated tests, approved ItemCode migration deploy, API refresh/list/STAFF-403 proof, and authenticated Admin Web `/item-codes` route/proxy proof.
- Phase 26C mobile browser proof JSON/screenshots and API scan-history readback.

## Completion Rule

Phase 26 is complete as of 2026-07-15 because output eval and trajectory eval pass, demo changes have API/database readback where applicable, stale references were checked and updated, and deferred questions are explicitly recorded.
