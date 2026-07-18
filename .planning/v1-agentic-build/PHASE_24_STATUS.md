# Phase 24 Status - Mobile Visual System Recovery

Status: In Progress  
Started: 2026-07-09  
Owner: Codex

## Current Position

Phase 24 is the active mobile visual-quality recovery phase. It covers both mobile apps:

- End-user mobile app: Contractor and Team Member.
- Admin Mobile app: OWNER and STAFF.

Active contract:

- `.planning/v1-agentic-build/PHASE_24_MOBILE_VISUAL_SYSTEM_UI_SPEC.md`

Controlling standards:

- `.planning/v1-agentic-build/APPROVED_STITCH_UI_CONTRACT.md`
- `.planning/v1-agentic-build/FRONTEND_EXPERIENCE_STANDARD.md`
- `.planning/v1-agentic-build/PRODUCT_GRADE_PLATFORM_STANDARD.md`

## Phase 24A - Browser Mobile UAT Harness And First Visual Foundation

Partial progress on 2026-07-09.

Built:

- Added bounded responsive phone-width Expo Web shell for end-user mobile and Admin Mobile.
- Updated frontend standards so mobile browser UAT must use a representative phone viewport matrix.
- Added the Phase 24 mobile visual-system UI spec before broad redesign work.
- Tightened end-user mobile header, greeting, promotion, wallet cards, scan CTA, and bottom-tab density.
- Reduced oversized mobile typography and brought dashboard hierarchy closer to approved Stitch references.
- Improved Admin Mobile login with a compact brand/operator structure.
- Improved Admin Mobile dashboard top bar into a carded operator header and tightened hero metric density.

Verification passed:

- `npm run test --workspace @volt-rewards/mobile` - includes mobile typecheck and 20 tests.
- `npm run test --workspace @volt-rewards/admin-mobile` - includes Admin Mobile typecheck and 4 tests.

Residual:

- Visible screenshot/UAT proof across `360x740`, `390x844`, `430x932`, and `480x900` remains required.
- Native iOS/Android validation remains required before public beta/store-readiness claims.
- This first wave improves shell and top-level hierarchy only; deeper screen-by-screen polish remains pending.

## Phase 24B - Mobile Dashboard And Row-Safety Pass

Progress on 2026-07-09.

Built:

- Moved end-user selected-site context before the Scan QR CTA so the dashboard matches the site-first scan workflow.
- Converted the end-user Scan QR CTA into a compact app-style action card with selected-site context visible inside the action.
- Tightened end-user dashboard spacing, wallet cards, selected-site strip, reward rail, panels, inputs, and primary buttons for 360px-width mobile screens.
- Reworked reward tabs into a horizontal segmented control to avoid clipped labels in English/Hindi and on smaller Android devices.
- Added text constraints to reward tiles, balance rows, scan history rows, wallet labels, and reward statistics.
- Replaced visible `CT` / `TM` scan-history text markers with icon-like contractor/QR glyph markers.
- Added Admin Mobile text constraints for top bars, Return Scan, contractor rows/details, reward claim rows, reward history rows, catalog rows, metric tiles, status pills, activity rows, report rows, and shared detail rows.
- Added Admin Mobile row/badge width safeguards so long contractor names, claim IDs, product names, SKUs, and addresses do not force layout overflow.
- Added web document root resets for both mobile Expo Web apps so `html`, `body`, and `#root` use zero margin, border-box sizing, hidden horizontal overflow, and a bounded `480px` root width.
- Simplified the Expo Web mobile shell by relying on the bounded root container instead of a nested device-frame wrapper.

Verification passed:

- `npm run test --workspace @volt-rewards/mobile` - includes mobile typecheck and 20 tests.
- `npm run test --workspace @volt-rewards/admin-mobile` - includes Admin Mobile typecheck and 4 tests.

Residual:

- Historical headless Chrome screenshots at `390x844` exposed right-edge clipping on the unauthenticated end-user mobile login screen during the Phase 24 iteration. Phase 27 later reran the end-user login viewport matrix and passed login/language/MPIN reveal proof at `360x740`, `390x844`, `430x932`, and `480x900`.
- Visible Browser proof across the required viewport matrix is now recorded in Phase 27 for the remaining mobile readiness surfaces.
- Native iOS/Android validation remains required before public beta/store-readiness claims.
- Screen-by-screen Admin Mobile information architecture was advanced after Phase 24 by Phase 25F and Phase 27; Admin Mobile login, Contractors, Staff, Reports, and Rewards role surfaces now have viewport proof. Return Scan native-camera/device proof remains blocked by native tooling.

## Next Work

- Phase 27 now owns the next controlled readiness slice after Phase 26: `.planning/v1-agentic-build/PHASE_27_MOBILE_NATIVE_VISUAL_READINESS_PLAN.md`.
- The mobile design-reference gate is recorded in `.planning/v1-agentic-build/evals/phase27/DESIGN_REFERENCE_APPENDIX.md`; approved Stitch remains primary and PhonePe, Google Pay India, Paytm, and CRED are secondary pattern checks only.
- Phase 27 has recorded the visible mobile-browser viewport proof after the latest Phase 25E/25F and Phase 26C behavior changes.
- Remaining readiness closure is native-device/toolchain proof. The development Supabase Storage egress blocker now has a local/no-network media path; production Supabase Storage quota/readback remains a launch gate.

## Manual Mobile UAT 2026-07-10

Source: `.planning/v1-agentic-build/Mobile_App_ManualUAT`  
Triage: `.planning/v1-agentic-build/MOBILE_APP_MANUAL_UAT_TRIAGE.md`

Post-Phase 26 update on 2026-07-15:

- The design-reference gate is now resolved for Phase 27 with approved Stitch as primary and external references as secondary pattern checks.
- Phase 27 owns the native-readiness closure for both mobile apps; visible viewport proof is recorded in Phase 27.

Verdict:

- Phase 24 remains historical `In Progress/PARTIAL` only because native iOS/Android validation is still blocked before store-readiness.
- The product-grade visual/info-architecture residuals identified in Phase 24 have follow-up proof in Phase 25F and Phase 27.
- Existing automated tests remain necessary but insufficient for completion; Phase 27 now supplies visible-control UAT and screenshot proof across the mobile viewport matrix.

New blockers before completion:

- Native iOS/Android tooling must be available before store-readiness can be claimed.
- Fresh image-backed reward-claim fulfillment proof can be repeated in local media mode. Supabase Storage quota/spend-cap must still be resolved before production image-backed reward readiness is claimed.
- End-user Mobile Rewards, Scan History, Scan Details, Promotion Banner, and Profile photo flows must pass screen-level readability and navigation review.
- Points math and already-claimed scan detail display must be verified as correctness gates, not treated as visual polish.
