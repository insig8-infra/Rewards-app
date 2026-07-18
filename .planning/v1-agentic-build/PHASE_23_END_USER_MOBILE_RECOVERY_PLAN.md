# Phase 23 - End-User Mobile Product-Grade Recovery Plan

Status: Planned - Contract Locked, Execution Pending  
Owner: Codex  
Date: 2026-07-09

## Source Contracts

- `AGENTS.md`
- `.planning/v1-agentic-build/APPROACH.md`
- `.planning/v1-agentic-build/ROADMAP.md`
- `.planning/v1-agentic-build/REQUIREMENTS_LEDGER.md`
- `.planning/v1-agentic-build/OPEN_QUESTIONS.md`
- `.planning/v1-agentic-build/SECURITY_AND_EVALUATION_PLAN.md`
- `.planning/v1-agentic-build/SKILLS_PLAN.md`
- `.planning/v1-agentic-build/FRONTEND_EXPERIENCE_STANDARD.md`
- `.planning/v1-agentic-build/PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `.planning/v1-agentic-build/PHASE_20_MOBILE_CONTRACT.md`
- `.planning/v1-agentic-build/APPROVED_STITCH_UI_CONTRACT.md`
- `Sample_References/Screenshots from Stitch/`

## Phase Boundary

Phase 23 recovers the end-user mobile app only:

- Contractor app experience.
- Team Member app experience.
- End-user mobile navigation, site selection, scan, history, rewards, balance book, auth, and profile/support flows.

Out of scope:

- Admin Mobile visible-polish issues, except defects that directly block end-user mobile shared primitives.
- Admin Web feature corrections, except Phase 22 residual visible UAT when browser tooling becomes available.
- New reward, QR, or BUSY business behavior unless already required by Phase 20 contracts.
- Claim fulfillment by OWNER/STAFF; that belongs to Admin Web/Admin Mobile phases.

## Open-Question Gate

Relevant Phase 23 questions from `OPEN_QUESTIONS.md` are brought forward before implementation.

### 1. First-Pass Filters, Search, And Sort

Decision for Phase 23: use `PHASE_20_MOBILE_CONTRACT.md` as the first-pass contract.

Scan History:

- Search: product, invoice number, site, Team Member mobile, QR reference.
- Filters: success, failed, reversed, Contractor, Team Member, date range.
- Sort: latest first by default, product, points.

Balance Book:

- Search: reward name, Claim ID, QR reference, source label.
- Filters: credits, reward claims, reward cancellations, QR reversals, reward revocations, date range.
- Sort: latest first by default, oldest, points high-to-low, points low-to-high.

Implementation note: where the backend already supports server-side query parameters, use them. Where the backend does not yet expose the filter, implement a correct local first-pass over the loaded result and record any backend expansion as a follow-up only if the current data size makes local filtering insufficient.

### 2. Native Device Validation Targets

Decision for Phase 23: product-grade mobile implementation may pass automated checks and Expo Web/visible fallback UAT, but public store readiness cannot be claimed until native iOS and Android validation is completed.

Minimum native validation targets before store-ready claim:

- iOS simulator/device: one modern iPhone viewport and one compact iPhone viewport.
- Android emulator/device: one modern Pixel-class viewport and one compact/low-width Android viewport.
- Native checks must include auth, PIN reveal/hide, site selection, scan result states, history filters, reward claim/cancel, Hindi/English toggle, session restore/logout, and Android hardware back behavior.

If native tooling is unavailable during this phase, the residual must be recorded explicitly; Expo Web is only a UAT supplement.

### 3. Local/Dev Fallbacks Hidden In Production

Decision for Phase 23:

- Mock OTP display is local/dev only.
- Manual QR token entry is local/dev only unless a future support-mode decision explicitly permits it.
- Production builds must present camera-first scan surfaces and must not show dev token entry or mock OTP values.
- Dev-only controls must be gated through a shared runtime helper, not scattered inline checks.

## Current-State Audit

The current end-user mobile app has useful foundations:

- React Navigation auth stack, app stack, and bottom tabs exist.
- Contractor and Team Member sessions call real backend APIs.
- Hindi/English copy exists.
- PIN reveal/hide exists for Contractor login, MPIN setup, and change MPIN.
- Team Member recent contractor is stored locally after successful login.
- Mock OTP display already uses a dev check.
- API-driven promotions and reward images are wired.

Current gaps against Phase 20 and product-grade contracts:

- Most mobile code lives in one large `App.tsx`, increasing regression risk and making screen-specific UAT harder.
- Manual QR token entry is not yet behind a shared production-safe dev-feature gate.
- Scan success and failure states are inline panels, not dedicated result screens with stack back behavior.
- Site list, create, edit, and archive are embedded in one panel rather than a clear Site List -> Detail/Form flow.
- History lacks product-grade search, filters, sort, readable labels, and detail screens.
- Balance Book has partial filter chips but lacks search, sort, date range, event detail, and full required event categories.
- Rewards screen mixes rewards, balance, and claims but does not yet provide a polished tabbed product experience with claim history/detail.
- Team Member flow needs a more intentional scan-first landing and must keep limited data boundaries visually obvious.
- Some tab icons are text initials rather than icon-led app controls.
- Visible UAT remains dependent on browser/native tooling availability; completion cannot be claimed without recording evidence or residual risk.

## Screen Contract

### Auth Stack

Screens:

- `RoleSelection`
- `ContractorLogin`
- `ContractorForgotMpin`
- `ContractorSetMpin`
- `TeamMemberLogin`
- `TeamMemberOtp`

Rules:

- Role selection follows approved Stitch role-selection grammar.
- Contractor login uses mobile plus four-digit MPIN with reveal/hide.
- Forgot MPIN explains retailer/admin reset.
- Team Member recent contractor appears only after one successful OTP login and includes use/clear controls.
- Hindi/English toggle remains visible.
- Successful Contractor login lands on `ContractorTabs.Home`.
- Successful Team Member login lands on scan-first limited screen.

### Contractor App

Top-level tabs:

- `Home`
- `Scan`
- `History`
- `Rewards`

Stack/detail screens:

- `SitesList`
- `SiteDetail`
- `SiteForm`
- `ScanCamera`
- `ScanDevTokenEntry`
- `ScanSuccess`
- `ScanAlreadyScanned`
- `ScanExpired`
- `ScanInvalid`
- `ScanSessionExpired`
- `ScanNetworkRetry`
- `ScanAttemptDetail`
- `RewardsHome`
- `RewardDetail`
- `ClaimDetail`
- `BalanceBook`
- `BalanceEntryDetail`
- `Profile`
- `HelpSupport`

Dashboard requirements:

- Human contractor name, mobile, photo/avatar, and tier.
- API-driven active promotion banner.
- Available points card linking to Balance Book.
- Lifetime/tier progress.
- Selected site context with Change/Create/Manage path.
- Dominant Scan QR action.
- Shortcuts for Balance Book, Scan History, Rewards, Sites/Profile.
- Featured rewards showing claimable/near-unlock items with images and status.
- Recent activity with human-readable labels, not raw database IDs.

### Team Member App

Top-level:

- `Scan`
- `History`

Stack/detail screens:

- `TeamMemberScanHome`
- `TeamMemberScanResult`
- `TeamMemberScanFailure`
- `TeamMemberHistoryDetail`
- `ChangeContractor`

Rules:

- Shows contractor human name, mobile, photo/avatar, selected site context, scan action, permitted history, session note, and logout/change contractor.
- Does not show rewards, balance book, tier progress, analytics, site management, or full profile management.
- OTP is required every session; recent contractor never bypasses OTP.

## Implementation Waves

### Phase 23A - Mobile Recovery Harness And Guardrails

- Create shared dev-feature gating for mock OTP and manual QR token entry.
- Add tests for dev/prod fallback visibility decisions.
- Record Phase 23 plan/status and open-question decisions.
- Keep Admin Mobile untouched.

### Phase 23B - Auth And App Shell Recovery

- Align role selection and login screens to approved Stitch grammar.
- Verify PIN reveal/hide behavior remains visible and accessible.
- Replace text-initial tab icons with icon-like, app-quality controls using existing dependencies unless a new icon dependency is explicitly justified.
- Ensure top app bar and Hindi/English toggle fit compact widths.

### Phase 23C - Contractor Dashboard And Site Flow

- Polish dashboard hierarchy and card rhythm.
- Split site selection/manage/create/edit/archive into clearer screen flow.
- Keep selected site visible on scan surfaces.
- Add empty/loading/error states.

### Phase 23D - Scan Flow Recovery

- Make scan flow camera-first for production surfaces and dev-token fallback local/dev only.
- Convert success and failure outputs into dedicated result screens.
- Include product, invoice/reference where allowed, QR short reference, points, current balance for Contractor success, site, actor, and next actions.

### Phase 23E - History And Balance Book Tooling

- Add search/filter/sort controls for Scan History.
- Add search/filter/sort controls for Balance Book.
- Add detail screens for scan attempts and ledger events.
- Ensure Team Member history scope remains limited.

### Phase 23F - Rewards And Claims Experience

- Polish reward tabs and reward tiles using catalog images.
- Separate active rewards, claim-raised states, delivered history, and balance book.
- Make claim/cancel result behavior clear and refresh balances/readbacks.

### Phase 23G - Team Member Limited Flow Recovery

- Polish Team Member login, recent contractor, scan-first landing, site context, history, and logout/change contractor flow.
- Re-verify no forbidden contractor balance/reward/tier/analytics data is visible.

### Phase 23H - Verification And UAT

- Run mobile typecheck/tests.
- Run relevant API tests if backend filters/read models change.
- Run API smoke for Contractor and Team Member auth, site, scan history, rewards, balance book, and promotions where feasible.
- Perform visible UAT through available Browser/Expo/native tooling.
- Record screenshots or explicitly record tooling residuals.
- Do not mark store-ready until native iOS/Android validation is completed.

### Manual UAT 2026-07-10 Contract Amendment

The manual UAT recorded in `.planning/v1-agentic-build/Mobile_App_ManualUAT` supersedes the weaker first-pass scan and mobile polish assumptions.

Required changes before Phase 23 product completion:

- Scan QR entry must be site-first for every new batch. There should be no silent default selected site when starting a scan batch.
- Contractor/Team Member selects or confirms a site, scans multiple valid QR units into a persistent server-reserved cart inside that site context, reviews all cart items and total points, then presses `Add to account`.
- Failed scans never enter the cart; they are recorded as failed attempts only.
- The scan batch review page must support success and technical-error recovery. If `Add to account` fails due network/API failure, the reserved items remain in the cart and the user retries.
- Reserved cart has no v1 point-value cap; valid high-value QR tokens reserve when token/site/session rules pass. If reserved items exist and the user tries to leave the selected site's Scan flow, show a prompt to `Add to account` or stay/go back to Scan.
- Reward tiles must preserve essential information at phone widths.
- Promotion banner title/description must not sit directly over the image unless an approved image-safe treatment is documented.
- Contractor profile must support set/edit/remove profile picture.
- `History` becomes `Scan History`; rows show Contractor vs Team Member actor and keep full details accessible.
- Scan Details use a uniform schema across success, failure, duplicate/already-claimed, expired, and invalid states.
- Points math for available balance, lifetime total, reward claims, cancellations, and scan attempts is a hard correctness gate.

## Acceptance Criteria

- Contractor login lands on a polished dashboard with human identity, points, site, scan, rewards, promotion, and activity.
- Team Member login lands on a polished limited scan-first experience.
- PIN reveal/hide works in all MPIN/PIN places in the end-user app.
- Manual QR token entry and mock OTP are hidden from production builds.
- Contractor cannot scan without an active selected site.
- Scan success and failure states are dedicated result experiences, not toast-only or vague inline feedback.
- Contractor sees full permitted scan history with search/filter/sort.
- Team Member sees only permitted scoped history with search/filter/sort.
- Rewards use images, statuses, progress, gap copy, and Claim ID where relevant.
- Balance Book has search/filter/sort and human-readable event rows.
- Hindi/English toggle remains visible and does not break layout.
- Seeded/user-facing data uses realistic human names, sites, products, and rewards.
- Admin Mobile issues are not fixed ad hoc in this phase unless they block shared end-user mobile primitives.

## Verification Plan

- `npm run typecheck --workspace @volt-rewards/mobile`
- `npm run test --workspace @volt-rewards/mobile`
- Add focused mobile tests for dev-feature gating, history filtering/sorting, reward status labels, and balance-book filters as implementation lands.
- If backend query/filter behavior changes, run `npm run test --workspace @volt-rewards/api`.
- Visible UAT: Contractor and Team Member login, site selection, scan result states, history, rewards, balance book, Hindi/English, logout/session restore.
- Native UAT before store-ready: iOS and Android simulator/device targets listed above.

## Output Eval, Trajectory Eval, And Learning Gate

Phase 23 uses explicit AI-Driven SDLC eval artifacts:

- `evals/phase23/OUTPUT_EVAL.md`
- `evals/phase23/TRAJECTORY_EVAL.md`
- `evals/phase23/LEARNING_LOG.md`

Rules:

- Every implementation wave must update the output eval with state/action/outcome evidence.
- Every implementation wave must update the trajectory eval with context, tool, verification, and self-correction evidence.
- Any surprise, repeated defect pattern, browser/native tooling limitation, or user correction must update the learning log before new feature breadth continues.
- Phase 23 cannot be called product-workflow complete unless both output eval and trajectory eval are `PASS`.
- If visible/native evidence is unavailable, the result is at best `PARTIAL`, even if automated tests pass.

## Residual Carried From Phase 22

Phase 22H/22I visible browser UAT remains queued because the current Browser/Playwright tooling was unavailable or closed during the last attempt. This residual does not authorize new Admin Web behavior during Phase 23; it must be resumed when browser tooling is stable.
