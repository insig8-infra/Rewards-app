# Phase 23 Status - End-User Mobile Product-Grade Recovery

Status: In Progress - Phase 23A Complete  
Started: 2026-07-09  
Owner: Codex

## Current Position

Phase 22 Admin Web recovery is implemented through Phase 22I, with residual visible Browser/manual-download UAT queued because Browser/Playwright tooling was unavailable in the current session.

Phase 23 is now the active planned build slice for the end-user mobile app. The implementation contract is:

- `.planning/v1-agentic-build/PHASE_23_END_USER_MOBILE_RECOVERY_PLAN.md`

Active eval gates:

- `.planning/v1-agentic-build/evals/phase23/OUTPUT_EVAL.md`
- `.planning/v1-agentic-build/evals/phase23/TRAJECTORY_EVAL.md`
- `.planning/v1-agentic-build/evals/phase23/LEARNING_LOG.md`

## Open-Question Gate

Resolved for execution defaults:

1. Use `PHASE_20_MOBILE_CONTRACT.md` for first-pass mobile search/filter/sort behavior.
2. Native iOS and Android validation is required before store-ready/public-launch readiness is claimed.
3. Mock OTP and manual QR token entry are local/dev-only and must be hidden from production builds through shared runtime gating.

## Phase 23A - Mobile Recovery Harness And Guardrails

Completed on 2026-07-09.

Built:

- Added shared end-user mobile dev-feature gating in `apps/mobile/src/devFeatures.ts`.
- Routed Team Member mock OTP display through the shared gate.
- Routed manual QR token entry through the shared gate.
- Production/non-dev builds now hide mock OTP and manual QR token entry.
- Local/dev builds keep the current fallback behavior for development and UAT unless explicitly disabled by environment flags.
- Added focused tests for dev/prod fallback behavior in `apps/mobile/src/devFeatures.test.ts`.
- Admin Mobile was not touched.

Verification passed:

- `npm run typecheck --workspace @volt-rewards/mobile`
- `npm run test --workspace @volt-rewards/mobile` - 9 tests passing.

Residual:

- Production scan surface currently shows a camera-only notice when manual token entry is hidden. The real camera-first scan screen remains planned for Phase 23D.

## Immediate Next Work

Start Phase 23B:

- Auth and app-shell recovery against approved Stitch grammar.
- Preserve and visible-test PIN reveal/hide.
- Improve app bar/tab shell and compact-width fit.
- Do not expand business behavior during this visual/navigation slice.

## Phase 23B - Auth And App Shell Recovery

Partial progress on 2026-07-09.

Built:

- Contractor role card copy now says `Full app` instead of the misleading `Admin access`.
- Team Member role card copy now says `Scan only`, matching the limited persona contract.
- Bottom tabs now use drawn Home/QR/History/Rewards glyphs instead of text-initial badges.
- Role selection now uses drawn Contractor/Team glyphs instead of `CT/TM/QR` text markers.
- No backend, permissions, session, or Admin Mobile behavior changed.

Verification passed:

- `npm run test --workspace @volt-rewards/mobile` - includes mobile typecheck and 9 tests.

Remaining in Phase 23B:

- Visible UAT/screenshot review once Browser/Expo/native tooling is stable.
- Further compact-width fit review for the auth shell, app bar, language toggle, and PIN reveal/hide controls.

## AI-Driven SDLC Eval Harness

Added on 2026-07-09 after the user explicitly asked to operationalize Output Eval, Trajectory Eval, and self-learning for Phase 23.

Built:

- Phase-specific output eval with state/action/outcome cases.
- Phase-specific trajectory eval with expected build sequence and scoreboard.
- Phase-specific learning log for harness improvement before new feature breadth.

Current eval verdicts:

- Output Eval: `PARTIAL`
- Trajectory Eval: `PARTIAL`

Reason:

- Phase 23A has passed automated proof and Phase 23B has partial automated proof, but Phase 23 as a full product workflow still needs remaining waves plus visible/native evidence.

## Phase 23C - Contractor Dashboard And Site Flow

Partial progress on 2026-07-09.

Built:

- Dashboard points-available card is now actionable and routes to Balance Book.
- Dashboard lifetime/tier-progress card is now actionable and routes to Rewards.
- Selected-site strip is now actionable and routes to Sites.
- Recent activity row is now actionable and routes to Scan History.
- Recent activity label is now human-readable instead of raw `result · id`.
- Featured rewards now exclude Delivered rewards and prioritize Claim Raised, Get Now, then nearest Locked rewards.

Verification passed:

- `npm run test --workspace @volt-rewards/mobile` - includes mobile typecheck and 11 tests.

Eval updates:

- `evals/phase23/OUTPUT_EVAL.md` updated.
- `evals/phase23/TRAJECTORY_EVAL.md` updated.

Remaining in Phase 23C:

- API/database readback for site create/edit/archive through visible/manual UAT or API smoke.
- Visible navigation/screenshot proof once Browser/Expo/native tooling is stable.

### Phase 23C Site Flow Recovery

Completed as automated/typecheck implementation proof on 2026-07-09.

Built:

- Replaced one embedded Sites panel/form with app-stack screens:
  - `Sites`
  - `SiteDetail`
  - `SiteForm`
- Contractor can open site detail, select an active site, add a site, edit an active site, and archive an active site from dedicated screens.
- Team Member remains limited to read-only site selection/detail behavior and cannot create/edit/archive.
- Site save selects the saved site and returns to Site Detail.
- Added Hindi/English copy for the new site flow.

Verification passed:

- `npm run test --workspace @volt-rewards/mobile` - includes mobile typecheck and 11 tests.

Eval updates:

- `evals/phase23/OUTPUT_EVAL.md` updated.
- `evals/phase23/TRAJECTORY_EVAL.md` updated.

Residual:

- Visible navigation proof and persisted mutation readback are still required before Phase 23C can be marked `PASS`.

## Phase 23D - Scan Flow Recovery

Partial progress on 2026-07-09.

Built:

- Contractor scan success and failure now navigate to dedicated stack result screens instead of inline result panels.
- Team Member scan success and failure now navigate to dedicated stack result screens while keeping limited tabs intact.
- Scan success result includes QR reference, site context, actor label, and next action.
- Contractor scan success can show points credited and current balance.
- Team Member scan success hides points and balance and shows only scan-recorded confirmation.
- Failure result screen carries site context where available.
- Added deterministic scan presentation tests.

Verification passed:

- `npm run test --workspace @volt-rewards/mobile` - includes mobile typecheck and 13 tests.

Eval updates:

- `evals/phase23/OUTPUT_EVAL.md` updated.
- `evals/phase23/TRAJECTORY_EVAL.md` updated.

Residual:

- Native camera-first scan surface remains pending.
- Visible scan result UAT and scan API/database readback remain required.
- Product/invoice details on scan result are still limited by the current scan API result shape.

## Phase 23E - History And Balance Book Tooling

Partial progress on 2026-07-09.

Built:

- Added Scan History search by product SKU, QR reference, site, Team Member mobile, and result.
- Added filters: All, Success, Failed, Contractor, Team Member.
- Added sorts: Latest, Product, Points high.
- Added deterministic scan-history presentation helper and tests.
- Added Balance Book search by ledger type, source, claim ID, reward name, and QR unit reference.
- Added Balance Book filters: All, Credits, Reward claims, Reward cancellations, QR reversals, Reward revocations.
- Added Balance Book sorts: Latest, Oldest, Points high, Points low.
- Added deterministic Balance Book presentation helper and tests.
- Fixed Balance Book reward-revocation matching for both `REVOK*` and `REVOC*` ledger type variants.
- Added pressable Scan History rows and a Scan detail screen.
- Added pressable Balance Book rows and a Ledger detail screen.
- Team Member Scan detail hides points/balance-sensitive rows by session role.

Verification passed:

- `npm run test --workspace @volt-rewards/mobile` - includes mobile typecheck and 19 tests.

Eval updates:

- `evals/phase23/OUTPUT_EVAL.md` updated.
- `evals/phase23/TRAJECTORY_EVAL.md` updated.

Residual:

- Visible interaction proof remains required.
- Native compact-screen layout review remains required.

## Phase 23F - Rewards And Claims Experience

Partial progress on 2026-07-09.

Built:

- Added deterministic reward catalog sectioning for Available rewards, Claim Raised rewards, and Delivered rewards.
- Rewards screen now uses real tabs for Available, Claim Raised, and Delivered.
- Delivered rewards no longer sit in the active rewards list.
- Reward tiles show image/fallback visual, name, description/value, required points, status, progress, gap, and Claim ID when chosen.
- Reward detail shows required points, tier, balance-after-claim, points-needed, points-spent, and cancel cutoff based on reward state.
- Get Now and Cancel reward actions now show reward-specific in-screen notices after API success and refresh Rewards plus Balance Book.

Verification passed:

- `npm run test --workspace @volt-rewards/mobile` - includes mobile typecheck and 20 tests.
- `npm run test --workspace @volt-rewards/api` - API build plus 87 tests passed.

Eval updates:

- `evals/phase23/OUTPUT_EVAL.md` updated.
- `evals/phase23/TRAJECTORY_EVAL.md` updated.

Residual:

- Live claim creation/cancellation API/database readback remains required through visible/manual UAT or API smoke.
- Visible rewards tab/detail layout proof remains required.
- Delivered reward immutability remains to be verified in the rewards detail path.

## Phase 23G - Team Member Limited Flow Recovery

Partial progress on 2026-07-09.

Built:

- Team Member login now states that OTP is required every session.
- Recent contractor card keeps one contractor with Use and Clear controls.
- Team Member landing now shows contractor identity, selected site context, a session-limit note, site selection, allowed Scan History, promotion, and logout.
- Team Member tabs remain limited to Scan and History.
- Team Member site action routes into the existing read-only site selector/detail flow.
- Team Member scan success remains points/balance hidden through shared scan-presentation logic.
- Scan target, dashboard scan CTA, scan result thumbnail, and dashboard quick actions now use drawn glyphs instead of text-badge placeholders.

Verification passed:

- `npm run test --workspace @volt-rewards/mobile` - includes mobile typecheck and 20 tests.

Eval updates:

- `evals/phase23/OUTPUT_EVAL.md` updated.
- `evals/phase23/TRAJECTORY_EVAL.md` updated.

Residual:

- Visible no-leak proof remains required for Team Member tabs/actions/details.
- Team Member OTP login and recent contractor behavior still need manual/live UAT.

## Phase 23H - Final Automated Gate And UAT Readiness

Partial progress on 2026-07-09.

Built:

- Added a web-only bounded responsive phone-width shell for the end-user mobile app so Expo Web UAT opens inside a mobile-sized device frame instead of full desktop width.
- Added the same bounded responsive phone-width shell for Admin Mobile so both mobile apps are evaluated at consistent mobile dimensions.
- Updated `FRONTEND_EXPERIENCE_STANDARD.md` so future mobile UI slices must use the phone-width shell and pass a representative phone viewport matrix for browser UAT.
- Updated `ROADMAP.md` so Phase 24 includes a mobile visual-system upgrade pass across both mobile apps before broad feature expansion.

Verification passed:

- `npm run test --workspace @volt-rewards/mobile` - includes mobile typecheck and 20 tests.
- `npm run test --workspace @volt-rewards/admin-mobile` - includes Admin Mobile typecheck and 4 tests.
- `npm run test --workspace @volt-rewards/api` - API build plus 87 tests passed.
- `git diff --check` passed for touched Phase 23 mobile/eval/status files.
- Focused search found no remaining rendered `QR`, `CT`, `TM`, or quick-code text badge placeholders in mobile JSX.

Eval updates:

- `evals/phase23/OUTPUT_EVAL.md` updated.
- `evals/phase23/TRAJECTORY_EVAL.md` updated.

Residual:

- Manual/visible UAT remains required before Phase 23 can be called complete.
- Native iOS/Android validation remains required before any store-ready/public-launch claim.
- Live claim/cancel, OTP/recent-contractor, site mutation, and scan readback smoke tests remain pending.

## Completion Rules

Do not mark Phase 23 complete until:

- The screen contract is implemented or residuals are explicitly recorded.
- Mobile typecheck/tests pass.
- Visible-control UAT is performed through the available mobile/browser tooling or a tooling residual is recorded honestly.
- Native iOS/Android residual is either passed or explicitly queued before any store-ready claim.

## Manual Mobile UAT 2026-07-10

Source: `.planning/v1-agentic-build/Mobile_App_ManualUAT`  
Triage: `.planning/v1-agentic-build/MOBILE_APP_MANUAL_UAT_TRIAGE.md`

Verdict:

- Phase 23 remains `PARTIAL`.
- The user has changed/clarified the expected QR scan workflow into a site-first batch/cart model. Existing immediate single-scan behavior is no longer enough for product completion.
- Scan History, Scan Details, reward tile readability, promotion banner layout, profile photo management, and points math require remediation before Phase 23 can be considered product-complete.

New blockers before Phase 23 completion:

- Implement or explicitly phase the resolved site-first persistent scan cart flow from `DEC-050`: select site, scan valid QRs into a server-reserved cart, review items/total points, allow high-value QR reservation above 1000 points, guard navigation away from Scan while reserved items exist, and credit with `Add to account`.
- Ensure failed scans never enter cart and technical `Add to account` failures keep reserved items retryable.
- Ensure already-claimed/failed scans do not appear as credited points.
- Standardize Scan Details fields across scan attempt types.
- Rename and polish `Scan History`, showing Contractor vs Team Member actor and preserving full detail access.
- Fix reward tile truncation and reward points available/lifetime calculations.
- Add contractor profile photo set/edit/remove workflow.
