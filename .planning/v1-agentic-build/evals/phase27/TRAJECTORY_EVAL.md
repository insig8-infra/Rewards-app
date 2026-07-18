# Phase 27 Trajectory Eval - Mobile Native And Visual Readiness Closure

Status: Active Gate  
Created: 2026-07-15

## Trajectory Checks

| Check | Expected behavior | Status | Evidence |
| --- | --- | --- | --- |
| Contract-first | Read Phase 23/24/25 residuals, Phase 26 completion, requirements, standards, and open questions before implementation. | PASS | Phase 27 plan created from those sources on 2026-07-15. |
| Design-reference gate | Resolve the mobile design-reference question before further visual implementation. | PASS | `DESIGN_REFERENCE_APPENDIX.md` records approved Stitch as primary and external references as secondary. |
| Eval-first | Create output and trajectory eval rows before code or native-proof work. | PASS | Phase 27 eval files created before implementation. |
| Scope control | Keep Phase 27 focused on readiness/proof, not broad feature expansion. | PASS | Phase 27 planning/status/eval updates added no product feature scope. |
| Visible proof discipline | Use viewport matrix proof for both mobile apps and verify real screen identity after navigation. | PASS | Phase 27 reran scan-site/cart, Admin Mobile contractor/staff/report, and the new Phase 27 mobile/admin readiness proof across the viewport matrix with screen-identity assertions and screenshot evidence. |
| Native honesty | Do not claim store-readiness without actual iOS/Android evidence. | PASS | Native probe found missing local toolchains; status/eval record blocker and keep store-readiness unclaimed. |
| Role/security discipline | Verify OWNER/STAFF and Contractor/Team Member boundaries through UI and backend/API checks. | PASS | Proof covers Team Member point hiding, recent-contractor storage/clear, STAFF contractor read-only path, OWNER Rewards sections/catalog controls, and STAFF Rewards no mutation/fulfillment/catalog leakage. |
| Maintenance feedback | Update Phase 23/24/25 status and standards if recurring proof defects appear. | PASS | Harness drift was fixed in `prepare-client-demo.mjs`; Phase 27 docs/evals now record visible proof pass plus native and Supabase Storage blockers. |
| Supabase egress discipline | Do not continue development in a mode that burns Supabase Storage egress for routine reward/promotion images. | PASS | 2026-07-16 added `MEDIA_STORAGE_MODE=local` default, read-model masking for existing Supabase Storage URLs, `SUPABASE_EGRESS_RUNBOOK.md`, DEC-052, API tests proving local mode avoids Storage calls, and a full Phase 27 proof rerun with fresh claim `CLM-C87F6F`. |

## Trace Log

### Phase 27 Planning Trace - 2026-07-15

- Intent: advance after Phase 26 without drifting into feature breadth while mobile recovery residuals remain.
- Context read: `ROADMAP.md`, `STATE.md`, `OPEN_QUESTIONS.md`, Phase 23/24/25/26 status and eval files, `MOBILE_APP_MANUAL_UAT_TRIAGE.md`, `APPROVED_STITCH_UI_CONTRACT.md`, `REQUIREMENTS_LEDGER.md`, and mobile package scripts.
- Design research: external sources reviewed for secondary pattern guidance: PhonePe, Google Pay India, Paytm, and CRED.
- Decision: approved Stitch remains the primary reference; external apps are only pattern checks.
- Boundary: Phase 27 does not implement real BUSY connector, production OTP/SMS, hosting, final reward content, or broad feature expansion.
- Verdict: `PASS` for planning gate; proof and any implementation remain pending.

### Phase 27 Automated And Native Probe Trace - 2026-07-15

- Intent: run non-destructive readiness gates after planning and determine whether native proof can proceed.
- Automated verification: mobile tests PASS 23/23; Admin Mobile tests PASS 4/4; API tests PASS 99/99; `git diff --check` PASS.
- Native environment probe: no checked-in native project directories exist; `simctl` unavailable; full Xcode unavailable; Android emulator command unavailable; global Expo/EAS CLI unavailable.
- Decision: do not run `expo run:ios` or `expo run:android` without explicit approval because they would generate native project files and still require missing native toolchains.
- Verdict: automated readiness gate `PASS`; native proof `BLOCKED` by local tooling; store-readiness not claimed.

### Phase 27 Visible Proof And Harness Drift Trace - 2026-07-15

- Intent: rerun current-code visible proof after Phase 26B/26C instead of relying only on historical screenshots.
- First issue: stale local dev servers exhausted the Supabase session pool; stale processes were stopped and only API/mobile surfaces needed for proof were restarted.
- Second issue: Node-based proof harnesses needed elevated local-network access because sandboxed Node `fetch` to `127.0.0.1` returned `EPERM`.
- Third issue: `prepare-client-demo.mjs` had drifted after Phase 26B ItemCodes. It inserted demo invoice lines but not matching ItemCodes, so QR print correctly rejected the demo invoice.
- Correction: added demo ItemCode sync to `prepare-client-demo.mjs` and verified syntax/whitespace.
- End-user proof: `node tools/phase26c-mobile-scan-site-proof.mjs` PASS with API scan-history readback and no console/runtime errors.
- Admin Mobile proof: `node tools/phase25f-admin-mobile-proof.mjs` PASS with OWNER/STAFF role proof and no console/runtime errors.
- Additional Phase 27 proof: added `tools/phase27-mobile-readiness-proof.mjs` for end-user login/language/rewards/profile/balance/promotions and Admin Mobile login/rewards role proof.
- Harness correction: the first Phase 27 proof attempt double-clicked Pressable controls, toggling MPIN reveal on and immediately off. The helper was corrected to send one pointer action per click.
- Harness correction: the proof now waits for async dashboard promotion data instead of asserting before app data hydration finishes.
- Harness correction: reward-list proof now targets a visible Available/Locked reward instead of a Fulfilled reward that belongs in a different tab.
- Storage blocker: fresh active proof reward creation followed the real catalog path but failed at image upload because Supabase Storage returned `402 exceed_egress_quota`. The proof records this as an external blocker and still verifies OWNER/STAFF Rewards role surfaces. The 2026-07-16 egress guard later configures development to avoid that Storage path by default.
- End-user/Admin Mobile readiness proof: `node tools/phase27-mobile-readiness-proof.mjs` PASS with no console/runtime errors, including Team Member recent-contractor storage, visible card, and clear/remove.
- Verdict: visible proof is `PASS`; native proof remains `BLOCKED`. Fresh active-claim fulfillment proof was blocked in the 2026-07-15 run but passed in local media mode after the 2026-07-16 egress guard.

### Phase 27 Supabase Egress Guard Trace - 2026-07-16

- Intent: respond to the Supabase dashboard screenshot showing Free plan egress overage and prevent routine development from causing further Supabase Storage egress.
- Context read: `OPEN_QUESTIONS.md`, `REQUIREMENTS_LEDGER.md`, Phase 27 plan/status/evals, Supabase storage adapter/tests, reward and promotion read-model mappers, `.env.example`.
- Current docs check: Context7 Supabase docs confirmed egress includes data leaving Supabase through Database/API, Storage, Realtime, Auth, Edge Functions, Database/Supavisor, and that Storage egress can be diagnosed through Logs Explorer Storage Egress Requests.
- Decision: add explicit `MEDIA_STORAGE_MODE=local|supabase`, default to local, keep production Supabase as an explicit opt-in.
- Implementation: local mode returns one shared placeholder data URL for uploads and masks existing Supabase Storage public URLs in reward/promotion API read models.
- Verification: `npm run test --workspace @volt-rewards/api` PASS, 103/103, including tests that default mode is local even with Supabase credentials, local uploads do not call `fetch`, read-model masking works, and Supabase mode requires credentials.
- Browser proof: `node tools/phase27-mobile-readiness-proof.mjs` PASS with `MEDIA_STORAGE_MODE=local`; fresh proof reward `P27-41817780` activated and was claimed as `CLM-C87F6F`, OWNER Claim Desk showed fulfillment controls, and STAFF mutation controls remained hidden.
- Verdict: development egress guard `PASS`; production Supabase Storage upload/readback remains a launch gate.

## Current Verdict

`PARTIAL/BLOCKED`: planning, automated trajectory, visible proof, and development storage egress guard are clean. Native proof is honestly blocked by local tooling. Production Supabase Storage upload/readback remains a launch gate.
