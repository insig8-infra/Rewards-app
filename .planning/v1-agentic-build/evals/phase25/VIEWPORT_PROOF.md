# Phase 25 Viewport Proof - Mobile UAT Remediation

Status: Pass - Phase 25B Cart Foundation, Phase 25C End-User Visual Remediation, Phase 25D Admin Mobile Wave 1, Phase 25E End-User UAT2A Corrections, And Phase 25F Admin Mobile Parity  
Date: 2026-07-10, updated 2026-07-12

## Scope

Viewport proof covers:

- Phase 25B End-User Mobile Scan tab after site-first/cart UI changes.
- Phase 25C End-User Mobile Home/Promotion, Rewards, History, and Profile visual remediation.
- Phase 25D Admin Mobile Login, Dashboard, Rewards Claim Desk, and Rewards Catalog IA remediation.
- Phase 25E End-User Mobile selected-site Dashboard, reserved Scan cart, reserved-cart navigation guard, cart commit success, and Team Member no-site guidance.
- Phase 25F Admin Mobile OWNER contractor registration/detail actions, OWNER reports landing/preview, OWNER staff management, and STAFF contractor read-only detail.

Tested widths:

- `360x740`
- `390x844`
- `430x932`
- `480x900`

## Evidence Captured

Screenshots:

- `screenshots/phase25b-scan-cart-360x740.png`
- `screenshots/phase25b-scan-cart-390x844.png`
- `screenshots/phase25b-scan-cart-430x932.png`
- `screenshots/phase25b-scan-cart-480x900.png`
- `screenshots/phase25c-promo-360x740.png`
- `screenshots/phase25c-promo-390x844.png`
- `screenshots/phase25c-promo-430x932.png`
- `screenshots/phase25c-promo-480x900.png`
- `screenshots/phase25c-rewards-360x740.png`
- `screenshots/phase25c-rewards-390x844.png`
- `screenshots/phase25c-rewards-430x932.png`
- `screenshots/phase25c-rewards-480x900.png`
- `screenshots/phase25c-history-360x740.png`
- `screenshots/phase25c-history-390x844.png`
- `screenshots/phase25c-history-430x932.png`
- `screenshots/phase25c-history-480x900.png`
- `screenshots/phase25c-profile-360x740.png`
- `screenshots/phase25c-profile-390x844.png`
- `screenshots/phase25c-profile-430x932.png`
- `screenshots/phase25c-profile-480x900.png`
- `screenshots/phase25d-login-360x740.png`
- `screenshots/phase25d-login-390x844.png`
- `screenshots/phase25d-login-430x932.png`
- `screenshots/phase25d-login-480x900.png`
- `screenshots/phase25d-dashboard-360x740.png`
- `screenshots/phase25d-dashboard-390x844.png`
- `screenshots/phase25d-dashboard-430x932.png`
- `screenshots/phase25d-dashboard-480x900.png`
- `screenshots/phase25d-rewards-360x740.png`
- `screenshots/phase25d-rewards-390x844.png`
- `screenshots/phase25d-rewards-430x932.png`
- `screenshots/phase25d-rewards-480x900.png`
- `screenshots/phase25d-rewards-catalog-360x740.png`
- `screenshots/phase25d-rewards-catalog-390x844.png`
- `screenshots/phase25d-rewards-catalog-430x932.png`
- `screenshots/phase25d-rewards-catalog-480x900.png`
- `screenshots/phase25e-contractor-dashboard-selected-360x740.png`
- `screenshots/phase25e-contractor-dashboard-selected-390x844.png`
- `screenshots/phase25e-contractor-dashboard-selected-430x932.png`
- `screenshots/phase25e-contractor-dashboard-selected-480x900.png`
- `screenshots/phase25e-contractor-scan-cart-360x740.png`
- `screenshots/phase25e-contractor-scan-cart-390x844.png`
- `screenshots/phase25e-contractor-scan-cart-430x932.png`
- `screenshots/phase25e-contractor-scan-cart-480x900.png`
- `screenshots/phase25e-contractor-cart-guard-360x740.png`
- `screenshots/phase25e-contractor-cart-guard-390x844.png`
- `screenshots/phase25e-contractor-cart-guard-430x932.png`
- `screenshots/phase25e-contractor-cart-guard-480x900.png`
- `screenshots/phase25e-contractor-commit-success-360x740.png`
- `screenshots/phase25e-contractor-commit-success-390x844.png`
- `screenshots/phase25e-contractor-commit-success-430x932.png`
- `screenshots/phase25e-contractor-commit-success-480x900.png`
- `screenshots/phase25e-team-no-site-360x740.png`
- `screenshots/phase25e-team-no-site-390x844.png`
- `screenshots/phase25e-team-no-site-430x932.png`
- `screenshots/phase25e-team-no-site-480x900.png`
- `screenshots/phase25e-proof.json`
- `screenshots/phase25f-owner-contractors-registration-360x740.png`
- `screenshots/phase25f-owner-contractors-registration-390x844.png`
- `screenshots/phase25f-owner-contractors-registration-430x932.png`
- `screenshots/phase25f-owner-contractors-registration-480x900.png`
- `screenshots/phase25f-owner-contractor-detail-actions-360x740.png`
- `screenshots/phase25f-owner-contractor-detail-actions-390x844.png`
- `screenshots/phase25f-owner-contractor-detail-actions-430x932.png`
- `screenshots/phase25f-owner-contractor-detail-actions-480x900.png`
- `screenshots/phase25f-owner-reports-landing-360x740.png`
- `screenshots/phase25f-owner-reports-landing-390x844.png`
- `screenshots/phase25f-owner-reports-landing-430x932.png`
- `screenshots/phase25f-owner-reports-landing-480x900.png`
- `screenshots/phase25f-owner-report-preview-360x740.png`
- `screenshots/phase25f-owner-report-preview-390x844.png`
- `screenshots/phase25f-owner-report-preview-430x932.png`
- `screenshots/phase25f-owner-report-preview-480x900.png`
- `screenshots/phase25f-owner-staff-management-360x740.png`
- `screenshots/phase25f-owner-staff-management-390x844.png`
- `screenshots/phase25f-owner-staff-management-430x932.png`
- `screenshots/phase25f-owner-staff-management-480x900.png`
- `screenshots/phase25f-staff-contractor-readonly-360x740.png`
- `screenshots/phase25f-staff-contractor-readonly-390x844.png`
- `screenshots/phase25f-staff-contractor-readonly-430x932.png`
- `screenshots/phase25f-staff-contractor-readonly-480x900.png`
- `screenshots/phase25f-admin-mobile-proof.json`

Observed pass:

- Scan tab opens at supported mobile widths.
- Site chip is visible and does not overflow.
- Scan controls are withheld until explicit site selection.
- Site-first guard copy is visible: `Select a site to start scanning.`
- Text remains inside visible card boundaries in the captured pre-selection state.
- After explicit site selection, a server-reserved cart renders on the Scan tab.
- The cart card shows `SCAN CART`, `Ready to add`, `Reserved in cart`, and copy controls.
- API readback after scan showed one reserved item and `100` pending points in the cart before UI screenshots were captured.

Runtime correction:

- Initial post-selection proof failed because the live Supabase-backed database had not been migrated for `ScanCart` / `ScanCartItem`.
- `GET /api/scan/cart` returned `500` with `public.ScanCart does not exist`.
- Added and applied migration `202607100001_scan_cart_persistence`.
- Re-ran the API cart readback and viewport proof after the migration.

Phase 25C observed pass:

- Promotion title/body render outside the image on the Home screen.
- Rewards tab opens at supported mobile widths and shows screen identity, points context, reward status, image, title, required-points/tier boxes, and progress/gap copy.
- Scan History tab opens at supported mobile widths and shows readable rows with product/reference, site, actor, date/time, status, and point meaning.
- Profile screen opens at supported mobile widths and shows the native Expo Web file input plus `Save photo` and `Remove photo` controls.
- Contractor profile photo API readback confirmed the saved image value reloads in the contractor session.

Phase 25C assertion summary:

- `360x740`: promotion, rewards, history, profile controls all passed.
- `390x844`: promotion, rewards, history, profile controls all passed.
- `430x932`: promotion, rewards, history, profile controls all passed.
- `480x900`: promotion, rewards, history, profile controls all passed.

Phase 25D observed pass:

- Login screen shows icon-style PIN reveal with no visible `Show` / `Hide` text.
- Dashboard opens as a command surface with primary Return Scan action, tappable metrics, OWNER controls, and non-truncated bottom-tab labels.
- Rewards opens with Claim Desk, History, and Catalog section switcher.
- Catalog section is reachable from the Rewards section switcher and shows catalog management controls.

Phase 25D assertion summary:

- `360x740`: login PIN icon, dashboard command surface, rewards switcher, and catalog section all passed.
- `390x844`: login PIN icon, dashboard command surface, rewards switcher, and catalog section all passed.
- `430x932`: login PIN icon, dashboard command surface, rewards switcher, and catalog section all passed.
- `480x900`: login PIN icon, dashboard command surface, rewards switcher, and catalog section all passed.

Phase 25E proof attempt:

- API and mobile web servers were restarted/rechecked for manual UAT.
- API health returned `ok` at `http://127.0.0.1:3000/api/health`.
- Mobile web returned `200 OK` at `http://127.0.0.1:3002`.
- Contractor login API readback succeeded for `Ramesh Sharma` using the documented test login `9000001001 / 1234`.
- Visible viewport proof was not accepted because browser automation was unavailable: in-app Browser returned `Browser is not available: iab`, and fallback Playwright returned `Transport closed`.
- Phase 25E was later completed on 2026-07-12 using short-lived headless Chrome/CDP via `node tools/phase25e-visible-proof.mjs`.

Phase 25E observed pass:

- Contractor selected-site Dashboard showed `Selected site and site management`, `Mr. Mehta`, and `Scan QR`.
- Contractor reserved Scan cart showed `Scan cart`, `Ready to add`, `Reserved in cart`, and `Add to account`.
- Reserved-cart navigation guard showed `Add reserved points first`, `Add to account`, and `Stay on Scan`.
- Cart commit success showed `Points added to account`.
- Team Member no-site guidance showed `Logged in for contractor`, `Mahesh Patil`, `No site available`, and `Ask the contractor to create a site first.`
- Runtime console assertion passed with no console errors or runtime exceptions captured.

Phase 25E assertion summary:

- `360x740`: selected-site Dashboard, reserved cart, cart guard, commit success, and Team Member no-site guidance passed.
- `390x844`: selected-site Dashboard, reserved cart, cart guard, commit success, and Team Member no-site guidance passed.
- `430x932`: selected-site Dashboard, reserved cart, cart guard, commit success, and Team Member no-site guidance passed.
- `480x900`: selected-site Dashboard, reserved cart, cart guard, commit success, and Team Member no-site guidance passed.

Phase 25F observed pass:

- OWNER Contractors screen showed `Register contractor`, `Directory`, and `Upload photo`.
- OWNER contractor registration created a contractor row with the generated mobile number and `points available`.
- OWNER contractor detail showed `Owner actions`, `Upload contractor photo`, `Reset MPIN`, and `Deactivate contractor`.
- OWNER reset MPIN flow showed `Temporary MPIN issued`, `MPIN`, and `Expires`.
- OWNER Reports screen loaded live `Report shortcuts`, `QR status`, and `Contractor leaderboard`.
- OWNER report preview showed `Preview` and `QR status`.
- OWNER Staff management showed `Add staff`, `Staff directory`, and `Create staff`.
- OWNER staff creation showed `Temporary PIN issued`, `Reset PIN`, and `Deactivate`.
- STAFF contractor list showed `Read-only contractor directory`, `cannot register`, and `Directory`.
- STAFF contractor detail showed `Read-only access` and `STAFF cannot edit`.
- Runtime console assertion passed with no console errors or runtime exceptions captured.

Phase 25F assertion summary:

- `360x740`: OWNER contractor registration/detail, reports landing/preview, staff management, and STAFF contractor read-only detail passed.
- `390x844`: OWNER contractor registration/detail, reports landing/preview, staff management, and STAFF contractor read-only detail passed.
- `430x932`: OWNER contractor registration/detail, reports landing/preview, staff management, and STAFF contractor read-only detail passed.
- `480x900`: OWNER contractor registration/detail, reports landing/preview, staff management, and STAFF contractor read-only detail passed.

Residual:

- Native clipboard support is not present yet; copy controls work in Expo Web via `navigator.clipboard` and expose selectable IDs, but native iOS/Android copy requires adding a clipboard module in the native-readiness slice.
- Native iOS/Android image-picker permission flow is not verified yet; Expo Web file input is proof for the development web harness only.
- Browser tool residual remains: in-app Browser was unavailable and Playwright transport was closed. Phase 25E screenshot proof used short-lived headless Chrome/CDP and closed the browser process after completion.

## Tooling Notes

- In-app browser was unavailable: `iab` missing.
- Exposed Playwright transport was closed.
- Headless Chrome/CDP was used as a short-lived fallback and then closed.
- Phase 25E fallback Playwright proof could not start because the MCP transport was closed, so a dedicated short-lived Chrome/CDP proof harness was added at `tools/phase25e-visible-proof.mjs`.
- The first proof attempt also exposed a stale API/dev database mismatch; this is recorded in the Phase 25 learning log and harness docs.
- The first Phase 25C proof attempt clicked by text and mislabeled Home as Rewards/History. The corrected proof used bottom-tab coordinates plus screen-identity assertions before accepting screen-specific checks.
- Phase 25D proof initially passed assertions, but screenshot review exposed truncated bottom-tab labels. Labels were shortened and the full viewport proof was rerun before acceptance.
- Phase 25F proof required elevated local-port permission because sandboxed API startup returned `listen EPERM`; the harness starts updated child API/Admin Mobile servers when needed and closes them after completion.
- Phase 25F proof attempts were corrected to wait for live list data before drilling into contractor detail, preventing false negatives from asynchronous loading.

## API Readback

Post-scan cart readback:

- `cartId`: `cmreoc1kw0007y1rs39ir6q93`
- `siteId`: `seed-site-1`
- `status`: `ACTIVE`
- `cartTotalPoints`: `100`
- `scanCapPoints`: `1000`
- `items.length`: `1`
- Reserved item product: `WIRE-1.5SQMM-RED`
- Reserved item QR value: `100`
- Reserved item status: `RESERVED`

Viewport assertions:

- `360x740`: API cart item count `1`, UI showed `Ready to add`, `Copy`, selected site.
- `390x844`: API cart item count `1`, UI showed `Ready to add`, `Copy`, selected site.
- `430x932`: API cart item count `1`, UI showed `Ready to add`, `Copy`, selected site.
- `480x900`: API cart item count `1`, UI showed `Ready to add`, `Copy`, selected site.

Phase 25C profile-photo readback:

- Contractor: `Ramesh Sharma`
- Result: saved profile photo returned in follow-up contractor login payload.
- Validation path: API update endpoint plus session reload; visible Profile controls captured in viewport proof.

Phase 25D admin readback:

- Admin: `Shishir Mehta`
- Result: OWNER admin login succeeded through `/api/auth/admin/login`; dashboard/rewards screens loaded through the stored Admin Mobile session.

Phase 25E post-proof readback:

- Contractor: `Ramesh Sharma`
- Selected site: `Mr. Mehta`
- Result: after cart commit success, the selected-site cart readback returned `items=0`, `cartTotalPoints=0`, and `status=ACTIVE`.
- Points readback: `availablePoints=2130`, `totalAccumulatedPoints=2980`.

Phase 25F proof readback:

- OWNER admin: `Shishir Mehta`.
- STAFF admin: `Aarti Deshmukh`.
- Generated contractor used in proof: `Vijay Kulkarni`.
- Generated staff used in proof: `Priya Nair`.
- Proof JSON: `screenshots/phase25f-admin-mobile-proof.json`, 24 screenshots, all assertions PASS.

## Verdict

Pass for Phase 25B cart foundation, Phase 25C end-user mobile visual remediation, Phase 25D Admin Mobile Wave 1, Phase 25E End-User UAT2A corrections, and Phase 25F Admin Mobile Contractors/Staff/Reports parity on Expo Web mobile-width proof. Phase 25 overall remains open only for native iOS/Android residual work.
