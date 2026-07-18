# Electrician Loyalty QR Platform

## What This Is

A loyalty platform for an electrical retailer that rewards registered contractors/electricians for recommending and using the retailer's products. End users scan secure product QR labels through mobile apps to collect points and claim rewards, while the client manages users, rewards, QR printing, reports, and analytics through admin web and mobile surfaces.

The platform now has three confirmed surface areas: end-user mobile apps for Android and iOS, admin mobile apps for Android and iOS, and an admin web portal in the browser.

## Core Value

The system must reliably issue one-time product QR labels from invoice data, credit rewards to the correct contractor, and give the client clear control over users, points, rewards, QR status, returns/exchanges, reports, and promotions.

## Requirements

### Validated

(None yet - PRD and UI/UX mockups must validate the final workflows before build.)

### Active

- [ ] End-user app working name is "Volt Rewards" and is  available on Android and iOS.
- [ ] Admin app is available on Android and iOS.
- [ ] Android and iOS mobile apps are built using a cross-platform app stack.
- [ ] Admin web portal is available in browser.
- [ ] Android and iOS apps support public Play Store and App Store launch.
- [ ] Contractor profiles are created/registered by the client/admin only; contractors cannot self-register.
- [ ] Login screen allows user to choose `Contractor` or `Team Member`.
- [ ] Contractor login verifies that the contractor exists in the system.
- [ ] Contractor login uses Registered Mobile Number and a 4-digit MPIN (Temporary One-time MPIN sent with welcome message). On first login - SET MPIN appears and Contractor sets their own 4-digit MPIN.
- Allow contractor to change their MPIN from their user profile as well - by entering old MPIN, New MPIN, Confirm New MPIN. 
- [ ] Contractor login includes Forgot MPIN flow that simply asks them to call the contractor to get the current MPIN.
- [ ] If a contractor record is not found, the app tells them to contact the retailer for onboarding.
- [ ] Team Member login does not show the full contractor list.
- [ ] Team Member enters the registered mobile number of the contractor they are currently helping. (allow them to select it from their phones contacts)
- [ ] If the mobile number belongs to a contractor registered with the retailer, OTP is sent to that contractor.
- [ ] Team Member receives the OTP offline from that contractor and enters it in the app.
- [ ] If the mobile number is not registered, Team Member is shown a neutral not-found state and cannot proceed.
- [ ] Team Member login shows a Recent list with no more than one contractor.
- [ ] Recent list is populated only after the Team Member has successfully logged in at least once for that registered contractor.
- [ ] Team Member Recent contractor is stored locally on the Team Member's device as convenience-only state.
- [ ] Team Member Recent contractor must be stored using secure device storage, not unprotected plain local storage.
- [ ] Team Member Recent contractor must never replace OTP verification; OTP is required for every Team Member login/session.
- [ ] Team Member can remove/change the Recent contractor.
- [ ] Team Member login is restricted to QR scanning only (i.e. site selection, actual scanning of QR and Scan History).
- [ ] Team Member sessions reset every day.
- [ ] Contractor login exposes the full end-user app.
- [ ] End-user app (Both Contractor and Team Member Personas) supports easy switching between Hindi and English for every screen or page.
- [ ] Contractor app uses bottom navigation: Home, Scan, Scan History, Rewards.
- [ ] Contractor home page shows Profile Pic at top right - which takes them to their profile, about, logout areas., "Your Sites", "Scan QR", Current tier (Silver/Gold etc.), total points accumulated till date, Points Available, top rewards up for claim or soon to expire claims or soon to reach rewards, and reward claim action. 
- "Your Sites" will have options to Create New Site, Manage sites
- Create Site enables the contractor to create a new project/site they are working on - "Client Name, Flat / Apartment No., Building Name, Area , City".  "Manage Sites" option - to remove, edit the site details. 
- On Scan QR - Tiles of all active sites under that contractor show up - first select the site then scan the QR code inside it. You continue to scan for that site within it. Switch to a different site to scan QR on products meant for that site.
- [ ] Team Member screen shows the contractor name, contractor number, contractor photo, and Scan QR only.On Scan QR - Tiles of all active sites under that contractor show up - first select the site then scan the QR code inside it. You continue to scan for that site within it. Switch to a different site to scan QR on products meant for that site.Team member cannot create / edit / delete any site. 
- [ ] End-user app includes standard advertisement/banner placements for offers and promotions from the client.
- [ ] Advertisement/banner placements are shown to both Contractor and Team Member personas.
- [ ] Contractor persona includes basic app pages when they click on their photo in top right - such as My Profile, About, and Logout and "Help & Support - which shows them FAQs and contact Retailer phone number".
- Scan History is basically entire History of QR Scans (Nothing related to Redemption of rewards only related to scan done for collecting the points). It should show line a timeline of all scans - successful scans, unsuccessful scans - reason for failure , If scanned (i.e. colleced) but unredeemed points were reversed due to product return, QR code ID , who was scanning - team-member or contractor , if team-member then their mobile number. It should have a filter for looking only at different types of scans. Maintaining Error attempts along with type of error is important for future issue solving. 
-Rewards section is everything related to Rewards - on click - it should take Contractor to a page that shows "Balance Book" - everything Activity related to Rewards in chronological order - how many points redeemend, on which reward those points were redeemend, date, time, if any already redeemend points were reversed, stage of reversal - pre-collecting the reward (points redeemed but reward not physically collected yet) or post-collecting the reward - reward returned to retailer, what was the points balance after every such activity. It should have appropriate date and type filters. Next to Balance Book will be "Redeem" option - that shows full catelogue of available rewards - which one are eligible for redeemption, what rewards are close to being eligible for redeemption. Every product in catelogue has "Redeem" button which opens up a product information page with "Redeem Now" button which is active/ clickable only if contractor has enough points collected, else it remains greyed out with a message on the lines of  "Collect 2000 more points to Get this". 
- Every Reward that is redeemed shows a symbol on the product tile in catelogue that indicates it is redeemed along with Claim ID. note that the contractor has simply chosen the reward here and not yet collected from the retailer. Once they collect it from the retailer , it should show a status of "Delivered / Collected". So in between Chosing a reward and actually collecting it - they can change their mind and cancel it and go for a different reward available. In this case , app should be able to reverse the deducted points, show available rewards according to collected points, tier adjusted accordingly, and Balance Book show reflect this as well. 
 
- [ ] Admin web portal working name is "Volt Admin Web Portal" and supports contractor registration and un-registration.
- [ ] Admin web portal shows contractor  details, rewards collected/given, analytics, and reports.
- [ ] Admin web portal landing/front page shows `Print QR codes`.
- [ ] Admin web portal pulls invoice details from the client database/BUSY integration after invoice generation.
- [ ] Admin web portal includes the QR print workflow: view invoice details, see pre-checked line items, check/uncheck products, reduce quantity if needed, issue print command, and view print history.
- [ ] Admin web portal does not allow QR print quantity to exceed the invoiced quantity.
- [ ] System tracks QR printing at individual QR/unit level, even when invoice data is displayed as line items with quantities.
- [ ] System records selected/printed individual units as `Printed` and skipped/unprinted individual units as `Not Printed`.
- [ ] Admin web portal can later print `Not Printed` units in one or more partial batches after checking through API that the product/invoice line item has not been returned.
- [ ] Admin web portal tracks QR status: Printed/Unclaimed, Scanned/Claimed, Expired, Cancelled, Reprinted, and Reversed.
- [ ] Reprinting a QR generates a replacement QR token and invalidates the old QR token.

- [ ] Admin mobile app working name is `Volt Admin`.
- [ ] Admin mobile apps include OWNER and STAFF personas and Login screen allows user to choose `OWNER` or `STAFF`.
- [ ] OWNER is the store owner/master admin account created from backend.
- [ ] OWNER logs in with registered mobile number and fixed 4-digit PIN.
- [ ] OWNER can add staff members from admin mobile.
- [ ] STAFF logs in with mobile number and assigned app-generated 4-digit PIN.
- [ ] OWNER and STAFF sessions persist unless access is removed/deactivated, PIN changes, or the app is not opened for 4 straight days.
- [ ] Admin mobile bottom navigation for OWNER persona is Dashboard, Return Scan, Contractors, Reports.
- [ ] Admin mobile bottom navigation for STAFF persona is Dashboard (limited view and options), Return Scan, Contractors(view only).Staff Dashboard has Recent Activity” to show only Reverse / cancellation history with Who did, at what time. 

- Owner persona Dashboard has OWNER profile (top right), total contactors onboarded, QR codes scan catgory bar chart - Printed , Scanned (collected), cancelled, reversed - with date filter (TOday, this week, last week, this month, custom date range), staff management, and reward fulfillment, Recent Activity. 
-Return-Scan include a return-processing QR scan flow.
- [ ] BOTH OWNER AND STAFF personas can scan a returned product QR code and show its current status.
- "cancel" a QR code IF it is not yet Scanned (i.e. points not collected AND QR id non-expired). 
- During return processing , a check box must be checked by OWNER or STAFF confirming that the QR label is removed from the product and discarded as a successful last step in cancelling a QR code
- [ ] BOTH OWNER AND STAFF personas can "reverse" points for an already collected/scanned Scanned/Claimed QR code during return processing, then discard that QR.
- [ ] Cancel and reverse actions use `Product Returned` as the fixed reason; no proof upload is required.
- [ ] Cancel and reverse actions require a confirmation checkbox that the QR label was removed and discarded.
- [ ] Reverse confirmation warns if reversal may create a negative contractor balance.
- [ ] If returned QR points were claimed but not fulfilled, system unclaims/revokes the claim.
- [ ] If returned QR points were already fulfilled, system reverses the points and may create a negative contractor balance. 

- [ ] QR expiry is 45 days for now, configurable later if business rule changes.
- [ ] Under COntractor option - Contractor leaderboard and options to add new contractor - OWNER can register contractors from admin mobile with contractor name, mobile number, and optional photo. 
- [ ] ContractorID is auto-generated during admin mobile contractor registration.
- [ ] Contractor registration sends a welcome SMS along with a one-time temporary PIN and a frontend app download links.
- [ ] Duplicate contractor mobile number is blocked and shows existing contractor details.
- [ ] OWNER can edit contractor name/photo/mobile and deactivate/unregister contractors from admin mobile.
- [ ] STAFF can view contractor list/details but cannot add, edit, deactivate, unregister, delete profiles, manually change points, manage staff, or export/share reports.
- [ ] Only OWNER can fulfill rewards by entering Claim ID, verifying claim, sending OTP to registered contractor mobile number, entering OTP, and marking the claim as `Fulfilled`.

- [ ] Reports give all types of report OWNER may need to see all kinds of information related to this platform.

- [ ] Reports includes QR codes printed by day/week/last week/month/3-month/custom date range with product category and quantity. It also includes contractor leaderboard by collected points, QR status, reward claims, returns/reversals, product/category performance, and deep-dive analytics for each contractor.
- [ ] STAFF reports are view-only.
- [ ] OWNER can export/share reports as PDF, Excel, and WhatsApp.
- [ ] Admin mobile notifications/alerts are not needed for v1.
- [ ] Admin web portal remains the owner of QR printing and broader full management workflows not explicitly confirmed for admin mobile.

### Out of Scope / Superseded Until Reconfirmed

- Android-only end-user pilot scope - superseded by Android + iOS requirement.
- End-user-only admin web scope - superseded by admin mobile apps + admin web portal requirement.
- Previously generated cost and one-pager deliverables - useful for background only, not current build baseline until regenerated.
- App distribution approach - not yet reconfirmed after iOS requirement.
- Exact BUSY return/status API fields and QR print edge cases - pending PRD clarification.

## Context

- Client is an electrical retailer using BUSY accounting software.
- Client previously indicated BUSY SQL database access / API integration key can be provided.
- Working assumption remains that BUSY data is available through SQL/API, but exact setup still needs verification.
- QR labels are printed separately from the invoice; QR codes do not need to be embedded inside BUSY invoice layout.
- Staff workflow from earlier discovery: staff selects invoice in admin web portal and prints QR labels separately.
- New discovery call on 2026-06-08 expanded scope from Android-only end-user app to Android+iOS end-user app, Android+iOS admin app, and web admin portal.
- QR management clarification on 2026-06-09 confirmed that QR printing happens from the admin web portal after invoice generation, while return-counter QR cancel/reverse actions can happen from admin mobile app scanning.
- Admin app clarification on 2026-06-13 confirmed Volt Admin, OWNER/STAFF personas, owner-only contractor registration and staff management, staff-limited return/reward actions, reward fulfillment by Claim ID plus contractor OTP, and mobile reports.
- The next project step is PRD creation followed by UI/UX mockups for frontend/admin surfaces.

## Constraints

- **No self-registration**: Contractors are onboarded by client/admin only.
- **Team Member access restriction**: Team Member login must only allow QR scanning for the selected contractor.
- **Team Member session safety**: Team Member access resets daily to reduce accidental scanning into the wrong contractor account.
- **Language**: End-user app must support Hindi and English switching.
- **Security**: QR tokens must not expose predictable IDs or point values that can be forged.
- **QR integrity**: QR codes must be one-time, expirable, and reversible for return/exchange cases where applicable.
- **QR lifecycle rules**: Reprint is allowed only for unscanned, non-expired QR codes; cancellation is allowed only for unused/uncollected, non-expired QR codes; reversal is allowed only for already collected/scanned QR codes; expired means unscanned and past expiry.
- **Reprint safety**: QR reprint must generate a replacement token and invalidate the earlier token.
- **QR unit accountability**: QR print and lifecycle status must be tracked per individual QR/unit, not only per invoice line item.
- **QR expiry**: QR codes expire after 45 days unless the PRD later changes this configurable value.
- **Invoice quantity integrity**: QR print quantity cannot exceed the original invoice quantity for that line item.
- **Return validation**: Previously skipped/unprinted units can be printed later only after API verification that the product/invoice line item was not returned.
- **Admin permissions**: Volt Admin has OWNER and STAFF personas. OWNER is the master store admin; STAFF has restricted access for return QR Cancel/Reverse, reward fulfillment, view-only contractors, view-only dashboard, and view-only reports.
- **Admin control**: Client must be able to manage users, rewards, promotions, reports, and QR lifecycle.
- **PRD discipline**: Anything not confirmed in PRD should be treated as open, not silently implemented.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Platform includes end-user Android and iOS apps | Confirmed in Discovery Call 1 | Current baseline |
| Platform includes admin Android and iOS apps | Confirmed in Discovery Call 1 | Current baseline |
| Mobile apps use a cross-platform app stack | Confirmed after Discovery Call 1 | Current baseline |
| Cross-platform framework will be decided during architecture | Avoids premature tool decision before architecture work | Current baseline |
| Public Play Store and App Store launch is in scope | Confirmed after Discovery Call 1 | Current baseline |
| Platform includes browser-based admin web portal | Needed for management, analytics, reporting, and QR print workflow | Current baseline |
| Contractor profiles are created by admin/client only | Prevents uncontrolled app access | Current baseline |
| Contractor login uses ContractorID + MPIN | Confirmed after Discovery Call 1 | Current baseline |
| Forgot ID sends ContractorID to registered mobile number | Allows recovery without self-registration | Current baseline |
| Forgot MPIN uses OTP to registered mobile number before reset | Protects account access while allowing recovery | Current baseline |
| Login has Contractor and Team Member paths | Needed for different access levels | Current baseline |
| Team Member enters contractor mobile number instead of seeing full contractor list | Prevents Team Members from discovering all registered contractors | Current baseline |
| Team Member Recent list shows no more than one contractor | Reduces privacy exposure and accidental selection | Current baseline |
| Team Member Recent list populates only after successful OTP login | Prevents storing invalid/unverified contractor entries | Current baseline |
| Team Member Recent contractor is stored locally on device using secure storage | Production-grade convenience pattern; avoids server-side Team Member identity requirement for v1 | Current baseline |
| Team Member Recent contractor is convenience-only and OTP remains required every session | Prevents local storage from becoming authentication | Current baseline |
| Team Member scans on behalf of contractor using OTP sent to contractor | Supports real-world Team Member workflow while contractor authorizes access offline | Current baseline |
| Team Member access is scan-only | Prevents Team Members from seeing contractor balances, rewards, and sensitive data | Current baseline |
| Team Member sessions reset daily | Reduces accidental reward credit to wrong contractor account | Current baseline |
| End-user app supports Hindi/English switching | Required by client for accessibility | Current baseline |
| Contractor app bottom navigation is Home, Scan, History, Rewards and Points Balance | User renamed Redeem to Rewards and Points Balance | Current baseline |
| Ads are shown to both Contractors and Team Members | Confirmed after Discovery Call 1 | Current baseline |
| Admin web landing/front page shows Print QR codes | Confirmed in QR management clarification | Current baseline |
| Admin web owns QR print mechanism | Confirmed direction; QR print starts after invoice data is available from BUSY/client database | Current baseline |
| Invoice line items are pre-checked for QR printing | Reduces staff work while allowing omissions | Current baseline |
| QR print quantity can be reduced but cannot exceed invoice quantity | Confirmed in QR management clarification | Current baseline |
| QR tracking is per individual QR/unit | A line item may have quantity 5 while only 2 QR labels are printed | Current baseline |
| Printed/skipped units are stored as Printed/Not Printed | Needed for later printing and audit trail | Current baseline |
| Not Printed units can be printed later in partial batches after return/status API check | Prevents QR creation for returned products while allowing operational flexibility | Current baseline |
| Admin mobile is not purely view-only | Return-processing QR scan actions are confirmed | Current baseline |
| Admin mobile supports QR status check during return processing | Needed at return counter | Current baseline |
| Admin mobile can cancel unused/uncollected non-expired QR codes during return | Confirmed in QR management clarification | Current baseline |
| Admin mobile can reverse already collected/scanned QR codes during return | Confirmed in QR management clarification | Current baseline |
| Admin mobile should include all useful data views | Confirmed after Discovery Call 1 | Current baseline |
| Admin mobile app working name is Volt Admin | User confirmed working admin app name | Current baseline |
| Admin mobile has OWNER and STAFF personas | Owner/store staff need different authority levels | Current baseline |
| OWNER can register and manage contractors in admin mobile | User confirmed lightweight contractor registration is needed on mobile | Current baseline |
| STAFF can view contractors but cannot edit profiles or points | Prevents staff from changing master data | Current baseline |
| STAFF can cancel/reverse returned-product QR codes | Supports return counter operations | Current baseline |
| OWNER and STAFF can fulfill rewards by Claim ID plus contractor OTP | Verifies the person at counter is authentic before handover | Current baseline |
| Admin mobile bottom nav is Dashboard, Return Scan, Contractors, More | Keeps frequent workflows one tap away without overcomplication | Current baseline |
| Contractors tab opens Contractor Leaderboard first | Gives owner/staff a fast operational view before management actions | Current baseline |
| Reports Hub Contractor Leaderboard is the export/report route for the same ranking data | Separates daily contractor navigation from report/export use | Current baseline |
| Rewards initially use point thresholds for vouchers/prizes claimed from shop | Exact workflow to be finalized later | Working assumption |
| QR lifecycle statuses are Printed/Unclaimed, Scanned/Claimed, Expired, Reversed, Reprinted, Cancelled | Confirmed after Discovery Call 1 | Current baseline |
| Reprint only applies to unscanned non-expired QR codes; Cancel only applies to unused/uncollected non-expired QR codes | Prevents changing already claimed or expired codes | Current baseline |
| Reprint uses replacement QR token and invalidates old QR token | Safer if original label is lost, damaged, or incorrectly printed | Current baseline |
| Reverse only applies to Scanned/Claimed QR codes | Supports return/exchange reversal after a claim exists | Current baseline |
| QR expiry is 45 days | Confirmed as current rule, can change later | Current baseline |
| Cancel/Reverse reason is Product Returned only | Client does not need additional proof for v1 | Current baseline |
| Reversal can create negative balance if reward was already fulfilled | Confirmed answer for returned product after fulfillment | Current baseline |
| QR print reports include custom date ranges | Confirmed after Discovery Call 1 | Current baseline |

---
*Last updated: 2026-06-13 after Volt Admin OWNER/STAFF, return-flow, and Contractors navigation clarification.*
