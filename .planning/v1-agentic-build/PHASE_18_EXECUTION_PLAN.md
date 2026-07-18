# Phase 18 Execution Plan - Stitch Approved UI Alignment

Status: Completed on 2026-07-06. See `PHASE_18_STATUS.md`.

## Goal

Bring the existing mobile app baselines into alignment with the client-approved Stitch UI/UX before adding more feature depth.

## Requirements Covered

- `PLAT-012`
- `PLAT-013`
- `PLAT-014`
- `PLAT-015`
- `CAPP-001` through `CAPP-013` where visual/dashboard/navigation presentation applies.
- `AUTH-002` through `AUTH-023` where role selection, Contractor login, Team Member login, and Recent contractor UI apply.
- `SCAN-001` through `SCAN-012` where scan history and result-state presentation applies.
- `RWD-001` through `RWD-025` where reward tiles, Balance Book, claims, and catalog presentation apply.
- `MADM-*` only for shared token/component alignment, not full workflow completion.

## Inputs

- `APPROVED_STITCH_UI_CONTRACT.md`
- `PHASE_18_UI_SPEC.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `Sample_References/Screenshots from Stitch/`

## Open Questions

None blocking.

Assumptions:

- The Stitch screenshots are approved as visual direction, not pixel-perfect implementation.
- The purple outer frame and black dotted background are Stitch/editor chrome, not app UI.
- Current brand name remains `Volt Rewards`.
- Existing deep teal/orange token direction remains valid but needs normalization and consistent use.
- Final client reward/product imagery can be replaced later; temporary images remain acceptable when documented.

## Scope

Included:

- Audit current `apps/mobile` screens against approved Stitch references.
- Normalize end-user mobile theme tokens to the approved visual contract.
- Align role selection/login/dashboard/rewards/balance book/team-member/scan states.
- Add missing result-state screen structure where the current UI is too shell-like.
- Keep all UI wired to existing APIs and realistic seeded data.
- Light Admin Mobile token/component alignment so `Volt Admin` does not feel like a different product family.
- Capture screenshot evidence.

Excluded:

- QR cancel/reverse business flow.
- Native camera implementation.
- Admin Web redesign.
- Full Admin Mobile staff/reward/report deep screens.
- Final brand asset package and store listing artwork.

## Implementation Tasks

- [x] Audit current end-user mobile screenshots against `APPROVED_STITCH_UI_CONTRACT.md`.
- [x] Create or normalize mobile design tokens for colors, spacing, radius, shadows, typography, and status tones.
- [x] Align role selection and Contractor login screens.
- [x] Align Contractor dashboard/home to approved card hierarchy and reward carousel.
- [x] Align Balance Book/Rewards/Claims shell and activity rows.
- [x] Align Team Member mobile entry and Recent contractor card.
- [x] Align scan home and scan result/failure state screens.
- [x] Align bottom tabs and app bars.
- [x] Apply shared token grammar to Admin Mobile without changing approved role workflows.
- [x] Run typecheck/test/lint.
- [x] Run visible-control UAT and capture screenshot evidence.
- [x] Write `PHASE_18_STATUS.md` with before/after findings and residual risks.

## Exit Gates

- [x] Applicable Stitch references cited for every touched screen.
- [x] Current mobile screens visibly match approved direction.
- [x] No fake/unwired controls added.
- [x] Hindi/English toggle preserved.
- [x] Product-like data and images preserved.
- [x] Console/network errors checked.
- [x] Screenshot evidence captured.
- [x] Tests pass.
- [x] Residual design gaps documented.
