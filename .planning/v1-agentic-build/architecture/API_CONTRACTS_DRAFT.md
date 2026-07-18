# API Contracts Draft

Status: Draft. Endpoint names are conceptual and should be finalized during implementation.

## Temporary Development Auth Headers

Protected backend shells support persisted bearer sessions from the mobile auth APIs. Local/dev and Admin Web test flows may still use guarded actor headers:

- `x-actor-role`
- `x-actor-user-id`
- `x-actor-contractor-id`
- `x-actor-team-member-mobile`

Protected request bodies must not include actor role or actor user id as authority. UI clients should centralize these headers in a development auth context.

Admin Web product requests go through the Next.js proxy/BFF, which forwards the bearer session from an HttpOnly cookie. Direct actor-header mode remains only for local/dev tests.

Manual UAT 1 correction: Admin Web product UAT and production readiness must use real OWNER/STAFF authentication. Guarded actor headers and role selectors are local/dev-only tooling and must not be treated as product-grade Admin Web auth after Phase 22.

Mobile auth sessions are sent as:

- `Authorization: Bearer <sessionToken>`

Session tokens are returned once by auth endpoints and only token hashes are stored in PostgreSQL.

## Runtime URL Prefix

The NestJS backend applies a global `/api` prefix.

- Local Admin Web: `http://127.0.0.1:3001`
- Local API base URL: `http://127.0.0.1:3000/api`
- Local health endpoint: `GET /api/health`

Contract paths below are written without the deployment prefix for readability; runtime clients must call them through the API base URL.

## Auth

- `POST /auth/contractor/login`
  - Implemented.
  - Input: mobile number, MPIN.
  - Output: persisted bearer session, contractor profile, and `MPIN_SETUP_REQUIRED` when temporary MPIN requires SET MPIN.
  - Temporary MPIN must be active and unexpired.

- `POST /auth/contractor/set-mpin`
  - Implemented.
  - Input: temporary session, new MPIN, confirm MPIN.
  - Output: authenticated session.
  - Behavior: stores only MPIN hash, clears temporary MPIN hash/expiry, revokes setup session, creates normal Contractor bearer session.

- `POST /auth/contractor/change-mpin`
  - Implemented.
  - Input: old MPIN, new MPIN, confirm MPIN.
  - Output: authenticated session.
  - Behavior: validates old MPIN, stores only new MPIN hash, revokes active Contractor sessions, creates replacement Contractor bearer session.

- `POST /auth/contractor/forgot-mpin`
  - Implemented.
  - Input: mobile number.
  - Output: neutral support instruction telling contractor to contact retailer/admin for MPIN reset.
  - Does not reveal whether the mobile number exists beyond approved not-found UX copy.

- `POST /admin-web/contractors/:contractorId/reset-mpin` OWNER only.
  - Implemented.
  - Input: none or reset reason.
  - Output: temporary MPIN delivery status or mocked delivery status in local/dev.
  - Behavior: creates a temporary MPIN valid for 5 days and requires contractor to set their own MPIN after login.

- `POST /admin-mobile/contractors/:contractorId/reset-mpin` OWNER only.
  - Same behavior as Admin Web reset.

- `POST /auth/team-member/request-otp`
  - Implemented.
  - Input: contractor mobile number, optional team member mobile number/device context.
  - Output: OTP challenge and mock delivery payload when contractor is active; neutral not-registered response otherwise.
  - Contacts access is optional client convenience only; manual contractor mobile entry must work.
  - OTP is stored only as hash.

- `POST /auth/team-member/verify-otp`
  - Implemented.
  - Input: contractor mobile number, OTP, optional team member mobile number/device context.
  - Output: Team Member bearer session scoped to contractor.
  - Team Member is a temporary session actor, not a saved user profile.
  - Team Member session expires at the end of the current server-local day in Phase 13.

- `POST /auth/admin/login`
  - Input: role choice OWNER/STAFF, mobile number, PIN.
  - Output: admin session and permissions.
  - Phase 22 target: Admin Web and Admin Mobile both use this real auth path unless a web-specific session endpoint is explicitly approved.

## Sites

- `GET /contractor/sites`
  - Implemented.
  - Requires actor permitted for `CONTRACTOR_MANAGE_OWN_SITE`.
  - Contractor scope comes from guarded actor context.
  - Output includes site id, contractor id, client name, optional flat/apartment, building, area, city, active/archive status, scan count, created timestamp, and updated timestamp.
- `POST /contractor/sites`
  - Implemented.
  - Requires actor permitted for `CONTRACTOR_MANAGE_OWN_SITE`.
  - Input: client name, optional flat/apartment, building, area, city.
  - Server normalizes free-text fields, creates the site for the current actor contractor, and audits `SITE_CREATED`.
- `PATCH /contractor/sites/:siteId`
  - Implemented.
  - Requires actor permitted for `CONTRACTOR_MANAGE_OWN_SITE`.
  - Only active sites owned by the current actor contractor can be edited.
  - Server audits `SITE_UPDATED`.
- `POST /contractor/sites/:siteId/archive`
  - Implemented.
  - Requires actor permitted for `CONTRACTOR_MANAGE_OWN_SITE`.
  - Soft-archives an active site owned by the current actor contractor.
  - Server audits `SITE_ARCHIVED`.
- `GET /team-member/sites`
  - Implemented.
  - Requires actor permitted for `TEAM_MEMBER_SCAN`.
  - Contractor scope comes from guarded actor context.
  - Output returns active sites only.

Team Member site endpoint is read-only and scoped to selected contractor.

Sites with scan history must be archived/inactivated rather than hard-deleted, so historical scan records and reports keep their site reference.

Current Phase 12 assumptions:

- No default-site bypass. Contractor and Team Member scans require an active selected site.
- Site fields remain free text until controlled city/area lists are approved.

## Admin Web QR Printing

- `GET /admin-web/busy/mock-invoices`
  - Temporary local/dev endpoint for mock BUSY fixtures.
  - Until actual BUSY API integration exists, mock invoice summaries include invoice number, invoice date/time, customer, GST totals, and final total from realistic electric-shop invoice fixtures.
  - Admin Web must not use this endpoint as a second operator invoice picker. It supports source-sync status only; `GET /admin-web/invoices` remains the QR Print Queue source.

- `POST /admin-web/busy/mock-import`
  - Temporary local/dev endpoint to import mock BUSY invoice data.
  - Requires actor permitted for `ADMIN_PRINT_QR`.
  - Output: invoice id, line count, and unit-level QR placeholder count.
  - Imported mock invoice raw source includes seller/customer GST details, taxable totals, GST totals, final total, and electrical product line metadata.
- `POST /admin-web/busy/mock-sync`
  - Temporary local/dev endpoint to sync all currently available mock BUSY invoices into the Volt Rewards database.
  - Requires actor permitted for `ADMIN_PRINT_QR`.
  - Output: source invoice count, imported invoice count, and latest sync timestamp.
  - Behavior: idempotently upserts existing mock invoices and still records the sync attempt time so the Admin Web latest sync indicator reflects the most recent attempted pull.
- `GET /admin-web/busy/sync-status`
  - Temporary local/dev endpoint for Admin Web source-ingestion status.
  - Requires actor permitted for `ADMIN_PRINT_QR`.
  - Output: source name, source invoice count, persisted invoice count, and latest sync/import timestamp.
  - UI contract: render as compact source status, not as an invoice browser.

- `GET /admin-web/invoices`
  - Requires actor permitted for `ADMIN_PRINT_QR`.
  - Output: persisted imported sale invoice summaries with invoice number, date/time, import time, customer/GSTIN, GST total, final total, line count, QR unit count, printed count, not-printed count, printable unit count, scanned/cancelled/reversed/returned counts, return voucher count, review-needed count, product summary, and category summary.
  - Client Demo 2 addition: supports Invoice Ledger date-range filtering using the Reports filter pattern, including presets plus explicit `from` and `to` fields.
- `GET /admin-web/invoices/:invoiceId`
  - Requires actor permitted for `ADMIN_PRINT_QR`.
  - Output: persisted sale invoice detail with seller/customer GST metadata, totals, persisted line ids, line-level product/tax metadata, printable quantities, unit-level QR ids/statuses/points/print-scan-expiry timestamps, scanned/cancelled/reversed line counts, linked return vouchers/allocations, and invoice print-run history.
- `POST /admin-web/qr/print`
  - Requires actor permitted for `ADMIN_PRINT_QR`.
  - Input: invoice id, selected line quantities.
  - Output: print job and unit QR records with raw token values for immediate label rendering.
  - Print writes are batched by QR unit and token creation so normal print runs do not depend on long per-unit interactive transactions.

- `GET /admin-web/qr/print-history`
  - Requires actor permitted for `ADMIN_PRINT_QR`.
  - Output: QR print audit history with invoice number, customer name, actor role, actor display name where available, printed unit count, line count, product summary, and printed timestamp.
- `POST /admin-web/qr/:qrUnitId/reprint`
  - Implemented.
  - Requires actor permitted for `ADMIN_PRINT_QR`.
  - Purpose: replace a printed label that was misplaced, torn, or unusable before it was scanned.
  - Input: optional `now` timestamp for deterministic local/test execution.
  - Output: replacement raw token for the same QR unit, shown once for immediate label rendering.
  - Allowed only when the QR unit status is `PRINTED_UNCLAIMED` or `REPRINTED`, the active token exists, and the QR is not expired.
  - Behavior: invalidates the old active token, creates a new active token for the same QR unit, sets/keeps the QR unit status as `REPRINTED`, and audits `QR_REPRINT`.
  - `REPRINTED` is an active unscanned replacement-label state; it remains eligible for scan, returned-product cancellation, and further reprint while active and unexpired.
  - Rejected for scanned/claimed, cancelled, reversed, expired, not-printed, or otherwise ineligible QR units with `QR_REPRINT_INVALID_STATUS` or equivalent guarded error.

## Production BUSY Integration

Canonical handoff: `client-deliverables/BUSY_API_INTEGRATION_SPEC.md`

The production BUSY connector must call Volt Rewards backend ingestion endpoints. The BUSY local server or sync process must not write directly to the Volt Rewards PostgreSQL database.

- `GET /integrations/busy/v1/health`
  - Purpose: BUSY sync process verifies connectivity and credentials.
  - Runtime path: `GET /api/integrations/busy/v1/health`.

- `POST /integrations/busy/v1/invoices/upsert`
  - Purpose: Create or update a sale invoice and line items from BUSY.
  - Required integration behavior:
    - Authenticated request using issued client credentials or HMAC signing.
    - Idempotency key per source invoice/event.
    - Stable external invoice and line identifiers.
    - Raw BUSY source retained for audit/debugging.
    - No duplicate QR unit placeholders on duplicate retry.

- No separate BUSY invoice-cancel endpoint is required in the current contract.
  - The all-lines case is ingested through the return invoice path.
  - The full return invoice must contain all original sale line items and quantities, linked back to the original sale invoice.
  - Server-side QR eligibility/audit reconciliation then follows the same return allocation rules.

- `POST /integrations/busy/v1/invoices/return`
  - Purpose: Register a full or partial Return of Sale voucher from BUSY.
  - Required integration behavior:
    - Stable linked original sale invoice reference.
    - Stable return voucher reference.
    - Return voucher type/flag proving this is Return of Sale.
    - Returned `tmpItemCode`, quantity, unit, and product name per return line.
    - Original line reference when BUSY can provide it; otherwise enough fields to allocate by original invoice + `tmpItemCode`.
    - Server-side exclusion of return vouchers from Admin Web QR printing.
    - Server-side update of original invoice return history and printable quantity.
    - Server-side allocation of returned quantity against original invoice QR units using `DEC-045`: not-yet-printed units first, printed-unscanned units as cancel-eligible candidates, and scanned/claimed units as review-needed unless an Admin Mobile physical QR scan identifies the exact unit for reversal.

Pull fallback is superseded. The current BUSY developer handoff is PUSH-only.
- `GET /busy/returns?updatedSince=&page=&pageSize=`

## Admin Web Management

Admin Web supports all non-camera OWNER/STAFF admin workflows available in Admin Mobile, using the same server-side role permissions.

- `GET /admin-web/dashboard`
  - Implemented as a read-only Admin Web endpoint.
  - Requires actor permitted for `REPORT_VIEW`.
  - Actor role comes from guarded request context.
  - OWNER: full dashboard.
  - STAFF: limited dashboard.
  - Output:
    - `actorRole`
    - `roleLabel`
    - `allowedSections`
    - `metrics.contractors`
    - `metrics.staff`
    - `metrics.invoices`
    - `metrics.qrTotal`
    - `metrics.qrNotPrinted`
    - `metrics.qrPrinted`
    - `metrics.qrScanned`
    - `metrics.qrCancelled`
    - `metrics.qrReversed`
    - `metrics.rewardClaims`
    - `recentActivity[]`

- `GET /admin-web/contractors`
  - Implemented.
  - Requires actor permitted for `ADMIN_VIEW_CONTRACTOR`.
  - OWNER and STAFF can list contractor summaries.
  - Output includes contractor id, user id, contractor code, name, mobile number, photo URL, status, tier, point totals, site count, scan count, reward claim count, created timestamp, and deactivated timestamp.
- `GET /admin-web/contractors/:contractorId`
  - Implemented.
  - Requires actor permitted for `ADMIN_VIEW_CONTRACTOR`.
  - Output includes contractor summary plus sites. Phase 26A extends site rows/details with site-wise QR scan analytics, item-wise data, item value sent to the site, and points collected for the site.
- `POST /admin-web/contractors` OWNER only.
  - Implemented.
  - Requires actor permitted for `ADMIN_REGISTER_CONTRACTOR`.
  - Input: contractor name, mobile number, optional photo URL, and Client Demo 2 open text area for where the contractor belongs / is associated.
  - Server normalizes name/mobile, blocks duplicate mobile numbers, creates linked user/contractor records, auto-generates contractor code, and audits registration.
  - Current welcome SMS behavior is mocked in audit metadata until SMS provider and temporary MPIN rules are finalized.
- `PATCH /admin-web/contractors/:contractorId` OWNER only.
  - Implemented with Phase 22D correction.
  - Requires actor permitted for `ADMIN_EDIT_CONTRACTOR`.
  - Product behavior accepts photo/profile-media update only.
  - Contractor name and mobile number are immutable after registration.
  - Backend rejects any name or mobile mutation attempt instead of relying only on client UI.
  - Audits photo update where applicable.
- `POST /admin-web/contractors/:contractorId/deactivate` OWNER only.
  - Implemented.
  - Requires actor permitted for `ADMIN_EDIT_CONTRACTOR`.
  - Soft-deactivates linked contractor and user records and audits deactivation.
- `POST /admin-web/contractors/:contractorId/reactivate` OWNER only.
  - Implemented.
  - Requires actor permitted for `ADMIN_EDIT_CONTRACTOR`.
  - Reactivates linked contractor and user records and audits reactivation.

- `GET /admin-web/staff` OWNER only.
  - Implemented.
  - Requires actor permitted for `ADMIN_MANAGE_STAFF`.
  - Output includes staff id, user id, name, mobile number, photo URL, active/deactivated status, created timestamp, last opened timestamp where available, and deactivated timestamp where applicable.
- `GET /admin-web/staff/me` STAFF self-profile.
  - Implemented.
  - Requires actor permitted for `REPORT_VIEW`.
  - Behavior: resolves the authenticated staff actor to their own staff profile.
  - Output includes the same staff summary fields for the current staff user only.
- `GET /admin-web/staff/:staffId` OWNER only.
  - Implemented.
  - Requires actor permitted for `ADMIN_MANAGE_STAFF`.
  - Output includes staff id, user id, name, mobile number, photo URL, status, created timestamp, last opened timestamp where available, created-by owner where available, and deactivated timestamp where applicable.
- `POST /admin-web/staff` OWNER only.
  - Implemented.
  - Requires actor permitted for `ADMIN_MANAGE_STAFF`.
  - Input: staff name, mobile number, and optional photo URL.
  - Behavior: normalizes name/mobile, blocks duplicate mobile numbers, creates linked `User` and `StaffProfile`, generates a 4-digit temporary PIN, stores only a PIN hash, audits staff creation, and returns the temporary PIN once for local/dev mock delivery.
- `POST /admin-web/staff/me/photo` STAFF self-profile.
  - Implemented.
  - Requires actor permitted for `REPORT_VIEW`.
  - Input: photo URL or `null`.
  - Behavior: updates only the authenticated staff user's `User.photoUrl` and audits `STAFF_PHOTO_UPDATED`.
- `POST /admin-web/staff/:staffId/photo`
  - Implemented.
  - Requires actor permitted for `REPORT_VIEW`; service-level authorization allows OWNER for any staff record and STAFF only when `staffId` belongs to their own authenticated user.
  - Input: photo URL or `null`.
  - Behavior: updates `User.photoUrl` and audits `STAFF_PHOTO_UPDATED`.
- `POST /admin-web/staff/:staffId/reset-pin` OWNER only.
  - Implemented.
  - Requires actor permitted for `ADMIN_MANAGE_STAFF`.
  - Behavior: generates a replacement 4-digit temporary PIN, stores only a PIN hash, audits reset, and returns the temporary PIN once for local/dev mock delivery.
- `POST /admin-web/staff/:staffId/deactivate` OWNER only.
  - Implemented.
  - Requires actor permitted for `ADMIN_MANAGE_STAFF`.
  - Behavior: soft-deactivates linked staff user/profile and audits deactivation.
- `POST /admin-web/staff/:staffId/reactivate` OWNER only.
  - Implemented.
  - Requires actor permitted for `ADMIN_MANAGE_STAFF`.
  - Behavior: reactivates linked staff user/profile and audits reactivation.

## Admin Web Reward Fulfillment

- `GET /admin-web/rewards/claims` OWNER only.
  - Requires actor permitted for OWNER reward fulfillment.
  - Output: active `Claim Raised` reward claims only with contractor identity/contact summary, reward item, chosen timestamp, points deducted, OTP eligibility, and whether the claim can still be delivered.
  - Admin Web uses this as the active Claim Desk read model.
  - Client Demo 2 requirement: Rewards tab open must refresh this endpoint automatically and the returned list must contain only valid fulfillable claims. Stale/cancelled/revoked/delivered claims must not be returned as active desk rows.
  - STAFF must receive forbidden response.

- `GET /admin-web/rewards/claims/history` OWNER and STAFF.
  - Requires actor permitted for reports/history view.
  - Input filters: optional date range presets and explicit `from` / `to`; sort field and direction for report-style column sorting.
  - Output: recent reward claim developments across contractors with contractor name, contractor phone, reward name, points spent, `Claimed Date/Time`, `Fulfilled Date/Time` where present, delivered/cancelled/revoked timestamps where present, and lifecycle status.
  - Cancelled/revoked claims appear here only, not in the active Claim Desk.

- `POST /admin-web/rewards/claims/lookup` OWNER only.
  - Requires actor permitted for OWNER reward fulfillment.
  - Input: Claim ID.
  - Output: claim status, contractor identity/contact summary, reward item, chosen date/time, points deducted, OTP eligibility, and whether the claim can still be fulfilled.
  - STAFF must receive forbidden response.

- `POST /admin-web/rewards/claims/:claimId/send-otp` OWNER only.
  - Requires actor permitted for OWNER reward fulfillment.
  - Sends/mock-delivers OTP to contractor mobile for physical handover confirmation.
  - Re-checks the claim is still active `Claim Raised` before sending OTP.
  - Does not mark the claim fulfilled and does not block contractor cancellation by itself.
  - Output: OTP challenge metadata suitable for local/dev testing without exposing production secrets.
  - If the claim was cancelled/revoked before handover, returns `Claim Request No longer available. History recorded.` and the UI refreshes Claim Desk/Reward History.

- `POST /admin-web/rewards/claims/:claimId/fulfill` OWNER only.
  - Requires actor permitted for OWNER reward fulfillment.
  - Input: OTP challenge id and OTP code.
  - Validates active OTP and active `Claim Raised` claim state, marks reward Delivered, records delivered timestamp and OWNER actor.
  - Output: fulfilled claim state and Balance Book marker.
  - Must reject already cancelled, revoked, fulfilled, missing, or wrong-contractor claims.

## Admin Web Reward Catalog Management

- `GET /admin-web/rewards/catalog` OWNER only.
  - Output: all reward catalog items, including draft/inactive/sold-out items, with reward code, name, quick description, image count/primary image, internal INR value, points required, tier requirement, total quantity, reserved quantity, delivered quantity, available quantity, status, and validation readiness.
  - STAFF must receive forbidden response.

- `POST /admin-web/rewards/catalog` OWNER only.
  - Input: name, quick description, internal INR value, points required, optional tier requirement, total quantity, and draft/active intent.
  - Reward code is system-populated for normal New Reward creation. CSV upsert continues to use stable reward code as the matching key.
  - Must reject invalid points/value/quantity, duplicate reward code, and active publish without at least one image.
  - Output: created catalog item read model.

- `PATCH /admin-web/rewards/catalog/:rewardId` OWNER only.
  - Input: editable catalog fields.
  - Must preserve existing `RewardClaim.rewardItemId` history.
  - Must reject quantity lower than active reservations plus delivered claims.
  - Must reject active publish without at least one image.

- `POST /admin-web/rewards/catalog/:rewardId/images` OWNER only.
  - Input: image upload payload or storage reference, alt text, and optional sort order.
  - Output: updated image list and catalog readiness.
  - Production direction is storage-backed images; temporary seeded URLs are acceptable for local/dev fixtures.

- `DELETE /admin-web/rewards/catalog/:rewardId/images/:imageId` OWNER only.
  - Removes an image when doing so does not leave an active reward without any images.

- `POST /admin-web/rewards/catalog/:rewardId/deactivate` OWNER only.
  - Hides reward from contractor general catalog without changing existing claims/history.

- `POST /admin-web/rewards/catalog/:rewardId/reactivate` OWNER only.
  - Requires valid fields, at least one image, and non-negative available quantity.

- `POST /admin-web/rewards/catalog/csv/preview` OWNER only.
  - Input: CSV file/content.
  - Output: parsed rows, create/update classification by reward code, validation errors/warnings, and commit token or normalized payload.

- `POST /admin-web/rewards/catalog/csv/commit` OWNER only.
  - Input: previously previewed valid rows.
  - Creates/updates catalog rows.
  - CSV does not satisfy image requirement unless a future approved image import mechanism exists; image-less rows remain draft/incomplete.

## Admin Web Explicit Exclusions

Admin Web does not expose returned-product QR status scan, cancel, or reverse endpoints in v1. These workflows stay on Admin Mobile because they require mobile camera scanning of the returned product QR and label-removed/discarded confirmation at the product handling point.

- No `POST /admin-web/return-scan/lookup` in v1.
- No `POST /admin-web/return-scan/:qrUnitId/cancel` in v1.
- No `POST /admin-web/return-scan/:qrUnitId/reverse` in v1.

## Admin Web ItemCodes

- `GET /admin-web/item-codes` OWNER and STAFF read.
  - Purpose: list BUSY ItemCodes and their reward-rule status.
  - Input filters: search by TempItemCode, item name, category; status filter `In Use`, `Not In Use`, `Not in BUSY`; sort by code, name, category, price, points, status, and last sync.
  - Output: TempItemCode, item name, product category, price, `Absolute Points`, `% of Price`, calculated `% of Price Points`, `Final Points`, status, BUSY presence, last sync timestamp, and audit metadata where available.

- `POST /admin-web/item-codes/refresh` OWNER-only action.
  - Purpose: refresh ItemCodes from BUSY adapter. Until production BUSY API exists, refreshes the dummy ItemCodes list.
  - Output: source count, created/updated count, missing count, latest sync timestamp, and rows needing attention because both editable reward fields are blank.

- `PATCH /admin-web/item-codes/:itemCodeId/reward-rule` OWNER-only edit; STAFF is read-only.
  - Input: exactly one active reward rule, either `Absolute Points` or `% of Price`.
  - Behavior: validates positive selected values, rejects both-rule payloads for active use, derives status, audits before/after, and does not mutate already printed QR units.

- `GET /admin-web/item-codes/attention`
  - Purpose: feed Dashboard Attention Queue.
  - Output: ItemCodes where `Absolute Points` and `% of Price` are both blank, plus missing-from-BUSY rows that may affect future QR generation.

## Scanning

- `POST /scan/qr`
  - Requires actor permitted for `QR_SCAN`.
  - Purpose: validate a QR token and reserve it into the actor's current site-specific scan cart.
  - Temporary shell input: QR token, selected site id, optional Team Member session id, and optional device context.
  - Contractor scope comes from guarded actor context.
  - Team Member mobile comes from guarded actor context and is required for Team Member scans.
  - Output on successful validation: reserved cart item, QR value, product/reference summary, selected site, and cart totals.
  - Output on failure: failure reason, `creditedPoints: 0`, optional informational QR value only when safe to expose, and no cart item.
  - Contractor and Team Member actors must select an active site before scanning.
  - Failed attempts retain contractor/site context when available but never enter the cart.
  - The v1 cart has no point-value cap. Navigation away from Scan while reserved items exist is a client/user-flow guard, not a scan rejection rule.

- `GET /scan/cart`
  - Requires actor permitted for `QR_SCAN`.
  - Purpose: return the actor's persistent reserved scan cart for the selected contractor/site context.
  - Output: reserved cart items, product/reference summaries, QR values, points pending credit, cart total, selected site, actor attribution, and any item-level errors.
  - Cart persists across app visits and is not automatically emptied by a short TTL.

- `POST /scan/cart/commit`
  - Requires actor permitted for `QR_SCAN` and a valid contractor/site/cart context.
  - Product copy/action: `Add to account`.
  - Purpose: atomically credit all currently valid reserved cart items into the contractor points ledger.
  - Output on success: credited items, total credited points, updated Points Available, updated total accumulated points, Scan History references, and cleared/remaining cart state.
  - Output on technical failure: cart remains unchanged and retryable.
  - Output on item invalidation edge case: do not credit invalidated items; keep item-level error visible until user removes/refreshes it or an approved remediation flow handles it.
  - Client Demo 2 UI contract: successful commit clears the active scan-site selection so the next Scan QR batch requires explicit site selection again. Technical failure keeps the cart retryable and must not discard reserved items.

- `GET /scan/history`
  - Implemented.
  - Requires actor permitted for `QR_SCAN`.
  - Contractor scope comes from guarded actor context.
  - Input filters: optional `siteId`, optional `result`, optional `limit`.
  - Output: scan timeline including successful reservations, committed credits, failed attempts, QR unit id, product SKU, QR value, credited points, actor type, site label, failure reason, and Team Member mobile/session attribution where the scanner was a Team Member.
  - Contractor actor output includes full contractor scan history across all sites and Team Member scans.
  - Team Member actor output must be server-filtered to scans for sites the Team Member scanned for or attempted to scan for within allowed scope.
  - Team Member restricted history must not rely on client-only filtering.
  - Does not expose raw QR token hashes.

## Rewards

- `GET /rewards/catalog`
  - Requires authenticated Contractor actor.
  - Output: configurable catalog items with id, name, description, image/display metadata, tier requirement, points required, eligibility status, current contractor tier, points available, points/tier gap, and points-based display copy.
  - Catalog should include eligible, locked, and near-eligibility rewards so tiles can show progress toward unlock.
  - General catalog must hide inactive, draft/image-less, and sold-out rewards.
  - Contractor-owned active claims and historical reward records remain visible through claim/history/balance-book flows even if the catalog item later becomes inactive or sold out.

- `GET /rewards/catalog/:rewardId`
  - Requires authenticated Contractor actor.
  - Output: reward detail, eligibility, points/tier gap, current active claim state for this contractor when present, and disabled/enabled `Redeem Now` state.
  - Must not expose internal INR value or total quantity unless a future explicit requirement approves it.

- `POST /rewards/:rewardId/redeem`
  - Requires authenticated Contractor actor.
  - Redeem allowed only when contractor has sufficient Points Available, any configured tier requirement, catalog item is active/image-backed, and available quantity remains positive.
  - Creates `Claim Raised` and reserves one unit atomically.
  - Output: Claim ID, chosen claim state, ledger entry, updated Points Available, total accumulated points, and recalculated tier/eligibility snapshot.

- `POST /rewards/claims/:claimId/cancel`
  - Requires authenticated Contractor actor who owns the claim.
  - Allowed until OWNER marks the reward Fulfilled/Delivered.
  - OTP initiation does not block cancellation.
  - Releases the reserved reward unit.
  - Output: cancelled claim state, restored points ledger entry, updated Points Available, total accumulated points, and recalculated tier/eligibility snapshot.

- `GET /rewards/balance-book`
  - Requires authenticated Contractor actor.
  - Input filters: optional date range, optional event type, optional limit.
  - Output: chronological ledger entries including scan credits, reward redeem, cancellation/restoration, fulfillment marker, QR reversal, revocation, balance after, related reward/claim/QR metadata, and negative balance indicators where applicable.

## Admin Mobile Return Scan

- `POST /admin-mobile/return-scan/lookup`
  - Input: QR token.
  - Output: QR status and eligible action.

- `POST /admin-mobile/return-scan/:qrUnitId/cancel`
  - Input: confirmation label removed/discarded.

- `POST /admin-mobile/return-scan/:qrUnitId/reverse`
  - Input: confirmation label removed/discarded.

## Admin Mobile Contractor And Staff

- `GET /admin-mobile/contractors`
- `POST /admin-mobile/contractors` OWNER only.
- `PATCH /admin-mobile/contractors/:contractorId` OWNER only.
- `POST /admin-mobile/contractors/:contractorId/deactivate` OWNER only.
- `GET /admin-mobile/staff` OWNER only.
- `POST /admin-mobile/staff` OWNER only.
- `POST /admin-mobile/staff/:staffId/reset-pin` OWNER only.
- `POST /admin-mobile/staff/:staffId/deactivate` OWNER only.

## Admin Mobile Reward Fulfillment

- `GET /admin-mobile/rewards/claims` OWNER only.
- `GET /admin-mobile/rewards/claims/history` OWNER and STAFF.
- `POST /admin-mobile/rewards/claims/lookup` OWNER only.
- `POST /admin-mobile/rewards/claims/:claimId/send-otp` OWNER only.
- `POST /admin-mobile/rewards/claims/:claimId/fulfill` OWNER only.

Admin Mobile fulfillment must follow the same active Claim Desk/history semantics as Admin Web. OWNER can deliver; STAFF can view history only.

## Admin Mobile Reward Catalog Management

- `GET /admin-mobile/rewards/catalog` OWNER only.
- `POST /admin-mobile/rewards/catalog` OWNER only.
- `PATCH /admin-mobile/rewards/catalog/:rewardId` OWNER only.
- `POST /admin-mobile/rewards/catalog/:rewardId/images` OWNER only.
- `POST /admin-mobile/rewards/catalog/:rewardId/deactivate` OWNER only.
- `POST /admin-mobile/rewards/catalog/:rewardId/reactivate` OWNER only.

Admin Mobile catalog management must follow the same backend validation as Admin Web. CSV upload may remain Admin Web-only for v1 unless explicitly approved.

## Reports

Admin Web is the primary reports/export surface. OWNER Admin Mobile may use the same report contracts where the mobile UX exposes reports.

- `GET /reports/qr-printed`
- `GET /reports/contractor-leaderboard`
- `GET /reports/qr-status`
- `GET /reports/reward-claims`
- `GET /reports/returns-reversals`
- `POST /reports/:reportType/export` OWNER only.

Manual UAT2 removed Product/Category Performance and Contractor Deep Dive from the first-pass report library. Site analytics now belongs under Contractor Detail > Sites, and ItemCodes analytics belongs under the new Admin Web ItemCodes workflow unless a later reports phase approves separate report tabs.

## Promotions

- `GET /promotions/active`
- `POST /admin-web/promotions` OWNER/admin web authorized.
- `PATCH /admin-web/promotions/:promotionId`
  - Client Demo 2 addition: promotion payloads may include horizontal marquee text settings with text, font family from a capped Hindi-safe list, bold, italic, and color.
