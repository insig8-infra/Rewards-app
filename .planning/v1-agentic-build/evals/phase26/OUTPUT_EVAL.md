# Phase 26 Output Eval - Client Demo 2 Alignment

Status: PASS - Phase 26A/26B/26C Gates Passed
Created: 2026-07-14

## Output Cases

| ID | Requirement | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- |
| P26A-INV-001 | `WEB-043` | Invoice Ledger includes Reports-style date range presets plus `From` and `To` fields; filtering is stable and does not shift controls. | PASS | Implemented in `InvoiceLedgerWorkspace.tsx`; browser proof shows `Invoice date range`, `Invoice date from`, and `Invoice date to` controls. Evidence: `screenshots/phase26a-invoice-date-range.png`. |
| P26A-CTR-001 | `WEB-044` | OWNER can add and update contractor `Where they belong to` note; value persists through API/database readback and appears on Contractor Detail. | PASS | Schema migration `202607140001_contractor_belongs_to_note`, API service coverage, Admin Web create/detail UI, configured DB column readback, and browser proof pass. Evidence: `screenshots/phase26a-contractor-belongs-to-new.png`, `screenshots/phase26a-contractor-site-analytics.png`. |
| P26A-CTR-002 | `WEB-045` | Contractor Detail > Sites exposes site-wise analytics with scan count, item/value/points fields, and clear drilldown affordance. | PASS | Rebuilt API returns `qrValuePoints`, `creditedPoints`, and `productSummary`; Admin Web drilldown shows scan attempts, QR value points, credited points, items scanned, city, and area. Evidence: `screenshots/phase26a-contractor-site-analytics.png`. |
| P26A-RWD-001 | `WEB-046`, `WEB-047`, `WEB-048` | Rewards tab refreshes active Claim Desk on open, Reward History has date range, report-style sorting, `Claimed Date/Time`, and `Fulfilled Date/Time`. | PASS | Admin Web reward history controls and 12s claim refresh are implemented; browser proof shows Reward History, Claim Desk, Refresh Claim Requests, Claimed, and Fulfilled labels. Evidence: `screenshots/phase26a-rewards-history-claim-desk.png`. |
| P26A-RWD-002 | `WEB-049` | New Reward normal create flow system-populates Reward Code while CSV keeps code as upsert key. | PASS | `RewardsService system-populates reward code for normal catalog creation` API test passes; Admin Web normal create sends no code for new rewards while CSV keeps code as upsert key. |
| P26A-PROMO-001 | `WEB-050` | Promotions supports horizontal marquee text controls with Hindi-safe font list, bold, italic, and color. | PASS | Promotion schema/API/Admin Web controls implemented with Hindi-safe font family, bold/italic toggles, color, and marquee preview; API/Admin Web tests, configured DB column readback, and browser proof pass. Evidence: `screenshots/phase26a-promotion-marquee-font-controls.png`. |
| P26B-ITEM-001 | `ITEM-001`, `ITEM-002`, `ITEM-003` | Admin Web ItemCodes lists BUSY-sourced item code, name, category, price, `Absolute Points`, `% of Price`, calculated `% of Price Points`, `Final Points`, status, BUSY presence, and last sync. | PASS | Added `ItemCode` schema/migration, BUSY-line ItemCode sync, guarded ItemCodes API, Admin Web route/workspace, derived point fields, and client API tests. Live API refresh created 11 ItemCodes; STAFF list returned 11 rows; authenticated `/item-codes` route and proxy returned 200. |
| P26B-ITEM-002 | `ITEM-004`, `ITEM-005` | OWNER can edit exactly one reward rule per ItemCode; STAFF is read-only; invalid both-rule/blank/negative payloads are rejected and valid edits are audited. | PASS | Domain exact-one validation and permission tests pass; API controller uses `ADMIN_MANAGE_ITEM_CODES`; Admin Web disables edit/refresh for STAFF. Live STAFF reward-rule `PATCH` returned 403. |
| P26B-ITEM-003 | `ITEM-006`, `ITEM-007`, `RWD-023` | QR print resolves points from ItemCodes using `Absolute Points` or latest synced ItemCode `Price * percent / 100`, freezes the resolved value on printed QR units, and labels the printed QR as `Collect X points`. | PASS | `qr-print-flow.test.ts` covers absolute-point print, later percent-of-price rule change, new print using percent value, and earlier printed QR preserving its frozen value. Domain item-code point-resolution tests pass; Admin Web print batch now renders `Collect X points`. |
| P26B-ITEM-004 | `ITEM-008`, `ITEM-009` | Dashboard Attention Queue flags blank-rule ItemCodes and missing-from-BUSY rows; missing in-use ItemCodes become `Not in BUSY` without changing existing printed QR values. | PASS WITH NOTE | Dashboard repository now reads `NOT_IN_USE`/`NOT_IN_BUSY` ItemCodes into attention items; refresh marks absent existing codes `NOT_IN_BUSY`; QR print rejects missing-BUSY ItemCodes while already printed units retain stored points. Seeded live proof had no blank/missing rows, so this gate is implementation/test-review verified rather than fixture-proven live. |
| P26C-SCAN-001 | `SITE-014`, `SCAN-024` | Contractor and Team Member Scan QR entry starts with no active scan-site selection when no retryable reserved cart is active. | PASS | `scanSiteWorkflow` helper tests pass; visible proof shows Contractor and Team Member fresh Scan entry with site prompt and no QR token field. Evidence: `screenshots/phase26c-proof.json`, `screenshots/phase26c-contractor-fresh-scan-no-site-390x844.png`, `screenshots/phase26c-team-fresh-scan-no-site-390x844.png`. |
| P26C-SCAN-002 | `SITE-015` | Scanner/frame and manual QR controls remain hidden until a site is selected; selected-site copy shows no active site before selection. | PASS | Proof asserts exact scanner title absent and QR token field absent before site selection, then visible after selecting `Joshi Residence`. Evidence: `screenshots/phase26c-contractor-site-selected-scanner-390x844.png`. |
| P26C-SCAN-003 | `SITE-015`, `SCAN-019` | Successful `Add to account` clears the active scan-site selection and hides the ready-to-add cart; technical commit failure keeps the selected site and retryable reserved items. | PASS | Contractor proof commits successfully and verifies site prompt plus hidden QR/cart; forced commit failure preserves selected site and cart; cleanup commit clears site. Evidence: `screenshots/phase26c-contractor-post-commit-site-cleared-390x844.png`, `screenshots/phase26c-contractor-commit-failure-preserves-cart-390x844.png`. |
| P26C-SCAN-004 | `SCAN-013`, `SCAN-018`, `SCAN-024` | Batch scans remain scoped to the explicitly selected site, while committed cart items are not shown as still ready to add. | PASS | Reserved-cart helpers filter to `RESERVED`; browser proof scans three demo tokens scoped to `seed-site-1`; API scan-history readback includes expected products and committed carts are hidden after success. Evidence: `screenshots/phase26c-proof.json`. |

## Current Verdict

`PASS`: Phase 26A Admin Web corrections, Phase 26B ItemCodes/QR point-rule source, and Phase 26C Scan QR site-selection tightening pass their output gates. Remaining Phase 26B caveat is limited to live Dashboard Attention fixture coverage for blank/missing ItemCodes; the implementation path is present and documented.

## Verification Run - 2026-07-14

- `npm run typecheck --workspace @volt-rewards/api` - PASS.
- `npm run typecheck --workspace @volt-rewards/admin-web` - PASS.
- `npm run typecheck --workspace @volt-rewards/mobile` - PASS.
- `npm run test --workspace @volt-rewards/api` - PASS, 97/97.
- `npm run test --workspace @volt-rewards/admin-web` - PASS, 13/13.
- `npm run test --workspace @volt-rewards/mobile` - PASS, 20/20.
- `git diff --check` - PASS.
- `npm run prisma:migrate:deploy --workspace @volt-rewards/api` - PASS; applied `202607140001_contractor_belongs_to_note` and `202607140002_promotion_marquee_controls`.
- PrismaService readback - PASS; `Contractor.belongsToNote`, `Promotion.overlayFontFamily`, and `Promotion.marqueeEnabled` are queryable in the configured database.

## Browser Proof - 2026-07-14

- Admin Web login through visible OWNER controls - PASS; dashboard loaded with no Next.js error overlay. Evidence: `screenshots/phase26a-admin-web-dashboard-owner.png`.
- `/invoices` - PASS; date range preset select plus `from`/`to` date fields rendered. Evidence: `screenshots/phase26a-invoice-date-range.png`.
- `/contractors/new` - PASS; `Where they belong to` field rendered for OWNER create flow. Evidence: `screenshots/phase26a-contractor-belongs-to-new.png`.
- `/contractors/cmr0qx89900053prsdatt2yzq` - PASS; site cards and drilldown rendered numeric `Credited`, `QR value`, `QR value points`, `Credited points`, and `Items scanned` values after API rebuild/restart. Evidence: `screenshots/phase26a-contractor-site-analytics.png`.
- `/rewards` - PASS; Reward History and Claim Desk controls rendered, including `Refresh Claim Requests`, `Claimed`, and `Fulfilled`. Evidence: `screenshots/phase26a-rewards-history-claim-desk.png`.
- `/promotions` Manage Promotions - PASS; `Font type` with Devanagari options, Bold, Italic, Horizontal scroller/Marquee text, color, and live preview rendered. Evidence: `screenshots/phase26a-promotion-marquee-font-controls.png`.
- Browser console - PASS; only React DevTools/HMR development messages observed during final route checks.

## Additional Verification - 2026-07-14

- `npm run test --workspace @volt-rewards/admin-web` - PASS, 13/13 after the site analytics display fallback.
- `npm run test --workspace @volt-rewards/api` - PASS, 97/97 after rebuilding API `dist`.
- Direct API payload readback - PASS; contractor detail sites now include `qrValuePoints`, `creditedPoints`, and `productSummary` from the rebuilt API runtime.

## Verification Run - 2026-07-15

- `npm run test --workspace @volt-rewards/mobile` - PASS, 23/23.
- `npm run test --workspace @volt-rewards/api` - PASS, 97/97.
- `git diff --check` - PASS.
- `node tools/phase26c-mobile-scan-site-proof.mjs` - PASS after restarting Expo Web at `http://127.0.0.1:3002`.

## Browser Proof - 2026-07-15

- Contractor visible login, dashboard site selection, Scan QR entry, site choice, QR token entry, reserved cart, `Add to account`, post-commit site clear, and forced commit-failure retry - PASS.
- Team Member visible login with OTP, fresh Scan QR entry, site choice, QR token entry, reserved cart without point total, `Add to account`, and post-commit site clear - PASS.
- Viewport matrix - PASS across `360x740`, `390x844`, `430x932`, and `480x900`.
- API readback - PASS; scan history for site `seed-site-1` includes `WIPRO-LED-BULB-DEMO`, `HAVELLS-WIRE-DEMO`, and `ANCHOR-SWITCH-DEMO`.
- Browser console/runtime - PASS; no console errors or runtime exceptions captured.
- Evidence: `screenshots/phase26c-proof.json` and Phase 26C screenshot set under `evals/phase26/screenshots/`.

## Verification Run - 2026-07-15 Phase 26B

- `npm run test --workspace @volt-rewards/domain` - PASS, 43/43.
- `npm run test --workspace @volt-rewards/api` - PASS, 99/99.
- `npm run test --workspace @volt-rewards/admin-web` - PASS, 14/14.
- `npm run typecheck` - PASS across all workspaces.
- `npm test` - PASS across all workspaces: domain 43/43, API 99/99, Admin Web 14/14, mobile 23/23, admin-mobile 4/4.
- `npm run build --workspace @volt-rewards/admin-web` - PASS; generated `/item-codes`.
- `git diff --check` - PASS.
- `npm run prisma:migrate:deploy --workspace @volt-rewards/api` - PASS with explicit approval; applied `202607150001_item_codes` to the configured database.

## API And Route Proof - 2026-07-15 Phase 26B

- Fresh API started at `http://127.0.0.1:3010` after stale local server detection.
- Initial `GET /api/admin-web/item-codes` returned an empty list before refresh, as expected after migration.
- `POST /api/admin-web/item-codes/refresh` with OWNER role returned `sourceCount: 11`, `createdCount: 11`, `updatedCount: 0`, `missingCount: 0`, `attentionCount: 0`.
- `GET /api/admin-web/item-codes` with STAFF role returned 11 rows.
- `PATCH /api/admin-web/item-codes/item_code_missing/reward-rule` with STAFF role returned 403, proving read-only enforcement.
- Admin Web ran at `http://localhost:3001` pointed to the fresh API; OWNER dev login reached `/item-codes` with HTTP 200.
- Authenticated Admin Web proxy `GET /api/admin/backend/admin-web/item-codes` returned 11 rows.
- Temporary evidence files were kept outside the repo at `/tmp/phase26b-auth-itemcodes.html`, `/tmp/phase26b-auth-proxy.json`, and `/tmp/phase26b-api-smoke.json`.

## Clarification Verification - 2026-07-15 Phase 26B

- Clarification accepted: QR point value freezes at QR print; ItemCodes sync keeps BUSY-owned `TempItemCode`, `ItemName`, and `Price` current; Volt-owned `Absolute Points` and `% of Price` remain manually managed.
- `npm run test --workspace @volt-rewards/domain` - PASS, 43/43.
- `npm run test --workspace @volt-rewards/api` - PASS, 99/99.
- `npm run test --workspace @volt-rewards/admin-web` - PASS, 14/14.
- `npm run typecheck --workspace @volt-rewards/admin-web` - PASS.
- `npm run build --workspace @volt-rewards/admin-web` - PASS.
- `git diff --check` - PASS before this doc note.
- Refreshed API `GET /api/admin-web/item-codes` returned `finalPoints` and `absolute pts` in `/tmp/phase26b-clarified-itemcodes.json`.
- Authenticated `/item-codes` route returned 200 and rendered `Absolute Points`, `% of Price Points`, and `Final Points`; proxy returned 11 rows in `/tmp/phase26b-clarified-auth-proxy.json`.
