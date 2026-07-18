# Phase 25 Status - Mobile UAT Remediation And Persistent Scan Cart

Status: In Progress - Phase 25A Complete, Phase 25B Scan Cart Foundation Updated By MANUALUAT2A, Phase 25C End-User Visual Remediation Updated By MANUALUAT2A, Phase 25D Admin Mobile Wave 1 Complete, Phase 25E Complete, Phase 25F Complete  
Started: 2026-07-10  
Owner: Codex

## Current Position

Phase 25 starts from Manual Mobile UAT and `DEC-050`.

Active plan:

- `.planning/v1-agentic-build/PHASE_25_MOBILE_UAT_REMEDIATION_PLAN.md`

Completed first wave:

- Phase 25A - Backend Persistent Scan Cart.

Completed second wave:

- Phase 25B - End-User Mobile Scan Cart UI foundation.

Completed third wave:

- Phase 25C - End-User Mobile Rewards/Profile/Promotions/History visual remediation.

Completed fourth wave:

- Phase 25D Wave 1 - Admin Mobile PIN, Dashboard command surface, OWNER action cards, and Rewards section IA.

New active wave from MANUALUAT2A:

- Phase 25E - End-User Mobile site/scan/cart/team-member corrections. Implementation and visible viewport proof complete.

Completed Admin Mobile parity wave:

- Phase 25F - Admin Mobile Contractors/Staff/Reports parity remediation. Implementation and visible viewport proof complete.

Remaining wave:

- Native iOS/Android residual proof for mobile-only capabilities.
- Client Demo 2 Phase 26C extension is complete; fresh scan-site selection and post-commit deselection now have Phase 26 output/trajectory proof.
- Remaining visual/native readiness closure is routed to Phase 27.

## Decisions Applied

- `DEC-050`: site-first persistent reserved cart before points credit.
- Failed scans do not enter cart.
- Points credit happens only on `Add to account`.
- MANUALUAT2A supersedes the earlier 1000-point cart cap. The cart has no point-value cap for v1; navigation away from Scan is guarded while reserved items exist.
- MANUALUAT2A supersedes the earlier rupee-equivalent reward display. End-user QR/reward/balance copy uses points.
- Scan History rows stay readable with full IDs in detail/copy.
- Admin Mobile Staff management remains OWNER-only.

## Implementation Evidence - 2026-07-10

Phase 25A backend/domain/API:

- Added `RESERVED_IN_CART` QR state and persistent `ScanCart` / `ScanCartItem` data model.
- Split scan flow so `POST /scan/qr` reserves, `GET /scan/cart` reads the persistent cart, and `POST /scan/cart/commit` credits points.
- Scan history now carries QR value and credited points separately.
- Earlier 1000-point cart cap implementation is now superseded by MANUALUAT2A and must be removed/disabled in Phase 25E.

Phase 25B mobile foundation:

- End-user mobile API types now distinguish scan reservation from cart commit.
- Mobile scan screen now loads the active site cart, shows reserved items, and uses `Add to account` before balance changes.
- Silent default site selection has been removed; scan controls appear only after the user selects an active site.
- Client Demo 2 later tightens this behavior: Scan QR must start with no active scan-site selected on every visit, not merely avoid silent first-site auto-selection on first load.
- Cart UI shows pending points and retry guidance if `Add to account` fails. Earlier cart capacity progress is now superseded by MANUALUAT2A.
- Cart item cards show product/reference, QR value, credited-points-zero state, reserved time, QR unit ID, scan attempt ID, and copy controls.
- Reservation success screen no longer implies points were credited.
- History rows/details can show reserved state, QR value, and credited points separately.
- Added Prisma migration `202607100001_scan_cart_persistence` for `ScanCart`, `ScanCartItem`, reserved QR state, scan result values, and scan attempt point fields.
- Applied the migration to the configured Supabase Postgres dev database with `npm run prisma:migrate:deploy --workspace @volt-rewards/api`.
- Viewport proof captured the selected-site cart card at `360x740`, `390x844`, `430x932`, and `480x900`.
- Runtime API readback before screenshots showed one reserved cart item and `100` pending cart points.

Automated verification:

- `npm run test --workspace @volt-rewards/domain` - PASS, 38/38.
- `npm run test --workspace @volt-rewards/api` - PASS, 90/90.
- `npm run test --workspace @volt-rewards/mobile` - PASS, 20/20.
- `git diff --check` - PASS.

Visible proof:

- `.planning/v1-agentic-build/evals/phase25/VIEWPORT_PROOF.md` - PASS for Phase 25B cart foundation.
- Browser tooling residual: in-app Browser was unavailable and Playwright transport was closed, so proof used short-lived headless Chrome/CDP.

Phase 25C end-user visual remediation:

- Added contractor self-service profile photo persistence via `POST /api/auth/contractor/profile-photo`.
- Profile photo update validates PNG/JPEG data URLs under 2 MB, persists `User.photoUrl`, reloads contractor session data, and records audit events for update/remove.
- End-user mobile Profile now exposes set/change/remove controls with preview and API save/remove actions.
- Promotion banner copy now renders outside the image, so dashboard readability is not controlled by image contrast.
- Reward tiles now use stable image/title/status/meta/progress/gap zones, preserving essential copy at mobile widths.
- Scan History rows/details now show product/reference/site/actor/date-time and distinguish QR value from credited points.
- Viewport proof captured Home/promotion, Rewards, History, and Profile at `360x740`, `390x844`, `430x932`, and `480x900`.
- API readback confirmed `Ramesh Sharma` profile photo persisted and reloaded after login.
- Native iOS/Android image-picker permission flow remains pending before any store-readiness claim.

Phase 25D Admin Mobile Wave 1:

- Added `PHASE_25D_ADMIN_MOBILE_IA_CONTRACT.md` before code changes.
- Replaced text-only Admin Mobile PIN reveal with an icon-style control and accessibility label.
- Added tab glyphs and shortened bottom-tab labels to avoid truncation at phone widths.
- Converted Dashboard primary operation into a tappable Return Scan card.
- Converted Dashboard metrics into tappable workflow cards for Contractors, Claims, Reversed QR, and OWNER staff/report path.
- Converted OWNER controls into navigable action cards; STAFF now gets explicit limited-access actions.
- Split Rewards into mobile sections: Claim Desk, History, and Catalog. OWNER sees all three; STAFF sees History only.
- Viewport proof captured Admin Mobile Login, Dashboard, Rewards Claim Desk, and Rewards Catalog at `360x740`, `390x844`, `430x932`, and `480x900`.
- Proof assertions passed for PIN icon/no Show-Hide text, dashboard command surface, OWNER action cards, reward section switcher, and Catalog section.
- Visual review caught and corrected truncated bottom-tab labels before acceptance.

MANUALUAT2A intake:

- Source UAT: `.planning/v1-agentic-build/Mobile_App_ManualUAT` lines 35-59.
- Added contract: `.planning/v1-agentic-build/PHASE_25E_END_USER_MOBILE_UAT2A_CONTRACT.md`.
- Reopened Phase 25B/25C outputs for end-user mobile because the latest UAT changes the scan/cart contract and identifies remaining site, cart, Team Member, terminology, and visual-quality gaps.
- `P25-CART-003` old cap proof is no longer valid completion evidence for the current requirement.
- High-value 4000-point QR reservation/commit and reserved-cart navigation guard are required before Phase 25 can complete.

Phase 25E implementation:

- Removed backend cart point-cap enforcement from QR scan service, Prisma scan repository, in-memory QR scan repository, and platform testing repository.
- Added API proof that a cart can reserve 700 + 4000 points and commit `4700` points successfully.
- Site list row tap now selects an active site and returns to Dashboard; `View details` is the separate detail action.
- Dashboard selected-site section is renamed as site management/change context, and Scan QR reflects the active selected site.
- Scan cart summary is visually distinct, removes capacity/progress copy, and includes a top `Add to account` shortcut.
- `Add to account` now shows a dedicated points-added success notice with credited points, site, and balance after.
- Top-level tab changes away from Scan are guarded while reserved cart items exist, with `Add to account` and `Stay on Scan` actions.
- Scan History detail for `Reserved` entries now includes an `Add to account` shortcut back to Scan.
- Team Member landing now frames access as `Logged in for contractor`, removes redundant Select Site/Scan History buttons, moves logout into the account header, and replaces internal session copy.
- Team Member scan with no active contractor site now shows contractor-name guidance to ask the contractor to create a site first.
- End-user reward display value now uses points copy from API and mobile fixtures instead of rupee-equivalent display.

Phase 25E verification:

- `npm run test --workspace @volt-rewards/api` - PASS, 91/91.
- `npm run test --workspace @volt-rewards/mobile` - PASS, 20/20.
- `git diff --check` - PASS.
- Static scan of active app/API code found no active `Rs.` reward-point display and no active cart-cap enforcement text. Remaining `Rs.`/cap hits are supersession documentation notes or true money fields.
- Runtime smoke for manual UAT: API is reachable at `http://127.0.0.1:3000/api/health`, mobile web is reachable at `http://127.0.0.1:3002`, and contractor login API readback succeeds for `Ramesh Sharma` (`9000001001`) without leaking test-only names.
- Phase 25E visible proof: `node tools/phase25e-visible-proof.mjs` - PASS using short-lived headless Chrome/CDP after in-app Browser and Playwright MCP remained unavailable.
- Viewport screenshots captured at `360x740`, `390x844`, `430x932`, and `480x900` for selected-site Dashboard, reserved Scan cart, reserved-cart navigation guard, cart commit success, and Team Member no-site guidance.
- Post-proof API readback confirmed Ramesh Sharma's selected-site cart cleared to `0` items and points reconciled to `availablePoints=2130`, `totalAccumulatedPoints=2980` after committing `60` reserved proof points.

Phase 25F Admin Mobile Contractors/Staff/Reports parity:

- Added contract: `.planning/v1-agentic-build/PHASE_25F_ADMIN_MOBILE_PARITY_CONTRACT.md`.
- Added Admin Mobile contractor OWNER actions: register contractor, upload/change photo, reset MPIN, deactivate, and reactivate.
- Added Admin Mobile staff API/UI parity for OWNER: list staff, create staff, upload staff photo, reset staff PIN, deactivate, and reactivate.
- Added Admin Mobile reports API/UI parity for live report landing and phone-readable report preview rows.
- Kept STAFF contractor access read-only with no mutation controls.
- Reused existing backend services and permission guards through thin `admin-mobile` controllers rather than duplicating business logic.
- Added visible proof harness: `tools/phase25f-admin-mobile-proof.mjs`.

Phase 25F verification:

- `npm run test --workspace @volt-rewards/api` - PASS, 94/94.
- `npm run test --workspace @volt-rewards/admin-mobile` - PASS, 4/4.
- `node --check tools/phase25f-admin-mobile-proof.mjs` - PASS.
- `node tools/phase25f-admin-mobile-proof.mjs` - PASS with elevated local-port permission because sandboxed port binding returned `EPERM`.
- Viewport screenshots captured at `360x740`, `390x844`, `430x932`, and `480x900` for OWNER contractor registration, OWNER contractor detail actions, OWNER reports landing, OWNER report preview, OWNER staff management, and STAFF contractor read-only detail.
- Runtime console assertion passed with no console errors or runtime exceptions captured.
- `git diff --check` - PASS.

Harness correction:

- `APPROACH.md` now includes the 2026-07-10 runtime schema drift correction.
- `SECURITY_AND_EVALUATION_PLAN.md` now requires migration/readback evidence for DB-backed output evals.
- `LEARNING_LOG.md` records the schema drift root cause and future prevention rule.
- `LEARNING_LOG.md` also records the Phase 25C proof correction: verify screen identity after navigation before accepting screenshot evidence.

Client Demo 2 intake - 2026-07-14:

- Source: `client_demo_2.md`.
- Phase 25E/25F remain valid for their original UAT contracts.
- New scan-site behavior was routed to Phase 26C and passed on 2026-07-15: Contractor and Team Member Scan QR require a fresh site selection every time the workflow is entered, scanner/frame controls stay hidden until a site is selected, and successful `Add to account` clears active scan-site selection for the next batch.
- Old Phase 25 scan-site PASS evidence remains historical; current stricter proof is in Phase 26C.

Post-Phase 26 route - 2026-07-15:

- Phase 25 remains open only for native iOS/Android residual proof before store-readiness.
- Phase 27 owns the consolidated mobile readiness closure and has now recorded current-code visible proof for end-user login/language/Rewards/Profile/Promotions/Balance Book, scan-site/cart behavior, Admin Mobile Contractors/Staff/Reports, and Admin Mobile login/Rewards OWNER/STAFF role boundaries.
- Fresh active reward-claim fulfillment proof can be repeated in Phase 27 with `MEDIA_STORAGE_MODE=local`; production Supabase Storage quota/spend-cap and upload/readback remain launch gates because the 2026-07-15 proof hit `402 exceed_egress_quota`.

## Phase Assumptions

Proceeding defaults after the questions were brought forward:

- Reserved-cart invalidation shows item-level error and does not credit points.
- Reserved state labels: cart `Ready to add`, history `Reserved`, admin/QR status `Pending_Add_To_Account`.

## Completion Rules

Do not mark Phase 25 complete until:

- [Closed by Phase 26C/27] Mobile UI removes silent default scan-site selection and completes full cart UX polish.
- [Closed by Phase 25E/26C/27] Phase 25E MANUALUAT2A Contractor and Team Member flows pass visible viewport proof.
- [Closed by Phase 25E] The 1000-point cart cap is removed/disabled and high-value QR reserve/commit proof is recorded.
- [Closed by Phase 25E/27] End-user mobile reward/QR/balance terminology uses points, not `Rs.` labels.
- [Closed by Phase 25E/26C/27] Points math is verified by API/database readback.
- [Closed by Phase 25E/26C] Post-selection cart-card viewport-matrix UAT is recorded.
- [Closed by Phase 25C/27] End-user mobile Rewards/Profile/Promotions/History viewport-matrix UAT is recorded.
- [Closed by Phase 25D/27] Admin Mobile PIN/Dashboard/Rewards Wave 1 viewport-matrix UAT is recorded.
- [Closed by Phase 25/27] Output eval and trajectory eval are updated.
- [Closed by Phase 25F/27] Admin Mobile Contractors/Staff/Reports parity is implemented and viewport proofed.
- Native iOS/Android residuals are explicitly recorded before any store-readiness claim.
