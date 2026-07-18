# Phase 22 Status - Admin Web Product-Grade Recovery

Status: In Progress - Phase 22I Promotions Implemented, Visible Browser UAT Queued
Last Updated: 2026-07-08

## Completed

### Phase 22A - Login, Session, Route Guards, Shell

Completed on 2026-07-07.

Delivered:

- Real Admin Web `/login` for OWNER and STAFF.
- Session token stored only in HttpOnly same-site cookie.
- Next.js backend proxy at `/api/admin/backend/*` forwards authenticated Admin Web API calls to Nest with bearer session from the cookie.
- Product Admin Web client path no longer sends browser-side actor headers.
- Visible dev actor selector removed from Admin Web shell.
- Server-side route protection added for all Admin Web routes.
- OWNER-only routes enforced for Staff, Rewards, and Promotions.
- Admin Web login audit surface records `ADMIN_WEB_LOGIN`.
- Route anchors added for Invoice Ledger and Print History so navigation matches the Phase 22 recovery structure.

Verification:

- `npm run test --workspace @volt-rewards/admin-web` passed.
- `npm run test --workspace @volt-rewards/api` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- Browser UAT passed for unauthenticated redirect, OWNER login, OWNER staff access, logout, STAFF login, STAFF nav scoping, and STAFF direct `/staff` blocking.

### Phase 22B - Dashboard Recovery

Completed on 2026-07-07.

Delivered:

- Dashboard-specific contract added in `PHASE_22B_DASHBOARD_CONTRACT.md` before implementation.
- Dashboard API expanded from static counts into an operational read model: summary metrics, attention queue, shortcuts, QR status mix, 7-day print trend, top contractors, and human-readable recent activity labels.
- OWNER dashboard now shows owner-only shortcuts for Staff Management, Rewards, and Promotions.
- STAFF dashboard hides owner-only navigation and shortcuts while retaining allowed desk-operation routes.
- Dashboard metrics and shortcuts route only to implemented Admin Web route anchors.
- `/dashboard?denied=1` now shows a visible owner-only route restriction banner.

Verification:

- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm run typecheck` passed.
- `npm test` passed across domain, API, admin web, mobile, and admin mobile.
- Browser UAT passed for logged-out redirect, OWNER dashboard sections, OWNER metric/shortcut navigation, STAFF dashboard sections, STAFF owner-only nav hiding, STAFF direct `/staff` denial, and zero browser console errors.
- Screenshots captured:
  - `/tmp/admin-web-phase22b-owner-dashboard.png`
  - `/tmp/admin-web-phase22b-staff-dashboard.png`

Runtime note:

- Supabase runtime DB was missing migration `202607070001_busy_return_vouchers`; `npm run prisma:migrate:deploy --workspace @volt-rewards/api` was run successfully before browser UAT.

### Phase 22C - QR Print Queue, Invoice Ledger, Invoice Detail, Print History

Completed on 2026-07-07.

Delivered:

- Phase 22C contract added in `PHASE_22C_INVOICE_PRINT_HISTORY_CONTRACT.md` before implementation.
- Admin Web invoice read model expanded with imported time, printable units, scanned/cancelled/reversed/returned units, return voucher count, review-needed count, product summary, and category summary.
- QR Print Queue at `/` now focuses on printable sale invoices, keeps mock BUSY import available, supports search/filter/sort, and separates line-level print selection from the full invoice ledger.
- Invoice Ledger added at `/invoices` for all persisted sale invoices, including fully printed, returned, review-needed, and non-printable invoices.
- Invoice Detail added at `/invoices/[invoiceId]` with invoice metadata, line-level lifecycle facts, linked return history, print-run history, and next action.
- Print History added at `/print-history` with searchable/filterable/sortable print-run rows and invoice drilldown.
- OWNER and STAFF can open Phase 22C routes; returned-product QR status/cancel/reverse controls remain excluded from Admin Web.

Verification:

- `npm run build --workspace @volt-rewards/api` passed.
- `npm run typecheck --workspace @volt-rewards/admin-web` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm test` passed across domain, API, admin web, mobile, and admin mobile.
- API smoke checks confirmed enriched `/api/admin-web/invoices` and `/api/admin-web/qr/print-history` fields.
- Browser UAT passed for QR print queue search/filter/detail drilldown, Invoice Ledger search/filter/detail drilldown, Print History search/filter/actor filter/detail drilldown, STAFF access, and zero browser console errors.
- Screenshots captured:
  - `/tmp/admin-web-phase22c-qr-print-queue.png`
  - `/tmp/admin-web-phase22c-invoice-detail.png`
  - `/tmp/admin-web-phase22c-invoice-ledger.png`
  - `/tmp/admin-web-phase22c-print-history.png`
  - `/tmp/admin-web-phase22c-staff-print-queue.png`

### Phase 22D - Contractor And Staff Management Recovery

Completed on 2026-07-07.

Delivered:

- Phase 22D contract added in `PHASE_22D_CONTRACTOR_STAFF_MANAGEMENT_CONTRACT.md` before implementation.
- Contractor directory at `/contractors` now supports search, filters, sorting, summary facts, and detail drilldown.
- Contractor registration moved to `/contractors/new` with accessible device photo upload and persisted detail readback.
- Contractor detail at `/contractors/[contractorId]` shows immutable name/mobile facts, photo-only update, reset MPIN, deactivate/reactivate, metrics, and sites.
- Backend rejects contractor name/mobile mutation attempts after registration.
- STAFF can view contractor directory/detail read-only and sees no contractor mutation controls.
- Staff directory at `/staff` now supports OWNER-only search, filters, sorting, and detail drilldown.
- Staff creation moved to `/staff/new` with generated temporary PIN shown once.
- Staff detail at `/staff/[staffId]` supports reset PIN, deactivate, and reactivate.
- STAFF staff-management nav and direct staff routes are blocked before management data renders.

Verification:

- `npm run build --workspace @volt-rewards/api` passed.
- `npm run typecheck --workspace @volt-rewards/admin-web` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm test` passed across domain, API, admin web, mobile, and admin mobile.
- Browser UAT passed for OWNER contractor create with image upload, contractor detail photo update, reset MPIN, deactivate/reactivate, backend identity mutation rejection, staff create/detail/reset/deactivate/reactivate, STAFF read-only contractor detail, STAFF staff-route blocking, and zero app console errors.
- Screenshots captured:
  - `/tmp/admin-web-phase22d-contractors-directory.png`
  - `/tmp/admin-web-phase22d-contractor-detail.png`
  - `/tmp/admin-web-phase22d-staff-directory.png`
  - `/tmp/admin-web-phase22d-staff-detail.png`
  - `/tmp/admin-web-phase22d-staff-readonly-contractor.png`

### Phase 22 UAT2 Correction - QR Print Semantics And Photo Upload

Completed on 2026-07-07.

Delivered:

- Correction contract added and completed in `PHASE_22_UAT2_QR_MEDIA_CORRECTION_CONTRACT.md`.
- QR Print screen now separates `BUSY sync` from the persisted `QR print queue`.
- `Sync from BUSY` imports/pulls invoice source data, while `Refresh queue` reloads the persisted database queue.
- Latest BUSY sync/import timestamp is visible on the QR Print screen.
- Print action is disabled until invoice selection and line quantities are valid.
- QR reprint is supported for active unscanned `PRINTED_UNCLAIMED` and `REPRINTED` units and returns a replacement token.
- QR reprint invalidates the prior active token and is audited.
- QR reprint is blocked for scanned/claimed, cancelled/reversed, expired, not-printed, and otherwise inactive/ineligible units.
- Invoice Detail exposes printed QR units so reprint is available after leaving the immediate print session.
- Shared Admin Web photo upload now uses a visible button-triggered file picker with the hidden file input removed from pointer/accessibility targeting.
- Contractor registration and detail photo upload use the shared device upload control.
- OWNER can update staff photos from staff detail.
- STAFF can update only their own staff photo from `/profile`; staff-management routes remain blocked for STAFF.

Verification:

- `npm run build --workspace @volt-rewards/api` passed.
- `npm run typecheck --workspace @volt-rewards/admin-web` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- Browser UAT passed for QR sync/queue labeling, latest sync timestamp, no-selection print disablement, unscanned QR reprint, scanned QR reprint backend rejection, contractor create with image persistence, OWNER staff photo update, STAFF self-photo update, STAFF direct `/staff` denial, and zero browser console errors.
- Screenshots captured:
  - `.planning/v1-agentic-build/evidence/admin-web-uat2-qr-sync-queue.png`
  - `.planning/v1-agentic-build/evidence/admin-web-uat2-invoice-detail-reprint.png`
  - `.planning/v1-agentic-build/evidence/admin-web-uat2-contractor-photo-directory.png`
  - `.planning/v1-agentic-build/evidence/admin-web-uat2-staff-photo-owner.png`
  - `.planning/v1-agentic-build/evidence/admin-web-uat2-staff-self-profile.png`

### Phase 22 UAT3 Correction - QR Sync, Reprint Status, Deep Links, Upload

Completed on 2026-07-07.

Delivered:

- Correction contract added and completed in `PHASE_22_UAT3_QR_SYNC_REPRINT_UPLOAD_CONTRACT.md`.
- BUSY Sync on the QR Print screen is now a compact source-ingestion/status panel, not a duplicate invoice browser.
- `Sync from BUSY` syncs all current mock BUSY invoices and updates latest sync time from sync/import audit events, including idempotent sync attempts.
- QR Print Queue remains the only invoice-selection surface.
- Dashboard ready-for-print attention rows deep-link to `/?invoiceId=<id>` and open the target invoice with line details visible.
- Reprinted QR units now surface status `REPRINTED` in backend state, Admin Web print batches, invoice detail, dashboard status mix, and Admin Mobile return status badges.
- `REPRINTED` is treated as an active unscanned replacement-label state and remains eligible for scan, returned-product cancellation, and further reprint while active and unexpired.
- Contractor and staff photo Browse controls use a native file input overlay on the visible button target.

Verification:

- `npm run test:domain` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm run test:admin-mobile` passed.
- Browser UAT passed for dashboard invoice deep link, BUSY Sync source/status behavior, latest sync timestamp refresh, print without runtime error, QR reprint showing `REPRINTED`, contractor photo Browse/create/avatar persistence, staff photo Browse/create/avatar persistence, and zero current-session app runtime console errors.

### Phase 22 UAT4 Correction - Invoice Tables And QR Status Labels

Completed on 2026-07-07.

Delivered:

- Correction contract added and completed in `PHASE_22_UAT4_INVOICE_TABLE_STATUS_CONTRACT.md`.
- Admin Web now has one shared QR item display helper for labels, badge tones, and ordered status counts.
- Invoice Detail line items now render as a single structured table with one header row instead of repeated per-line fact labels.
- Invoice Detail QR unit reprint now renders as a structured table with one header row for Unit, Item, Status, Expiry, Replacement token, and Action.
- Approved QR item display statuses are now `Not_Printed`, `Printed`, `Reprinted`, `Claimed`, `Cancelled`, and `Reversed_AND_Cancelled`.
- Backend lifecycle enum names remain unchanged and internal.
- Dashboard QR status mix and Admin Web QR Print latest-batch status labels now use the approved display vocabulary.

Verification:

- `npm run test:admin-web` passed.
- `npm run test:api` passed.
- Browser UAT passed on Invoice Detail for one line-item header row, one QR reprint header row, 4 line rows, 33 QR unit rows, approved status labels, no visible raw QR enum labels, and zero app runtime console errors.
- Screenshot evidence: `/tmp/admin-web-uat4-invoice-table-final.png`.

### Phase 22E - Reward Fulfillment Recovery

Completed on 2026-07-07.

Delivered:

- Phase 22E contract added and completed in `PHASE_22E_REWARD_FULFILLMENT_CONTRACT.md`.
- Admin Web Rewards at `/rewards` is now a role-aware rewards surface: OWNER gets active fulfillment controls; STAFF gets Reward History only.
- Backend exposes `GET /admin-web/rewards/claims` under `ADMIN_FULFILL_REWARD`.
- Rewards page loads reward claims, defaults to pending `CHOSEN` handover claims, and provides search, filter, and sort controls.
- Claim detail shows claim-specific contractor identity, phone, reward, Rs value, claim-raised/delivered timestamps, and backend action eligibility; account totals are intentionally excluded from the claim detail panel.
- Claim ID lookup, mock OTP send, and Fulfilled/Delivered marking remain wired to backend APIs.
- Send OTP does not mark fulfillment; fulfill requires challenge id and OTP.
- STAFF is blocked by route and backend permission.

Verification:

- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- Runtime API smoke check confirmed OWNER `GET /api/admin-web/rewards/claims` returns `200` and STAFF returns `403`.
- Browser UAT passed for OWNER route render, reward-claim summary metrics, pending-empty state, list controls, no hidden selected claim, and zero current-session console errors.
- Current runtime data has no pending `CHOSEN` reward claim, so browser UAT could not safely exercise OTP send/fulfill without manufacturing data. Automated API/Admin Web client tests cover OTP send/fulfill until a pending claim is available.
- Screenshot evidence: `.planning/v1-agentic-build/evidence/phase22e-rewards-empty-pending.png`.

### Phase 22E UAT5 - Reward Semantics Correction

Completed on 2026-07-07; runtime database connectivity restored through Supabase Shared Pooler.

Delivered:

- Added `PHASE_22E_UAT5_REWARD_SEMANTICS_CONTRACT.md`.
- Admin Web active Claim Desk now lists only active `Claim Raised` requests (`CHOSEN` internally).
- Admin Web Reward History is available to OWNER and STAFF; STAFF cannot see fulfillment controls.
- Claim detail now shows claim-specific fields only and removes `Available Balance` / `Lifetime Total`.
- Backend re-checks active `Claim Raised` before OTP send and final Delivered marking.
- Mock seed scenarios added: `CLM-ACTIVE01` for normal delivery and `CLM-STALE01` for cancelled-before-OTP handling.
- Contractor mobile reward copy now uses `Get Now`, `Claim Raised`, and `Delivered`.
- Admin Web select controls received right-side padding to prevent dropdown-arrow text overlap.

Verification:

- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm run test:mobile` passed.
- Browser UAT passed for OWNER `/rewards` active Claim Desk, `CLM-STALE01` no-longer-available handling, `CLM-ACTIVE01` OTP and Delivered transition, and STAFF `/rewards` history-only access.
- Claim detail/browser checks confirmed `Available Balance` and `Lifetime Total` are not shown in claim details.
- STAFF browser checks confirmed Claim Desk, Reward fulfillment, Send OTP, and Mark Delivered controls are not rendered.
- Expected console note: the stale claim path logs one HTTP `400 Bad Request` resource entry because the backend intentionally rejects stale fulfillment. No page runtime exceptions were captured during the passed UAT steps.
- Browser evidence:
  - `.planning/v1-agentic-build/evidence/phase-22e-owner-claims-before.png`
  - `.planning/v1-agentic-build/evidence/phase-22e-owner-stale-claim.png`
  - `.planning/v1-agentic-build/evidence/phase-22e-owner-delivered-claim.png`
  - `.planning/v1-agentic-build/evidence/phase-22e-staff-history-only.png`
- Post-UAT seed reset succeeded and direct API verification confirmed `CLM-STALE01` and `CLM-ACTIVE01` are active `CHOSEN` mock claims again for manual UAT.
- Runtime seed now passes through Supabase Shared Pooler `aws-1-ap-southeast-1.pooler.supabase.com:5432`. The direct DB host remains IPv6-only from this environment. Production launch must replace local/dev TLS compatibility with verified TLS using the Supabase CA certificate or an approved managed Postgres TLS runbook.

### Phase 22F - Reward Catalog Management

Completed on 2026-07-07.

Delivered:

- `PHASE_22F_REWARD_CATALOG_MANAGEMENT_CONTRACT.md` created before implementation and updated after verification.
- Reward catalog schema expanded with stable reward code/SKU, internal INR value, total quantity, draft/active/inactive status, and multiple catalog images.
- Supabase migration `202607070002_reward_catalog_management` applied to the runtime database.
- Supabase Storage adapter added for reward image uploads using bucket `reward-images`, with local/test fallback when Supabase env is unavailable.
- Seed data now creates realistic rewards with client-facing names, descriptions, required points, internal INR values, quantities, and one Supabase Storage-backed primary image each.
- Admin Web OWNER `/rewards` now opens Reward Catalog Management from an explicit `Manage Reward Catalog` action into a nested management workspace; it is not rendered directly on the Rewards landing page.
- Admin Web OWNER can list, create, edit, deactivate/reactivate, image-upload, and CSV-preview/commit catalog items.
- Admin Web CSV is Web-only for this phase and upserts by `rewardCode`.
- CSV rows without images remain unpublished from contractor browsing until OWNER uploads at least one image.
- Admin Web STAFF cannot see catalog management and receives backend `403` for catalog API access.
- Admin Mobile OWNER now has a Rewards tab with catalog list, core create/edit fields, image upload, stock summary, and deactivate/reactivate.
- Admin Mobile STAFF does not get the Rewards catalog tab.
- Contractor reward catalog now hides inactive, draft/image-less, and sold-out rewards from general browsing.
- Reward redemption re-checks active state, image readiness, and stock before creating a Claim Raised reservation.
- Claim Raised, cancellation/revocation, and Delivered flows now drive stock availability.

Verification:

- `npm test` passed across domain, API, Admin Web, contractor mobile, and Admin Mobile.
- `npm run prisma:migrate:deploy --workspace @volt-rewards/api` passed against Supabase shared pooler.
- `npm run db:seed --workspace @volt-rewards/api` passed.
- Admin Web browser UAT passed for OWNER Rewards landing hierarchy, nested catalog entry/back flow, Supabase Storage image upload, CSV preview, no desktop overflow offenders, and current OWNER session restored.
- Direct catalog verification confirmed all seeded primary reward images use Supabase Storage public object URLs.
- Admin Web browser UAT passed for STAFF history-only visibility and backend catalog API `403`.
- Admin Mobile browser UAT passed for STAFF no Rewards tab, OWNER Rewards tab/catalog load, and no mobile overflow offenders.
- Screenshot evidence:
  - `.planning/v1-agentic-build/evidence/phase-22f-admin-web-reward-catalog-nested.png`
  - `.planning/v1-agentic-build/evidence/phase-22f-admin-mobile-reward-catalog.png`

Known UAT side effect:

- `RW-SMART-TV-01` now has a second uploaded image in Supabase Storage from the real browser upload verification.

### Phase 22F UAT Correction - Upload Controls And PIN Reveal

Completed on 2026-07-07.

Why this correction exists:

- Manual UAT found that Reward Catalog Management `Choose File` was not reliably clickable even after earlier upload UAT passed.
- The failure repeated the earlier contractor/staff upload class of issue, proving the shared-control harness was still incomplete.

Delivered:

- Added a shared Admin Web file-picker button component and moved profile-photo and reward-image upload controls onto it.
- Reward Catalog Management no longer owns a separate raw file-input implementation.
- Admin Web login PIN now has reveal/hide.
- Admin Mobile login PIN now has reveal/hide.
- End-user mobile Contractor login, SET MPIN, and Change MPIN now have reveal/hide.
- Admin Mobile image upload flows now request media-library permission through a shared picker helper before reward/contractor image selection.
- Admin Mobile OWNER contractor detail now exposes contractor photo upload.
- Admin Mobile Reward Catalog now selects the first saved catalog item after load and keeps the selected saved item after refresh; image upload is disabled and labeled clearly for unsaved new rewards.
- Requirements and standards updated with explicit reusable-control and visible-control UAT gates: `AUTH-027`, `RWD-040`, `WEB-041`, `WEB-042`, and `MADM-029`.

Verification:

- `npm run typecheck` passed across domain, API, Admin Web, end-user mobile, and Admin Mobile.
- `npm test` passed across domain, API, Admin Web, end-user mobile, and Admin Mobile.
- `npm run typecheck --workspace @volt-rewards/admin-mobile` passed after the Admin Mobile reward-selection fix.
- `npm run test --workspace @volt-rewards/admin-mobile` passed after the Admin Mobile reward-selection fix.
- Admin Web visible-control UAT passed for PIN reveal/hide, Reward Catalog `Browse reward image`, Contractor photo Browse/Save, OWNER Staff-detail photo Browse/Save, and STAFF self-profile photo Browse/Save.
- Admin Mobile Expo Web visible-control UAT passed for PIN reveal/hide, OWNER contractor `Upload contractor photo`, OWNER reward `Upload image`, and reward image upload after saved-item auto-selection.
- End-user mobile Expo Web visible-control UAT passed for Contractor login MPIN reveal/hide and Profile Change MPIN reveal controls.
- Evidence screenshots:
  - `.planning/v1-agentic-build/evidence/phase22f-uat-correction-reward-upload.png`
  - `.planning/v1-agentic-build/evidence/phase22f-uat-correction-profile-upload.png`

Residual risk:

- Profile photos still use compressed inline data URLs during local/product UAT. Production storage policy for contractor/staff photos remains open under `OPEN_QUESTIONS.md`.
- Native iOS/Android picker verification is still required before public store-readiness is claimed; Expo Web verification is a supplement, not a substitute.

Known UAT side effects:

- `RW-HAIRDRYER` and `RW-TOOLBOX-01` received additional uploaded images during visible-control UAT.
- `seed-reward-stale-contractor`, staff `cmrablhik001r0urswxdgz5be`, and STAFF login account `9000000092` received updated profile images during visible-control UAT.

### Phase 22F UAT Correction 2 - Reward Image Picker Reliability And File Contract

Completed on 2026-07-07. Superseded by Correction 3 on 2026-07-08 for the Admin Web picker mechanism.

Why this correction exists:

- Manual UAT still found that `Browse reward image` did not open the native file picker.
- Root cause: the shared Admin Web picker returned a `<label>` and the Rewards image upload area nested it inside another `<label>`, creating invalid nested-label HTML. This can fail silently in real browsers even when automated hidden-input tests pass.
- The previous reward image contract also drifted: Admin Web/API allowed WebP and backend storage allowed 3 MB, while the expected product behavior is PNG/JPG/JPEG under 2 MB.

Delivered:

- Rebuilt the shared Admin Web file picker as a visible button that triggers a hidden native file input from the direct user click.
- Hid the native file input from the accessibility tree so only one `Browse reward image` button is exposed.
- Changed Reward Catalog upload accept list to `.png,.jpg,.jpeg,image/png,image/jpeg`.
- Added Admin Web validation for PNG/JPG/JPEG only and under-2MB before upload.
- Normalized reward image data URL MIME headers before API submission.
- Changed API reward image parsing/storage validation to reject WebP and files over 2 MB.
- Changed Supabase Storage bucket setup contract to PNG/JPEG and 2 MB.
- Added API unit tests for reward image size/type rejection.
- Aligned Admin Mobile picker validation with PNG/JPG/JPEG under 2 MB.
- Clarified `APPROVED_STITCH_UI_CONTRACT.md` and `FRONTEND_EXPERIENCE_STANDARD.md`: Stitch screenshots are visual-language references, not pixel-copy targets.

Verification:

- `npm run test --workspace @volt-rewards/api` passed, including new reward image storage rejection tests.
- `npm run test --workspace @volt-rewards/admin-web` passed.
- `npm run test --workspace @volt-rewards/admin-mobile` passed.
- Restarted API, Admin Web, end-user mobile web, and Admin Mobile web servers.
- Browser UAT confirmed the visible `Browse reward image` button opens the native file chooser, accepts a real PNG under 2 MB, uploads successfully, and shows `Reward image uploaded`.
- Browser UAT after accessibility cleanup confirmed exactly one accessible `Browse reward image` button, one hidden native input, and accept list `.png,.jpg,.jpeg,image/png,image/jpeg`.
- Evidence screenshot: `.planning/v1-agentic-build/evidence/reward-catalog-upload-control-fixed.png`.

Known UAT side effect:

- `RW-TOOLBOX-01` received one additional uploaded PNG image during visible-control verification.

### Phase 22F UAT Correction 3 - Native File Input Root Cause Closure

Completed on 2026-07-08.

Why this correction exists:

- Manual UAT still found that `Browse reward image` did not open the native file picker reliably after Correction 2.
- Backend/Supabase was ruled out for picker-opening behavior: the OS/browser file picker opens before any API request or storage upload is involved.
- The previous automated harness was too weak because it accepted a custom hidden-input path and accumulated unclosed Playwright file chooser dialogs across repeated tests.
- The shared upload component also still allowed profile photos to accept generic image MIME types while reward images were constrained to PNG/JPG/JPEG.

Delivered:

- Rebuilt the shared Admin Web upload control as a visible native `input[type=file]`.
- Removed hidden-input, nested-label, and programmatic-click behavior from Admin Web profile-photo and reward-image uploads.
- Kept one shared Admin Web upload component for contractor photo, staff photo, STAFF self-profile photo, and reward image upload.
- Aligned Admin Web profile photo validation with the platform upload contract: PNG/JPG/JPEG only and under 2 MB.
- Updated `APPROACH.md` with the native picker harness correction: clean session, visible native picker, DOM hit-target checks, chooser cleanup, and console/accessibility review.

Verification:

- `npm run test --workspace @volt-rewards/admin-web` passed.
- Live Admin Web Rewards Catalog DOM check passed for `Browse reward image`:
  - visible enabled native file input,
  - size 420 x 43 px,
  - accept list `.png,.jpg,.jpeg,image/png,image/jpeg`,
  - `document.elementFromPoint()` at the click target resolved to the input itself,
  - no overlay intercepted the click.
- Live click-level check from that exact native input opened a file chooser; chooser state was then cancelled/cleared.
- Admin Web profile-photo upload surfaces use the same native upload component, so contractor/staff/profile Browse controls now share the corrected mechanism.

Residual risk:

- Native iOS/Android media-picker verification is still required before app-store readiness is claimed.
- Profile photos still use compressed inline data URLs during local/product UAT. Production storage policy for contractor/staff photos remains open under `OPEN_QUESTIONS.md`.

### Phase 22G - Admin Mobile Reward Fulfillment Completion

Completed on 2026-07-08.

Delivered:

- `PHASE_22G_ADMIN_MOBILE_REWARD_FULFILLMENT_CONTRACT.md` created before implementation and completed after verification.
- Admin Mobile reward-claim endpoints added for active Claim Desk, Reward History, Claim ID lookup, OTP send, and final Delivered marking.
- Admin Mobile fulfillment audit events use the `ADMIN_MOBILE` surface.
- OWNER Rewards tab now supports active Claim Desk, Claim ID lookup, selected claim details, OTP handover, Mark Delivered, Reward History, and existing catalog management.
- STAFF now has a Rewards tab for Reward History only, with no Claim Desk, Send OTP, Mark Delivered, or catalog-management controls.
- Admin Mobile role navigation updated so STAFF can view reward history while remaining blocked from owner actions.
- Admin Mobile actionable pressables now expose semantic button/checkbox roles and state, improving both accessibility and automation reliability.
- Admin Mobile API client no longer sends `content-type: application/json` on POST requests without a body; this fixed Fastify bodyless POST rejection on OTP send.
- Seed reset now removes seeded `reward-fulfill:*` ledger artifacts before resetting mock claims, preventing duplicate idempotency-key failures during repeated UAT.

Verification:

- `npm run test:api` passed: 79 tests.
- `npm run test:admin-mobile` passed: 4 tests, including request-helper regression coverage for bodyless POST and JSON-body POST.
- Browser UAT passed for OWNER Rewards Claim Desk, stale `CLM-STALE01` no-longer-available handling, active `CLM-ACTIVE01` OTP generation, Mark Delivered, and STAFF Reward History-only access.
- Specific readback evidence confirmed the `CLM-ACTIVE01` fulfill endpoint returned HTTP `201` with status `FULFILLED`; broad page-text matching was not accepted as sufficient evidence.
- Post-UAT seed reset succeeded.
- Direct API readback after reset confirmed `CLM-ACTIVE01` and `CLM-STALE01` are active `CHOSEN` mock claims again for manual UAT.

Harness learnings:

- React Native Web pressables must expose `accessibilityRole` and state; visual clickability is not enough for app-store-grade accessibility or reliable UAT automation.
- API clients must not send JSON content-type on bodyless POST requests.
- Seed scripts used for repeated UAT must reset mutation side effects, including idempotency ledger entries.
- Fulfillment UAT must verify the specific claim ID after mutation, not merely search for a status word that may appear in unrelated history rows.

Evidence:

- `/tmp/rewards-phase22g-owner-final.png`
- `/tmp/rewards-phase22g-staff.png`

### Phase 22H - Reports Implementation And Manual UAT2 Correction

Correction updated on 2026-07-08 after manual UAT issues recorded in `ManualUAT2_Reports.md`.

Delivered:

- `PHASE_22H_REPORTS_IMPLEMENTATION_PLAN.md` executed for Reports only; promotions remained excluded as planned.
- Admin Web `/reports` now renders a real Reports workspace instead of `AdminPlaceholderWorkspace`.
- Reports landing analytics now show persisted platform-wide QR, points, reward, contractor, return-attention, top contractor, and top product/category cards. These top cards are platform attention metrics and do not change when selected report filters change.
- Reports landing also shows lightweight owner-useful charts for QR lifecycle mix, reward fulfillment funnel, points movement, and top claimed products.
- Corrected first-pass report set:
  - QR Print Analytics.
  - Scan History Analytics.
  - Contractor Leaderboard.
  - QR Status.
  - Reward Claims.
  - Returns/Reversals.
- Removed after manual UAT because they were duplicate/low-value in this first-pass Reports library:
  - Rewards Analytics, which duplicated Reward Claims.
  - Product/Category Performance.
  - Contractor Deep Dive.
- Shared report filters implemented for Today, This Week, Last Week, This Month, Last 3 Months, and Custom date range, with server-resolved India business-time ranges.
- Report-specific filters implemented for QR status, scan outcome, reward status, return status, invoice number, product/category, search, pagination, and page size.
- Report filter layout is stable when Custom date range is selected; From/To occupy reserved slots instead of pushing other filters down.
- Reports include a visible `Clear filters` action.
- Report tables use sticky headers and per-column sort controls with ascending, descending, and no-sort cycle.
- Approved QR display statuses are used in report columns: `Not_Printed`, `Printed`, `Reprinted`, `Claimed`, `Cancelled`, and `Reversed_AND_Cancelled`.
- Scan failure reasons in Reports use owner-facing business labels instead of raw internal codes such as `QR_NOT_SCANNABLE`.
- Reward claim reports use owner-facing statuses `Claim Raised`, `Delivered`, and `Claim Cancelled`; internal revoked/return-driven claim states are not surfaced as a separate owner-facing status.
- OWNER-only PDF and Excel export endpoints added under `POST /admin-web/reports/:reportId/export`.
- Manual UAT2 export defect fixed: the Reports controller now writes download headers through Fastify `reply.header(...)` instead of Express-style `setHeader`, and export audit omits non-existent dev/header actor IDs instead of failing the file download.
- STAFF can view reports but cannot export; backend export remains guarded by `ACTION.REPORT_EXPORT`.
- Successful export writes a `REPORT_EXPORTED` audit event with report ID, format, resolved range, row count, actor role, and actor user where present.
- Admin Web API proxy now preserves binary response bodies and `Content-Disposition` headers for file downloads.
- Admin Web client gained typed report read methods plus a dedicated binary export/download helper.
- PDF/XLSX generation is implemented in-repo without adding new runtime dependencies after dependency install attempts exposed avoidable supply-chain/audit surface.

Verification:

- Context7/local-doc preflight completed for current Next.js route handlers/BFF behavior, NestJS response streaming, and Prisma query patterns before implementation.
- After Manual UAT2 correction, `npm run typecheck --workspace @volt-rewards/api` passed.
- After Manual UAT2 correction, `npm run typecheck --workspace @volt-rewards/admin-web` passed.
- After Manual UAT2 correction, `npm run test:api` passed: 82 tests, including PDF/XLSX byte generation, report export audit coverage, and a Fastify controller export-header boundary test.
- After Manual UAT2 correction, `npm run test:admin-web` passed: 12 tests, including Admin Web report read/export client coverage.
- Earlier full `npm run typecheck` passed across domain, API, Admin Web, end-user mobile, and Admin Mobile before Manual UAT2 correction; post-correction full cross-workspace typecheck remains queued because the process-count warning is active and the changed files are API/Admin Web only.
- Live API smoke proof after rebuild: `POST /api/admin-web/reports/qr-status/export` with OWNER headers returned `201`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `content-disposition: attachment; filename="qr-status-2026-07-08.xlsx"`, and a non-empty 13,650 byte XLSX file.
- `npm run typecheck` passed across domain, API, Admin Web, end-user mobile, and Admin Mobile.
- Dependency check confirmed `exceljs` and `pdfkit` are not installed in the API workspace after the export implementation; no new PDF/XLSX runtime dependency remains.
- OWNER Admin Web session login through `/api/admin/session/login` returned `200` and set an HttpOnly `volt_admin_web_session` cookie.
- Authenticated `/reports` SSR returned `200 text/html`.
- Authenticated Admin Web proxy report landing returned persisted metrics and report shortcuts.
- Authenticated Admin Web proxy QR Status report returned `24` rows with the approved status columns and realistic invoice/product rows.

Output eval:

- Verdict: PASS for automated/API/Admin Web client verification.
- Requirements covered: `WEB-015`, `REP-001` through `REP-012`, and the approved first-pass part of `REP-010` for OWNER PDF/Excel export.
- Explicitly deferred: WhatsApp sharing from `REP-010`, Hindi report output, Admin Mobile report depth, and promotions.
- Residual: visible Browser UAT and real browser download UX proof are still required before the reports slice should be treated as fully product-grade from a frontend UAT perspective.

Trajectory eval:

- Verdict: PASS with one harness caveat.
- The original implementation followed the agentic sequence, but Manual UAT2 showed that the Report design contract was not specific enough about report usefulness, platform-wide versus filtered metrics, stable filter layout, and table ergonomics.
- Correction action: `ManualUAT2_Reports.md` has been fed back into the requirements ledger and Phase 22 status, and the report/list UX standard now requires clear filters, stable custom-date layout, sticky headers, and column-header sorting before future list/report surfaces are considered product-grade.
- The phase avoided ad-hoc expansion into Admin Mobile polish or Promotions.
- The in-repo PDF/XLSX generator reduced dependency risk and now has deterministic byte-level tests.
- The process-count warning exposed a harness issue: local dev/browser UAT should not rely on multiple parallel shell curls or long-lived untracked sessions. Future visible UAT should first recover/confirm browser tooling and process health, then run a small sequential UAT script.

UAT limitation:

- In-app Browser UAT could not be completed because the `iab` browser was unavailable in this session.
- Fallback Playwright MCP browser automation failed with closed transport.
- Local dev servers also showed intermittent connection refusals while the environment repeatedly warned about exceeding the unified exec process limit. Long-running API/Admin Web sessions started for UAT were stopped afterward.
- Therefore this phase does not claim visible Browser screenshot evidence or real browser file-download proof. It claims automated/API/Admin Web proxy verification only, with visible Browser UAT queued for the next stable browser session.

Harness learnings:

- Do not run repeated parallel local-server curls while the unified exec process limit warning is active; use sequential checks and close temporary dev sessions promptly.
- Export behavior must have deterministic service/file-generator tests so local port instability does not hide business regressions.
- File download endpoints must also have controller/adapter boundary tests; generator tests alone missed the Fastify versus Express response-header mismatch.
- Visible Browser UAT remains mandatory before final product-grade sign-off when browser tooling is available; automated export tests are not a substitute for download UX verification.

### Phase 22I - Promotions Implementation

Implemented on 2026-07-08.

Delivered:

- `PHASE_22I_PROMOTIONS_IMPLEMENTATION_PLAN.md` created before implementation and tied to `PHASE_22H_REPORTS_PROMOTIONS_DECISION_CONTRACT.md`.
- Backend promotion-management permission added as OWNER-only; STAFF is explicitly denied promotion management.
- Backend promotion-view permission added for Contractor and Team Member app sessions.
- Promotion schema expanded with media alt text, overlay text, overlay text color, overlay font size, overlay font style, and archived timestamp.
- Prisma migration `202607080001_promotions_management` added and applied to the Supabase database.
- Promotion media storage generalized from reward image storage while preserving reward PNG/JPG rules and adding promotion PNG/JPG/JPEG/GIF support under 2 MB.
- Admin Web promotion APIs added:
  - `GET /api/admin-web/promotions`.
  - `POST /api/admin-web/promotions`.
  - `PATCH /api/admin-web/promotions/:promotionId`.
  - `POST /api/admin-web/promotions/:promotionId/activate`.
  - `POST /api/admin-web/promotions/:promotionId/deactivate`.
- End-user app promotion API added:
  - `GET /api/promotions/active`.
- The mobile active-promotion API returns only `ACTIVE`, non-expired, all-user promotions in this version.
- Promotion create/update/activate/deactivate writes `PROMOTION_*` audit events, with robust actor-user lookup so dev/header actor IDs do not break valid local mutations.
- Admin Web `/promotions` no longer uses `AdminPlaceholderWorkspace`.
- Admin Web Promotions landing now shows summary cards, current banner preview, promotion register, and a clear `Manage Promotions` entry.
- Promotion creation/editing is behind explicit Manage mode, not dumped onto the landing page.
- OWNER can set title, body, image URL, uploaded image/GIF media, alt text, overlay text, overlay text color, font size, font style, optional expiry, activate, and deactivate.
- STAFF remains blocked from `/promotions` by Admin Web route policy and backend permission.
- End-user mobile static hardcoded promotion copy was replaced with API-driven banner rendering.
- Contractor dashboard shows the first active backend promotion as a non-blocking banner.
- Team Member scan landing shows the first active backend promotion as a compact non-blocking banner.
- Seed data now includes one visible active promotion, one expired active promotion that must not show on mobile, and one archived promotion that stays admin-history-only.

Verification:

- `npm run typecheck --workspace @volt-rewards/domain` passed.
- `npm run prisma:generate --workspace @volt-rewards/api` passed.
- `npm run typecheck --workspace @volt-rewards/api` passed.
- `npm run typecheck --workspace @volt-rewards/admin-web` passed.
- `npm run typecheck --workspace @volt-rewards/mobile` passed.
- `npm run test --workspace @volt-rewards/domain` passed: 36 tests.
- `npm run test --workspace @volt-rewards/api` passed: 87 tests, including promotions service visibility/activation/audit tests and promotion storage validation tests.
- `npm run test --workspace @volt-rewards/admin-web` passed: 13 tests, including promotion API client route coverage.
- `npm run prisma:migrate:deploy --workspace @volt-rewards/api` succeeded against Supabase shared pooler and applied `202607080001_promotions_management`.
- `npm run db:seed --workspace @volt-rewards/api` succeeded after escalated permission for `tsx` IPC and Supabase access.
- API runtime smoke:
  - `GET /api/health` returned OK.
  - OWNER `GET /api/admin-web/promotions` returned active, expired, and archived seeded promotions for management.
  - STAFF `GET /api/admin-web/promotions` returned `403`.
  - Contractor `GET /api/promotions/active` returned only `seed-promotion-monsoon-sale`; expired and archived seeded promotions were excluded.
- Temporary API smoke server process was stopped afterward to reduce process-count pressure.
- Browser availability check after implementation returned no in-app browser instances, so visible Browser UAT could not be completed in this session.

Output eval:

- Verdict: PASS for backend, Admin Web client, mobile typecheck, Supabase migration/seed, and API runtime smoke.
- Requirements covered: `PROM-001` through `PROM-006`, and Phase 22H first-pass promotions decisions.
- Explicitly deferred: Admin Mobile promotion management, targeting, scheduler, push notifications, and promotion analytics beyond audit events.
- Residual: visible Browser UAT for Admin Web `/promotions` and end-user mobile banner rendering remains queued because this session is still emitting unified exec process-count warnings and the current Browser/iab availability check returned no browser instances.

Harness learnings:

- Promotion visibility must be tested as a filtered API contract, not inferred from Admin Web list behavior.
- Admin Web management surfaces must keep creation/editing behind an explicit management entry when the landing page is meant for summary/preview.
- Storage helper changes should preserve existing media rules per feature; promotion GIF support must not widen reward catalog image acceptance.
- Temporary elevated dev servers must be stopped by PID when the original session stdin is closed.

## Local URL Conventions

- API: `http://127.0.0.1:3000/api`
- Admin Web: `http://127.0.0.1:3001`
- Admin Mobile Web: `http://127.0.0.1:3003`

Note: Phase 22H/22I temporary API/Admin Web dev sessions were closed after verification to avoid adding to the process-count issue. Start these servers when manual UAT requires them.

## Next Slice

Phase 22 visible UAT stabilization, then continue the roadmap after the active admin recovery scope.

Attempted on 2026-07-09:

- API and Admin Web dev servers were started successfully for browser UAT.
- In-app Browser remained unavailable from the browser bridge.
- Playwright fallback was attempted for OWNER login, `/reports` export/download, and `/promotions` Manage Promotions coverage, but the Playwright transport closed before execution.
- No product behavior result is claimed from this attempt.
- API and Admin Web processes were stopped afterward; ports `3000` and `3001` were verified clear.

Bring forward before implementation:

- Carry forward Phase 22H Reports residual verification: visible Browser UAT for `/reports` and real browser PDF/Excel download once browser tooling is available.
- Carry forward Phase 22I Promotions residual verification: visible Browser UAT for Admin Web `/promotions`, `Manage Promotions`, image/GIF upload, activate/deactivate, and end-user mobile banner rendering once browser tooling is stable.
- Product-grade frontend rules from `FRONTEND_EXPERIENCE_STANDARD.md` and `PRODUCT_GRADE_PLATFORM_STANDARD.md`.
- Harness rules from Phase 22G: semantic controls, exact mutation readback by entity ID, and deterministic seeded UAT state.
- User direction from 2026-07-08: do not reopen Admin Mobile polish ad-hoc; remaining Admin Mobile visible issues are parked for Phase 24 unless they directly block the active reports/export/promotion requirement.
- `PHASE_22H_REPORTS_PROMOTIONS_DECISION_CONTRACT.md` has recorded user decisions for first-pass Reports and Promotions. Reports and Promotions implementation are complete with residual visible Browser UAT queued.

Do not implement new promotions business behavior outside the approved Phase 22H decisions without a new decision record.
