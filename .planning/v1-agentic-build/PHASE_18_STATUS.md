# Phase 18 Status - Stitch Approved UI Alignment

Completed: 2026-07-06.

## Completed Goal

Aligned the end-user mobile app baseline to the client-approved Stitch visual direction before expanding deeper QR return, staff, reporting, or admin workflows.

This phase also applied light shared-token alignment to Admin Mobile and fixed a backend scan error boundary exposed by visible-control UAT.

## Requirement IDs Covered

- `PLAT-012`
- `PLAT-013`
- `PLAT-014`
- `PLAT-015`
- `AUTH-002` through `AUTH-023` where role selection, Contractor login, Team Member login, and Recent contractor UI apply.
- `CAPP-001` through `CAPP-013` where dashboard/navigation presentation applies.
- `SCAN-001` through `SCAN-012` where scan home, success, history, and failure presentation apply.
- `RWD-001` through `RWD-025` where reward tile, Balance Book, claims shell, and catalog presentation apply.
- `MADM-*` only for shared token grammar, not deep Admin Mobile workflow completion.

## Questions And Decisions

- Phase-relevant open questions brought forward: none blocking for visual alignment.
- User decisions recorded: client-approved Stitch screenshots are the visual source of truth; use PayTM/PhonePe-like app clarity; Hindi/English toggle remains day-one; Team Member recent contractor appears only after successful OTP login.
- Assumptions or deferrals: final client brand assets, final product/reward photography, native camera, and native iOS/Android validation remain future hardening items.

## Files Changed

- `apps/mobile/App.tsx`
- `apps/mobile/src/theme.ts`
- `apps/mobile/src/i18n.ts`
- `apps/mobile/src/i18n.test.ts`
- `apps/admin-mobile/src/theme.ts`
- `apps/api/src/qr/scan.controller.ts`
- `apps/api/src/qr/scan.controller.test.ts`
- `apps/api/src/auth/mobile-auth.service.test.ts`
- `.planning/v1-agentic-build/PHASE_18_EXECUTION_PLAN.md`
- `.planning/v1-agentic-build/ROADMAP.md`
- `.planning/v1-agentic-build/PHASE_18_STATUS.md`

## Verification

Tests run:

- `npm run test --workspace @volt-rewards/mobile` - pass.
- `npm run test --workspace @volt-rewards/api` - pass, 54/54.
- `npm run typecheck --workspace @volt-rewards/admin-mobile` - pass.
- `npm run lint` - pass across all workspaces.
- `git diff --check` - pass.

Frontend experience quality:

- Role selection and Contractor login now use card-based app UI, MPIN boxes, compact app bar, and visible Hindi/English toggle.
- Contractor dashboard now shows human name, tier chip, promo banner, points cards, primary Scan QR action, shortcut cards, selected site, featured reward rail, and recent activity.
- Rewards screen now uses tabs, balance card, stats, and full-width reward list with visible temporary reward visuals.
- Team Member entry now shows no recent contractor before first success, then one recent contractor with Use/Clear after OTP login.
- Scan screen now shows selected site, scanning identity, scan frame, success result, and already-scanned failure result.

Browser workflow UAT:

- Exact URLs:
  - Mobile web: `http://127.0.0.1:3002`
  - API: `http://127.0.0.1:3000/api`
- Persona/actor context:
  - Contractor: `9000001001` / `1234`.
  - Team Member: contractor mobile `9000001001`, team mobile `9000011111`, dev OTP returned by API.
  - Admin QR print actor: OWNER `9000000091` / `1111`.
- Visible-control interaction proof:
  - Contractor login through visible mobile/MPIN controls.
  - Bottom navigation to Rewards and Scan through visible tab labels.
  - Team Member OTP login through visible fields and Verify OTP button.
  - Real QR print through Admin Web API, then scan through visible Contractor QR token field.
- Hydration/console/network check:
  - Auth, Contractor dashboard, Rewards, Scan, Scan success, Team Member login, Team Member scan: no console warnings/errors.
  - Already-scanned UAT intentionally produces one browser network error entry for HTTP `400 Bad Request`; this is expected for a rejected scan and no JS exception occurs.

Screenshot evidence:

- `evidence/phase18-mobile-auth.png`
- `evidence/phase18-mobile-contractor-dashboard-viewport.png`
- `evidence/phase18-mobile-contractor-dashboard-full.png`
- `evidence/phase18-mobile-rewards-viewport.png`
- `evidence/phase18-mobile-rewards-full.png`
- `evidence/phase18-mobile-scan-viewport.png`
- `evidence/phase18-mobile-scan-success.png`
- `evidence/phase18-mobile-scan-success-full.png`
- `evidence/phase18-mobile-scan-already-scanned.png`
- `evidence/phase18-mobile-team-member-login-empty.png`
- `evidence/phase18-mobile-team-member-scan.png`
- `evidence/phase18-mobile-team-member-login-recent.png`

Security checks:

- No fake scan success was injected; scan success used a real QR token printed from seeded invoice `INV-1001`.
- The reused token now returns a domain `400` instead of an internal `500`.
- Team Member still has scan-limited post-login navigation and no contractor balance/reward access.

## Agentic Process Notes

Context read:

- `AGENTS.md`
- `APPROVED_STITCH_UI_CONTRACT.md`
- `PHASE_18_UI_SPEC.md`
- `PHASE_18_EXECUTION_PLAN.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `ROADMAP.md`

Tools used:

- Local code inspection and edits.
- Playwright visible-control UAT.
- API test suite and mobile test suite.
- Real local API calls for Admin QR print.

Failures encountered:

- Initial reward list layout overflowed because compact reward tile image sizing was reused by full list tiles.
- Scan frame rotation produced a diagonal dashed line that read as a visual defect.
- React Native Web warned about deprecated `shadow*` and `pointerEvents` props.
- Reused/already-scanned QR returned HTTP 500 from the API because `ScanController` did not translate `DomainError`.
- An existing auth test was time-dependent and failed after the temporary MPIN expiry date.

Self-repair steps:

- Split compact reward image sizing from full reward-list image sizing.
- Removed scan-frame rotation.
- Replaced deprecated web shadow props with `boxShadow` and moved pointer events into style.
- Added inline scan failure panel and suppressed raw backend toast for scan failures.
- Mapped QR scan `DomainError` to `BadRequestException` in `ScanController`.
- Added `ScanController` regression test.
- Made the MPIN-change test deterministic with explicit timestamps.

## Residual Risk

- Native iOS/Android screenshots and camera behavior are not validated in this phase.
- Reward visuals are temporary app-native illustrations; final client/product photography is still needed.
- Expired QR, invalid QR, session expired, and network retry panels share the same failure-panel structure but were not each exercised with separate real fixtures in browser UAT.
- Admin Mobile received token-level alignment only; deep Admin Mobile visual redesign remains future work.
- Browser logs one expected failed-resource entry for the intentionally rejected `400` scan attempt.

## Follow-Up

- Plan QR return operations next: QR status lookup, cancel, reverse, label-removed confirmation, negative-balance warning, and audit readback.
- Add native camera scanning and native-device UAT before public app-store readiness can be claimed.
- Replace temporary reward visuals with final brand/product assets when client supplies them.
