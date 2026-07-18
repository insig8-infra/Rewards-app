# Phase 27 Output Eval - Mobile Native And Visual Readiness Closure

Status: Active Gate  
Created: 2026-07-15

## Output Cases

| ID | Requirement | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- |
| P27-DESIGN-001 | `PLAT-013`, `PLAT-014`, `PLAT-015` | Phase 27 records approved Stitch mapping plus 3-5 secondary external design references before visual/native work. | PASS | `DESIGN_REFERENCE_APPENDIX.md` created on 2026-07-15. |
| P27-EU-001 | `PLAT-009`, `CAPP-011`, `AUTH-027` | End-user role/login shell fits supported phone widths, keeps language toggle usable, and uses icon-style MPIN reveal/hide. | PASS | `node tools/phase27-mobile-readiness-proof.mjs` PASS on 2026-07-15. Evidence covers Contractor login shell, MPIN reveal/hide, Hindi toggle, and viewport screenshots across `360x740`, `390x844`, `430x932`, and `480x900`. |
| P27-EU-002 | `CAPP-012`, `SITE-014`, `SITE-015`, `SCAN-024` | Contractor Dashboard and Scan QR entry require fresh site selection, hide scanner controls until selection, and keep primary scan path obvious. | PASS | `node tools/phase26c-mobile-scan-site-proof.mjs` PASS on 2026-07-15 after harness ItemCode sync fix. Evidence: `evals/phase26/screenshots/phase26c-proof.json`. |
| P27-EU-003 | `SCAN-013` through `SCAN-023` | Scan cart, reserved items, commit success, failure retry, Scan History, and Scan Details are visually readable and state-correct. | PASS | Phase 27 end-user proof covers reserved cart, commit success, forced commit failure retry, Team Member no-points cart, and API scan-history readback across `360x740`, `390x844`, `430x932`, and `480x900`. |
| P27-EU-004 | `RWD-024`, `RWD-041`, `CAPP-014`, `CAPP-015`, `CAPP-017` | Rewards, Profile photo, Promotions, and Balance Book preserve essential copy and points terminology at supported phone widths. | PASS | `node tools/phase27-mobile-readiness-proof.mjs` PASS. Evidence covers dashboard promotion, Rewards, Balance Book controls/readback, Profile photo input, and MPIN controls across the viewport matrix. |
| P27-EU-005 | `TMEM-006` through `TMEM-009`, `AUTH-018`, `AUTH-019` | Team Member flow remains scan-first, limited, recent-contractor/OTP-safe, and free of contractor reward/balance leakage. | PASS | Phase 26C proof covers visible OTP login, fresh scan entry, selected-site scan, no point total in Team Member result/cart, and post-commit site clear. Phase 27 proof adds recent-contractor local storage, visible recent card, and clear/remove proof. |
| P27-AM-001 | `MADM-010`, `MADM-026`, `MADM-030`, `MADM-031` | Admin Mobile login and dashboard use icon PIN reveal and operational command cards with real drilldowns. | PASS | Phase 25F proof covers OWNER dashboard and drilldowns; Phase 27 proof adds Admin Mobile login shell and PIN reveal/hide viewport evidence. |
| P27-AM-002 | `MADM-013`, `MADM-014`, `MADM-015`, `MADM-029` | Return Scan and native camera/media permission readiness are proved or precisely blocked by missing native tooling. | BLOCKED RECORDED | Native camera/media readiness is blocked by missing full Xcode/simctl, Android emulator, global Expo/EAS CLI, and checked-in native project directories. Store-readiness is not claimed. |
| P27-AM-003 | `MADM-017`, `MADM-021`, `MADM-022`, `MADM-023`, `MADM-033` | Contractors, Staff, and Reports workflows preserve OWNER mutation and STAFF read-only restrictions. | PASS | `node tools/phase25f-admin-mobile-proof.mjs` PASS on 2026-07-15. Evidence covers OWNER contractor/staff/report paths and STAFF contractor read-only list/detail. |
| P27-AM-004 | `MADM-024`, `MADM-027`, `MADM-034` | Admin Mobile Rewards is organized into role-correct sections and does not leak STAFF fulfillment/catalog controls. | PASS | `node tools/phase27-mobile-readiness-proof.mjs` PASS on 2026-07-16 with `MEDIA_STORAGE_MODE=local`. Evidence covers fresh image-backed proof reward activation, contractor claim `CLM-C87F6F`, OWNER fulfillment controls, OWNER catalog controls, STAFF Reward History, and absence of STAFF mutation/fulfillment/catalog controls. |
| P27-NATIVE-001 | `PLAT-002`, `PLAT-003`, `PLAT-006`, `PLAT-008` | iOS and Android run/build probes for both mobile apps pass, or exact missing-tooling blocker is recorded without claiming store-readiness. | BLOCKED RECORDED | Local toolchain probe on 2026-07-15 found no `simctl`, no full Xcode, no Android emulator command, no global Expo/EAS CLI, and no checked-in native project directories. Store-readiness is not claimed. |
| P27-GATE-001 | `PLAT-012` | Phase 23/24/25 residual statuses are updated after proof, and no broad feature phase starts while readiness gates are open. | PASS | Roadmap, open questions, state, Phase 24, Phase 25, and Phase 25 eval route readiness closure through Phase 27; Phase 27 now records visible proof and native/storage blockers before any broad new feature phase. |

## Current Verdict

`PARTIAL/BLOCKED`: Phase 27 planning/design-reference, automated gates, current-code visible proof, and development local-media proof pass. Native iOS/Android proof remains blocked by local toolchain/project-structure gaps. Production Supabase Storage upload/readback remains a launch gate. Store-readiness is not claimed.

## Development Storage Egress Guard - 2026-07-16

- Added `MEDIA_STORAGE_MODE=local|supabase`; default/unset mode is local even if Supabase credentials exist.
- Local media mode validates uploads but returns one shared placeholder data URL, avoiding Supabase Storage uploads during development.
- Local media mode masks existing Supabase Storage public media URLs in reward and promotion API read models, avoiding image-display egress from old rows.
- Added `SUPABASE_EGRESS_RUNBOOK.md` and DEC-052.
- `npm run test --workspace @volt-rewards/api` - PASS, 103/103.
- `MEDIA_STORAGE_MODE=local API_BASE_URL=http://127.0.0.1:3000/api NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3000/api MOBILE_URL=http://127.0.0.1:3002 ADMIN_MOBILE_URL=http://127.0.0.1:3003 node tools/phase27-mobile-readiness-proof.mjs` - PASS.
- Fresh proof reward `P27-41817780` activated and was claimed as `CLM-C87F6F`; OWNER Claim Desk showed `Send OTP`, `Mark Delivered`, and backend re-check copy without hitting Supabase Storage.

## Verification Run - 2026-07-15

- `npm run test --workspace @volt-rewards/mobile` - PASS, 23/23.
- `npm run test --workspace @volt-rewards/admin-mobile` - PASS, 4/4.
- `npm run test --workspace @volt-rewards/api` - PASS, 99/99.
- `git diff --check` - PASS after Phase 27 planning updates.
- `node --check tools/phase27-mobile-readiness-proof.mjs` - PASS.

## Harness Correction - 2026-07-15

- First end-user proof run exposed a stale proof helper after Phase 26B: demo QR SKUs were not synced into the ItemCodes master, so QR print correctly failed with `ITEM_CODE_NOT_FOUND_FOR_PRINT`.
- Fixed `tools/prepare-client-demo.mjs` to seed matching demo ItemCodes with `fixedPoints` for its own demo SKUs before QR print.
- `node --check tools/prepare-client-demo.mjs` - PASS.
- `git diff --check` - PASS.

## Visible Proof Run - 2026-07-15

- `node tools/phase26c-mobile-scan-site-proof.mjs` - PASS with elevated local-network access.
- End-user proof evidence: `evals/phase26/screenshots/phase26c-proof.json`.
- `node tools/phase25f-admin-mobile-proof.mjs` - PASS with elevated local-network access.
- Admin Mobile proof evidence: `evals/phase25/screenshots/phase25f-admin-mobile-proof.json`.
- `node tools/phase27-mobile-readiness-proof.mjs` - PASS with elevated local-network/browser access.
- Phase 27 proof evidence: `evals/phase27/screenshots/phase27-mobile-readiness-proof.json`.
- Phase 27 screenshot matrix includes end-user login reveal, Hindi login, dashboard promotions, Rewards, Balance Book, Profile, Team Member recent contractor, Admin login reveal, OWNER Rewards Claim Desk/Catalog, and STAFF Rewards read-only.
- Runtime console checks in all proof harnesses - PASS, no console errors or runtime exceptions captured.

## Storage Blocker - 2026-07-15

- The Phase 27 proof attempted to create a fresh image-backed active proof reward so OWNER fulfillment controls could be exercised against a new `Claim Raised` row.
- Backend correctly rejected ACTIVE rewards without images, so the harness followed the real path: create draft, upload image, activate.
- Image upload then failed because the connected Supabase project returned Storage `402` with `exceed_egress_quota`.
- Result: Admin Mobile Rewards role organization and STAFF no-leak proof passed. On 2026-07-16, development storage was pointed to local/no-network mode through `MEDIA_STORAGE_MODE=local`; the fresh active-claim proof was then repeated successfully in that mode. Production Supabase Storage remains a launch gate.

## Native Tooling Probe - 2026-07-15

- No native project directories exist under `apps/mobile` or `apps/admin-mobile`.
- `xcrun simctl list devices available` - BLOCKED, `simctl` unavailable.
- `xcodebuild -version` - BLOCKED, active developer directory is Command Line Tools rather than full Xcode.
- `emulator -list-avds` - BLOCKED, command not found.
- `which expo` and `which eas` - unavailable globally.
- Decision: do not run `expo run:ios` or `expo run:android` without explicit approval because they would generate native project files and still require missing native toolchains.
