# Phase 26C Plan - Fresh Scan Site Selection

Status: Complete - Output And Trajectory PASS
Created: 2026-07-15
Parent phase: `PHASE_26_CLIENT_DEMO_2_ALIGNMENT_PLAN.md`

## Goal

Tighten the end-user mobile Scan QR workflow so every Contractor and Team Member scan batch starts with an explicit site choice, scanner controls stay hidden until a site is selected, and successful `Add to account` clears the active scan-site selection for the next batch without breaking retryable reserved-cart behavior.

## Source Requirements

- `SITE-014`
- `SITE-015`
- `SCAN-024`
- Existing related requirements: `SCAN-013`, `SCAN-018`, `SCAN-019`
- Durable decisions: `DEC-050`, `DEC-051`

## Scope

Included:

- Contractor Scan QR entry from Dashboard or bottom tab starts with no selected scan site when there is no reserved cart requiring retry.
- Team Member Scan QR entry starts with no selected scan site when there is no reserved cart requiring retry.
- Scanner/manual QR entry controls and scan-frame treatment remain hidden until a site is explicitly selected.
- Batch scanning remains allowed after selecting a site.
- Successful `Add to account` clears the selected scan site and removes the ready-to-add cart surface from the active scan workflow.
- Technical `Add to account` failure keeps the selected site and retryable reserved cart items available.
- Mobile tests cover scan-site reset and reserved-cart presentation helpers.

Excluded:

- Phase 26B ItemCodes point-rule implementation.
- Native camera implementation; local dev manual QR entry remains a runtime-gated scanner substitute.
- Native iOS/Android device validation; Expo Web viewport proof is required here and native validation remains a launch hardening residual.

## Open Questions

Relevant questions from `OPEN_QUESTIONS.md`:

- Contractor and Team Member fresh scan-site selection: resolved for Phase 26 in `OPEN_QUESTIONS.md` and `DEC-051`.
- ItemCodes `% of Price` and permissions: blocking for Phase 26B only; not in this slice.

Blocking before implementation:

- None for Phase 26C.

Needed before phase completion:

- Verify through visible controls that scan-site selection resets on Scan entry and after successful `Add to account`.

Safe to defer with explicit assumption:

- Native camera/device proof remains deferred to store-readiness/native validation because Phase 26C changes workflow state, not camera capability.

User decisions recorded:

- Use Client Demo 2 rule exactly: no default scan-site selection on each Scan QR entry; clear selected scan site after `Add to account`.

## Spec-To-Eval Criteria

BDD/state-action-outcome scenarios:

- Given a Contractor has an active site selected elsewhere, when they enter Scan QR from Dashboard, then no site is selected in Scan and scanner/manual QR controls are hidden until they choose a site.
- Given a Contractor selects a site in Scan QR, when they scan one or more valid QR tokens, then the same site remains selected for the current batch and the reserved cart is visible.
- Given reserved cart items exist, when the user tries to leave Scan, then the navigation guard asks them to `Add to account` or stay.
- Given `Add to account` succeeds, when the user returns to Scan, then the selected scan site is cleared and the next batch requires a fresh site choice.
- Given `Add to account` fails technically, when the error returns, then the selected site and reserved cart remain available for retry.
- Given a Team Member enters Scan QR, then the same fresh site-selection and hidden-scanner behavior applies, while Team Member point values remain hidden.

Business invariants:

- A scan batch is always scoped to the explicit site selected for that batch.
- Reserved cart items are not credited until `Add to account`.
- Failed scans do not enter the cart.
- Successful commit clears only UI site selection for the next batch; it does not erase committed ledger/history readback.

Role/permission invariants:

- Contractor can select their own active sites and see cart point totals.
- Team Member can select only allowed active contractor sites and does not see point totals.
- No client-only authorization changes are introduced; backend scan and commit authorization remain authoritative.

Data persistence/readback invariants:

- Successful scan reservation still persists a reserved cart item tied to the selected site.
- Successful commit still persists ledger/history/balance changes and returns updated contractor points.
- Commit failure leaves server cart retryable.

UI/UX acceptance criteria:

- Scan screen shows site chooser first.
- Scanner/manual QR controls are not visible when no active site is selected.
- Current selected-site copy shows no active site before selection.
- `Add to account` success message appears, but the next batch requires a new site selection.
- Text fits in supported mobile viewport widths.

Security acceptance criteria:

- No point crediting is moved to client code.
- No bypass of backend site ownership checks.
- No new secret, dependency, or production dev fallback is introduced.

Explicit non-goals:

- Do not implement ItemCodes.
- Do not implement production camera scanning.
- Do not change QR reward calculation.

## UI Experience Contract

- Surface: End-user mobile app (`apps/mobile`) Scan QR workflow.
- Persona: Contractor and Team Member.
- Primary job: Select the correct active site, scan one or more product QR labels into a reserved cart, then add the batch to the account.
- Screen map: Contractor `Dashboard` -> `Scan` tab -> scan result stack screens -> back to `Scan`; Team Member `Scan` tab -> scan result stack screens -> back to `Scan`.
- Entry path: Contractor Dashboard `Scan QR`, Contractor bottom Scan tab, Team Member default Scan tab, Team Member bottom Scan tab.
- Navigation/back behavior: leaving Scan with reserved cart items shows guard; success result returns to the same batch until `Add to account`; successful commit clears selected site for the next batch.
- Dashboard impact: Contractor dashboard may still show selected/manage-site context outside Scan, but entering Scan does not inherit it as an active scan site.
- Primary action: Select site, scan QR, `Add to account`.
- Secondary actions: stay on Scan from guard, scan another QR, view Scan History.
- Data shown: contractor identity, selected site label after selection, reserved cart count, point totals for Contractor only, QR identifiers, reserved timestamps.
- Data identity source: `StoredSession.contractor`, `SiteSummary`, `ScanCartSummary`, `ScanReservationResult`, `CommitScanCartResult`.
- Asset strategy: No new visual assets; existing scan icon/card patterns remain.
- Empty/loading/success/error/denied states: no-site prompt, Team Member no-site notice, cart commit success card, scan failure result, technical commit failure retry.
- Role differences: Contractor sees points; Team Member sees reserved/cart state without points.
- Reference inputs used: `CLIENT_DEMO_2_TRIAGE.md`, `FRONTEND_EXPERIENCE_STANDARD.md`, `PRODUCT_GRADE_PLATFORM_STANDARD.md`, `APPROVED_STITCH_UI_CONTRACT.md`.
- Mobile/desktop layout expectations: Expo Web phone shell; viewport matrix `360x740`, `390x844`, `430x932`, `480x900`.
- Persistence/API readback after mutation: API scan reservation, cart readback, commit response, scan history/balance refresh.
- Exact UAT URL/device target: `http://127.0.0.1:3002` Expo Web mobile shell, plus API at `http://127.0.0.1:3000`.

## Architecture Touchpoints

- Domain services: no domain rule changes expected.
- API routes: no route changes expected; continue using `/api/scan/qr`, `/api/scan/cart`, `/api/scan/cart/commit`.
- Database tables: no schema changes expected.
- UI surfaces: `apps/mobile/App.tsx`; optional helper/test files under `apps/mobile/src`.
- Background jobs: N/A.
- Audit events: existing scan/commit audit behavior remains unchanged.

## Tests And Evals

- Unit: mobile helper tests for scan-site entry reset and reserved-cart item presentation.
- Integration: existing API/mobile tests for scan cart and site scope.
- API contract: existing scan/cart API contracts remain.
- UI/E2E: Expo Web visible-control proof for Contractor and Team Member Scan QR site reset.
- Frontend experience quality: review against site-first scanning and mobile viewport fit.
- Product-grade platform review: verify batch/cart, data identity, and Team Member restriction behavior.
- Output eval: update `evals/phase26/OUTPUT_EVAL.md`.
- Trajectory eval: update `evals/phase26/TRAJECTORY_EVAL.md`.
- Browser workflow UAT:
  - Exact URL(s): `http://127.0.0.1:3002`.
  - Browser profile matrix: clean isolated Playwright browser context.
  - Persona/actor context: Contractor `9000001001` / MPIN `1234`; Team Member contractor mobile `9000001001`, team mobile `9000011111`, mock OTP from API.
  - Hydration/console/network check: no framework overlays; record console/network residuals.
  - Visible-control interaction proof: use visible login, site choice, QR token/manual dev entry, and `Add to account` controls.
  - Upload controls: N/A.
  - Happy path: select site -> scan/reserve -> Add to account -> fresh site required.
  - Edit/update path: N/A.
  - Delete/deactivate/cancel path: N/A.
  - Denied/read-only role path: Team Member no points, no site-management actions.
  - Persistence checks after mutation: API cart/history/balance readback after scan/commit.
  - Desktop/mobile layout checks: required phone viewport matrix.
- Security: no client-only auth; backend site/cart checks unchanged.
- Manual review: final screenshots stored under `evals/phase26/screenshots/`.

## Implementation Tasks

- [x] Update Phase 26 status docs for Phase 26A PASS, Phase 26B pending-at-the-time, Phase 26C in progress.
- [x] Add testable scan-site workflow helpers.
- [x] Reset selected scan site on fresh Scan tab/workflow entry when no reserved cart is active.
- [x] Hide scanner/manual QR controls until a site is selected.
- [x] Clear active scan-site selection after successful `Add to account`.
- [x] Keep selected site and reserved cart on technical commit failure.
- [x] Add/update automated tests.
- [x] Run mobile/API regression tests relevant to Phase 26C; Admin Web remains covered by Phase 26A and was not changed in this slice.
- [x] Complete Expo Web visible proof and update eval docs.

## Exit Gates

- [x] Requirement IDs satisfied.
- [x] Phase-relevant open questions were brought forward before implementation.
- [x] User decisions or explicit assumptions were recorded.
- [x] UI experience contract completed.
- [x] Spec-to-eval criteria written before implementation.
- [x] Frontend experience quality gate completed.
- [x] Product-grade platform gate completed.
- [x] Mobile screen map, navigation/back behavior, and dashboard impact documented.
- [x] User-facing seed/mock/UAT data remains realistic.
- [x] Tests pass.
- [x] Browser workflow UAT completed for Contractor and Team Member Scan QR.
- [x] Browser UAT exercised visible controls directly.
- [x] Exact user-facing local URL was tested.
- [x] Browser console/network/hydration failures were checked.
- [x] Successful scan and commit verified through API readback.
- [x] Denied/restricted Team Member path tested.
- [x] Output eval completed.
- [x] Trajectory eval completed.
- [x] Security/eval gate completed.
- [x] Residual risks documented.

## Completion Notes

- Automated verification passed on 2026-07-15: mobile 23/23, API 97/97, and `git diff --check`.
- Browser proof passed through `tools/phase26c-mobile-scan-site-proof.mjs` against API `http://127.0.0.1:3000` and Expo Web `http://127.0.0.1:3002`.
- Proof used visible Contractor and Team Member login controls, visible site choice, visible QR token entry, visible `Add to account`, a forced technical commit failure, viewport matrix screenshots, API scan-history readback, and console/runtime checks.
- Evidence is recorded in `evals/phase26/OUTPUT_EVAL.md`, `evals/phase26/TRAJECTORY_EVAL.md`, `evals/phase26/screenshots/phase26c-proof.json`, and Phase 26C screenshots.
- Residual risk: native camera/device proof remains deferred to store-readiness/native validation because Phase 26C changed workflow state, not camera capability.
- Follow-up note: Phase 26B ItemCodes was subsequently completed on 2026-07-15 after `% of Price` and permission questions were resolved.
