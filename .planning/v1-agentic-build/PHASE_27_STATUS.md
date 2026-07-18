# Phase 27 Status - Mobile Native And Visual Readiness Closure

Status: In Progress - Planning/Automated/Visible Gates Passed, Native Tooling Blocked, Dev Storage Egress Guard Added  
Started: 2026-07-15  
Owner: Codex

## Current Position

Phase 27 is the active controlled slice after Phase 26. It exists to close mobile visual-proof and native-readiness residuals before broad new feature work resumes.

Active plan:

- `.planning/v1-agentic-build/PHASE_27_MOBILE_NATIVE_VISUAL_READINESS_PLAN.md`

Active eval gates:

- `.planning/v1-agentic-build/evals/phase27/DESIGN_REFERENCE_APPENDIX.md`
- `.planning/v1-agentic-build/evals/phase27/OUTPUT_EVAL.md`
- `.planning/v1-agentic-build/evals/phase27/TRAJECTORY_EVAL.md`

## Phase 27A - Planning And Design Reference Gate

Completed on 2026-07-15.

Built:

- Added Phase 27 plan.
- Added Phase 27 output eval and trajectory eval.
- Added design-reference appendix.
- Resolved the mobile design-reference gate for this phase: approved Stitch screenshots are primary; PhonePe, Google Pay India, Paytm, and CRED are secondary pattern checks only.
- Updated roadmap, open questions, Phase 24 status, Phase 25 status/eval, and project state to route the next work through Phase 27.

Verification passed:

- `git diff --check` - PASS.
- Stale-route scan - PASS for Phase 26C pending/future references.

## Automated Gate - 2026-07-15

Passed:

- `npm run test --workspace @volt-rewards/mobile` - PASS, 23/23.
- `npm run test --workspace @volt-rewards/admin-mobile` - PASS, 4/4.
- `npm run test --workspace @volt-rewards/api` - PASS, 99/99.

## Visible Proof - 2026-07-15

Initial proof attempt:

- End-user proof first failed because the proof harness was blocked from local Node `fetch` under the sandbox and then exposed a real harness drift: `prepare-client-demo.mjs` created demo invoice SKUs without matching Phase 26B ItemCodes.
- Admin Mobile proof first failed because stale local dev servers exhausted the Supabase session pool (`EMAXCONNSESSION`, pool size 15).

Corrections:

- Stopped stale local dev servers and restarted only the API/mobile surfaces needed for proof.
- Updated `tools/prepare-client-demo.mjs` to seed matching demo ItemCodes for its own demo SKUs before QR print.
- Verified `node --check tools/prepare-client-demo.mjs` and `git diff --check`.

Passed proof:

- `node tools/phase26c-mobile-scan-site-proof.mjs` with elevated local-network access - PASS.
  - Covered Contractor and Team Member fresh Scan QR entry, scanner hidden before site selection, selected-site scanner visibility, reserved cart, post-commit site clearing, technical commit failure retry preservation, Team Member no-points exposure, API scan-history readback, and console/runtime checks.
  - Evidence: `.planning/v1-agentic-build/evals/phase26/screenshots/phase26c-proof.json` and screenshot matrix under `.planning/v1-agentic-build/evals/phase26/screenshots/`.
- `node tools/phase25f-admin-mobile-proof.mjs` with elevated local-network access - PASS.
  - Covered OWNER contractor registration/detail actions/reset MPIN, OWNER reports landing/preview, OWNER staff management, STAFF contractor read-only list/detail, and console/runtime checks.
  - Evidence: `.planning/v1-agentic-build/evals/phase25/screenshots/phase25f-admin-mobile-proof.json` and screenshot matrix under `.planning/v1-agentic-build/evals/phase25/screenshots/`.
- `node tools/phase27-mobile-readiness-proof.mjs` with elevated local-network/browser access - PASS.
  - Covered end-user Contractor login shell, MPIN reveal/hide, Hindi language toggle, dashboard promotion, Rewards, Balance Book, Profile photo input, Profile MPIN controls, Team Member recent-contractor storage/visible card/clear, Admin Mobile login PIN reveal, OWNER Rewards sections/catalog controls, STAFF Reward History, STAFF no fulfillment/catalog mutation leakage, and console/runtime checks.
  - Evidence: `.planning/v1-agentic-build/evals/phase27/screenshots/phase27-mobile-readiness-proof.json` and screenshot matrix under `.planning/v1-agentic-build/evals/phase27/screenshots/`.

Storage blocker:

- The Phase 27 proof attempted to create a fresh image-backed active reward so an OWNER fulfillment OTP path could be repeated against a new `Claim Raised` row.
- The backend correctly required an image before reward activation. The harness followed that rule, but Supabase Storage returned `402 exceed_egress_quota` during image upload.
- Result: Admin Mobile Rewards organization and STAFF no-leak proof passed. Fresh active-claim fulfillment proof remains repeatable after storage is run in local/no-network mode or after production Supabase Storage quota is restored.

## Development Storage Egress Guard - 2026-07-16

Triggered by the Supabase dashboard screenshot showing 16.70 GB egress usage against the Free plan 5 GB included quota.

Built:

- Added `MEDIA_STORAGE_MODE`, defaulting to `local`.
- Local media mode validates reward/promotion media uploads but returns one shared placeholder data URL instead of uploading to Supabase Storage.
- Existing Supabase Storage public URLs are masked in reward and promotion API read models while local media mode is active, so clients do not keep downloading old Storage objects.
- `.env.example` now defaults development to `MEDIA_STORAGE_MODE=local` and documents explicit staging/production Supabase opt-in.
- Added `.planning/v1-agentic-build/SUPABASE_EGRESS_RUNBOOK.md`.
- Added DEC-052 for development media-storage policy and production launch requirements.

Verification passed:

- `npm run test --workspace @volt-rewards/api` - PASS, 103/103.
- `MEDIA_STORAGE_MODE=local API_BASE_URL=http://127.0.0.1:3000/api NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3000/api MOBILE_URL=http://127.0.0.1:3002 ADMIN_MOBILE_URL=http://127.0.0.1:3003 node tools/phase27-mobile-readiness-proof.mjs` - PASS.
- Fresh proof reward `P27-41817780` activated through local media mode, contractor claimed it as `CLM-C87F6F`, and OWNER Claim Desk showed fulfillment controls.

## Native Tooling Probe - 2026-07-15

Result: blocked by local toolchain, not by app code.

Findings:

- No native project directories exist yet under `apps/mobile` or `apps/admin-mobile`.
- `xcrun simctl list devices available` failed because `simctl` is unavailable.
- `xcodebuild -version` failed because the active developer directory is Command Line Tools, not full Xcode.
- `emulator -list-avds` failed because the Android emulator command is unavailable.
- `expo` and `eas` are not installed globally. Local npm scripts can still use project dependencies, but `expo run:ios` or `expo run:android` would generate native project files and require the missing native toolchains.

Decision:

- Do not run `expo run:ios` or `expo run:android` in this session without explicit approval, because the apps do not currently have checked-in native project directories and local native tooling is unavailable.
- Do not claim public beta, App Store, Play Store, or store-ready status.

## Remaining Work

- Restore/upgrade Supabase Storage quota or remove the spend cap before staging/production image upload/readback can be claimed.
- If the user installs full Xcode/iOS simulator and Android SDK emulator or approves generating native project files, rerun native probes.

## Current Verdict

- Output eval: `PARTIAL/BLOCKED`
- Trajectory eval: `PARTIAL/BLOCKED`
- Completion language: `readiness planning, automated gate, visible proof, and development storage egress guard complete`; not product/store-ready.
