# Phase 27 Plan - Mobile Native And Visual Readiness Closure

Status: In Progress - planning/automated/visible gates complete, native tooling blocked  
Created: 2026-07-15  
Source: Phase 23/24/25 residuals, Phase 26 completion, `MOBILE_APP_MANUAL_UAT_TRIAGE.md`

## Intent

Close the remaining mobile recovery gates before broad new feature work resumes. Phase 27 is not a new feature phase. It is a readiness and evidence phase that turns the Phase 23/24/25 partial residuals into explicit output and trajectory gates for:

- End-user mobile visual proof after the scan-cart and fresh site-selection corrections.
- Admin Mobile visual proof after Contractors, Staff, Reports, Rewards, and role-parity corrections.
- Native iOS/Android feasibility evidence for camera, image picker, secure storage, permissions, and release-build compatibility.
- Design-reference discipline before any further mobile UI redesign.

## Source Contracts

- `REQUIREMENTS_LEDGER.md`
- `OPEN_QUESTIONS.md`
- `APPROVED_STITCH_UI_CONTRACT.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `SECURITY_AND_EVALUATION_PLAN.md`
- `PHASE_23_STATUS.md`
- `PHASE_24_STATUS.md`
- `PHASE_25_STATUS.md`
- `PHASE_27_STATUS.md`
- `MOBILE_APP_MANUAL_UAT_TRIAGE.md`
- `PHASE_26_CLIENT_DEMO_2_ALIGNMENT_PLAN.md`
- `evals/phase27/DESIGN_REFERENCE_APPENDIX.md`
- `evals/phase27/OUTPUT_EVAL.md`
- `evals/phase27/TRAJECTORY_EVAL.md`

## Requirements Covered

- `PLAT-002` through `PLAT-015`
- `AUTH-018`, `AUTH-027`
- `SITE-004`, `SITE-011` through `SITE-015`
- `CAPP-014`, `CAPP-016`, `CAPP-017`
- `TMEM-006` through `TMEM-009`
- `SCAN-013` through `SCAN-024`
- `RWD-024`, `RWD-040`, `RWD-041`
- `MADM-010`, `MADM-013`, `MADM-024`, `MADM-026`, `MADM-029` through `MADM-034`

## Open Questions Review

Resolved for this phase:

1. The design-reference gate uses the approved Stitch screenshots as the primary client direction.
2. External references are secondary pattern checks only: PhonePe, Google Pay India, Paytm, and CRED.
3. The phase may proceed without changing the product's approved information architecture.

Completion-relevant:

1. Native iOS/Android proof requires an available simulator/device or an explicitly recorded tooling block.
2. Actual production camera scanning remains a native capability gate. Expo Web token-entry proof is not store-readiness evidence.
3. Development media can use `MEDIA_STORAGE_MODE=local` to avoid Supabase Storage egress while still enforcing image-required reward rules.
4. Production OTP/SMS, hosting, final reward imagery, Supabase Storage quota/spend-cap readiness, and real BUSY connector remain outside this phase unless they block a native build command.

## Implementation Waves

### Phase 27A - Planning And Design Reference Gate

Scope:

- Create and maintain the Phase 27 output eval, trajectory eval, and design-reference appendix.
- Map approved Stitch screenshots to affected mobile screens.
- Record external reference patterns adopted and rejected.
- Keep the phase bounded to readiness closure, not feature expansion.

Exit gate:

- `evals/phase27/DESIGN_REFERENCE_APPENDIX.md` exists and names adopted/rejected patterns.
- Output and trajectory eval cases are created before code or native-proof work.

### Phase 27B - End-User Mobile Visual Closure

Scope:

- Re-run visible proof for Contractor and Team Member after Phase 25E and Phase 26C changes.
- Cover role/login, Contractor dashboard, fresh Scan QR site selection, reserved cart, post-commit success, Scan History/detail, Rewards, Profile, and Team Member no-site/no-leak flows.
- Verify Hindi/English toggle and compact text fit where the screen uses localized copy.

Exit gate:

- `360x740`, `390x844`, `430x932`, and `480x900` proof passes with no text clipping, hidden primary actions, or stale scan-site behavior.
- API/database readback covers at least one scan-cart commit and one reward claim/cancel or a documented reason it cannot be safely repeated.

### Phase 27C - Admin Mobile Visual Closure

Scope:

- Re-run visible proof for OWNER and STAFF Admin Mobile after Phase 25F.
- Cover login/PIN reveal, dashboard command cards, Return Scan, Contractors, Staff management, Reports, Rewards sections, OWNER-only actions, and STAFF read-only paths.
- Verify no STAFF mutation/export/fulfillment controls leak into visible UI.

Exit gate:

- Viewport matrix proof passes for representative OWNER and STAFF workflows.
- Role-denied/read-only behavior is verified through visible UI plus API permission tests where relevant.

### Phase 27D - Native Device/Simulator Readiness Probe

Scope:

- Attempt native build/run probes for both Expo mobile apps using the existing scripts where local tooling allows:
  - `npm run ios --workspace @volt-rewards/mobile`
  - `npm run android --workspace @volt-rewards/mobile`
  - `npm run ios --workspace @volt-rewards/admin-mobile`
  - `npm run android --workspace @volt-rewards/admin-mobile`
- If local native tooling is unavailable, capture the exact blocker and keep store-readiness unclaimed.
- Audit app manifests for camera, media picker, secure storage, app names, bundle IDs/package IDs, and permission copy.
- Verify production-hidden dev fallbacks for mock OTP and manual QR token entry remain gated.

Exit gate:

- Native run/build evidence is recorded, or the phase records a precise `BLOCKED` residual with the missing simulator/device/toolchain.
- No public beta, App Store, Play Store, or store-ready claim is made without actual native evidence.

### Phase 27E - Readiness Verdict And Maintenance Feedback

Scope:

- Update Phase 23/24/25 statuses based on new evidence.
- Update Phase 27 output and trajectory eval verdicts.
- Add learning-log or standard updates if proof exposes recurring visual or tooling defects.
- Leave broad feature work paused until verdict is `PASS` or residuals are explicitly accepted.

Exit gate:

- Output eval verdict and trajectory eval verdict are recorded.
- Residual risks are explicit and dated.
- Next phase recommendation is clear.

## Verification Commands

Required automated checks:

- `npm run test --workspace @volt-rewards/mobile`
- `npm run test --workspace @volt-rewards/admin-mobile`
- `npm run test --workspace @volt-rewards/api`
- `npm run typecheck --workspace @volt-rewards/mobile`
- `npm run typecheck --workspace @volt-rewards/admin-mobile`
- `git diff --check`

Required visible proof:

- End-user mobile Expo Web: `http://127.0.0.1:3002`
- Admin Mobile Expo Web: `http://127.0.0.1:3003`
- Viewport matrix: `360x740`, `390x844`, `430x932`, `480x900`

Required native proof:

- iOS simulator/device probe for both apps, if local tooling is available.
- Android emulator/device probe for both apps, if local tooling is available.
- If unavailable, record exact blocker and do not claim store-readiness.

Current native-tooling result on 2026-07-15:

- iOS probe is blocked because full Xcode/simctl is unavailable in the active developer directory.
- Android probe is blocked because the Android emulator command is unavailable.
- `expo` and `eas` are not installed globally, and `expo run:*` would generate native project directories for apps that do not currently check them in.
- Native store-readiness is not claimed.

## Completion Rule

Phase 27 can pass only when:

- Output eval and trajectory eval are both `PASS`, or any `PARTIAL/BLOCKED` residual is explicitly scoped to external native tooling.
- Mobile visual proof exists after the latest Phase 25/26 behavior changes.
- Native iOS/Android readiness is honestly proved or honestly deferred.
- The next build phase has a clear recommendation based on evidence, not optimism.
