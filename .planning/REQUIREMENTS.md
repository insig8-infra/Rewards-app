# Requirements: Electrician Loyalty QR Platform

**Defined:** 2026-06-04  
**Last major update:** 2026-06-13 after Volt Admin OWNER/STAFF, return-flow, and Contractors navigation clarification  
**Core Value:** The system must reliably issue one-time product QR labels from invoice data, credit rewards to the correct contractor, and give the client clear control over users, points, rewards, QR status, returns/exchanges, reports, and promotions.

## v1 Requirements

### Platform Surfaces

- [ ] **PLAT-01**: End-user app is available on Android.
- [ ] **PLAT-02**: End-user app is available on iOS.
- [ ] **PLAT-03**: Admin app is available on Android.
- [ ] **PLAT-04**: Admin app is available on iOS.
- [ ] **PLAT-05**: Admin web portal is available in browser.
- [ ] **PLAT-06**: End-user app supports easy switching between Hindi and English.
- [ ] **PLAT-07**: Android and iOS mobile apps are built using a cross-platform app stack.
- [ ] **PLAT-08**: Android app supports public Play Store launch.
- [ ] **PLAT-09**: iOS app supports public App Store launch.
- [ ] **PLAT-10**: Exact cross-platform framework is decided during architecture phase.

### Contractor And Helper Access

- [ ] **AUTH-01**: Login screen allows user to choose `Contractor` or `Helper`.
- [ ] **AUTH-02**: Contractor profile can only be created by client/admin; contractor cannot self-register.
- [ ] **AUTH-03**: Contractor login uses ContractorID as the primary account identifier.
- [ ] **AUTH-04**: If contractor record is not found, app tells contractor to contact the client for onboarding.
- [ ] **AUTH-05**: Registered contractor login requires a 4-digit MPIN known only to contractor.
- [ ] **AUTH-06**: Contractor login includes Forgot ID flow.
- [ ] **AUTH-07**: Forgot ID sends ContractorID to the contractor's registered mobile number.
- [ ] **AUTH-08**: Contractor login includes Forgot MPIN flow.
- [ ] **AUTH-09**: Forgot MPIN sends OTP to contractor's registered mobile number.
- [ ] **AUTH-10**: Contractor can reset MPIN after OTP verification.
- [ ] **AUTH-11**: Helper login does not show the full contractor/electrician list.
- [ ] **AUTH-12**: Helper enters the registered mobile number of the contractor/electrician they are currently helping.
- [ ] **AUTH-13**: System checks whether the entered mobile number belongs to a contractor registered with the retailer.
- [ ] **AUTH-14**: If the mobile number is registered, OTP is sent to that contractor.
- [ ] **AUTH-15**: Helper enters OTP received offline from contractor to log in.
- [ ] **AUTH-16**: If the mobile number is not registered, helper sees a neutral not-found state and cannot proceed.
- [ ] **AUTH-17**: Helper session is restricted to Scan QR only.
- [ ] **AUTH-18**: Contractor session exposes the full end-user app.
- [ ] **AUTH-19**: Helper session resets every day.
- [ ] **AUTH-20**: Helper login can show a Recent list with no more than one contractor.
- [ ] **AUTH-21**: Helper Recent list is populated only after successful OTP login for that registered contractor.
- [ ] **AUTH-22**: Helper Recent contractor is stored locally on the helper's device as convenience-only state.
- [ ] **AUTH-23**: Helper Recent contractor uses secure device storage, not unprotected plain local storage.
- [ ] **AUTH-24**: Helper Recent contractor does not authenticate the helper; OTP remains required for every helper login/session.
- [ ] **AUTH-25**: Helper can remove or change the Recent contractor.

### Contractor App Experience

- [ ] **CAPP-01**: Contractor home page shows Scan QR.
- [ ] **CAPP-02**: Contractor home page shows Balance Book.
- [ ] **CAPP-03**: Contractor home page shows current tier.
- [ ] **CAPP-04**: Contractor home page shows total points accumulated till date.
- [ ] **CAPP-05**: Contractor can view rewards.
- [ ] **CAPP-06**: Contractor can view reward expiry date.
- [ ] **CAPP-07**: Contractor can claim rewards.
- [ ] **CAPP-08**: Contractor app includes My Profile.
- [ ] **CAPP-09**: Contractor app includes About.
- [ ] **CAPP-10**: Contractor app includes Logout.
- [ ] **CAPP-11**: Contractor app includes standard banner/ad placements for client promotions.
- [ ] **CAPP-12**: Contractor app uses bottom navigation with Home, Scan, History, and Rewards and Points Balance.

### Helper App Experience

- [ ] **HAPP-01**: Helper screen shows selected contractor name.
- [ ] **HAPP-02**: Helper screen shows selected contractor number.
- [ ] **HAPP-03**: Helper screen shows selected contractor photo.
- [ ] **HAPP-04**: Helper screen exposes Scan QR only.
- [ ] **HAPP-05**: Helper cannot see Balance Book, total points, rewards, reward claim, profile, analytics, or sensitive contractor data beyond confirmed display fields.
- [ ] **HAPP-06**: Helper app includes standard banner/ad placements if confirmed in PRD.
- [ ] **HAPP-07**: Helper contractor selection screen uses contractor mobile number entry, not browsing/searching all contractors.
- [ ] **HAPP-08**: Helper recent contractor area shows at most one successfully used contractor.
- [ ] **HAPP-09**: Helper recent contractor area clearly acts as a shortcut/prefill, not as a logged-in session.

### QR Issuance And Lifecycle

- [ ] **QR-01**: Admin web portal landing/front page exposes `Print QR codes` as a primary workflow.
- [ ] **QR-02**: After invoice generation in BUSY, system can pull invoice details from the client database/BUSY integration through API access.
- [ ] **QR-03**: Admin web portal can show invoice metadata needed before QR printing.
- [ ] **QR-04**: Admin web portal can show invoice product line items eligible for QR printing.
- [ ] **QR-05**: Each invoice line item is pre-checked for QR printing by default.
- [ ] **QR-06**: Staff can uncheck a line item to omit it from QR printing.
- [ ] **QR-07**: Staff can reduce print quantity for a line item.
- [ ] **QR-08**: System prevents QR print quantity from exceeding the original invoiced quantity for that line item.
- [ ] **QR-09**: Admin web portal can issue the `Print QR codes` command for selected line item quantities.
- [ ] **QR-10**: System creates and tracks QR records at individual QR/unit level, linked to invoice and line item.
- [ ] **QR-11**: System stores selected/printed units against the invoice as `Printed`.
- [ ] **QR-12**: System stores skipped/unprinted units against the invoice as `Not Printed`.
- [ ] **QR-13**: Staff can later select `Not Printed` units for QR printing.
- [ ] **QR-14**: Staff can later print `Not Printed` units in one or more partial batches.
- [ ] **QR-15**: Before later printing of `Not Printed` units, system checks through API whether the product/invoice line item has any return-of-sale or returned-product entry.
- [ ] **QR-16**: System blocks later QR printing for returned product quantities.
- [ ] **QR-17**: System maintains history of which QR codes were printed and from which invoice/line item/unit.
- [ ] **QR-18**: System can show line-item level print summaries derived from individual QR/unit records.
- [ ] **QR-19**: QR expiry is 45 days for now.
- [ ] **QR-20**: QR expiry duration remains configurable for future business-rule changes.
- [ ] **QR-21**: System tracks which printed QR codes were scanned.
- [ ] **QR-22**: System tracks which QR codes have expired.
- [ ] **QR-23**: System tracks which QR codes remain unclaimed.
- [ ] **QR-24**: System tracks which scanned QR codes were reversed due to return or exchange.
- [ ] **QR-25**: QR label encodes a secure non-guessable token, not raw point logic.
- [ ] **QR-26**: QR code cannot be scanned/claimed more than once.
- [ ] **QR-27**: QR lifecycle statuses include Printed/Unclaimed, Scanned/Claimed, Expired, Reversed, Reprinted, and Cancelled.
- [ ] **QR-28**: Reprint is allowed only for unscanned and non-expired QR codes.
- [ ] **QR-29**: Cancellation is allowed only for unused/uncollected, Printed/Unclaimed, non-expired QR codes.
- [ ] **QR-30**: Reversal is allowed only for QR codes that were already collected/scanned and are Scanned/Claimed.
- [ ] **QR-31**: Expired status applies to QR codes that are unscanned and past expiry.
- [ ] **QR-32**: QR reprint generates a replacement QR token.
- [ ] **QR-33**: QR reprint invalidates the earlier QR token so the old physical label can no longer be scanned.

### Rewards, Points, And Balance

- [ ] **RWD-01**: Successful QR scan credits reward/points to selected contractor.
- [ ] **RWD-02**: Contractor can see Balance Book.
- [ ] **RWD-03**: Contractor can see total points accumulated till date.
- [ ] **RWD-04**: Contractor can see current tier such as Gold/Silver/etc.
- [ ] **RWD-05**: Contractor can view rewards and expiry dates.
- [ ] **RWD-06**: Contractor can claim reward.
- [ ] **RWD-07**: Admin can see rewards collected/given.
- [ ] **RWD-08**: Admin can reverse scanned rewards/points when return/exchange requires it.
- [ ] **RWD-09**: Reward tiers are based on points collected.
- [ ] **RWD-10**: On reaching configured thresholds, contractor becomes eligible for discount vouchers or prizes.
- [ ] **RWD-11**: Reward examples include discount vouchers and physical prizes such as an Air Fryer.
- [ ] **RWD-12**: Claimed rewards are fulfilled from the shop/counter unless later PRD decision changes this workflow.
- [ ] **RWD-13**: Admin mobile app lets OWNER or STAFF enter a contractor-provided Claim ID to verify a reward claim.
- [ ] **RWD-14**: After Claim ID verification, system sends OTP to the registered contractor mobile number before reward handover.
- [ ] **RWD-15**: OWNER or STAFF must enter the contractor OTP in the admin mobile app before marking the reward as `Fulfilled`.
- [ ] **RWD-16**: If returned QR points were claimed but not fulfilled, system unclaims/revokes that claim.
- [ ] **RWD-17**: If returned QR points were already fulfilled, system reverses points and can create a negative contractor balance.
- [ ] **RWD-18**: Points reversals are recorded in the balance book/ledger.

### Admin Web Portal

- [ ] **WEB-01**: Admin web portal can register end users.
- [ ] **WEB-02**: Admin web portal can unregister end users.
- [ ] **WEB-03**: Admin web portal can view end-user details.
- [ ] **WEB-04**: Admin web portal can view rewards collected/given.
- [ ] **WEB-05**: Admin web portal can view analytics.
- [ ] **WEB-06**: Admin web portal can run reports.
- [ ] **WEB-07**: Admin web portal manages QR print workflow.
- [ ] **WEB-08**: Admin web portal can manage advertisement/promotion banners shown in frontend apps.
- [ ] **WEB-09**: Admin web portal supports action workflows, including QR printing, contractor registration, and similar full management actions.
- [ ] **WEB-10**: Admin web portal reports QR codes printed by day, month, and 3-month period.
- [ ] **WEB-11**: QR print reports include product category and quantity.
- [ ] **WEB-12**: Admin web portal includes leaderboard of contractors by points collected.
- [ ] **WEB-13**: Admin web portal provides deep-dive analytics for each contractor.
- [ ] **WEB-14**: Admin web portal supports custom date range filtering for QR printed reports.
- [ ] **WEB-15**: Admin web portal shows invoice line item print status summaries derived from individual QR/unit records.
- [ ] **WEB-16**: Admin web portal can show QR print history, scanned status, expired status, unclaimed status, cancelled status, reprinted status, and reversed status.

### Admin Mobile Apps

- [ ] **MADM-01**: Admin mobile app is available on Android.
- [ ] **MADM-02**: Admin mobile app is available on iOS.
- [ ] **MADM-03**: Admin mobile app working name is `Volt Admin`.
- [ ] **MADM-04**: Admin mobile app does not support QR printing.
- [ ] **MADM-05**: Admin mobile app includes a return-processing QR scan function.
- [ ] **MADM-06**: Admin mobile app shows current QR status after scanning a product QR during return processing.
- [ ] **MADM-07**: If scanned QR status is unused/uncollected, Printed/Unclaimed, and non-expired, admin mobile app can cancel the QR code without showing contractor or points details.
- [ ] **MADM-08**: If scanned QR status is already collected/scanned and Scanned/Claimed, admin mobile app can reverse the credited points/reward for that QR code and then discard the QR.
- [ ] **MADM-09**: Cancel and Reverse actions use fixed reason `Product Returned`.
- [ ] **MADM-10**: Cancel and Reverse actions do not require extra proof upload.
- [ ] **MADM-11**: Cancel and Reverse confirmations require an explicit checkbox that the QR label was removed and discarded.
- [ ] **MADM-12**: Cancel scan details show product name, QR ID, and invoice number.
- [ ] **MADM-13**: Reverse scan details show product name, QR ID, invoice number, contractor name, contractor mobile number, points to reverse, and scan date.
- [ ] **MADM-14**: Reverse confirmation warns when reversal may create a negative contractor balance.
- [ ] **MADM-15**: OWNER can register new contractors from admin mobile.
- [ ] **MADM-16**: Contractor registration requires contractor name and mobile number, with optional photo.
- [ ] **MADM-17**: ContractorID is auto-generated during admin mobile contractor registration.
- [ ] **MADM-18**: Contractor registration sends a welcome SMS to the contractor mobile number with frontend app download links.
- [ ] **MADM-19**: Duplicate contractor mobile number is blocked and shows existing contractor details.
- [ ] **MADM-20**: OWNER can edit contractor name, photo, and mobile number from admin mobile.
- [ ] **MADM-21**: OWNER can deactivate/unregister contractors from admin mobile.
- [ ] **MADM-22**: STAFF can view contractor list/details but cannot add, edit, deactivate, unregister, delete profiles, or manually change points.
- [ ] **MADM-23**: Admin mobile bottom navigation uses Dashboard, Return Scan, Contractors, and More.
- [ ] **MADM-24**: OWNER dashboard shows today's scans, active contractors, pending reward pickups, QR cancelled/reversed today, top contractors, expired QR, unclaimed QR, and total points issued.
- [ ] **MADM-25**: STAFF dashboard shows read-only total QR codes printed by date/week/last week/custom dates and read-only return-scan stats.
- [ ] **MADM-26**: Admin mobile reports include QR printed by date/category, contractor leaderboard, QR status report, reward claims, returns/reversals, and product/category performance.
- [ ] **MADM-27**: STAFF can view reports but cannot export or share them.
- [ ] **MADM-28**: OWNER can export/share reports as PDF, Excel, and WhatsApp.
- [ ] **MADM-29**: Admin mobile does not need notifications/alerts for v1.
- [ ] **MADM-30**: Admin mobile profile/more includes language setting, staff management, support, about, app version, logout, privacy, and terms.
- [ ] **MADM-31**: Admin mobile supports English and Hindi, with language selected once in Profile and applied globally.
- [ ] **MADM-32**: Admin mobile does not use a screen-level language toggle.
- [ ] **MADM-33**: Admin mobile Contractors bottom-nav landing screen is Contractor Leaderboard, with manage-contractor routes below it.
- [ ] **MADM-34**: Admin mobile Reports Hub Contractor Leaderboard option is a report/export view tied to the same ranking data, not the primary contractor-management route.

### Admin Roles And Permissions

- [ ] **ROLE-01**: Admin mobile includes OWNER and STAFF personas.
- [ ] **ROLE-02**: OWNER is the store owner/master admin account created from backend.
- [ ] **ROLE-03**: OWNER logs in with registered mobile number and fixed 4-digit PIN.
- [ ] **ROLE-04**: OWNER can add staff members from admin mobile.
- [ ] **ROLE-05**: Staff member profile includes staff name, mobile number, and optional photo.
- [ ] **ROLE-06**: System generates a unique 4-digit PIN for each staff member.
- [ ] **ROLE-07**: STAFF logs in with mobile number and assigned 4-digit PIN.
- [ ] **ROLE-08**: OWNER can reset/regenerate STAFF PIN.
- [ ] **ROLE-09**: OWNER can deactivate and reactivate STAFF access.
- [ ] **ROLE-10**: OWNER and STAFF sessions stay logged in unless access is removed/deactivated, PIN changes, or the app is not opened for 4 straight days.
- [ ] **ROLE-11**: STAFF can cancel/reverse returned-product QR codes and fulfill verified reward claims.
- [ ] **ROLE-12**: STAFF cannot manually change contractor information, staff information, profile data, or points.

### Advertising And Promotions

- [ ] **ADS-01**: Frontend apps include standard banner/ad placement areas.
- [ ] **ADS-02**: Client can publish offers/promotions from admin side.
- [ ] **ADS-03**: Promotions can be shown to contractors.
- [ ] **ADS-04**: Promotions can be shown to helpers.

### BUSY Integration

- [ ] **BUSY-01**: System can connect to BUSY invoice data using client-provided SQL/API access, subject to verification.
- [ ] **BUSY-02**: System can read invoice metadata and product line items needed for QR printing.
- [ ] **BUSY-03**: System can map BUSY invoice products to QR-printable products/reward rules.
- [ ] **BUSY-04**: System avoids duplicate QR generation for the same invoice unless reprint/regeneration rules are explicitly approved.
- [ ] **BUSY-05**: System can check return-of-sale or returned-product status for invoice line items before allowing later QR printing of previously skipped quantities.
- [ ] **BUSY-06**: Exact BUSY/API field mapping will be finalized after receiving sample invoice data from the client.

## Deferred / Needs PRD Decision

- Exact cross-platform framework choice.
- Advertisement placement count, size, scheduling, targeting, and asset rules.
- Exact reward catalog, claim workflow, approval flow, fulfillment flow, and expiry rules.
- Exact automatic audit fields for admin mobile Cancel/Reverse and reward fulfillment actions.
- Exact BUSY schema/API behavior.

## Out Of Scope Until Reconfirmed

| Feature | Reason |
|---------|--------|
| Android-only app scope | Superseded by Android + iOS requirement |
| End-user-only mobile scope | Superseded by end-user app + admin app + admin web portal |
| QR embedded inside BUSY invoice | Previous clarification said QR labels print separately |
| Fully automatic QR print trigger from BUSY invoice print | Current flow remains admin web action unless PRD changes it |
| Purely view-only admin mobile app | Superseded by return-processing QR scan, cancel, and reverse actions |
| Admin mobile QR printing | QR printing remains an admin web portal workflow |
| Previous pilot cost estimate | Superseded by larger Android+iOS + admin app scope |

## Traceability

| Requirement Group | Phase | Status |
|-------------------|-------|--------|
| PLAT | TBD | Pending PRD |
| AUTH | TBD | Pending PRD |
| CAPP | TBD | Pending PRD |
| HAPP | TBD | Pending PRD |
| QR | TBD | Pending PRD |
| RWD | TBD | Pending PRD |
| WEB | TBD | Pending PRD |
| MADM | TBD | Pending PRD |
| ROLE | TBD | Pending PRD |
| ADS | TBD | Pending PRD |
| BUSY | TBD | Pending PRD |

---
*Requirements updated: 2026-06-13 after Volt Admin OWNER/STAFF, return-flow, and Contractors navigation clarification.*
