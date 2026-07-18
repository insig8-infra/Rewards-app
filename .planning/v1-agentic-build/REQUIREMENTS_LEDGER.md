# Requirements Ledger - Volt Rewards V1

Source: `app-requirementsV1.md`

This ledger normalizes the free-form requirements into stable IDs for planning, tests, and traceability. It intentionally reflects the new v1 requirement file rather than older planning documents.

## Platform

- **PLAT-001**: End-user app working name is `Volt Rewards`.
- **PLAT-002**: End-user app is available on Android and iOS.
- **PLAT-003**: Admin app is available on Android and iOS.
- **PLAT-004**: Mobile apps use a cross-platform stack.
- **PLAT-005**: Admin web portal is available in browser.
- **PLAT-006**: Android and iOS apps support public Play Store and App Store launch.
- **PLAT-007**: End-user app supports Hindi and English switching on every screen/page for Contractor and Team Member personas.
- **PLAT-008**: Mobile app implementation should be Play Store and App Store ready from the start, including native-permission discipline, release-build compatibility, privacy-safe storage, and avoidance of shortcuts that would block public launch.
- **PLAT-009**: Mobile apps must behave like real apps with an auth stack, authenticated navigation stack, top-level tabs, workflow/detail screens, visible back affordances, and planned Android hardware-back behavior.
- **PLAT-010**: User-facing seeded/mock/UAT data must use realistic human names, realistic sites, realistic electrical-shop products, and realistic reward content; placeholder labels such as `Demo Contractor`, `Runtime Gate Contractor`, `UAT Contractor`, or `Isolated Contractor` are test-only and must not appear in client-facing UAT/screenshots.
- **PLAT-011**: Contractor human name is sourced from persisted `User.displayName` unless a future approved identity model separates display name, legal name, and business/shop name.
- **PLAT-012**: Every product-grade UI phase must include screen map, navigation/back behavior, dashboard impact, data identity, asset strategy, and visible-control UAT evidence.
- **PLAT-013**: Client-approved mobile UI/UX direction is the Stitch screenshot set in `Sample_References/Screenshots from Stitch/`, documented in `APPROVED_STITCH_UI_CONTRACT.md`.
- **PLAT-014**: End-user mobile and Admin Mobile phases must cite the applicable approved Stitch screen pattern and verify screenshots against it before claiming product-grade UI completion.
- **PLAT-015**: Existing mobile baselines from Phase 16 and Phase 17 must receive a visual-system alignment pass before deep feature expansion, so future screens do not compound inconsistent UI.

## End-User Auth And Access

- **AUTH-001**: Contractor profiles are created by client/admin only; no contractor self-registration.
- **AUTH-002**: Login screen allows user to choose `Contractor` or `Team Member`.
- **AUTH-003**: Contractor login verifies contractor exists.
- **AUTH-004**: Contractor login uses registered mobile number and 4-digit MPIN.
- **AUTH-005**: Temporary one-time MPIN is sent with welcome message.
- **AUTH-006**: First contractor login shows SET MPIN and requires contractor to set own 4-digit MPIN.
- **AUTH-007**: Contractor can change MPIN from profile by entering old MPIN, new MPIN, and confirm new MPIN.
- **AUTH-008**: Forgot MPIN flow tells contractor to contact retailer/admin; OWNER resets a temporary MPIN and contractor should set their own MPIN again after login.
- **AUTH-009**: Contractor not found state tells user to contact retailer for onboarding.
- **AUTH-010**: Team Member login does not show full contractor list.
- **AUTH-011**: Team Member enters contractor registered mobile number and may optionally select it from phone contacts; contacts access is helpful but not mandatory.
- **AUTH-012**: If mobile number belongs to a registered contractor, OTP is sent to that contractor.
- **AUTH-013**: Team Member receives OTP offline from contractor and enters it.
- **AUTH-014**: If mobile number is not registered, Team Member sees neutral not-found state and cannot proceed.
- **AUTH-015**: Team Member login shows Recent list with no more than one contractor.
- **AUTH-016**: Team Member Recent is populated only after successful OTP login for that contractor.
- **AUTH-017**: Team Member Recent is stored locally as convenience-only state.
- **AUTH-018**: Team Member Recent uses secure device storage, not unprotected local storage.
- **AUTH-019**: Team Member Recent never replaces OTP; OTP is required every session.
- **AUTH-020**: Team Member can remove/change Recent contractor.
- **AUTH-021**: Team Member session resets daily.
- **AUTH-022**: Team Member access is restricted to site selection, QR scanning, and Scan History.
- **AUTH-023**: Contractor login exposes the full end-user app.
- **AUTH-024**: Temporary contractor MPIN created by OWNER reset is valid for 5 days.
- **AUTH-025**: OWNER can reset contractor MPIN from Admin Web and Admin Mobile.
- **AUTH-026**: Team Member is a temporary session actor, not a saved user profile, unless a later approved requirement needs durable Team Member profiles.
- **AUTH-027**: End-user app masked MPIN fields, including Contractor login, SET MPIN, and Change MPIN, must include a visible reveal/hide control so users can confirm the PIN they are entering.

## Contractor Sites And Scanning

- **SITE-001**: Contractor home shows `Your Sites`.
- **SITE-002**: Contractor can create a new site with client name, flat/apartment number, building name, area, and city.
- **SITE-003**: Contractor can manage sites, including edit and remove.
- **SITE-004**: Site selection must use a scalable list/sheet/search pattern rather than small tiles inside Scan QR when the contractor can have many sites.
- **SITE-005**: Contractor must select a site before scanning QR.
- **SITE-006**: Contractor continues scanning within selected site until switching site.
- **SITE-007**: Team Member sees active site tiles for selected contractor before scan.
- **SITE-008**: Team Member must select a site before scanning QR.
- **SITE-009**: Team Member cannot create, edit, or delete sites.
- **SITE-010**: Sites that already have scan history should be archived/inactivated rather than hard-deleted, so historical scans and reports keep their site reference.
- **SITE-011**: End-user mobile must not silently rely on a default selected site when starting a QR scan batch; Scan QR entry must first confirm/select the active site for that batch.
- **SITE-012**: In end-user mobile site lists, tapping a site selects it and returns the user to the relevant dashboard/scan context; `View Details` is the only action that opens the site detail page.
- **SITE-013**: If a Team Member tries to scan/select a site for a contractor with no active sites, the app shows a user-facing message naming the contractor and asking the contractor to create a site first.
- **SITE-014**: Every visit to the Scan QR workflow by Contractor or Team Member starts with no default scan-site selected; the user must explicitly select a site for that scan batch.
- **SITE-015**: Scan frame/scanner controls remain hidden until a site is explicitly selected, and `Add to account` clears the active scan-site selection for the next batch while preserving retryable reserved-cart items if a technical commit failure occurs.

## Contractor App

- **CAPP-001**: Contractor bottom navigation is Home, Scan, Scan History, Rewards.
- **CAPP-002**: Contractor home shows profile picture at top right.
- **CAPP-003**: Profile picture opens My Profile, About, Logout, and Help & Support.
- **CAPP-004**: Help & Support shows FAQs and retailer contact phone number.
- **CAPP-005**: Contractor home shows Scan QR.
- **CAPP-006**: Contractor home shows current tier, total accumulated points, and points available.
- **CAPP-007**: Contractor home shows top rewards up for claim, soon-to-expire claims, or soon-to-reach rewards.
- **CAPP-008**: Contractor home supports reward claim/redeem action.
- **CAPP-009**: End-user app includes banner/ad placements for client offers/promotions.
- **CAPP-010**: Banner/ad placements appear for Contractor and Team Member personas.
  - Phase 22H decision note: first-pass promotions are all-user advertisement banners on dashboard/high-attention placements; no tier/city/category/persona targeting initially.
  - Phase 22I implementation note: active, non-expired, all-user promotions now render from backend data on Contractor dashboard and Team Member scan landing. Expired/archived promotions are excluded from the mobile active endpoint.
- **CAPP-011**: Contractor login lands on the main dashboard screen, not directly inside a secondary workflow.
- **CAPP-012**: Contractor dashboard shows human contractor name, photo/avatar, mobile, tier, available points, total accumulated points, primary Scan QR action, selected-site context, recent activity, and relevant reward prompts.
- **CAPP-013**: Contractor workflow screens such as site create/edit, scan result, reward detail, reward claim, Balance Book entry detail, profile, Help, and About have clear navigation and back behavior.
- **CAPP-014**: Contractor profile supports set, edit, and remove profile picture with device picker, validation, persistence, readback, and clear error states.
- **CAPP-015**: Promotion banner header and description must render outside or above the image region unless an approved image-safe treatment is documented for that banner.
- **CAPP-016**: End-user mobile UI must use production-grade icon-led controls where a familiar icon affordance is expected, including PIN reveal/hide, tab actions, scan-state markers, and row action controls.
- **CAPP-017**: End-user mobile must use points terminology for QR value, reward cost, balance, scan cart, and Scan History; rupee/`Rs.` labels are allowed only for actual monetary fields such as invoice amount or admin-only reward value in INR.

## Team Member App

- **TMEM-001**: Team Member screen shows contractor name.
- **TMEM-002**: Team Member screen shows contractor number.
- **TMEM-003**: Team Member screen shows contractor photo.
- **TMEM-004**: Team Member screen exposes Scan QR only plus allowed site selection and Scan History.
- **TMEM-005**: Team Member cannot create, edit, or delete contractor sites.
- **TMEM-006**: Team Member landing experience is limited and scan-first, while still showing contractor human name, contractor mobile, contractor photo if available, selected-site context, Scan QR, and permitted Scan History.
- **TMEM-007**: Team Member app navigation must not expose Contractor-only Rewards, Balance Book, profile management, contractor analytics, or site-management actions.
- **TMEM-008**: Team Member landing must frame the session as access under the selected contractor, not as a contractor profile owned by the Team Member.
- **TMEM-009**: Team Member temporary-access and permission copy must be user-facing and must not expose internal implementation language.

## Scan History

- **SCAN-001**: Scan History is only QR scan history, not reward redemption history.
- **SCAN-002**: Scan History shows successful scans.
- **SCAN-003**: Scan History shows unsuccessful scans and reason for failure.
- **SCAN-004**: Scan History shows scanned/collected but unredeemed points reversed due to product return.
- **SCAN-005**: Scan History shows QR code ID.
- **SCAN-006**: Scan History shows whether scanner was contractor or Team Member.
- **SCAN-007**: If scanner was Team Member, Scan History shows Team Member mobile number.
- **SCAN-008**: Scan History has filters by scan type/status.
- **SCAN-009**: Error attempts and error type are stored for future issue solving.
- **SCAN-010**: Team Member scan attempts are stored with contractor id, selected site id, Team Member mobile number, and Team Member session id/device context where available.
- **SCAN-011**: Contractor Scan History shows full contractor scan history across all sites and Team Member scans under that contractor.
- **SCAN-012**: Team Member Scan History shows only scans for sites that the Team Member has scanned for or attempted to scan for in their allowed session/history scope.
- **SCAN-013**: Contractor and Team Member scan flow supports a site-first batch model: select/confirm site, successfully scan multiple QR units into a persistent reserved cart, review scanned items and total points, then press `Add to account`.
- **SCAN-014**: Scan batch review shows every successfully scanned reserved cart item with product/reference, per-item status, QR value, points to credit, total points to collect, remove/retry controls, and success/error recovery paths.
- **SCAN-015**: Failed, invalid, expired, duplicate, or already-claimed scan attempts must not display points as credited; if QR value is useful, it must be labeled separately from credited points.
- **SCAN-016**: Scan detail screens must use a uniform field schema across success, failure, duplicate/already-claimed, expired, invalid, reversed, and cancelled attempts, with role-appropriate visibility.
- **SCAN-017**: Failed scans never enter the reserved cart; they are recorded as failed scan attempts only.
- **SCAN-018**: A successfully scanned QR is reserved server-side immediately and persists across app visits until `Add to account` credits it, the user removes it, or an approved invalidation rule applies.
- **SCAN-019**: If `Add to account` fails due a technical issue such as network/API failure, reserved cart items remain in the cart and the user can retry the commit.
- **SCAN-020**: Reserved scan cart has no point-value cap for v1; valid high-value QR tokens must reserve successfully when site/session/token rules pass.
- **SCAN-021**: Reserved-but-not-credited QR units must have a clear user/admin-facing status label distinct from failed scans and credited/claimed scans; final copy is a phase planning question.
- **SCAN-022**: If a reserved cart has items and the user tries to leave the selected site's Scan flow, the app prompts them to `Add to account` or stay/go back to Scan instead of rejecting scans due to cart value.
- **SCAN-023**: Reserved cart and Scan History detail surfaces must provide a visible shortcut to `Add to account` when there are reserved-but-not-credited items.
- **SCAN-024**: Each scan batch is scoped to the site selected for that batch. After successful `Add to account`, the next batch must require a fresh site selection.

## Rewards And Balance Book

- **RWD-001**: Rewards section contains Balance Book and Redeem/catalog.
- **RWD-002**: Balance Book shows reward-related activity in chronological order.
- **RWD-003**: Balance Book shows points redeemed, reward, date, time, reversal events, reversal stage, and balance after each activity.
- **RWD-004**: Balance Book supports date and type filters.
- **RWD-005**: Redeem option shows full reward catalog.
- **RWD-006**: Catalog shows rewards eligible for redemption.
- **RWD-007**: Catalog shows rewards close to eligibility.
- **RWD-008**: Reward detail page has `Get Now`.
- **RWD-009**: `Get Now` is active only when contractor has enough points and tier eligibility.
- **RWD-010**: Ineligible reward action is disabled with message such as `Collect 2000 more points to Get this`.
- **RWD-011**: `Claim Raised` reward tile shows Claim ID.
- **RWD-012**: `Claim Raised` means contractor chose the reward but has not physically collected it.
- **RWD-013**: Once physically collected, reward shows `Delivered`.
- **RWD-014**: Contractor can cancel/change a chosen reward before physical collection.
- **RWD-015**: Canceling chosen reward restores deducted points.
- **RWD-016**: Canceling chosen reward recalculates available rewards and tier.
- **RWD-017**: Balance Book reflects reward cancellation and restored points.
- **RWD-018**: Reward tiers are Silver, Gold, Platinum, and Diamond.
- **RWD-019**: Reward tiles visually show how far the contractor is from unlocking or affording a reward.
- **RWD-020**: Total accumulated points are lifetime gross and do not decrease when points are later reversed.
- **RWD-021**: Points Available is the current redeemable balance and can become negative after post-fulfillment QR reversal.
- **RWD-022**: OTP initiation does not block contractor cancellation; OWNER Fulfilled/Delivered marking is the cancellation cutoff.
- **RWD-023**: QR scan reward points are resolved from the managed BUSY `TempItemCode` / `tmpItemCode` reward-rule table at QR print time, then copied onto printed QR units so later ItemCode rule changes do not alter already printed QR rewards.
- **RWD-024**: Reward tiles and reward detail screens show a reward image or documented temporary image asset, reward name, category/type where useful, required points, required tier where applicable, status, visual progress, gap copy, Claim ID when chosen, and a clear primary action or disabled reason.
- **RWD-025**: Reward catalog data must support replaceable images through catalog media fields such as `imageUrl`; final client images can be replaced without changing reward ledger logic.
- **RWD-026**: Contractor-facing reward statuses are exactly `Locked`, `Get Now`, `Claim Raised`, and `Delivered`; internal cancellation/revocation states are shown through Balance Book/history, not as active catalog statuses.
- **RWD-027**: Every `Get Now` action creates a Claim ID and deducts the reward points value until cancellation/restoration or delivery.
- **RWD-028**: If a contractor cancels before delivery, the Claim ID ceases to be fulfillable, points are restored, and only a historical/development record remains.
- **RWD-029**: Before OTP send and before final delivery, the backend must re-check that the claim is still `Claim Raised`.
- **RWD-030**: Reward catalog is OWNER-managed content, not hardcoded app content. It must support reward code/SKU, name, quick description, multiple images, internal reward value in INR, contractor-facing required points, tier requirement where applicable, quantity, status, and audit metadata.
- **RWD-031**: Reward Value in INR and Quantity are internal admin metrics and must not be shown to contractors unless later approved.
- **RWD-032**: Contractor catalog must hide inactive, draft/image-less, and sold-out rewards from general browsing.
- **RWD-033**: Existing contractor-specific active claims and historical reward records remain visible even when the underlying reward is later inactive or sold out.
- **RWD-034**: Reward availability is derived from stock and claims: `available quantity = total quantity - active Claim Raised reservations - Delivered claims`.
- **RWD-035**: `Claim Raised` reserves one reward unit; contractor cancellation or claim revocation releases that unit; Delivered consumes the unit permanently.
- **RWD-036**: OWNER cannot reduce reward total quantity below already reserved plus delivered quantity unless a future approved over-allocation workflow exists.
- **RWD-037**: CSV upload must support reward catalog create/update with validation preview before commit and use a stable reward code/SKU as the upsert key.
- **RWD-038**: CSV-created or CSV-updated rewards without at least one image remain draft/incomplete and cannot appear in the contractor catalog.
- **RWD-039**: OWNER must upload at least one image before a reward can be activated/published.
- **RWD-040**: Reward catalog image upload must use the same product-grade device-upload control pattern as profile photos: visible user-facing button, native browser/app picker, PNG/JPG/JPEG-only validation, under-2MB validation, error state, persistence readback, and visible-control UAT.
- **RWD-041**: Reward tiles must not truncate essential reward name, quick description, required points, status, progress, gap copy, or Claim ID at supported mobile viewport widths; use detail expansion for secondary copy instead of hiding critical meaning.

## Admin Web Portal

- **WEB-001**: Admin web working name is `Volt Admin Web Portal`.
- **WEB-002**: Admin web supports contractor registration and un-registration.
- **WEB-003**: Admin web shows contractor details, rewards collected/given, analytics, and reports.
- **WEB-004**: Admin web landing/front page shows `Print QR codes`.
- **WEB-005**: Admin web pulls invoice details from client database/BUSY integration after invoice generation.
- **WEB-006**: Admin web QR print flow shows invoice details.
- **WEB-007**: QR print flow shows pre-checked line items.
- **WEB-008**: QR print flow allows check/uncheck products.
- **WEB-009**: QR print flow allows quantity reduction.
- **WEB-010**: QR print flow issues print command.
- **WEB-011**: QR print flow shows print history.
- **WEB-012**: QR print quantity cannot exceed invoiced quantity.
- **WEB-013**: Admin web owns QR printing and full browser-based admin management workflows.
- **WEB-014**: Admin web supports all non-camera OWNER/STAFF workflows available in Admin Mobile.
- **WEB-015**: Admin web supports dashboards, contractor management, staff management, reward fulfillment, reports/exports, promotions, analytics, and admin management screens according to role permissions.
- **WEB-016**: Returned-product QR status scan, cancel, and reverse remain Admin Mobile only in v1 because they require mobile camera scanning of the returned product QR and label-removed/discarded confirmation.
- **WEB-017**: Admin web must not expose returned-product QR status scan, cancel, or reverse controls unless a future approved non-camera verification method exists.
- **WEB-018**: Until actual BUSY API integration is available, mock BUSY invoices must use realistic electric-shop invoice data with invoice number, date/time, seller/customer GST details, taxable totals, GST totals, final total, and product line items such as Havells Wire, Atomberg Fans, Wipro Bulbs, switches, MCBs, and related electrical goods.
- **WEB-019**: Production BUSY integration must ingest sale invoice and return invoice events through Volt Rewards backend APIs, not direct database writes from the BUSY local server. A full return invoice contains all original sale line items and quantities.
- **WEB-020**: BUSY integration must support idempotent real-time or near-real-time sync so retries do not duplicate invoices, line items, or QR unit placeholders.
- **WEB-021**: Contractor name and mobile number are immutable after registration; Admin Web can update contractor photo/status and must use deactivate plus new registration for incorrect identity data.
- **WEB-022**: Admin Web must use real OWNER/STAFF authentication for product UAT and production readiness; development actor switching is not product-grade.
- **WEB-023**: BUSY Return of Sale vouchers must be ingested and persisted separately from original sale invoices, linked back to the original sale invoice, and excluded from the Admin Web QR Print Queue.
- **WEB-024**: Admin Web invoice detail/read models must expose linked return history, returned quantity, printable quantity, and allocation status without treating the original BUSY sale invoice as mutated source data.
- **WEB-025**: Admin Web QR Print screen must distinguish source ingestion (`Sync from BUSY`) from persisted queue refresh (`Refresh queue`) and show the latest BUSY sync/import timestamp.
- **WEB-026**: Admin Web contractor and staff photo controls must use reliable device upload from the browser rather than photo URL entry for product UAT.
- **WEB-027**: Admin Web staff photo updates are allowed for OWNER on any staff profile and for STAFF only on their own `/profile`; STAFF must not gain staff-management route access.
- **WEB-028**: Admin Web BUSY Sync is a compact source-ingestion/status panel, not an invoice browser; QR Print Queue is the only invoice-selection surface.
- **WEB-029**: Dashboard ready-for-print attention items must deep-link into the QR Print Queue with the target invoice selected and line details opened.
- **WEB-030**: Latest BUSY sync time must update from sync/import audit events, including idempotent sync attempts where invoices already exist.
- **WEB-031**: Admin Web dense operational invoice data must use structured data-table layouts with one header row per table, not repeated per-row mini header/fact labels.
- **WEB-032**: Admin Web Rewards must expose an OWNER-only active Claim Desk with reward-claim list, search/filter/sort, Claim ID lookup, contractor/reward verification, OTP send, and Delivered marking only when backend claim eligibility allows it.
- **WEB-033**: Admin Web Rewards must expose Reward History to OWNER and STAFF, including Contractor Name, Contractor Phone Number, Reward Name, Reward Points spent, Claimed Date/Time, Fulfilled Date/Time where present, and lifecycle development.
- **WEB-034**: Admin Web Claim Desk lists active `Claim Raised` requests only; cancelled/revoked/delivered claims belong in Reward History and must not appear as fulfillable work.
- **WEB-035**: Admin Web reward claim details must show claim-related fields only and must not show contractor account totals such as `Available Balance` or `Lifetime Total` inside the claim detail panel.
- **WEB-036**: Admin Web Rewards must include OWNER-only Reward Catalog Management alongside Claim Desk and Reward History.
- **WEB-037**: Admin Web Reward Catalog Management must support search/filter/sort, create/edit, multiple image upload, CSV preview/commit, deactivate/reactivate, and stock/reservation summary.
- **WEB-038**: Admin Web STAFF can view Reward History but must not see or call reward catalog management or reward fulfillment controls.
- **WEB-039**: Admin Web CSV upload must populate/update the reward catalog while requiring images before publish/activation.
- **WEB-040**: Admin Web Rewards landing must default to daily reward operations: Claim Desk for OWNER and Reward History. OWNER Reward Catalog Management must open from an explicit action/button into a nested management workspace, not render directly on the Rewards landing page.
- **WEB-041**: Admin Web OWNER/STAFF masked PIN login must include a visible reveal/hide control.
- **WEB-042**: Admin Web device-image upload controls must use a shared visible file-picker component backed by a native file input. Raw browser file inputs or hidden-input-only tests are not acceptable for product UAT.
- **WEB-043**: Admin Web Invoice Ledger must include a date-range filter using the Reports pattern, including presets and explicit `From` / `To` fields.
- **WEB-044**: Admin Web contractor registration must include an open text area for where the contractor belongs / is associated. Final production label is decided during the implementation phase.
- **WEB-045**: Admin Web Contractor Detail > Sites must drill into site-wise analytics with QR scan data, item-wise data, item value sent to the site, and points collected for that site.
- **WEB-046**: Admin Web Reward History must include a date-range filter and report-style per-column sorting.
- **WEB-047**: Admin Web Reward History must rename `Unlocked At` to `Claimed Date/Time` and add `Fulfilled Date/Time`.
- **WEB-048**: Admin Web Claim Desk must auto-refresh when the Rewards tab is opened and must list only valid fulfillable `Claim Raised` claims; stale, cancelled, revoked, and delivered claims belong in Reward History.
- **WEB-049**: Admin Web New Reward flow must system-populate Reward Code instead of requiring OWNER manual entry during normal create.
- **WEB-050**: Admin Web Promotions must support horizontal marquee text scroller controls with font type, bold, italic, and color. Font options must be capped to Hindi-safe choices.
- **WEB-051**: Admin Web must include an `ItemCodes` tab below Promotions for BUSY item-code reward-rule management.
- **WEB-052**: Admin Web Dashboard Attention Queue must flag ItemCodes where both fixed points and `% of Price` points are blank.

## ItemCodes And QR Point Rules

- **ITEM-001**: Admin Web `ItemCodes` is the operator-facing master for configurable BUSY `TempItemCode` / `tmpItemCode` reward rules.
- **ITEM-002**: BUSY-sourced ItemCode fields are TempItemCode, Item Name, Product Category, and Price; these are periodically refreshed and can also be manually refreshed.
- **ITEM-003**: Editable reward-rule fields are fixed Points and Points `% of Price`.
- **ITEM-004**: If both fixed Points and Points `% of Price` are blank, the ItemCode status is `Not In Use`.
- **ITEM-005**: If either fixed Points or Points `% of Price` is populated, the ItemCode status is `In Use`, subject to the phase decision on whether both fields can be populated together.
- **ITEM-006**: If an in-use item disappears from BUSY sync, status becomes `Not in BUSY`; it must be unavailable for future QR generation, but already printed QR units and already allocated points remain valid.
- **ITEM-007**: QR print must copy the resolved points value onto each QR unit at print time. Later ItemCode edits must not mutate printed QR point value.
- **ITEM-008**: Until production BUSY API exists, the app uses a realistic dummy ItemCodes list with fixed Points populated and Points `% of Price` blank.
- **ITEM-009**: ItemCode reward-rule edits must be permissioned and audited. The recommended default is OWNER-only edit and STAFF read-only, but final role policy must be brought forward before implementation.

## QR Lifecycle

- **QR-001**: System tracks QR printing at individual QR/unit level.
- **QR-002**: Selected/printed units are recorded as `Printed`.
- **QR-003**: Skipped/unprinted units are recorded as `Not Printed`.
- **QR-004**: Admin web can later print `Not Printed` units in partial batches.
- **QR-005**: Later `Not Printed` printing requires API check that product/invoice line item has not been returned.
- **QR-006**: QR statuses include Printed/Unclaimed, Scanned/Claimed, Expired, Cancelled, Reprinted, and Reversed.
- **QR-007**: Reprinting a QR generates replacement QR token.
- **QR-008**: Reprinting invalidates old QR token.
- **QR-009**: QR expiry is 45 days for now.
- **QR-010**: QR expiry should be configurable later.
- **QR-011**: Cancel applies only when QR is not scanned, points not collected, and QR is non-expired.
- **QR-012**: Reverse applies only when QR is already collected/scanned and Scanned/Claimed.
- **QR-013**: Cancel and reverse use fixed reason `Product Returned`.
- **QR-014**: Cancel and reverse require no proof upload.
- **QR-015**: Cancel and reverse require checkbox confirming QR label was removed and discarded.
- **QR-016**: Reverse confirmation warns if reversal may create negative contractor balance.
- **QR-017**: If returned QR points were claimed but not fulfilled, system unclaims/revokes claim.
- **QR-018**: If returned QR points were fulfilled, system reverses points and may create negative contractor balance.
- **QR-019**: When a BUSY return voucher arrives without physical Admin Mobile QR scan, returned quantity allocation consumes not-yet-printed units before printed-unscanned units and scanned units.
- **QR-020**: BUSY return import must not auto-reverse scanned/claimed QR points without an Admin Mobile physical QR scan; it creates review-needed allocation instead.
- **QR-021**: Admin Web reprint is allowed only for active unscanned `PRINTED_UNCLAIMED` or `REPRINTED` QR units that have not expired.
- **QR-022**: Admin Web reprint must be blocked for scanned/claimed, cancelled, reversed, expired, not-printed, or otherwise ineligible QR units.
- **QR-023**: Reprinting a QR unit must keep the same QR unit identity, invalidate the prior active token, create one replacement active token, set/keep status as `REPRINTED`, and audit the action.
- **QR-024**: `REPRINTED` is an active unscanned replacement-label state and remains eligible for scan, returned-product cancellation, and further reprint while active and unexpired.
- **QR-025**: Admin Web invoice and QR item status display labels must consistently render as `Not_Printed`, `Printed`, `Reprinted`, `Claimed`, `Cancelled`, and `Reversed_AND_Cancelled`; backend lifecycle enum names remain internal implementation state.

## Admin Mobile

Phase 17 baseline coverage note:

- Implemented and verified in `PHASE_17_STATUS.md`: `MADM-001`, `MADM-002`, `MADM-003`, `MADM-004`, `MADM-005`, `MADM-007`, `MADM-008`, `MADM-009`, `MADM-010`, `MADM-011` baseline dashboard/recent activity, `MADM-012` baseline dashboard, `MADM-022`, and `MADM-023`.
- Partially surfaced but not complete: `MADM-013` token-entry Return Scan surface only; native camera QR status lookup remains next slice.
- Implemented and verified in Phase 25F: `MADM-006`, `MADM-017`, `MADM-018`, `MADM-020`, `MADM-021`, `MADM-022`, `MADM-023`, `MADM-031`, and `MADM-033` role-appropriate Admin Mobile parity for Contractors, Staff, and Reports.
- Deferred/remaining dedicated slices: `MADM-014`, `MADM-015`, `MADM-019` production welcome SMS/app-link delivery, and native-device proof for `MADM-029`.

- **MADM-001**: Admin mobile working name is `Volt Admin`.
- **MADM-002**: Admin mobile includes OWNER and STAFF personas.
- **MADM-003**: Admin login screen allows user to choose OWNER or STAFF.
- **MADM-004**: OWNER is store owner/master admin account created from backend.
- **MADM-005**: OWNER logs in with registered mobile number and fixed 4-digit PIN.
- **MADM-006**: OWNER can add staff members from admin mobile.
  - Phase 25F completion note: implemented and viewport-proofed through the OWNER Reports/Operations staff-management section.
- **MADM-007**: STAFF logs in with mobile number and assigned app-generated 4-digit PIN.
- **MADM-008**: OWNER and STAFF sessions persist unless access is removed/deactivated, PIN changes, or app is not opened for 4 straight days.
- **MADM-009**: OWNER bottom navigation is Dashboard, Return Scan, Contractors, Rewards, Reports.
- **MADM-010**: STAFF bottom navigation is Dashboard, Return Scan, Contractors, Rewards, Reports; STAFF can view role-appropriate read-only/history/report surfaces but cannot access OWNER-only mutation controls.
- **MADM-011**: STAFF dashboard is limited and includes recent reverse/cancellation activity with who did it and when.
- **MADM-012**: OWNER dashboard shows profile, total contractors, QR status/category chart with date filters, staff management, reward fulfillment, and recent activity.
- **MADM-013**: OWNER and STAFF can scan returned product QR and see current status.
- **MADM-014**: OWNER and STAFF can cancel eligible QR.
- **MADM-015**: OWNER and STAFF can reverse eligible QR points.
- **MADM-016**: Contractor option includes contractor leaderboard and add-new-contractor option.
- **MADM-017**: OWNER can register contractors from admin mobile with name, mobile number, and optional photo.
  - Phase 25F completion note: implemented and viewport-proofed on Admin Mobile OWNER Contractors.
- **MADM-018**: ContractorID is auto-generated during admin mobile registration.
  - Phase 25F completion note: implemented through the existing contractor repository code-generation path and verified by visible contractor rows.
- **MADM-019**: Contractor registration sends welcome SMS with one-time temporary PIN and app download links.
  - Remaining note: not production-complete in Phase 25F. Local development still uses mocked delivery/reset-MPIN flows; production SMS/app-link delivery remains a later integration slice.
- **MADM-020**: Duplicate contractor mobile is blocked and shows existing contractor details.
  - Phase 25F completion note: backed by existing duplicate-mobile service guard and Admin Mobile registration API path.
- **MADM-021**: OWNER can update contractor photo and deactivate/unregister/reactivate contractors. Contractor name and mobile number are immutable after registration per `DEC-043`.
  - Phase 25F completion note: Admin Mobile OWNER detail exposes photo upload, reset MPIN, deactivate, and reactivate actions.
- **MADM-022**: STAFF can view contractor list/details only.
  - Phase 25F completion note: visible proof covers STAFF contractor list/detail read-only state.
- **MADM-023**: STAFF cannot add, edit, deactivate, unregister, delete profiles, manually change points, manage staff, or export/share reports.
  - Phase 25F completion note: Admin Mobile hides contractor/staff/report mutation controls from STAFF and visible proof covers read-only contractor detail.
- **MADM-024**: Only OWNER can fulfill rewards from Admin Mobile by Claim ID, active Claim Desk, claim verification, contractor OTP, OTP entry, and mark `Delivered`; STAFF can view Reward History but cannot fulfill.
  - Phase 22G completion note: implemented and verified in `PHASE_22G_ADMIN_MOBILE_REWARD_FULFILLMENT_CONTRACT.md` and `PHASE_22_STATUS.md`; post-UAT seed reset restores `CLM-ACTIVE01` and `CLM-STALE01` to `CHOSEN` for manual UAT.
- **MADM-025**: Admin mobile notifications/alerts are not needed for v1.
- **MADM-026**: Admin Mobile PIN entry for OWNER/STAFF must include reveal/hide control.
- **MADM-027**: Admin Mobile OWNER must support reward catalog management for core fields, image upload, stock summary, and deactivate/reactivate; STAFF must not access reward catalog management.
- **MADM-028**: Admin Mobile CSV upload is not required unless explicitly approved; Admin Web is the primary CSV upload surface for v1.
- **MADM-029**: Admin Mobile image upload flows must use the OS media picker with explicit permission handling, cancellation handling, selected-image readback, mutation persistence, and visible-control UAT on Expo Web plus native device/simulator before store-readiness is claimed.
- **MADM-030**: Admin Mobile PIN entry must use an icon-style reveal/hide affordance with accessibility labels instead of text-only `Show`/`Hide` controls.
- **MADM-031**: Admin Mobile dashboard metrics and counts such as Contractors, Staff, QR status, and Rewards must drill into the relevant filtered workflow or detail screen unless a phase contract explicitly defers the drilldown.
  - Phase 25F completion note: Staff metric and Reports entry now lead to live Reports/Operations with staff management; Contractors and Rewards entry paths were completed in Phase 25D/25F.
- **MADM-032**: Admin Mobile OWNER controls must be integrated as role-gated action cards or sections with clear entry paths, not loose text blocks on the dashboard.
- **MADM-033**: Admin Mobile Contractors, Staff, Reports, and Rewards tabs must match Admin Web workflow parity where role-appropriate, with explicit exclusions for camera-only returned-product cancel/reverse flows and STAFF restrictions.
  - Phase 25F completion note: Contractors, Staff, and Reports parity implemented and viewport-proofed; Rewards parity was implemented in Phase 22G/25D. Staff management remains inside Reports/Operations rather than a sixth bottom tab; STAFF has Rewards and Reports entry points with restricted/read-only behavior.
- **MADM-034**: Admin Mobile Rewards must be organized into mobile-appropriate sections or sub-tabs such as Claim Desk, Reward History, Catalog, and Fulfillment instead of stacking all workflows in one long screen.

## Reports

- **REP-001**: Reports give OWNER all information needed for platform visibility.
- **REP-002**: Reports include QR codes printed by day/week/last week/month/3-month/custom date range with product category and quantity.
- **REP-003**: Reports include contractor leaderboard by collected points.
- **REP-004**: Reports include QR status.
- **REP-005**: Reports include reward claims.
- **REP-006**: Reports include returns/reversals.
- **REP-007**: Report landing must show owner-useful platform-wide charts/graphs and attention metrics that do not change when a selected report or report filters change.
- **REP-008**: Report tables must use sticky headers, stable filter layout, per-column sort controls with ascending/descending/none states, and clear-all filter controls. This standard should be reused across other list/report surfaces where applicable.
- **REP-009**: STAFF reports are view-only.
- **REP-010**: OWNER can export/share reports as PDF, Excel, and WhatsApp.
  - Phase 22H decision note: initial reports implementation supports OWNER PDF and Excel export only. WhatsApp share is deferred and requires a later decision before implementation.
  - Phase 22H implementation note: Admin Web reports now support OWNER PDF and Excel export through guarded backend APIs, while STAFF remains view-only. WhatsApp is still deferred.
- **REP-011**: Admin Web first-pass report library is intentionally limited to QR Print Analytics, Scan History Analytics, Contractor Leaderboard, QR Status Report, Reward Claims Report, and Returns/Reversals Report. Product/Category Performance and Contractor Deep Dive are removed until they have a clearly distinct owner use case.
- **REP-012**: Reward claim reporting uses owner-facing statuses `Claim Raised`, `Delivered`, and `Claim Cancelled`. Internal revoked/return-driven claim states must not surface as a separate owner-facing status unless the business explicitly approves that lifecycle.
