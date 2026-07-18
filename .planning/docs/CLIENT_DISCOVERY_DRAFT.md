# Client Discovery Draft: Electrician Loyalty QR Platform

**Original date:** 2026-06-04  
**Updated:** 2026-06-13 after Volt Admin OWNER/STAFF clarification  
**Status:** PRD input draft

## Executive Summary

The client wants a loyalty platform for contractors/electricians and helpers. The retailer will attach secure QR labels to sold electrical products. Contractors and helpers scan those labels from end-user mobile apps to collect rewards/points for the contractor. The client manages users, rewards, QR printing, QR lifecycle, analytics, reports, and promotions through admin web and mobile surfaces.

The confirmed platform now includes Android and iOS end-user apps, Android and iOS admin apps, and a browser-based admin web portal.

Mobile apps will use a cross-platform app stack. Exact framework selection remains an architecture decision. Public Play Store and App Store launch are in scope.

## Confirmed Platform Surfaces

1. **End-user app:** Android and iOS.
2. **Admin app:** Android and iOS.
3. **Admin web portal:** Browser.

## Confirmed Personas

### Contractor

- Registered by client/admin only.
- Cannot create own profile.
- Login starts by selecting `Contractor`.
- Each onboarded contractor gets a ContractorID.
- Contractor login uses ContractorID and 4-digit MPIN.
- If contractor record does not exist, app asks them to contact client for onboarding.
- Forgot ID sends ContractorID to the registered mobile number.
- Forgot MPIN sends OTP to registered mobile number and allows MPIN reset after OTP verification.
- Sees full app.

### Helper

- Login starts by selecting `Helper`.
- Does not see the full list of registered electricians/contractors.
- Enters the registered mobile number of the contractor they are currently helping.
- If the mobile number belongs to a contractor registered with the retailer, OTP goes to that contractor.
- Helper obtains OTP from contractor offline.
- Helper enters OTP and can scan QR on behalf of contractor.
- If the mobile number is not registered, helper cannot proceed.
- On subsequent login, helper can see a Recent list with no more than one contractor name.
- Recent list is populated only after helper successfully logged in for that registered contractor at least once.
- Recent contractor is stored locally on the helper's device using secure device storage.
- Recent contractor is convenience-only and does not replace OTP; OTP is required for every helper login/session.
- Helper can remove/change the Recent contractor.
- Helper sees only Scan QR and contractor identity details: name, number, photo.
- Helper session resets every day.

## End-User App Scope

### Contractor Home Page

- Scan QR.
- Balance Book.
- Current tier such as Gold/Silver/etc.
- Points accumulated till date.
- Rewards section.
- Reward expiry date.
- Ability to claim reward.

### Helper View

- Selected contractor name.
- Selected contractor number.
- Selected contractor photo.
- Scan QR only.

### Shared / Basic App Requirements

- Hindi/English language switch.
- Contractor app bottom navigation: Home, Scan, History, Rewards and Points Balance.
- My Profile.
- About.
- Logout.
- Standard advertisement/banner placements for client offers and promotions.
- Ads/promotions are visible to both Contractors and Helpers.

## Admin Web Portal Scope

Admin web portal supports:

- End-user registration and un-registration.
- View/manage end-user details.
- View rewards collected/given.
- Analytics.
- Reports.
- Advertisement/promotion management for frontend app placements.
- QR print mechanism:
  - `Print QR codes` is shown on the admin web portal front/landing page.
  - Pull invoice details from the client database/BUSY integration after invoice generation.
  - See current invoice details.
  - Show each line item with a pre-checked checkbox.
  - Allow staff to uncheck products that should not receive QR labels.
  - Allow staff to reduce quantity if needed.
  - Prevent staff from increasing QR print quantity above invoice quantity.
  - Print QR command.
  - Track QR records at individual QR/unit level, linked to invoice and line item.
  - Store selected/printed units as `Printed`.
  - Store skipped/unprinted units as `Not Printed`.
  - Allow later printing of `Not Printed` units in one or more partial batches only after API check confirms the product/invoice line item was not returned.
  - History of printed QR codes.
  - Track QR codes printed, scanned, expired, unclaimed, usable/unusable, and reversed.
  - Identify scanned codes needing reversal for product return or exchange.

## Admin Mobile App Scope

Admin mobile apps are confirmed for Android and iOS.

Admin mobile app working name is `Volt Admin`.

Admin mobile includes OWNER and STAFF personas:

- OWNER is the store owner/master admin account created from backend.
- OWNER logs in with registered mobile number and fixed 4-digit PIN.
- OWNER can add staff members from the admin app.
- Staff member profile includes staff name, mobile number, and optional photo.
- The app generates a unique 4-digit PIN for each staff member.
- STAFF logs in with mobile number and assigned 4-digit PIN.
- OWNER can reset/regenerate staff PIN, deactivate staff, and reactivate staff.
- OWNER and STAFF sessions stay logged in unless access is removed/deactivated, PIN changes, or the app is not opened for 4 straight days.
- Admin app supports English and Hindi through a one-time Profile language setting, not a per-screen language toggle.

Confirmed admin mobile navigation:

- Bottom navigation: Dashboard, Return Scan, Contractors, More.

Confirmed contractor administration:

- OWNER can register new contractors from admin mobile.
- Contractor registration requires contractor name and mobile number; photo is optional.
- ContractorID is auto-generated.
- Registration sends a welcome SMS to the contractor mobile number with frontend app download links.
- Duplicate contractor mobile number is blocked and shows existing contractor details.
- OWNER can edit contractor name, photo, and mobile number.
- OWNER can deactivate/unregister contractors.
- STAFF can view contractor list/details but cannot add, edit, deactivate, unregister, delete profiles, or manually change points.

Confirmed admin mobile return workflow:

- OWNER or STAFF scans the QR code on a product brought for return.
- App checks and shows QR status.
- If status is unused/uncollected, Printed/Unclaimed, and non-expired, app allows Cancel after the QR label is removed from the product and discarded.
- Cancel scan details show product name, QR ID, and invoice number only; no contractor, points, balance, or Reverse action appears.
- If status is already collected/scanned and Scanned/Claimed, app allows Reverse to reverse the points credited to the contractor for that QR and discard the QR.
- Reverse scan details show product name, QR ID, invoice number, contractor name, contractor mobile number, points to reverse, and scan date.
- Cancel/Reverse reason is fixed as `Product Returned`; no proof upload is required.
- Cancel and Reverse both require a checkbox confirming the QR label was removed and discarded.
- Reverse confirmation warns when the action may create a negative contractor balance.
- If returned QR points were claimed but not fulfilled, system unclaims/revokes the claim.
- If returned QR points were already fulfilled, system reverses points and can create a negative contractor balance.
- QR printing remains a web portal workflow.

Confirmed reward fulfillment workflow:

- OWNER and STAFF can fulfill reward claims at the counter.
- Admin enters Claim ID shown by the contractor.
- App verifies the claim.
- App sends OTP to the registered contractor mobile number.
- OWNER/STAFF enters the OTP in Volt Admin.
- After OTP verification and handover, OWNER/STAFF marks the claim as `Fulfilled`.

Confirmed dashboards and reports:

- OWNER dashboard shows today's scans, active contractors, pending reward pickups, QR cancelled/reversed today, top contractors, expired QR, unclaimed QR, and total points issued.
- STAFF dashboard shows read-only total QR codes printed by date/week/last week/custom dates and read-only return-scan stats.
- Reports include QR printed by date/category, contractor leaderboard, QR status report, reward claims, returns/reversals, and product/category performance.
- Contractors bottom navigation opens Contractor Leaderboard first, with manage-contractor routes below it.
- Reports Hub Contractor Leaderboard is a report/export route tied to the same ranking data, not the main contractor-management route.
- STAFF reports are view-only.
- OWNER can export/share reports as PDF, Excel, and WhatsApp.
- Admin mobile notifications/alerts are not needed for v1.
- More/Profile includes language setting, staff management, support, about, app version, logout, privacy, and terms.

## Reward Working Assumption

- Contractor accumulates points.
- Tiers are based on points collected.
- On hitting configured thresholds, contractor gets discount vouchers or prizes such as an Air Fryer.
- Contractor can claim rewards from the shop.
- Reward handover/fulfillment is verified in Volt Admin by Claim ID plus OTP sent to the registered contractor mobile number.

## Analytics Confirmed So Far

- QR codes printed by day, week, last week, month, 3-month period, and custom date range where relevant.
- Custom date range filter for QR printed reports.
- QR print analytics include product category and quantity.
- Contractor leaderboard by points collected.
- Deep-dive analytics for each contractor.
- QR status reporting.
- Reward claims reporting.
- Returns/reversals reporting.
- Product/category performance reporting.

## QR Lifecycle Confirmed So Far

- QR statuses: Printed/Unclaimed, Scanned/Claimed, Expired, Reversed, Reprinted, Cancelled.
- QR tracking is per individual QR/unit, not only per invoice line item.
- QR expiry is 45 days for now and can be changed later if needed.
- Reprint is possible only for unscanned and non-expired QR codes.
- Reprint uses a replacement QR token and invalidates the old QR token.
- Cancellation is possible only for unused/uncollected, Printed/Unclaimed, non-expired QR codes.
- Reversal is possible only for already collected/scanned, Scanned/Claimed QR codes.
- Expired applies to unscanned QR codes that are past expiry.

## Existing QR / BUSY Workflow Context

- BUSY remains expected invoice source.
- Previous direction: QR codes are printed separately from the BUSY invoice, not embedded in invoice layout.
- Admin web portal is expected to show invoice details and issue QR print command from the front/landing page.
- Client previously indicated SQL/API access can be provided, but exact BUSY setup remains unverified.
- For later printing of skipped quantities, system must check through API for return-of-sale or returned-product entry before allowing print.
- Exact BUSY/API fields will be finalized after the client shares sample invoice data.

## Admin Roles Confirmed So Far

- Admin mobile has OWNER and STAFF personas.
- OWNER is the master store admin.
- STAFF has restricted access for return QR Cancel/Reverse, reward fulfillment, view-only contractors, view-only dashboard, and view-only reports.
- STAFF cannot add/edit/deactivate contractors, manage staff, manually change points, export reports, or alter master data.

## Superseded Prior Understanding

- Android-only end-user app is superseded.
- Admin web-only management is superseded by admin mobile apps + web portal.
- Previous cost and one-page documents are background only until regenerated.

## PRD Open Items

- Exact cross-platform framework.
- Exact automatic audit fields for admin mobile Cancel/Reverse and reward fulfillment.
- Exact ad/banner management flow.
- BUSY version/schema/API.

---
*This document is now PRD input, not a finalized PRD. Last updated 2026-06-13 after Volt Admin OWNER/STAFF clarification.*
