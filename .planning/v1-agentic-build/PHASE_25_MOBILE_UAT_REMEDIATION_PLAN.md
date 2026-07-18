# Phase 25 Plan - Mobile UAT Remediation And Persistent Scan Cart

Status: Active Plan  
Created: 2026-07-10  
Owner: Codex

## Intent

Convert the Manual Mobile UAT findings into a controlled implementation phase instead of ad-hoc mobile fixes.

Phase 25 starts with the highest-risk product contract: `DEC-050`, the site-first persistent scan cart. This must be stable in backend/domain/API before the mobile UI is redesigned around it.

## Source Contracts

- `MOBILE_APP_MANUAL_UAT_TRIAGE.md`
- `PHASE_25E_END_USER_MOBILE_UAT2A_CONTRACT.md`
- `DEC-050` in `architecture/DECISIONS.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `architecture/DATA_MODEL_DRAFT.md`
- `architecture/QR_STATE_MACHINE.md`
- `REQUIREMENTS_LEDGER.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `SECURITY_AND_EVALUATION_PLAN.md`

## Requirements Covered First

- `SITE-011`
- Client Demo 2 extension: `SITE-014`, `SITE-015`, and `SCAN-024` are not covered by the original Phase 25B/25E PASS evidence and are routed to Phase 26C.
- `SCAN-013` through `SCAN-021`
- `CAPP-014` through `CAPP-016` in later UI waves
- `RWD-041` in later UI waves
- `MADM-030` through `MADM-034` in later Admin Mobile waves

## Phase Assumptions For Implementation

The following were brought forward after Manual Mobile UAT. For Phase 25 implementation, proceed with the recommended defaults unless the user revises them:

- Reserved-cart invalidation: if a reserved QR later becomes invalid before `Add to account`, keep the row visible with item-level error, do not credit points, and require remove/refresh.
- Reserved state labels: contractor cart `Ready to add`, Scan History `Reserved`, admin/QR status `Pending_Add_To_Account`.
- MANUALUAT2A supersedes the earlier cart-cap assumption: no point-value cap for v1; use a reserved-cart navigation guard instead.
- MANUALUAT2A supersedes earlier rupee-equivalent marketing copy for end-user app value labels: QR/reward/balance copy uses points.

## Implementation Waves

### Phase 25A - Backend Persistent Scan Cart

Status: Complete - automated verification passed on 2026-07-10.

Goal: Make backend behavior match `DEC-050`.

Tasks:

- Add `RESERVED_IN_CART` QR status and `RESERVED` scan result.
- Add persistent `ScanCart` and `ScanCartItem` schema.
- Split scan behavior:
  - `POST /scan/qr` validates token and reserves a cart item.
  - `GET /scan/cart` returns persistent cart.
  - `POST /scan/cart/commit` performs `Add to account`.
- Ensure failed scans do not enter cart.
- Superseded by MANUALUAT2A: the earlier 1000-point scan cap must be removed/disabled in Phase 25E.
- Keep cart retryable if commit fails.
- Update scan history to show QR value and credited points separately.
- Add domain/API tests.

Exit gates:

- Domain/API tests prove reserve does not credit points.
- Commit credits points exactly once.
- Failed scans create attempts but no cart item.
- High-value QR reservation above 1000 points is handled in Phase 25E because MANUALUAT2A superseded the cap requirement after Phase 25A.
- History can distinguish reserved, committed, failed, and already-claimed states.

### Phase 25B - End-User Mobile Scan Cart UI

Goal: Make mobile flow match the product workflow.

Status: In progress - API/types/cart/site-first foundation implemented; visual/viewport proof pending.

Tasks:

- Remove silent default site scan entry.
- Scan QR entry starts with site selection/confirmation.
- Show persistent cart summary.
- Show per-item product/reference, QR value, pending credit, status, and total pending points.
- `Add to account` commits cart and updates points.
- Technical commit failure keeps cart visible and retryable.
- Failed scan result never appears as cart item.
- Update History/Scan Details labels and fields.

Implemented foundation:

- Mobile API types distinguish scan reservation from cart commit.
- Scan screen loads active site cart.
- Successful scan reserves into cart and does not update balance.
- `Add to account` commits cart and updates balance from server response.
- Scan controls stay hidden until an active site is explicitly selected; no first-site auto-selection.
- Commit failure keeps/reloads the reserved cart so `Add to account` remains retryable.
- Superseded by MANUALUAT2A: cap progress and remaining-capacity copy must be removed in Phase 25E.
- Cart item cards show product/reference, QR value, credited-points-zero state, reserved time, QR unit ID, scan attempt ID, and copy controls.
- Success and history copy distinguish QR value, reserved state, and credited points.
- Partial viewport proof captured the scan tab pre-selection guard at `360x740`, `390x844`, `430x932`, and `480x900`.

Still pending:

- Capture post-selection cart-card viewport proof.
- Decide native clipboard module for iOS/Android copy controls; current copy implementation is Expo Web only with selectable IDs.
- Continue visual remediation after cart proof.

Exit gates:

- Manual UAT at mobile viewport matrix.
- API readback after reserve and commit.
- Available/lifetime points reconcile after commit.

### Phase 25C - End-User Mobile Visual Remediation

Goal: Address remaining end-user mobile UAT findings.

Tasks:

- Reward tile readability and layout.
- Promotion banner copy outside/above image.
- Profile photo set/edit/remove.
- Scan History row/detail polish.
- Points math display audit.

### Phase 25D - Admin Mobile Visual And IA Remediation

Goal: Address Admin Mobile UAT findings after scan backend contract is stable.

Tasks:

- PIN reveal icon.
- Dashboard command-surface redesign.
- Owner controls as functional action cards.
- Contractors/Staff/Reports parity screen maps.
- Rewards sections/sub-tabs.

### Phase 25E - End-User Mobile MANUALUAT2A Corrections

Goal: Correct the Contractor and Team Member site/scan/cart behavior from MANUALUAT2A before the next broad mobile slice.

Contract:

- `PHASE_25E_END_USER_MOBILE_UAT2A_CONTRACT.md`

Tasks:

- Site row tap selects site; `View Details` remains the detail path.
- Dashboard selected-site section is repositioned and Scan QR reflects selected site.
- Reserved cart summary/header is visually distinct and includes a top `Add to account` shortcut.
- `Add to account` shows success feedback and reconciles points.
- Remove/disable the 1000-point cart cap and verify a 4000-point QR reserve/commit.
- Add reserved-cart navigation guard when leaving Scan with uncommitted reserved items.
- Add `Add to account` shortcut from reserved Scan History details.
- Replace rupee labels with points labels for reward/QR/balance copy on end-user mobile.
- Fix Team Member no-site messaging, session framing, redundant buttons, logout placement, internal copy, and scalable site selection.

Exit gates:

- Domain/API/mobile tests cover no-cap high-value QR behavior and affected UI states.
- Visible proof covers Contractor and Team Member flows at `360x740`, `390x844`, `430x932`, and `480x900`.
- Output eval and trajectory eval are updated before Phase 25E is called complete.

Client Demo 2 supersession note:

- Phase 25E removed silent first-site auto-selection and proved selected-site scan/cart behavior.
- Client Demo 2 adds a stricter requirement: every Scan QR visit must start with no active scan-site selected, and successful `Add to account` must clear active scan-site selection for the next batch.
- This stricter behavior is routed to Phase 26C and must receive fresh output/trajectory evidence.

### Phase 25F - Admin Mobile Contractors/Staff/Reports Parity

Goal: Close the Admin Mobile parity gap from Manual Mobile UAT after the end-user mobile scan/cart corrections are stable.

Contract:

- `PHASE_25F_ADMIN_MOBILE_PARITY_CONTRACT.md`

Tasks:

- Add OWNER contractor registration and detail owner actions to Admin Mobile.
- Add Admin Mobile staff-management APIs and OWNER UI for create/photo/reset/deactivate/reactivate.
- Add Admin Mobile reports APIs and live report landing/preview UI.
- Keep STAFF contractor list/detail read-only with no mutation controls.
- Preserve the established OWNER bottom navigation and expose Staff management inside Reports/Operations.

Exit gates:

- API and Admin Mobile tests cover new routes and client wiring.
- Visible proof covers OWNER contractor registration/detail, OWNER staff management, OWNER reports landing/preview, and STAFF read-only contractor detail at `360x740`, `390x844`, `430x932`, and `480x900`.
- Output eval, trajectory eval, and viewport proof are updated before Phase 25F is called complete.

## Verification

Automated:

- `npm run test --workspace @volt-rewards/domain`
- `npm run test --workspace @volt-rewards/api`
- `npm run test --workspace @volt-rewards/mobile`
- `npm run test --workspace @volt-rewards/admin-mobile` when Admin Mobile changes land
- `git diff --check`

Manual/visible:

- Mobile viewport matrix: `360x740`, `390x844`, `430x932`, `480x900`
- Contractor flow: select site -> scan QR -> cart -> Add to account -> points update -> Scan History detail
- Team Member flow: select site -> scan QR -> cart -> Add to account -> scoped history
- Failure flow: invalid/already-claimed QR creates failed attempt, no cart item
- No-cap flow: a 4000-point QR reserves and commits successfully
- Navigation-guard flow: reserved cart exists, user tries to leave Scan, app prompts to `Add to account` or stay/go back to Scan

## Completion Rule

Phase 25 cannot be marked complete until output eval and trajectory eval are updated with automated evidence, visible-control evidence, database/API readback, and residual native-device gaps.
