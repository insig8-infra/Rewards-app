# Phase 23 Output Eval - End-User Mobile Product-Grade Recovery

Status: Active Gate  
Created: 2026-07-09  
Purpose: Verify what Phase 23 built before the user's Manual UAT.

## Evaluation Rule

Phase 23 cannot be called complete until this output eval is `PASS`.

Scoring:

- `PASS`: implemented, verified, and evidence recorded.
- `PARTIAL`: implemented but missing visible/native evidence or a non-blocking residual exists.
- `FAIL`: requirement missing, broken, insecure, or contradicted by evidence.
- `BLOCKED`: external tooling or user decision blocks verification.

## Required Evidence

Each completed wave must record:

- Requirement or contract source.
- State/action/outcome eval criteria.
- Automated test evidence.
- API/database readback evidence where mutation occurs.
- Visible UAT evidence or explicit tooling residual.
- Role-denied evidence where applicable.
- Hindi/English layout risk review where text changed.
- Security/store-readiness review where dev-only or native behavior changed.

## Wave Scoreboard

| Wave | Scope | Current Result | Required Evidence Before PASS |
| --- | --- | --- | --- |
| 23A | Mobile recovery harness and dev fallback guardrails | PASS | Mobile tests passed; mock OTP/manual QR entry hidden in non-dev builds through shared gate. |
| 23B | Auth and app shell recovery | PARTIAL | Automated mobile tests passed; visible compact-width auth/shell UAT and PIN reveal/hide proof still required. |
| 23C | Contractor dashboard and site flow | PARTIAL | Dashboard actionability, featured-reward selection, and site list/detail/form navigation have automated/typecheck proof; mutation readback and visible navigation proof still required. |
| 23D | Scan flow recovery | PARTIAL | Dedicated success/failure result screens and Team Member point/balance hiding have automated proof; camera/native and scan readback proof still required. |
| 23E | History and Balance Book tooling | PARTIAL | Scan History and Balance Book search/filter/sort plus row detail screens have automated proof; visible interaction proof still required. |
| 23F | Rewards and claims experience | PARTIAL | Reward sectioning, image/status/progress/claim UI has automated proof; claim/cancel balance readback and visible proof still required. |
| 23G | Team Member limited flow recovery | PARTIAL | OTP/recent contractor, limited landing, site/history actions, and no-points scan result have automated/typecheck proof; visible no-leak proof still required. |
| 23H | Final verification and UAT readiness | PARTIAL | Mobile/API automated gates passed; visible UAT artifacts and native validation status remain pending. |

## Phase 23 State/Action/Outcome Cases

### Auth And Session

| Case | State | Action | Expected Outcome | Result |
| --- | --- | --- | --- | --- |
| P23-AUTH-001 | Contractor registered with active MPIN | Enter mobile and MPIN | Lands on Contractor dashboard with human name, photo/avatar, points, tier, site context | PENDING |
| P23-AUTH-002 | Contractor login MPIN hidden | Tap reveal/hide | MPIN toggles visibility without changing value or validation | PARTIAL |
| P23-AUTH-003 | Team Member has one recent contractor | Tap Use recent | Contractor mobile pre-fills but OTP is still required | PENDING |
| P23-AUTH-004 | Production/non-dev build | Open Team Member OTP screen | Mock OTP value is not displayed | PASS |

### Contractor Dashboard And Site

| Case | State | Action | Expected Outcome | Result |
| --- | --- | --- | --- | --- |
| P23-DASH-001 | Contractor logged in | Open Home | Shows human identity, promotion, points, tier progress, selected site, scan CTA, rewards, recent activity | PARTIAL |
| P23-SITE-001 | No active site selected | Try scan | Scan is blocked with clear site-selection path | PENDING |
| P23-SITE-002 | Contractor opens site management | Create/edit/archive site | Mutations persist and selected-site context refreshes | PARTIAL |
| P23-SITE-003 | Team Member session | Open site context | Can select active sites only; cannot create/edit/archive | PARTIAL |

### Scan

| Case | State | Action | Expected Outcome | Result |
| --- | --- | --- | --- | --- |
| P23-SCAN-001 | Production/non-dev build | Open Scan | Manual token entry is hidden; camera-first surface is shown | PARTIAL |
| P23-SCAN-002 | Local/dev build | Open Scan | Manual token fallback is available for UAT/dev only | PASS |
| P23-SCAN-003 | Valid unclaimed QR and active site | Scan | Dedicated success screen shows product, invoice/QR reference, points, balance, site, actor, next actions | PARTIAL |
| P23-SCAN-004 | Already claimed QR | Scan | Dedicated already-scanned screen with recovery actions; no points credited | PARTIAL |
| P23-SCAN-005 | Expired/invalid/replaced QR | Scan | Dedicated failure screen with correct semantic state; no points credited | PARTIAL |

### History And Balance Book

| Case | State | Action | Expected Outcome | Result |
| --- | --- | --- | --- | --- |
| P23-HIST-001 | Contractor has mixed scan attempts | Search/filter/sort | Full contractor history across sites and Team Member scans is searchable, filterable, sortable | PARTIAL |
| P23-HIST-002 | Team Member has session/site-attributed attempts | Open History | Only permitted Team Member attempts appear | PARTIAL |
| P23-BOOK-001 | Contractor has credits/claims/cancellations/reversals | Search/filter/sort Balance Book | Ledger rows are human-readable and filterable by event type/date/search | PARTIAL |
| P23-BOOK-002 | Open ledger event | Tap row/detail | Detail screen shows source, points delta, balance after, claim/QR reference where relevant | PARTIAL |

### Rewards And Claims

| Case | State | Action | Expected Outcome | Result |
| --- | --- | --- | --- | --- |
| P23-REW-001 | Contractor opens Rewards | View catalog | Reward tiles show image, name, required points, tier/status, progress, gap, Claim ID when chosen | PARTIAL |
| P23-REW-002 | Eligible reward | Tap Get Now | Claim ID is generated, points deducted, status becomes Claim Raised, balance refreshes | PENDING |
| P23-REW-003 | Claim Raised reward | Cancel before delivered | Claim ID ceases to exist, points restore, history records cancellation | PENDING |
| P23-REW-004 | Delivered reward | View history | Delivered state is historical and cannot be undone by contractor | PENDING |

### Team Member Limited Flow

| Case | State | Action | Expected Outcome | Result |
| --- | --- | --- | --- | --- |
| P23-TM-001 | Team Member logged in | View landing | Shows contractor name/mobile/photo, selected site, scan CTA, permitted history, session note | PARTIAL |
| P23-TM-002 | Team Member logged in | Inspect tabs/actions | No rewards, balance, tier progress, analytics, or site management visible | PARTIAL |
| P23-TM-003 | Team Member scans successfully | View result/history | Success is scan-success only; no contractor balance or reward data leaks | PARTIAL |

## Current Output Eval Verdict

Current verdict: `PARTIAL`

Reason: Phase 23A passed and Phase 23B has automated proof, but broad Phase 23 product workflow completion depends on the remaining waves and visible/native evidence.

## Evidence Log

### 2026-07-09 - Phase 23A/23B/23C Automated Evidence

- `npm run test --workspace @volt-rewards/mobile` passed with 11 tests.
- Added deterministic tests that production/non-dev builds hide mock OTP and manual QR fallback.
- Added deterministic tests that featured rewards exclude delivered rewards and prioritize Claim Raised, Get Now, then nearest Locked rewards.
- Dashboard points card now navigates to Balance Book, lifetime/tier card navigates to Rewards, selected-site strip navigates to Sites, and recent activity navigates to History.
- Site flow now uses list/detail/form stack screens instead of one embedded list+form panel.
- Contractor site form can create/edit and returns to Site Detail after save.
- Contractor site detail can select active site, edit active site, and archive active site.
- Team Member site surfaces stay read-only for management actions.

Residual:

- Visible dashboard navigation and compact layout proof remains required.
- Site create/edit/archive API/database readback remains required through visible/manual UAT or API smoke.

### 2026-07-09 - Phase 23D Automated Evidence

- `npm run test --workspace @volt-rewards/mobile` passed with 13 tests.
- Scan success and failure now navigate to dedicated stack result screens for Contractor and Team Member.
- Contractor scan success can show points and balance.
- Team Member scan success hides points and balance and shows scan-recorded copy.
- Failure result screen carries site context where available.

Residual:

- Native camera surface remains planned.
- Product/invoice enrichment depends on scan API/read model expansion or existing scan history data.
- Visible scan result UAT and persisted scan readback remain required.

### 2026-07-09 - Phase 23E Scan History Automated Evidence

- `npm run test --workspace @volt-rewards/mobile` passed with 16 tests.
- Added local scan history search over product SKU, QR reference, site, Team Member mobile, and result.
- Added local scan history filters for All, Success, Failed, Contractor, and Team Member.
- Added local scan history sorting for Latest, Product, and Points high.
- Existing history scope helper still enforces Contractor full-history and Team Member scoped-history descriptions.

Residual:

- Visible history interaction proof remains required.
- Backend query expansion is not yet required for current local result size, but should be revisited if history volume grows.
- Balance Book search/filter/sort remains pending.

### 2026-07-09 - Phase 23E Balance Book Automated Evidence

- `npm run test --workspace @volt-rewards/mobile` passed with 19 tests.
- Added local Balance Book search over ledger type, source, claim ID, reward name, and QR unit reference.
- Added local Balance Book filters for All, Credits, Reward claims, Reward cancellations, QR reversals, and Reward revocations.
- Added local Balance Book sorting for Latest, Oldest, Points high, and Points low.
- Added Hindi/English copy for Balance Book search, filters, and sort labels.
- Fixed revocation matching to accept both `REVOK*` and `REVOC*` ledger type variants after the automated test exposed the gap.

Residual:

- Visible Balance Book interaction proof remains required.
- Balance Book row/detail screen has later automated proof; visible proof remains required.
- Backend query expansion is not yet required for current local result size, but should be revisited if ledger volume grows.

### 2026-07-09 - Phase 23E Detail Screen Automated Evidence

- `npm run test --workspace @volt-rewards/mobile` passed with 19 tests.
- Scan History rows are now pressable and route to a Scan detail screen.
- Contractor Scan detail can show attempt ID, scan time, actor, site, product, QR code/unit, points, status, and failure reason.
- Team Member Scan detail uses the same screen but does not expose points because the session role gates the points row.
- Balance Book rows are now pressable and route to a Ledger detail screen.
- Ledger detail shows ledger entry ID, created time, event type, points delta, balance after, source type/reference, reward, claim ID, reward claim ID, QR unit, and negative-balance marker where applicable.
- Added Hindi/English copy for detail-screen labels and empty states.

Residual:

- Visible tap-through proof remains required for Scan History and Balance Book rows.
- Native compact-screen layout review remains required before Phase 23E can pass.

### 2026-07-09 - Phase 23F Rewards Catalog Automated Evidence

- `npm run test --workspace @volt-rewards/mobile` passed with 20 tests.
- Added deterministic reward catalog sectioning for Available rewards, Claim Raised rewards, and Delivered rewards.
- Rewards screen now renders real tabs for Available, Claim Raised, and Delivered instead of a static Claims label.
- Active rewards exclude Delivered rewards; Delivered rewards move into the Delivered tab.
- Reward tiles include image/fallback visual, reward name, description/value, required points, status, progress, gap, and Claim ID when chosen.
- Reward detail now shows required points, tier, balance-after-claim for eligible rewards, points needed for locked rewards, points spent and cancel cutoff for Claim Raised rewards.
- Reward claim/cancel actions now set specific in-screen notices after API success and refresh rewards/balance book.

Residual:

- `npm run test --workspace @volt-rewards/api` passed with 87 tests, proving current API build/controller/domain regressions are clean, but not replacing live claim/cancel readback.
- Claim creation/cancellation API/database readback remains required through visible/manual UAT or API smoke.
- Visible rewards tab/detail layout proof remains required.
- Delivered reward immutability remains to be verified in the rewards detail path.

### 2026-07-09 - Phase 23G Team Member Limited Flow Automated Evidence

- `npm run test --workspace @volt-rewards/mobile` passed with 20 tests.
- Team Member login now states that OTP is required every session.
- Recent contractor remains a single stored contractor with Use and Clear controls after successful login.
- Team Member landing now shows contractor identity, selected site context, session-limit note, site selection action, allowed Scan History action, promotion, and logout.
- Team Member tab shell still exposes only Scan and History; no Rewards or Balance Book tabs are present.
- Team Member site action routes to the existing read-only site selector/detail behavior.
- Team Member scan success remains gated through `shouldShowScanPoints("TEAM_MEMBER") === false`.
- Scan target, dashboard scan CTA, scan result thumbnail, and dashboard quick actions now use drawn glyphs instead of text-badge placeholders.

Residual:

- Visible no-leak proof remains required for Team Member tabs/actions/details.
- Team Member OTP login and recent contractor behavior still need manual/live UAT.

### 2026-07-09 - Phase 23H Final Automated Gate Evidence

- `npm run test --workspace @volt-rewards/mobile` passed with 20 tests after the Phase 23G glyph cleanup.
- `npm run test --workspace @volt-rewards/api` passed with 87 tests during Phase 23F verification.
- `git diff --check` passed for the touched Phase 23 mobile/eval/status files.
- Focused search found no remaining mobile `QR`, `CT`, `TM`, or quick-code text badge placeholders in rendered JSX.

Residual:

- Manual/visible UAT remains required before Phase 23 can be called complete.
- Native iOS/Android validation remains required before any store-ready/public-launch claim.
- Live claim/cancel, OTP/recent-contractor, site mutation, and scan readback smoke tests remain pending.

### 2026-07-10 - Manual Mobile UAT Result

Manual UAT source: `.planning/v1-agentic-build/Mobile_App_ManualUAT`  
Triage: `.planning/v1-agentic-build/MOBILE_APP_MANUAL_UAT_TRIAGE.md`

Result:

- Phase 23 output eval is `FAIL/PARTIAL` for product completion.
- Automated tests did not catch several visible or workflow-level blockers.

Blocking output gaps:

- End-user Scan QR must become the `DEC-050` site-first persistent reserved-cart workflow before product completion.
- Reward tiles truncate essential content at mobile width.
- Promotion banner copy sits on the image and must be separated or given an approved image-safe treatment.
- Contractor profile photo set/edit/remove is missing.
- `History` must become `Scan History` and show actor/source without placeholder avatar noise.
- Scan Details need uniform fields across attempt types and must not show failed/already-claimed attempts as credited points.
- Rewards available points and lifetime totals require ledger reconciliation proof.

Required next eval additions:

- Add scan batch/cart output cases against `DEC-050`: reserve valid QR server-side, exclude failed scans from cart, persist cart across app visits, allow high-value QR reservation above 1000 points, guard navigation away from Scan when reserved items exist, and credit only through `Add to account`.
- Add points reconciliation output cases for scan credit, reward claim, reward cancellation, QR reversal, stale claim, and negative balance.
- Add visible reward tile and scan-history screenshot checks across the mobile viewport matrix.
