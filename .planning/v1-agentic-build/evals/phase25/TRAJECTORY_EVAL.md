# Phase 25 Trajectory Eval - Mobile UAT Remediation And Persistent Scan Cart

Status: Active Gate  
Created: 2026-07-10

## Trajectory Checks

| Check | Expected behavior | Status | Evidence |
| --- | --- | --- | --- |
| Contract-first | Read Manual Mobile UAT, `DEC-050`, API/data/QR contracts before code. | PASS | Phase 25 plan created from those contracts. |
| Relevant questions | Phase-relevant open questions were surfaced and assumptions recorded before implementation. | PASS | Phase assumptions documented in `PHASE_25_STATUS.md`. |
| Small coherent wave | Start with backend scan cart before mobile visual breadth. | PASS | Phase 25A selected as first implementation wave. |
| Verification-first | Add/update tests for reserve/commit/cap/failure before claiming completion. | PASS | Domain/API/mobile tests updated and passing; API commit-failure injection now verifies retryable cart behavior. |
| Output eval update | Update output eval after each implementation wave. | PASS | `OUTPUT_EVAL.md` updated after Phase 25A, Phase 25B, Phase 25C, and Phase 25D Wave 1. |
| Visible proof | Mobile visible viewport-matrix proof required before UI completion. | PASS | `VIEWPORT_PROOF.md` captures `360x740`, `390x844`, `430x932`, and `480x900` screenshots plus API/readback evidence for scan cart, end-user visual remediation, and Admin Mobile Wave 1. |
| Manual UAT assimilation | New user UAT findings update requirements, decisions, evals, and next contract before further implementation. | PASS | MANUALUAT2A created `PHASE_25E_END_USER_MOBILE_UAT2A_CONTRACT.md`, superseded old cart-cap and rupee-display decisions, and reopened output eval items before code changes. |
| Avoid superficial pass | Previously passing evidence must be downgraded or extended if the product contract changes. | PASS | `P25-CART-003` changed from PASS to SUPERSEDED; Client Demo 2 added `P25-MOB-007` so stricter fresh scan-site selection is evaluated separately instead of being hidden under the earlier `P25-MOB-001` PASS. |
| Client demo assimilation | Client Demo 2 changes must update requirements, decisions, roadmap, and eval routing before new implementation. | PASS | `CLIENT_DEMO_2_TRIAGE.md` created; Phase 26 routing added; `P25-MOB-007` routes stricter scan-site behavior to Phase 26C instead of treating Phase 25 proof as sufficient. |

## Trace Log

### Phase 25 Planning Trace - 2026-07-10

- Intent: Start controlled remediation after Manual Mobile UAT.
- Contracts read: `MOBILE_APP_MANUAL_UAT_TRIAGE.md`, `DEC-050`, architecture API/data/QR docs, Phase 23/24 status, frontend/product standards.
- Decision: implement backend persistent cart before mobile UI redesign.
- Files changed: planning/eval docs.
- Verification: pending.
- Verdict: `PASS` for planning, `PENDING` for implementation.

### Phase 25A/25B Foundation Trace - 2026-07-10

- Intent: Implement the scan-cart contract before mobile visual breadth.
- Backend implementation: `RESERVED_IN_CART`, persistent scan cart/items, reserve endpoint, cart read endpoint, commit endpoint, split history fields.
- Mobile implementation: mobile wire types now separate reservation from commit; scan screen loads cart, shows pending reserved items, blocks scan controls until explicit site selection, and credits only through `Add to account`.
- Verification: `npm run test --workspace @volt-rewards/domain` PASS 38/38; `npm run test --workspace @volt-rewards/api` PASS 90/90; `npm run test --workspace @volt-rewards/mobile` PASS 20/20; `git diff --check` PASS.
- Verdict: `PASS` for backend contract and mobile foundation; visible proof was completed after the runtime schema correction below. Remaining mobile/admin visual remediation continues in later Phase 25 waves.

### Phase 25B Runtime Schema Drift Trace - 2026-07-10

- Intent: Close the post-selection cart-card proof gap.
- Deviation found: source code mapped `GET /api/scan/cart`, but the running API was stale; after restart the route existed but Supabase returned `public.ScanCart does not exist`.
- Root cause: schema changes for persistent cart had been implemented without a Prisma migration applied to the live dev database.
- Correction: added migration `202607100001_scan_cart_persistence`, applied it with `npm run prisma:migrate:deploy --workspace @volt-rewards/api`, and reran live API readback.
- Visible proof: selected-site cart card rendered at `360x740`, `390x844`, `430x932`, and `480x900`; API cart readback showed one reserved item and `100` pending points.
- Harness update: added runtime schema drift correction to `APPROACH.md` and migration/readback gates to `SECURITY_AND_EVALUATION_PLAN.md`.
- Verdict: `PASS` for Phase 25B scan-cart foundation; phase remains open for later visual/native/admin remediation waves.

### Phase 25C End-User Mobile Visual Trace - 2026-07-10

- Intent: Remediate the end-user mobile UAT gaps for reward tile readability, promotion legibility, profile photo self-service, and scan-history readability before moving to Admin Mobile.
- Contract: `PHASE_25C_END_USER_MOBILE_VISUAL_CONTRACT.md` was written before code and scoped to Contractor/Team Member end-user mobile only.
- Backend implementation: contractor profile photo update endpoint persists `User.photoUrl`, validates PNG/JPEG data URLs under 2 MB, supports removal, reloads the session contractor, and records audit events.
- Mobile implementation: Profile exposes set/change/remove photo controls with preview and save/remove actions; rewards tiles use stable zones for image, title, status, meta, progress, and gap; promotion copy renders outside the image; scan-history rows/details separate QR value from credited points.
- Verification: `npm run test --workspace @volt-rewards/api` PASS 91/91; `npm run test --workspace @volt-rewards/mobile` PASS 20/20; API login/readback confirmed `Ramesh Sharma` profile photo persisted and reloaded.
- Visible proof: Home/promotion, Rewards, History, and Profile were captured at `360x740`, `390x844`, `430x932`, and `480x900`; screen identity and key assertions passed after switching from text-click proof to coordinate tab taps plus identity checks.
- Residual: native iOS/Android image-picker permission flow remains pending before any public store-readiness claim.
- Verdict: `PASS` for Phase 25C Expo Web development proof; Phase 25 remains open for Admin Mobile and native-device residuals.

### Phase 25D Wave 1 Admin Mobile IA Trace - 2026-07-10

- Intent: Address the bounded Admin Mobile Manual UAT findings for PIN reveal, dashboard command surface, OWNER controls, and Rewards IA before deeper parity work.
- Contract: `PHASE_25D_ADMIN_MOBILE_IA_CONTRACT.md` was written before code and explicitly excluded full Staff CRUD, new parity APIs, and native proof.
- Implementation: PIN reveal is now icon-style with an accessibility label; Dashboard primary operation opens Return Scan, metrics/action cards navigate to existing mobile workflows, and OWNER/STAFF affordances are role-specific. Rewards now has Claim Desk, History, and Catalog sections instead of one long stacked page.
- Verification: `npm run test --workspace @volt-rewards/admin-mobile` PASS; `git diff --check` PASS after docs; viewport proof passed at `360x740`, `390x844`, `430x932`, and `480x900`.
- Harness correction during proof: assertions passed but visual review showed bottom tab labels truncating; labels were shortened and proof was rerun before acceptance.
- Residual at that time: Contractors/Staff/Reports parity still needed its own Admin Mobile screen map and implementation wave; native iOS/Android proof remained pending.
- Verdict: `PARTIAL PASS` for Admin Mobile UAT remediation, `PASS` for Phase 25D Wave 1.

### MANUALUAT2A Intake Trace - 2026-07-10

- Intent: Assimilate new end-user mobile UAT findings before continuing implementation.
- Source: `.planning/v1-agentic-build/Mobile_App_ManualUAT` lines 35-59.
- Contract correction: the 1000-point cart cap was valid under the previous decision but is now superseded. The v1 cart has no point-value cap; the app uses a navigation guard when reserved items exist.
- Terminology correction: earlier rupee-equivalent display copy is superseded for user-facing reward/QR/balance labels. Points are the display unit.
- Planning updates: added `PHASE_25E_END_USER_MOBILE_UAT2A_CONTRACT.md`; updated `DEC-024`, `DEC-050`, `REQUIREMENTS_LEDGER.md`, `MOBILE_APP_MANUAL_UAT_TRIAGE.md`, `OPEN_QUESTIONS.md`, `PHASE_25_MOBILE_UAT_REMEDIATION_PLAN.md`, `PHASE_25_STATUS.md`, and `OUTPUT_EVAL.md`.
- Trajectory lesson: do not treat screenshots or automated tests as sufficient when the user-flow contract changes after UAT. Reopen earlier passes and make the new desired behavior explicit before implementation.
- Verdict: `PASS` for UAT assimilation; Phase 25E implementation and proof are now completed in the Phase 25E trace below.

### Phase 25E Implementation Trace - 2026-07-10

- Intent: Implement the bounded MANUALUAT2A correction contract before moving to later mobile/admin breadth.
- Backend implementation: removed point-value cart-cap enforcement from QR scan service and repositories while keeping the reserved-cart schema field for compatibility; added high-value QR reserve/commit test above the old cap.
- Mobile implementation: site rows now select directly, `View details` is the detail path, selected-site dashboard/scan copy is clearer, Scan uses a scalable site list, cart summary has a top `Add to account` shortcut and success notice, top-level navigation away from Scan is guarded while reserved items exist, and reserved Scan History details route back to `Add to account`.
- Team Member implementation: landing now frames access as contractor context, removes duplicate Select Site/Scan History buttons, moves logout into the account header, replaces internal copy, and shows no-site contractor guidance.
- Terminology implementation: reward display value now uses points copy from the API/mobile fixtures; static scan shows no active app/API `Rs.` reward-point display strings.
- Verification: `npm run test --workspace @volt-rewards/api` PASS 91/91; `npm run test --workspace @volt-rewards/mobile` PASS 20/20; `git diff --check` PASS.
- Runtime smoke: API health and mobile web were restarted/rechecked; contractor login API readback succeeds for `Ramesh Sharma` with the documented test login.
- Visible proof: `node tools/phase25e-visible-proof.mjs` PASS using short-lived headless Chrome/CDP after in-app Browser remained unavailable and Playwright MCP returned `Transport closed`.
- Proof coverage: selected-site Dashboard, reserved Scan cart, reserved-cart navigation guard, cart commit success, and Team Member no-site guidance at `360x740`, `390x844`, `430x932`, and `480x900`.
- Post-proof readback: Ramesh Sharma cart for `Mr. Mehta` site cleared to `0` items and points reconciled to `availablePoints=2130`, `totalAccumulatedPoints=2980`.
- Verdict: `PASS` for Phase 25E. At that point, Phase 25 remained open for Admin Mobile Contractors/Staff/Reports parity and native iOS/Android residuals.

### Phase 25F Admin Mobile Parity Trace - 2026-07-12

- Intent: Close the Admin Mobile Contractors/Staff/Reports parity gap identified in Manual Mobile UAT without changing the established bottom navigation contract.
- Contract: `PHASE_25F_ADMIN_MOBILE_PARITY_CONTRACT.md` was written before code. It locked Staff management inside OWNER Reports/Operations instead of adding a sixth tab, and required STAFF contractor access to remain read-only.
- Backend implementation: added thin `admin-mobile` controllers for staff and reports, extended Admin Mobile contractor routes for reactivation and reset MPIN, and reused existing services/guards to avoid forked Admin Web/Admin Mobile business logic.
- Mobile implementation: Contractors now supports OWNER registration and detail actions; Reports now loads live report landing/preview data; OWNER Staff management supports create/photo/reset/deactivate/reactivate; STAFF sees read-only contractor list/detail.
- Verification: `npm run test --workspace @volt-rewards/api` PASS 94/94; `npm run test --workspace @volt-rewards/admin-mobile` PASS 4/4; `git diff --check` PASS.
- Visible proof: `node tools/phase25f-admin-mobile-proof.mjs` PASS with 24 screenshots across `360x740`, `390x844`, `430x932`, and `480x900`.
- Harness correction: initial proof attempts failed on stale API routes, sandboxed port binding, and premature list clicks. The harness now starts updated child API/Admin Mobile servers when needed, waits for real loaded data before assertions, and closes child processes after proof.
- Verdict: `PASS` for Phase 25F. Phase 25 remains open only for native iOS/Android residual proof before store-readiness.

### Client Demo 2 Intake Trace - 2026-07-14

- Intent: Assimilate client demo feedback before continuing build work.
- Source: `.planning/v1-agentic-build/client_demo_2.md`.
- Planning correction: created `CLIENT_DEMO_2_TRIAGE.md`, updated roadmap with Phase 26, and routed Admin Web corrections, ItemCodes, and scan-site tightening into controlled implementation slices.
- Output correction: added `P25-MOB-007` to show the stricter scan-site behavior is not covered by earlier Phase 25 PASS evidence.
- Trajectory lesson: when a later client demo tightens a behavior already marked PASS, preserve historical evidence but create a new explicit eval case and phase route rather than assuming the old evidence still applies.
- Verdict: `PASS` for intake and routing. Implementation remains pending for Phase 26.
