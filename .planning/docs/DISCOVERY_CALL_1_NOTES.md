# Discovery Call 1 Notes

**Date:** 2026-06-08  
**Updated:** 2026-06-09 with QR unit tracking and reversal clarification  
**Purpose:** Capture confirmed scope changes and PRD inputs from first post-contract discovery call.

> Current admin mobile note: admin role and mobile contractor-management assumptions in this historical call note were superseded on 2026-06-13. Current baseline is `Volt Admin` with OWNER and STAFF personas, OWNER mobile contractor/staff management, STAFF restricted return/reward actions, and reward fulfillment by Claim ID plus contractor OTP. See `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, and `client-deliverables/Stitch_Admin_App_Prompts.md`.

## Confirmed Platform Scope

The platform will include:

- End-user frontend app for Android and iOS.
- Admin app for Android and iOS.
- Admin web portal for browser.
- Mobile apps will use a cross-platform app stack.
- Exact cross-platform framework will be decided during architecture.
- Public Play Store and App Store launch is in scope.

## End-User Personas

### Contractor

- Contractor is registered by the client/admin from backend.
- Contractor cannot create their own profile.
- Login screen shows option to log in as `Contractor`.
- Each onboarded contractor gets a ContractorID.
- Contractor login uses ContractorID and 4-digit MPIN known only to contractor.
- Forgot ID sends ContractorID to registered mobile number.
- Forgot MPIN sends OTP to registered mobile number, then lets contractor reset MPIN.
- If contractor does not exist in our records, app asks them to contact the client to get onboarded.
- Contractor sees full app.

### Helper

- Login screen shows option to log in as `Helper`.
- Helper does not see the full contractor list.
- Helper enters the registered mobile number of the electrician/contractor they are helping.
- If the number belongs to a registered contractor, OTP goes to that contractor.
- Helper gets OTP from contractor offline and enters it.
- Helper can scan product QR codes on behalf of contractor.
- If the number is not registered, helper cannot proceed.
- Recent list shows no more than one contractor name.
- Recent list is populated only after helper successfully logs in for that registered contractor at least once.
- Recent contractor is stored locally on the helper's device using secure device storage.
- Recent contractor is convenience-only and does not replace OTP; OTP is required for every helper login/session.
- Helper can remove/change the Recent contractor.
- Helper sees only Scan QR capability.
- Helper session resets every day.
- Helper screen shows contractor name, contractor number, and contractor photo.

## End-User App Must-Haves

- Easy switch between Hindi and English.
- Contractor app bottom navigation: Home, Scan, History, Rewards and Points Balance.
- Contractor home page includes:
  - Scan QR
  - Balance Book
  - Current tier such as Gold/Silver/etc.
  - Points accumulated till date
  - Rewards section
  - Reward expiry date
  - Ability to claim reward
- Basic app pages:
  - My Profile
  - About
  - Logout
- Standard banner/ad placements for client offers/promotions.
- Ads/promotions should be visible to both Contractors and Helpers.

## Admin Web Portal Scope

Admin web portal supports:

- Manage/view end-user details.
- Register/un-register end users.
- See details around rewards collected/given.
- Analytics.
- Reports.
- QR code print mechanism:
  - `Print QR codes` should be shown on the admin web portal front/landing page.
  - After invoice generation in BUSY, invoice data reaches the client's database and our portal pulls it through API integration.
  - See current invoice details.
  - Show each invoice line item with a pre-checked checkbox.
  - Staff can uncheck products to omit them from QR printing.
  - Staff can reduce line item quantity for QR printing.
  - Staff cannot increase QR print quantity above invoice quantity.
  - Send print QR command.
  - Track QR records at individual QR/unit level, linked to invoice and line item.
  - Store selected/printed units as `Printed`.
  - Store skipped/unprinted units as `Not Printed`.
  - Let staff later select `Not Printed` units for printing in one or more partial batches only if API recheck confirms there is no return-of-sale/returned-product entry for that product/invoice line item.
  - View history of printed QR codes.
  - See which printed QR codes got scanned.
  - See which QR codes remain usable/unusable.
  - See expired QR codes.
  - See unclaimed QR codes.
  - See scanned codes that need reversal for product return or exchange.

## Admin Mobile App Scope

- Admin mobile apps exist for Android and iOS.
- Admin mobile apps are primarily for client/admin data visibility.
- Admin mobile apps should include useful data screens, such as dashboard, reports, contractor details, QR history, rewards, and analytics where useful.
- Admin mobile app includes a return-processing QR scan function.
- During return processing, admin mobile app scans the QR code on the returned product and checks status.
- If QR status is unused/uncollected, Printed/Unclaimed, and non-expired, admin mobile app can cancel the QR after the QR label is removed from the product and discarded.
- If QR status is already collected/scanned and Scanned/Claimed, admin mobile app can reverse the points credited to the contractor and discard that QR.
- Cancel/Reverse reason is fixed as `Product Returned`; no extra proof is required.
- If returned QR points were claimed but not redeemed/fulfilled, system unclaims/revokes the claim.
- If returned QR points were already redeemed/fulfilled, system reverses points and can create a negative contractor balance.
- Admin mobile app does not support QR printing.
- Admin mobile app does not support contractor registration/unregistration.

## Admin Roles

- There is one admin role for now.
- All registered admins can perform all available admin actions.

## Reward Working Assumption

- Contractor accumulates points.
- Tiers are based on how many points contractor collects.
- On hitting thresholds, contractor gets discount vouchers or prizes such as an Air Fryer.
- Contractor can claim rewards from the shop.
- Exact workflow will be discussed and finalized later.

## Analytics Confirmed So Far

- QR codes printed by day.
- QR codes printed by month.
- QR codes printed by 3-month period.
- QR print analytics include product category and quantity.
- Leaderboard showing who has collected most points.
- Deep-dive analytics for each contractor.
- Custom date range filter for QR printed reports.

## QR Lifecycle Confirmed So Far

- QR statuses: Printed/Unclaimed, Scanned/Claimed, Expired, Reversed, Reprinted, Cancelled.
- QR tracking is per individual QR/unit, not only per invoice line item.
- QR expiry is 45 days for now and can be changed later if needed.
- Reprint is possible only for unscanned and non-expired QR codes.
- Reprint uses a replacement QR token and invalidates the old QR token.
- Cancellation is possible only for unused/uncollected, Printed/Unclaimed, non-expired QR codes.
- Reversal is possible only for already collected/scanned, Scanned/Claimed QR codes.
- Expired applies to unscanned QR codes that are past expiry.

## Superseded Prior Assumptions

- Android-only end-user app is no longer current.
- Admin-only web portal is no longer sufficient; admin mobile apps are now in scope.
- Prior cost and one-page PDFs were based on pre-contract discovery and should be treated as background only until regenerated.

## PRD Drafting Notes

- Cross-platform app stack is confirmed; exact framework will be selected during architecture.
- Do not assume app store/internal distribution strategy yet.
- Do not assume exact reward claim flow.
- Do not assume exact admin mobile dashboard/report screen list.
- Do not assume exact cancel/reverse confirmation UI and automatic audit fields.
