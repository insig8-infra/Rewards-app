# Roadmap - Volt Rewards V1

This roadmap applies the agentic SDLC from the white papers to the app defined in `app-requirementsV1.md`. Each milestone is a controlled vertical slice with tests and review gates.

## Historical Build Correction - Product-Grade Mobile App Baseline

This section records the earlier product-grade mobile correction that led to Phase 16 through Phase 19. It is no longer the active next step after Manual UAT 1.

Phase 14 result:

- Completed in `PHASE_14_STATUS.md`.
- The end-user mobile shell now validates Contractor and Team Member auth, site selection/management, QR token scan placeholder, persona-specific scan history, Hindi/English toggle, Team Member Recent contractor, and API persistence readback.
- Treat this as a visible/API validation shell, not the final product-grade app structure.
- Remaining mobile hardening is native-device validation, camera scanning, production SMS/OTP policy, and later Rewards/Balance Book slices.

Phase 15 result:

- Completed in `PHASE_15_STATUS.md`.
- Rewards, Balance Book, and OWNER fulfillment are functionally wired.
- Treat current reward tiles as functional shell presentation until reward images/assets and product-grade catalog screens are added.

Former immediate next phase before new feature breadth:

- Use `PHASE_16_EXECUTION_PLAN.md` as the active phase gate.
- Create a product-grade mobile screen map for Contractor and Team Member flows.
- Replace single-scroll/panel-style mobile flow with real app navigation: auth stack, authenticated stack, top-level tabs, detail/edit/confirm/result screens, visible back affordances, and planned Android back behavior.
- Make Contractor login land on the main dashboard.
- Define the approved Team Member landing path: scan-first limited dashboard/screen with contractor identity and site context.
- Replace user-facing seed/UAT names such as `Demo Contractor`, `Runtime Gate Contractor`, `UAT Contractor`, and similar labels with realistic human names.
- Keep contractor human names sourced from `User.displayName`; do not add a duplicate `Contractor.name` unless a future approved identity split requires it.
- Add reward catalog images or documented temporary assets and render them in tiles/details with required points, tier, status, progress, and Claim ID where relevant.
- Add dashboard sections for available points, total accumulated points, tier progress, primary Scan QR action, selected site context, recent activity, and relevant reward prompts.
- Run visible-control UAT and screenshot evidence against the product-grade standard.

Phase 16 result:

- Completed in `PHASE_16_STATUS.md`.
- Contractor app now uses route-based navigation with Home, Scan, History, and Rewards tabs.
- Sites, Profile, Reward Detail, and Balance Book now use stack screens with visible back behavior.
- Contractor login lands on the Dashboard/Home screen.
- Team Member now lands on a scan-first limited flow with only Scan and History tabs.
- Seeded client-facing mobile data now uses realistic human/site/product/reward data.
- Reward catalog now renders temporary image-backed assets through `RewardCatalogItem.imageUrl`.
- Remaining mobile hardening is native iOS/Android validation, camera scanning, dedicated scan result screen, production SMS/OTP policy, and deeper site-management screen polish.

Phase 17 result:

- Completed in `PHASE_17_STATUS.md`.
- Admin Mobile is now a separate `Volt Admin` app in `apps/admin-mobile`.
- OWNER/STAFF login uses backend PIN auth and bearer sessions.
- OWNER tabs are Dashboard, Return Scan, Contractors, Rewards, Reports.
- STAFF tabs were Dashboard, Return Scan, Contractors in the Phase 17 baseline.
- Supersession note: Phase 25F/post-demo correction now gives STAFF Dashboard, Return Scan, Contractors, Rewards, and Reports with restricted/read-only behavior. Staff management remains OWNER-only.
- Dashboard and contractor list/detail use protected API readback and STAFF read-only behavior.
- Visible-control UAT caught and fixed CORS, dashboard activity key, site scan-count, and fake-action issues before completion.
- Remaining Admin Mobile hardening is native iOS/Android validation, camera scan, QR lookup/cancel/reverse wiring, contractor mutation screens, staff management screens, reward fulfillment screens, and reports/export depth.

Phase 18 result:

- Completed in `PHASE_18_STATUS.md`.
- End-user mobile now follows the approved Stitch visual direction for role selection, Contractor login, dashboard, Rewards/Balance Book shell, Team Member entry/recent contractor, scan home, scan success, and already-scanned failure state.
- Reward tiles now show visible temporary product visuals instead of blank/generic placeholders, while still allowing real image URLs later.
- QR scan result UAT used a real Admin Web printed token from seeded invoice `INV-1001`; no fake scan success was injected.
- Visible-control UAT caught and fixed a backend boundary defect where already-scanned QR attempts returned HTTP 500 instead of a domain `400` response.
- Remaining visual hardening is native iOS/Android validation, final client brand assets, production reward photography, camera scanning, and deeper Admin Mobile/Admin Web redesign slices.

Phase 19 result:

- Completed in `PHASE_19_STATUS.md`.
- Admin Mobile Return Scan now performs real QR token lookup, cancel for eligible unclaimed QR, reverse for eligible scanned QR, label-removed confirmation, claim-impact preview, ledger writes, token invalidation, and audit events.
- The confirmed QR reversal rule is locked in `DEC-041`: deduct QR points first, revoke newest chosen/unfulfilled claims until balance is non-negative or no chosen claims remain, keep fulfilled claims fulfilled, and allow any remaining deficit as negative balance.
- Visible-control UAT used real printed and scanned QR fixtures from mock BUSY invoices, exercised STAFF Return Scan controls, and verified dashboard/QR/ledger API readback.
- Admin Web remains excluded from returned-product QR status lookup/cancel/reverse controls for v1.
- Remaining Admin Mobile hardening is native camera/device validation, contractor mutation screens, staff management screens, OWNER reward fulfillment screens, and reports/export depth.

Manual UAT 1 result:

- Captured in `ManulUAT1.md`.
- Triaged in `MANUAL_UAT1_TRIAGE.md`.
- Durable decisions recorded as `DEC-042`, `DEC-043`, and `DEC-044`.
- Manual UAT 1 blocks further feature breadth until product-grade recovery phases are planned and executed.
- The largest gaps are static dashboards, weak information architecture, missing list tooling, lack of real Admin Web login, insufficient native-app feel, internal IDs leaking into histories, contractor/staff directory UX, site selection discoverability, reward tile quality, and updated BUSY return-voucher modeling.

AI-Driven SDLC harness audit:

- Completed in `ITERATION_CYCLE_AUDIT_2026-07-08.md`.
- Future phases must use the strengthened phase templates with spec-to-eval criteria, output eval, trajectory eval, browser profile matrix, and maintenance feedback.
- Clean isolated/incognito-like browser profiles are the default agent UAT surface. User persistent-profile anomalies are treated as cache/extension/dialog/session/profile-policy hypotheses before product-code patches.
- Historical phases remain the accepted baseline, but any touched area must be re-baselined under the current gate before new completion claims.

Phase 20 result:

- Completed in `PHASE_20_STATUS.md`.
- Product-grade recovery contracts now exist for cross-surface UI behavior, Admin Web, End-User/Admin Mobile, and BUSY return-voucher modeling.
- The recovery contracts lock dashboard drilldowns, operational list tooling, human-readable history labels, Admin Web real login, QR Print Queue vs Invoice Ledger split, contractor identity immutability, PIN reveal/hide, mobile native-app quality, and linked return-voucher handling.
- No app code was changed in Phase 20.

Phase 21 result:

- Completed in `PHASE_21_STATUS.md`.
- Return allocation decisions are locked in `DEC-045`.
- Mock BUSY sales invoices and return invoices are now separate sources.
- Return invoices are persisted separately from original sale invoices with linked return lines and allocation records.
- QR print availability is derived from linked return allocations, not from mutating original BUSY sale lines.
- Return invoices stay out of the QR Print Queue and are exposed as linked return history on invoice read models.
- Scanned QR without physical Admin Mobile QR scan creates review-needed allocation and does not silently reverse points.

Immediate next phases:

1. Phase 22 - Admin Web Product-Grade Recovery.
   - Phase 22A real Admin Web login/session/route guards completed in `PHASE_22_STATUS.md`.
   - Phase 22B dashboard recovery completed in `PHASE_22_STATUS.md`.
   - Phase 22C QR Print Queue, Invoice Ledger, Invoice Detail, and Print History completed in `PHASE_22_STATUS.md`.
   - Phase 22D Contractor And Staff Management Recovery completed in `PHASE_22_STATUS.md`.
   - Phase 22E Reward Fulfillment and Reward Semantics completed in `PHASE_22_STATUS.md`.
   - Phase 22F Reward Catalog Management completed in `PHASE_22_STATUS.md`.
   - Phase 22G Admin Mobile Reward Fulfillment Completion completed in `PHASE_22_STATUS.md`.
   - Phase 22H Reports Implementation completed in `PHASE_22_STATUS.md`; Manual UAT2 corrections narrowed the report library, made top metrics platform-wide, added owner-useful charts, stabilized filters, added clear filters, and moved sorting to sticky column headers. Visible browser/manual download proof remains queued.
   - Phase 22I Promotions Implementation completed in `PHASE_22_STATUS.md`; OWNER Admin Web management, all-user active mobile visibility, optional expiry, media upload/URL, overlay controls, audit, migration, and seed scenarios are implemented. Visible browser/mobile UAT remains queued.
   - Completed admin recovery areas now cover dashboard, invoices, QR print, print history, contractors, staff, reward fulfillment, reward catalog management, Admin Mobile reward fulfillment around operational workflows, first-pass Admin Web reports/export APIs, and first-pass promotions.
   - Contractor name/mobile immutability is enforced in UI and backend.
   - Remaining Phase 22 work is residual visible Browser/manual download UAT for Reports and visible Browser/mobile banner UAT for Promotions when browser tooling is stable.

2. Phase 23 - End-User Mobile Product-Grade Recovery.
   - Improve native-app feel and navigation against approved Stitch patterns.
   - Add PIN reveal/hide, clearer site select/create/manage paths, reward image/status separation, and human-readable history/Balance Book with list tooling.
   - Planning contract started on 2026-07-09 in `PHASE_23_END_USER_MOBILE_RECOVERY_PLAN.md`.
   - Open-question defaults for filters/search/sort, native validation targets, and production-hidden dev fallbacks are recorded in `PHASE_23_STATUS.md`.
   - 2026-07-10 Manual Mobile UAT keeps Phase 23 `PARTIAL`: scan flow must move to a site-first batch/cart model, Scan History/Scan Details need correctness and uniformity, Rewards/Profile/Promotion screens need product-grade remediation, and points math is a hard correctness gate.

3. Phase 24 - Admin Mobile Product-Grade Recovery.
   - Rework Admin Mobile dashboard, contractor leaderboard/directory, OWNER staff management, remaining visible UAT issues, and app-native interaction quality.
   - Add a mobile visual-system upgrade pass across both mobile apps before broad feature expansion: phone-width Expo Web UAT, denser but polished screen hierarchy, improved cards/lists/navigation, stronger icons/microcopy, and review against approved Stitch mobile direction without copying it directly.
   - Started on 2026-07-09 in `PHASE_24_MOBILE_VISUAL_SYSTEM_UI_SPEC.md` and `PHASE_24_STATUS.md`.
   - 2026-07-09: Phase 24B added dashboard, reward-tab, row-safety, and narrow-screen visual improvements; still requires visible viewport-matrix proof before completion.
   - 2026-07-10 Manual Mobile UAT keeps Phase 24 `PARTIAL`: Admin Mobile needs a stronger dashboard IA, icon-led PIN reveal, workflow parity in Contractors/Staff/Reports, Rewards sub-sections, design-reference research, and visible-control viewport proof before completion.

4. Phase 25 - Mobile UAT Remediation And Scan Batch Contract.
   - Active recovery phase before broad new mobile feature work.
   - Use `DEC-050` as the approved scan/cart contract: valid scans reserve server-side into a persistent cart, failed scans never enter cart, no v1 point-value cart cap, reserved-cart navigation guard before leaving Scan, and points credit only on `Add to account`.
   - 2026-07-10: Phase 25A backend/domain/API persistent scan cart completed with passing domain/API/mobile automated tests.
   - 2026-07-10: Phase 25B mobile scan-cart foundation completed after adding/applying migration `202607100001_scan_cart_persistence`, live API cart readback, and viewport proof at `360x740`, `390x844`, `430x932`, and `480x900`.
   - 2026-07-10: Phase 25C end-user mobile visual remediation completed for reward tiles, promotion legibility, contractor profile photo self-service, and scan-history readability with API/mobile tests, API profile-photo readback, and viewport proof at `360x740`, `390x844`, `430x932`, and `480x900`.
   - 2026-07-10: Phase 25D Admin Mobile Wave 1 completed for PIN reveal icon, dashboard command surface, OWNER action cards, and Rewards Claim Desk/History/Catalog section IA with Admin Mobile tests and viewport proof at `360x740`, `390x844`, `430x932`, and `480x900`.
   - 2026-07-10 MANUALUAT2A reopened end-user mobile Phase 25B/25C outputs and added Phase 25E for site selection, cart summary, success feedback, no-cap high-value QR behavior, navigation guard, Team Member no-site/session copy, and points-only terminology.
   - 2026-07-10 harness update: DB-backed slices require migration deploy/status evidence and live readback before visible UAT is accepted.
   - 2026-07-14 Client Demo 2 reopened the scan-site entry detail: Contractor and Team Member Scan QR must require a fresh site selection every time the Scan workflow is entered, scanner controls stay hidden until selection, and `Add to account` clears active scan-site selection for the next batch.
   - 2026-07-15 Phase 26C completed the stricter scan-site selection behavior with output/trajectory proof.
   - The remaining mobile recovery continuation is Phase 27, which owns visual/native readiness closure, design-reference evidence, and status/eval updates.
   - Phase 25 remains open only for native iOS/Android residual proof before store-readiness can be claimed.

5. Phase 26 - Client Demo 2 Alignment.
   - PASS on 2026-07-15; controlled correction completed before broad new feature work resumes.
   - Source: `client_demo_2.md`, normalized intake `CLIENT_DEMO_2_TRIAGE.md`, and plan `PHASE_26_CLIENT_DEMO_2_ALIGNMENT_PLAN.md`.
   - Phase 26A Admin Web demo corrections: Invoice Ledger date range, contractor belongs/association text area, contractor site analytics, Reward History date/sort/Claimed/Fulfilled columns, active Claim Desk auto-refresh, system Reward Code, and Promotions marquee controls.
   - Phase 26B ItemCodes: Admin Web tab, data model, API, dummy seed list, BUSY refresh/manual refresh, status derivation, dashboard attention queue, and QR print-time point resolution.
   - Phase 26C scan-site selection tightening: Contractor and Team Member Scan QR must start with no default selected site on every Scan visit and clear active scan-site selection after `Add to account`.
   - Phase 26D documentation/eval guard: update output eval, trajectory eval, API/data/decision docs, and run stale-reference checks before claiming completion.
   - Phase 26B decisions resolved: `% of Price` uses latest synced ItemCode `Price`, fractional percentages are allowed, resolved points round to the nearest integer, exactly one editable reward rule is active per ItemCode (`Absolute Points` or `% of Price`), printed QR labels say `Collect X points`, OWNER edits, and STAFF is read-only.

6. Phase 27 - Mobile Native And Visual Readiness Closure.
   - Started on 2026-07-15 as the next controlled slice after Phase 26.
   - Source: Phase 23/24/25 residuals, Manual Mobile UAT, Phase 26 completion, plan `PHASE_27_MOBILE_NATIVE_VISUAL_READINESS_PLAN.md`, and status `PHASE_27_STATUS.md`.
   - Purpose: close end-user mobile and Admin Mobile visible proof, native-readiness, and design-reference gates before broad new feature work resumes.
   - Design gate: approved Stitch screenshots remain the primary client direction; PhonePe, Google Pay India, Paytm, and CRED are secondary pattern checks only.
   - Automated gate on 2026-07-15: mobile 23/23, Admin Mobile 4/4, and API 99/99 pass.
   - Visible proof on 2026-07-15: end-user scan-site/cart proof, Team Member recent-contractor storage/clear proof, end-user login/language/Rewards/Profile/Promotions/Balance Book proof, Admin Mobile Contractors/Staff/Reports proof, and Admin Mobile login/Rewards OWNER/STAFF proof pass after updating demo/proof harnesses.
   - Storage blocker on 2026-07-15: fresh active reward-claim fulfillment proof could not be repeated because Supabase Storage returned `402 exceed_egress_quota` during proof reward image upload; Admin Mobile role/no-leak proof still passed.
   - Development egress guard on 2026-07-16: `MEDIA_STORAGE_MODE=local` default added, local placeholder media and read-model masking prevent routine dev reward/promotion image traffic from hitting Supabase Storage. Phase 27 proof rerun passed with fresh claim `CLM-C87F6F`; production Supabase Storage remains a launch gate.
   - Native toolchain probe on 2026-07-15: local full Xcode/simctl and Android emulator are unavailable, no native project directories are checked in, and store-readiness is not claimed.
   - Required evals: `evals/phase27/OUTPUT_EVAL.md`, `evals/phase27/TRAJECTORY_EVAL.md`, and `evals/phase27/DESIGN_REFERENCE_APPENDIX.md`.

7. Phase 28 - BUSY Adapter Payload Hardening.
   - PASS on 2026-07-16 under `PHASE_28_BUSY_ADAPTER_HARDENING_PLAN.md` and `PHASE_28_STATUS.md`.
   - Source: `SaleWithRef.txt`, Phase 20/21 BUSY return contract, Phase 26B ItemCodes decisions, and DEC-053.
   - Added real BUSY object/XML payload normalization for Sale and Return invoices into existing `BusyInvoiceImport` and `BusyReturnVoucherImport` contracts.
   - Explicit `VchType` now wins over the XML/root wrapper name, so a BUSY payload wrapped as `<Sale>` can still be treated as Return when `VchType = Return`.
   - Actual BUSY adapter sale lines do not invent reward points; ItemCodes remain the source of `Absolute Points` / `% of Price` and QR points freeze at print time.
   - Verification on 2026-07-16: API tests pass 108/108 and `git diff --check` passes.
   - Production BUSY auth, PUSH sync-agent/retry mechanics, exact return-link field, partial/full return samples, and deeper GST/discount semantics remain production connector gates.

8. Phase 29 - BUSY Developer API Handoff.
   - PASS on 2026-07-17 under `PHASE_29_BUSY_DEVELOPER_HANDOFF_PLAN.md` and `PHASE_29_STATUS.md`.
   - Created `client-deliverables/BUSY_DEVELOPER_API_HANDOFF.md` as the first-share requirements document for the BUSY developer.
   - The handoff is PUSH-only, contains no code snippets, and treats `tmpVchCode` as the unique invoice id.
   - The handoff covers sale invoice upsert, return invoice upsert, ItemCodes sync, retry/duplicate prevention, developer deliverables, and acceptance checks.
   - Clarification captured: `VchNo` is the BUSY billing invoice number; `tmpVchCode` is the unique invoice id. BUSY returns are new invoices with different `VchType`, linked to original invoices at invoice level.
   - The detailed reference `client-deliverables/BUSY_API_INTEGRATION_SPEC.md` now points to the handoff as the starting document.
   - Production connector implementation still waits on BUSY developer answers and samples: sync-agent need for PUSH, line identity, return-link field, partial/full return samples, item master feed, and price semantics.

Native camera/device validation remains required before public app-store readiness, but it moves after the product-grade recovery contract unless Phase 20 deliberately pulls it forward.

Phase status language:

- API-only work may be marked `API foundation complete`.
- A single-screen mobile shell may be marked `visible shell` or `API validation shell`.
- Product workflow completion requires real navigation, product-like fixture data, frontend implementation, visible-control UAT, persistence readback, screenshot evidence, frontend quality review, product-grade platform review, output eval `PASS`, and trajectory eval `PASS`.

## Milestone 0 - Product Contract And Harness

Goal: Make the build controllable before writing application code.

Deliverables:

- Root `AGENTS.md`.
- V1 requirements ledger.
- Open questions.
- Agentic build approach.
- Security and evaluation plan.
- Skill/runbook plan.
- Phase 0 execution plan.

Exit gates:

- All source documents are named.
- Requirement IDs exist for implementation traceability.
- High-risk open questions are visible.
- Next architecture decisions are known.

## Milestone 1 - Architecture And Stack Decision

Goal: Choose the production architecture and write implementation contracts.

Deliverables:

- `ARCHITECTURE.md`
- `DATA_MODEL.md`
- `API_CONTRACTS.md`
- `AUTH_AND_PERMISSIONS.md`
- `QR_STATE_MACHINE.md`
- `REWARD_LEDGER_RULES.md`
- `CI_CD_PLAN.md`

Exit gates:

- Stack choices are documented with tradeoffs.
- Framework docs are checked through Context7 before implementation.
- Database schema covers users, roles, sites, invoices, QR units, scans, points ledger, reward ledger, fulfillment, reports, and audit events.
- API contracts cover all first vertical slices.
- Security gates are mapped to CI.

## Milestone 2 - Backend Domain Core

Goal: Build deterministic domain services before UI.

Scope:

- Auth primitives for OWNER, STAFF, Contractor, Team Member session models.
- Site model and ownership rules.
- QR unit model and state machine.
- Points ledger and reward ledger.
- Audit event model.
- Mock BUSY invoice/return adapter.

Exit gates:

- Unit tests for QR state machine, points ledger, reward ledger, role permissions, site permissions, and idempotency.
- Integration tests for invoice import, QR creation, scan, cancel, reverse, reward redeem, reward cancel, and fulfillment.
- No business rule depends only on client UI.

## Milestone 3 - Admin Web Operations Foundation And QR Printing

Goal: Deliver the first operational web workflow and establish Admin Web as the full browser surface for all non-camera admin operations.

Scope:

- Admin Web shell/navigation foundation for OWNER and STAFF management workflows.
- Invoice list/detail from mock BUSY adapter.
- `Print QR codes` landing workflow.
- Pre-checked line items.
- Quantity reduction and max invoice quantity validation.
- Unit-level QR record generation.
- QR label print simulation.
- Print history.
- Reprint with replacement token.
- Role-aligned Admin Web navigation, route structure, and implementation plan for dashboards, contractor management, staff management, reward fulfillment, reports/exports, promotions, and analytics.
- Explicit exclusion: returned-product QR status scan, cancel, and reverse stay Admin Mobile only in v1.
- Realistic mock BUSY adapter remains the invoice source until actual BUSY API integration is available.

Exit gates:

- End-to-end test: invoice import -> select quantities -> print -> unit QR records exist.
- Negative tests: over-quantity blocked, duplicate generation blocked, old token invalid after reprint.
- Audit events for print and reprint.
- Admin Web planning docs clearly route returned-product QR scan/cancel/reverse away from web.
- Admin Web backlog/route map covers all non-camera Admin Mobile workflows, not only QR printing.

## Milestone 4 - End-User Scan Flow

Goal: Allow Contractor and Team Member to scan QR into site-scoped history.

Scope:

- Mobile experience contract for Contractor and Team Member workflows.
- Thin end-user mobile shell wired to current auth/site/scan/history APIs.
- Client-approved Stitch mobile UI patterns through theme tokens.
- Hindi/English toggle from day one.
- Contractor login, temporary MPIN, first-login SET MPIN, MPIN change.
- Team Member contractor mobile lookup, OTP, Recent contractor, secure local storage.
- Contractor site create/manage.
- Site selection before scan.
- QR scan success/failure.
- Contractor full Scan History across all sites and Team Member scans.
- Team Member restricted Scan History for sites they scanned or attempted.
- Scan History with filters and error attempts.
- Hindi/English switching.

Exit gates:

- Phase-relevant open questions were brought forward and decisions/assumptions recorded.
- Mobile UI workflow tests cover visible Contractor and Team Member paths.
- Frontend quality review passes against `FRONTEND_EXPERIENCE_STANDARD.md`.
- Hindi/English toggle verified on each Phase 14 screen.
- Store-ready implementation constraints reviewed.
- Contractor cannot scan without valid auth and site selection.
- Team Member cannot access forbidden contractor data.
- Team Member OTP required every session.
- Scan attempts are recorded with actor type and failure reason.
- UI workflow tests cover key mobile paths.

## Milestone 5 - Rewards And Balance Book

Goal: Implement reward redemption as a ledger-backed workflow across end-user app and Admin Web/Admin Mobile fulfillment surfaces.

Phase 15 result:

- Completed in `PHASE_15_STATUS.md`.
- Contractor mobile Rewards now includes catalog eligibility, reward detail, redeem, cancel-before-fulfillment, Balance Book, and Delivered/Collected state.
- Admin Web OWNER reward fulfillment now includes Claim ID lookup, mock OTP, and Fulfilled/Delivered marking.
- STAFF fulfillment is blocked in UI and server-side API.
- Remaining Milestone 5/6 reward work is Admin Mobile fulfillment parity and returned-product reversal integration.

Scope:

- Reward catalog and eligibility.
- Configurable physical reward catalog using seed items until client finalizes content.
- Silver, Gold, Platinum, and Diamond tiers.
- Reward tiles show locked/eligible/chosen/fulfilled state and points/tier progress gap.
- Reward detail and disabled ineligible `Redeem Now`.
- Reward selection/redeem with Claim ID.
- Deduct points on reward choice.
- Cancel chosen reward before physical collection and restore points.
- Balance Book chronological activity with filters.
- Delivered/Collected after OWNER fulfillment.
- Admin Web OWNER reward fulfillment by Claim ID and OTP.
- QR earning rule documented as managed BUSY `TempItemCode` / `tmpItemCode` ItemCodes table; full Admin Web ItemCodes integration completed in Phase 26B.

Exit gates:

- Points ledger remains internally consistent.
- Reward cancellation restores points and recalculates tier/eligibility.
- Fulfilled reward cannot be casually cancelled by contractor.
- Negative balance behavior is covered for post-fulfillment QR reversal.

## Milestone 6 - Admin Mobile Operations

Goal: Deliver OWNER and STAFF mobile operations, including the mobile-only returned-product QR handling flow.

Scope:

- OWNER and STAFF login.
- OWNER dashboard and STAFF limited dashboard.
- Mobile Return Scan QR status.
- Mobile cancel eligible QR.
- Mobile reverse eligible QR.
- OWNER contractor registration/edit/deactivate.
- STAFF contractor read-only.
- OWNER staff management.
- OWNER-only reward fulfillment with Claim ID and OTP.
- Admin Web implements the same non-camera management workflows in web slices; returned-product QR scan/cancel/reverse is not duplicated on web in v1.

Exit gates:

- STAFF cannot perform OWNER-only actions.
- Cancel and reverse require label-removed confirmation.
- Reverse warns on possible negative balance.
- OWNER-only fulfillment is enforced server-side.
- Recent activity records who did what and when.

## Milestone 7 - Reports, Exports, Promotions

Goal: Add owner visibility and client communication features.

Scope:

- Admin Web as the primary report/export/promotion management surface.
- QR printed reports.
- Contractor leaderboard.
- QR status reports.
- Reward claims reports.
- Returns/reversals reports.
- Product/category performance.
- Contractor deep-dive analytics.
- OWNER export to PDF and Excel in the first reports implementation; WhatsApp share remains deferred until explicitly re-approved.
- Promotion/banner management.
- Admin Web full management screens for non-camera admin workflows must be complete by this milestone if not completed in earlier slices.

Exit gates:

- STAFF exports are blocked.
- Report filters and columns match approved requirements.
- Export files match source report data.
- Promotion visibility respects active/non-expired all-user rules in the first promotion implementation; advanced targeting is deferred.

## Milestone 8 - Production Hardening And Launch

Goal: Prepare for real users and store distribution.

Scope:

- Production environment setup.
- Secrets management.
- Backup and restore.
- Observability and audit dashboards.
- Security testing.
- Performance testing.
- Play Store and App Store packaging.
- Release runbooks.

Exit gates:

- CI/CD green.
- Security scans green or accepted with documented risk.
- Critical user journeys verified on Android, iOS, and web.
- Operational runbooks exist for QR disputes, reward disputes, BUSY sync failures, and OTP failures.
