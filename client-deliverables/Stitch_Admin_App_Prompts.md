# Stitch Prompts: Admin Mobile App

**Created:** 2026-06-13  
**Tool target:** Stitch by Google  
**Scope:** Admin mobile app only: OWNER + STAFF personas for `Volt Admin`. End-user Contractor/Helper prompts remain in `Stitch_Frontend_App_Prompts.md`. Admin web portal prompts will be created separately.

## Current Stitch Sync Status - 2026-06-13

Active Stitch project: `Volt Admin Mobile App` (`projects/11128801461567928004`).

The prompt pack defines the intended Volt Admin screen contract. The current Stitch project is being cleaned one screen at a time after user-side deletion of duplicate/messy screens.

Latest recreated screens, generated one at a time and verified by direct screen ID:

- `More` - `projects/11128801461567928004/screens/ccbc7cd7e7724e6e97544770210d80da`
- `Staff Management` - `projects/11128801461567928004/screens/b752982f1eae4cc591e0674a6c5b17b5`
- `Add Staff` - `projects/11128801461567928004/screens/c5a9cfacd4a8451991b7b0b80444c992`
- `Staff Detail / PIN and Access` - `projects/11128801461567928004/screens/91ab777fb3dc41aab15010ac1fde3984`
- `Contractor Leaderboard` - `projects/11128801461567928004/screens/e4a1ed5fc14b4d3dba3d7731835388f4`
- `About - Volt Admin` - `projects/11128801461567928004/screens/16f79f86cadb45e59c07c261639efe22`
- `Support - Volt Admin` - `projects/11128801461567928004/screens/675806bf72db4dcd9fc9c7c001ab9fbc`
- `Privacy Policy - Volt Admin` - `projects/11128801461567928004/screens/dae25b2116b7419fbdf484e0887e9086`
- `Terms & Conditions - Volt Admin` - `projects/11128801461567928004/screens/d0f31ca89c7347ec91dd9f1f144c4f96`
- `STAFF - Login` - `projects/11128801461567928004/screens/316ba5ac61ad41a69d9e86342dd799eb`
- `STAFF - Access Blocked / Re-login` - `projects/11128801461567928004/screens/f467bd4d628542c8bf8bcc74d1bd511f`
- `Cancel QR Success - Final` - `projects/11128801461567928004/screens/8206048fbb014847a796f18598f0b794`

Latest existing-screen updates safely applied with `project.file_update`:

- `Reports Hub`
- `QR Status - Cancel Eligible` - reworked in place for STAFF unused/uncollected Cancel-only status; no Reverse action, contractor data, points, or bottom navigation.
- `Cancel QR Confirmation` - reworked in place for STAFF Cancel confirmation with fixed Product Returned reason, required label-discard checkbox, destructive `Cancel QR` action, and STAFF audit note.
- `Cancel QR Success - Final` - reworked in place for STAFF Cancel success with Cancelled/Discarded result, no points-reversed copy, and STAFF audit note.
- `QR Status - Reverse Eligible` - reworked in place for STAFF scanned/claimed Reverse-only status with contractor, mobile, scan date, points to reverse, and negative-balance warning.
- `Reverse QR Confirmation` - reworked in place for STAFF Reverse confirmation with Product Returned reason, contractor/points details, negative-balance warning, required label-discard checkbox, destructive `Reverse Points` action, and STAFF audit note.
- `Reverse QR Success` - reworked in place for STAFF Reverse success with Reversed/Discarded result, points reversed summary, balance-book note, and STAFF audit note.
- `Reward Fulfillment - Claim ID Entry` - reworked in place for STAFF counter handover with Claim ID entry, Verify Claim action, pending pickup preview, OTP security note, and no reward/points editing.
- `Reward Fulfillment - OTP Verification` - reworked in place for STAFF contractor OTP verification after Claim ID lookup, with 6-digit OTP, resend timer, MPIN warning, and next-step hint.
- `Reward Fulfillment Success` - reworked in place for STAFF Fulfilled completion with Claim summary, Fulfilled by audit trail, reward-claims/report recording note, and no Redeem wording.
- `QR Status - Non-actionable` - reworked in place for STAFF no-action return-scan result with expired example, other non-actionable status chips, no Cancel/Reverse actions, and support note.
- `Reports Hub` - reworked in place as the STAFF view-only report hub with More selected, no export/share/download controls, and report-category rows only.
- `QR Printed Report` - reworked in place as a STAFF view-only report detail with page-title header, More selected, date/category report content, and no export/share/print/generate QR controls.
- `QR Status Report` - reworked in place as a STAFF view-only lifecycle report with More selected, status filters/rows, no export/share/reprint/Cancel/Reverse controls, and a note to use Return Scan for eligible actions.
- `Reward Claims Report` - reworked in place as a STAFF view-only claim report with Pending Pickup/Fulfilled/Revoked counts, Claim/Fulfilled wording, and no export/share or in-report fulfillment buttons.
- `Return Scan Camera` - the kept visible STAFF return-scan screen is now `projects/11128801461567928004/screens/4580c459a432402fa3c27b81a56dc715`. It includes STAFF context, Return Scan selected, title-case bottom navigation, QR status helper logic, manual QR ID entry, and the remove/discard label note.
- `STAFF Dashboard` - reworked as the explicit STAFF post-login landing screen with Dashboard selected, allowed actions, read-only QR/return stats, and no OWNER-only controls.
- `Contractor Leaderboard` - reworked in place as the STAFF Contractors-tab landing screen with Contractors selected, read-only ranking, no Add/Edit/Deactivate/export controls, and read-only entries for Contractors List and View Contractor Detail.
- `Contractors List` - reworked in place as the STAFF read-only contractor list with search, Active/Deactivated/Tier filters, read-only contractor rows, no Add Contractor, and no edit/deactivate/manual point controls.
- `STAFF - Contractor Detail Read-only - Final` - corrected in place as a strict STAFF read-only detail screen with no Return Scan/Fulfill Reward shortcuts, no profile/point/admin actions, and Claim/Fulfilled activity wording.
- `Profile and Language`

Known generated artifacts to discard if they appear after Stitch refresh:

- `projects/11128801461567928004/screens/25ef8579e3cd4816b68199058fd549e3` - `Reports Hub - OWNER View` duplicate of the original `Reports Hub`.
- `projects/11128801461567928004/screens/4cc090f5c254465a965fa3509cf7a722` - older generated `More` artifact.
- `projects/11128801461567928004/screens/4ed4fa91475c441bb920cec83aa37b41` - generated `Cancel QR Confirmation` artifact created when a text-only in-place edit returned a design object instead of `project.file_update`.
- `projects/11128801461567928004/screens/5bc89cebbccb41efba0706daeab675df` - generated `Contractor Detail - STAFF Read-only` artifact created when an icon-only in-place edit returned a design object instead of `project.file_update`.
- `projects/11128801461567928004/screens/c6697fed76df4527ab0691e46d289cff` - generated `Cancel QR Success` artifact created when a bottom-nav correction returned a design object instead of `project.file_update`.
- `projects/11128801461567928004/screens/2e36eaa2ce9648928191425465482de9` - generated `Returns & Reversals Report - STAFF View` artifact created when an attempted in-place edit of `Returns and Reversals Report` returned a design object instead of `project.file_update`. It did not appear in the immediate `list_screens` check; discard it if it appears after refresh.

Remaining Stitch pass queue:

- Fresh replacement screen to keep: `Cancel QR Success - Final` - `projects/11128801461567928004/screens/8206048fbb014847a796f18598f0b794`.
- Fresh replacement screen to keep: `STAFF - Contractor Detail Read-only - Final` - `projects/11128801461567928004/screens/86fac0a035e446d9a4a70584a371ee9e`.
- User plans to delete older `Cancel QR Success` copies: `projects/11128801461567928004/screens/6ec1b7e82fa94d5caaa7d294fe4a415f` and `projects/11128801461567928004/screens/c6697fed76df4527ab0691e46d289cff`.
- User plans to delete older `Contractor Detail - STAFF Read-only` copies: `projects/11128801461567928004/screens/abd9cc0f0ee44643a6c375d8fbafd11c` and `projects/11128801461567928004/screens/5bc89cebbccb41efba0706daeab675df`.
- User reported `Cancel QR Confirmation` duplicate is not visible after refresh and the single visible `Cancel QR Confirmation` screen looks correct.
- Create/rework remaining STAFF persona flow screens one at a time.
- User confirmed `Return Scan Camera` `projects/11128801461567928004/screens/4580c459a432402fa3c27b81a56dc715` is the only STAFF return-scan screen visible and should be kept for now.
- Recheck visible/direct generated screens for `More`, `Staff Management`, `Add Staff`, and `Staff Detail / PIN and Access` after user refresh.
- Resume STAFF report pass from the original `Returns and Reversals Report` (`projects/11128801461567928004/screens/a35ee0117316490dac3633348aa7944b`) only after confirming how to handle the generated `2e36eaa2ce9648928191425465482de9` artifact.

No product requirement has changed from these Stitch artifacts. They are tooling/session artifacts unless the user explicitly approves a requirement change.

## Documentation Role

This file is the Stitch UI prompt contract for the production admin mobile app. It must stay aligned with:

- `.planning/PROJECT.md` - high-level product baseline and key decisions.
- `.planning/REQUIREMENTS.md` - build-traceable functional requirements.
- `.planning/docs/CLIENT_DISCOVERY_DRAFT.md` - PRD input and client-facing understanding.
- `.planning/docs/QR_MANAGEMENT_WORKFLOW.md` - QR lifecycle, return processing, and reward fulfillment flows.
- `.planning/docs/OPEN_QUESTIONS.md` - unresolved PRD questions that must not be silently assumed.
- `.planning/STATE.md` - current session state and active design direction.

Use this prompt pack to create or refine Stitch designs only after the linked planning docs remain consistent. Requirements are authoritative for build behavior; this file translates those requirements into mobile screens, layout, copy, and interaction states.

## Confirmed Admin App Decisions

- Working app name: `Volt Admin`.
- Android and iOS admin mobile app.
- Roles: `OWNER` and `STAFF`.
- OWNER is the store owner/master admin account created from backend.
- OWNER login: registered mobile number + fixed 4-digit PIN.
- OWNER can add staff members.
- Staff profile fields: staff name, mobile number, optional photo.
- System generates a unique 4-digit PIN for each staff member.
- STAFF login: mobile number + assigned 4-digit PIN.
- OWNER can reset/regenerate staff PIN, deactivate staff, and reactivate staff.
- OWNER and STAFF stay logged in unless access is removed/deactivated, PIN changes, or the app is not opened for 4 straight days.
- Admin app supports English and Hindi through a one-time language setting in Profile.
- Do not show a per-screen language toggle.
- Bottom navigation: Dashboard, Return Scan, Contractors, More.
- QR printing remains a web portal workflow. Do not design QR print screens in admin mobile.
- Advertisement/promotion management remains outside this admin mobile prompt pack.
- Manual points editing is not allowed in admin mobile.

## Role Permissions

| Area | OWNER | STAFF |
|------|-------|-------|
| Dashboard | Full store visibility | Read-only operational visibility |
| Return Scan | Cancel/Reverse eligible QR codes | Cancel/Reverse eligible QR codes |
| Contractors | Add, view, edit, deactivate/unregister | View-only |
| Contractor points | View | View-only, no manual changes |
| Staff management | Add, deactivate, reactivate, reset PIN | Not allowed |
| Reward fulfillment | Claim ID + contractor OTP + mark Fulfilled | Claim ID + contractor OTP + mark Fulfilled |
| Reports | View and export/share PDF, Excel, WhatsApp | View-only |
| Profile language | Set own default language | Set own default language |

## Contractor Registration

- OWNER can register contractors from Volt Admin.
- Required fields: Contractor Name, Mobile Number.
- Optional field: Contractor Photo.
- ContractorID is auto-generated by the system.
- Duplicate contractor mobile number is blocked and the app shows existing contractor details.
- Successful registration sends a Welcome SMS to the contractor mobile number with frontend app download links for Play Store and App Store.
- OWNER can update contractor photo later. Contractor name and mobile number are immutable after registration; incorrect identity data should be handled by deactivation and new registration.
- OWNER can deactivate/unregister contractors.
- STAFF can view contractor list/details only.

## Return Processing

Return Scan is a core STAFF and OWNER workflow.

Cancel applies when QR status is unused/uncollected, `Printed/Unclaimed`, and non-expired:

- Show product name, QR ID, and invoice number.
- Do not show contractor, points, balance, or Reverse action.
- Require checkbox: `QR label removed and discarded`.
- Reason is fixed: `Product Returned`.
- No proof upload.

Reverse applies only when QR status is already collected/scanned, `Scanned/Claimed`, and points were credited:

- Show product name, QR ID, invoice number, contractor name, contractor mobile number, points to reverse, and scan date.
- Require checkbox: `QR label removed and discarded`.
- Reason is fixed: `Product Returned`.
- No proof upload.
- Show warning if reversal may create a negative contractor balance.
- After Reverse, points are reversed and the QR is discarded.

Non-actionable states must be clear: expired QR, already cancelled, already reversed, invalid/replaced QR, and network retry.

## Reward Fulfillment

Reward fulfillment is allowed for both OWNER and STAFF at the counter:

1. Contractor presents Claim ID from frontend app.
2. OWNER or STAFF enters Claim ID in Volt Admin.
3. App verifies the claim.
4. App sends OTP to the registered contractor mobile number.
5. OWNER or STAFF enters OTP in Volt Admin.
6. After handover, OWNER or STAFF marks the reward claim as `Fulfilled`.

Use `Fulfilled` for completed handover. Do not use `Redeemed` or `Redeem`.

## Reports And Dashboards

OWNER dashboard cards:

- Today's scans.
- Active contractors.
- Pending reward pickups.
- QR cancelled/reversed today.
- Top contractors.
- Expired QR.
- Unclaimed QR.
- Total points issued.

STAFF dashboard:

- Read-only total QR codes printed by date, week, last week, and custom dates.
- Read-only return-scan stats.

Reports:

- QR printed by date/category.
- Contractor leaderboard report/export view, tied to the same ranking data used on the Contractors tab.
- QR status report.
- Reward claims report.
- Returns/reversals report.
- Product/category performance report.

STAFF can view reports only. OWNER can export/share as PDF, Excel, and WhatsApp.

Notifications/alerts are not needed for v1.

Contractors navigation:

- Bottom nav `Contractors` opens `Contractor Leaderboard` as the landing screen.
- `Contractor Leaderboard` includes a manage-contractors area with entries for `Contractors List`, `Add New Contractor`, and contractor detail.
- `Reports Hub` may include a Contractor Leaderboard report/export option, but it should not be the primary route for managing contractors.

## Design Direction

- Build for store owner and shop staff using the app at a counter, warehouse, or return desk.
- Use clean dense Google Pay / PhonePe-style clarity, tuned for operational/admin tasks.
- Prioritize fast scanning, short forms, clear confirmation, and low ambiguity around destructive actions.
- Use white/off-white/light gray surfaces, charcoal text, deep teal primary, saffron accent, green success, red error, and restrained status colors.
- Avoid dark dashboard-heavy themes, purple/lavender, large gradients, decorative blobs, oversized hero sections, and marketing layouts.
- Typography should be Inter-like, compact, and readable.
- Use 390px mobile baseline, 16px padding, 8px spacing rhythm, 48-56px touch targets, and card/button radius of 8px or less.
- Use cards for metrics, contractor rows, report rows, QR status summaries, confirmation panels, and repeated list items.
- Do not put cards inside cards.
- Use icons consistently: dashboard, QR scanner, contractor/person, more/menu, phone, lock, report, gift, staff, warning, success, export.
- OWNER and STAFF surfaces should feel like the same app, with controls hidden/disabled based on role.

## Master Prompt

```text
Design a high-fidelity mobile admin app UI for Volt Admin, the admin mobile app for an electrical retailer loyalty QR platform in India.

The app is used by a store OWNER and store STAFF. OWNER has master access. STAFF has restricted access. The UI must be practical, dense, trustworthy, and production-ready for use at a shop counter, warehouse, and return desk.

Core product context:
- Contractors/electricians collect points by scanning secure product QR labels in the frontend app.
- Volt Admin lets the store manage mobile admin tasks, register contractors, handle returned-product QR cancel/reverse, fulfill reward claims at the counter, view contractors, view dashboards, and view reports.
- QR printing remains a browser admin web portal workflow. Do not create QR print screens in mobile.
- Ad/promotion management remains outside this mobile prompt pack.
- Manual point changes are not allowed in mobile.

Roles:
1. OWNER
- Store owner/master admin account created from backend.
- Logs in with registered mobile number and fixed 4-digit PIN.
- Can add staff members with name, mobile, optional photo.
- App generates unique 4-digit PIN for each staff member.
- Can reset/regenerate staff PIN, deactivate staff, and reactivate staff.
- Can register, edit, and deactivate/unregister contractors.
- Can use Return Scan to Cancel or Reverse eligible QR codes.
- Can fulfill reward claims by Claim ID + contractor OTP.
- Can view and export/share reports as PDF, Excel, and WhatsApp.
- Contractors tab opens Contractor Leaderboard, with manage-contractor routes below the leaderboard.

2. STAFF
- Logs in with mobile number and assigned 4-digit PIN.
- Stays logged in unless deactivated/removed, PIN changes, or app is not opened for 4 straight days.
- Can use Return Scan to Cancel or Reverse eligible returned-product QR codes.
- Can fulfill reward claims by Claim ID + contractor OTP.
- Can view contractors and reports, but cannot add/edit/deactivate contractors, manage staff, manually change points, or export/share reports.
- Contractors tab opens Contractor Leaderboard, and any manage-contractor route is read-only for STAFF.

Language:
- Supports English and Hindi.
- No per-screen language toggle.
- Language is selected in Profile and becomes default across screens.

Bottom navigation:
- Dashboard
- Return Scan
- Contractors
- More

Design:
- Clean dense Google Pay / PhonePe-style clarity.
- Light surfaces, charcoal text, deep teal primary, saffron accent, green success, red error.
- 390px mobile baseline, 16px padding, 8px rhythm, 48-56px touch targets, 8px-or-less radius.
- Consistent header style, bottom nav, buttons, form fields, status badges, and report rows.
- Use concise operational copy. No marketing hero screens.

Generate and preserve this screen set:
1. Splash Screen
2. Login - Mobile Number and PIN
3. Access Blocked / Re-login Required
4. OWNER Dashboard
5. STAFF Dashboard
6. Return Scan Camera
7. QR Status - Cancel Eligible
8. Cancel QR Confirmation
9. Cancel QR Success
10. QR Status - Reverse Eligible
11. Reverse QR Confirmation
12. Reverse QR Success
13. QR Status - Non-actionable
14. Reward Fulfillment - Claim ID Entry
15. Reward Fulfillment - OTP Verification
16. Reward Fulfillment Success
17. Contractors List
18. Contractor Detail - OWNER
19. Contractor Detail - STAFF Read-only
20. Add Contractor
21. Duplicate Contractor Found
22. Contractor Created / Welcome SMS Sent
23. Edit Contractor
24. Deactivate Contractor Confirmation
25. Reports Hub
26. QR Printed Report
27. Contractor Leaderboard
28. QR Status Report
29. Reward Claims Report
30. Returns and Reversals Report
31. Product and Category Performance Report
32. Staff Management
33. Add Staff
34. Staff Detail / PIN and Access
35. More
36. Profile and Language
37. About, Support, Privacy, Terms
```

## Screen-Specific Prompts

### 1. Splash Screen

```text
Create the Volt Admin splash/loading screen. Show compact admin identity, app name, line "Admin controls for Volt Rewards", subtle loading indicator, and small version placeholder. No bottom navigation.
```

### 2. Login - Mobile Number and PIN

```text
Create Volt Admin login. Fields: mobile number and 4-digit PIN. Primary action: Login. Supporting copy: "For store owner and authorized staff." Include secure PIN tone, help/support link, and no signup. No language toggle; language is set after login in Profile.
```

### 3. Access Blocked / Re-login Required

```text
Create access blocked/re-login state. Cover cases: access removed, PIN changed, or inactive for 4 straight days. Message should be calm and operational. Actions: Login Again and Contact Owner/Support. No bottom navigation.
```

### 4. OWNER Dashboard

```text
Create OWNER Dashboard. Bottom nav Dashboard selected. Header shows store/admin identity and profile entry. Show metric cards for Today's Scans, Active Contractors, Pending Reward Pickups, QR Cancelled/Reversed Today, Top Contractors, Expired QR, Unclaimed QR, and Total Points Issued. Include quick actions: Return Scan, Add Contractor, Fulfill Reward, Reports. Keep dense and readable.
```

### 5. STAFF Dashboard

```text
Create STAFF Dashboard. Bottom nav Dashboard selected. Header shows staff identity and role badge STAFF. Show read-only QR printed stats by date/week/last week/custom date and return-scan stats. Quick actions: Return Scan and Fulfill Reward. Contractors and Reports are visible but read-only. Do not show Add Contractor, Staff Management, exports, or manual point controls.
```

### 6. Return Scan Camera

```text
Create Return Scan camera screen. Bottom nav Return Scan selected. Header title "Return Scan". Show camera preview, QR frame, flashlight toggle, manual QR ID entry, and instruction "Scan returned product QR". Include network status. Designed for counter use with high contrast.
```

### 7. QR Status - Cancel Eligible

```text
Create QR status screen for Cancel eligible QR. Status: unused/uncollected, Printed/Unclaimed, and non-expired. Show product name, QR ID, invoice number, and status badge. Primary action: Cancel QR. Secondary action: Scan Another. Do not show contractor, points, balance, or Reverse action because this QR was never collected.
```

### 8. Cancel QR Confirmation

```text
Create Cancel QR confirmation for an unused/uncollected QR. Show product name, QR ID, invoice number, fixed reason Product Returned, and required checkbox "QR label removed and discarded". Primary Cancel QR button stays disabled until checkbox is checked. No contractor, points, balance, or Reverse content. No proof upload. Warning should say cancellation discards the unused QR and cannot be undone.
```

### 9. Cancel QR Success

```text
Create Cancel QR Success. Show success state, status Cancelled, product name, QR ID, invoice number, fixed reason Product Returned, timestamp placeholder, and actor placeholder. Clearly show that no points were reversed because the QR was unused/uncollected. Actions: Scan Another and Back to Dashboard.
```

### 10. QR Status - Reverse Eligible

```text
Create QR status screen for Reverse eligible QR. Status: already collected/scanned, Scanned/Claimed. Show product name, QR ID, invoice number, contractor name, contractor mobile number, points to reverse, scan date, and status badge. Primary action: Reverse Points. Secondary action: Scan Another. Do not show Cancel QR because this QR already credited points.
```

### 11. Reverse QR Confirmation

```text
Create Reverse QR confirmation. Show product name, QR ID, invoice number, contractor name, mobile number, points to reverse, scan date, fixed reason Product Returned, and required checkbox "QR label removed and discarded". Show that points will be reversed and the QR will be discarded. Show negative balance warning section when applicable. Primary Reverse Points button stays disabled until checkbox is checked.
```

### 12. Reverse QR Success

```text
Create Reverse QR Success. Show success state, status Reversed, contractor name, mobile number, points reversed, QR ID, fixed reason Product Returned, discarded QR note, and updated balance placeholder if available. Actions: Scan Another, View Contractor, Back to Dashboard.
```

### 13. QR Status - Non-actionable

```text
Create non-actionable QR status screen with variants for Expired, Already Cancelled, Already Reversed, Invalid/Replaced QR, and Network Retry. Show clear status badge, short reason, relevant product/QR details when available, and actions Scan Another, Try Again, or Contact Support. No Cancel/Reverse action unless eligible.
```

### 14. Reward Fulfillment - Claim ID Entry

```text
Create reward fulfillment Claim ID entry screen. Entry point from Dashboard/More. Field: Claim ID. Primary action: Verify Claim. Explain contractor must present Claim ID from their app. STAFF and OWNER can use this. No reward handover before verification.
```

### 15. Reward Fulfillment - OTP Verification

```text
Create reward fulfillment OTP verification. After Claim ID verification, show reward name, claim ID, contractor name, registered mobile masked, and status Pending Pickup. Show message "OTP sent to contractor mobile." Include 6-digit OTP input, resend timer, Change Claim ID, and Mark Fulfilled disabled until OTP verifies.
```

### 16. Reward Fulfillment Success

```text
Create reward fulfillment success screen. Show status Fulfilled, reward name, claim ID, contractor name, fulfillment timestamp, and actor role/name placeholder. Actions: Fulfill Another, View Claim Report, Back to Dashboard. Do not use Redeem/Redeemed wording.
```

### 17. Contractors List

```text
Create Contractors list. Bottom nav Contractors selected. Show search, filters Active/Deactivated/Tier, contractor rows with name, mobile, ContractorID, tier, points summary, and status. OWNER sees Add Contractor action. STAFF does not see Add Contractor and list is read-only.
```

### 18. Contractor Detail - OWNER

```text
Create OWNER contractor detail. Show photo, name, ContractorID, mobile, active status, tier, points, scans, reward claims, returns/reversals, and recent activity. Actions: Edit, Deactivate/Reactivate, View History. No manual point edit.
```

### 19. Contractor Detail - STAFF Read-only

```text
Create STAFF read-only contractor detail. Show photo, name, ContractorID, mobile, active status, tier, points, scans, reward claims, returns/reversals, and recent activity. No edit, deactivate, delete, or point-change controls. Use clear read-only treatment.
```

### 20. Add Contractor

```text
Create OWNER Add Contractor screen. Fields: Contractor Name, Mobile Number, optional Photo upload/camera. Show note that ContractorID will be auto-generated and welcome SMS will be sent with app download links. Primary action: Register Contractor. No STAFF access.
```

### 21. Duplicate Contractor Found

```text
Create duplicate contractor mobile state. Message: "This mobile number is already registered." Show existing contractor name, mobile, ContractorID, status, and View Contractor action. Do not allow duplicate registration.
```

### 22. Contractor Created / Welcome SMS Sent

```text
Create Contractor Created success screen. Show generated ContractorID, contractor name, mobile number, optional photo thumbnail, and success note "Welcome SMS sent with app download links." Actions: View Contractor, Add Another, Back to Contractors.
```

### 23. Edit Contractor

```text
Create OWNER Edit Contractor screen for current requirements. Contractor name and mobile number are read-only after registration. Editable fields: optional photo and the open text area for where the contractor belongs / is associated. Show read-only ContractorID. Primary action: Save Changes. No manual points editing.
```

### 24. Deactivate Contractor Confirmation

```text
Create OWNER deactivate/unregister contractor confirmation. Show contractor name, mobile, ContractorID, active status, and warning that deactivated contractors cannot log in or collect points. Actions: Deactivate Contractor and Cancel. No delete/destructive language unless product later confirms hard delete.
```

### 25. Reports Hub

```text
Create Reports Hub. Bottom nav More selected when reached from More. Show current first-pass report categories: QR Printed, Contractor Leaderboard, QR Status, Reward Claims, Returns/Reversals. Product/Category Performance is not an active first-pass report unless a later phase approves a distinct owner use case; ItemCodes and contractor-site analytics are separate focused workflows. The Contractor Leaderboard row is an exportable/reporting view tied to the same ranking data as the Contractors-tab leaderboard; it is not the contractor-management entry point. OWNER sees PDF/Excel export availability. STAFF sees View Only badge and no export controls.
```

### 26. QR Printed Report

```text
Create QR Printed Report. Show date filters Today, This Week, Last Week, Custom. Include category breakdown, total QR printed, printed quantity by product category, and report rows. OWNER actions: Export PDF and Export Excel. WhatsApp share is deferred unless separately approved. STAFF view-only.
```

### 27. Contractor Leaderboard

```text
Create Contractor Leaderboard as the Contractors bottom-nav landing screen. Bottom nav Contractors selected. Show ranking by collected points, contractor name, mobile, tier, points, scan count, and trend. Include compact period filters. Include a Manage Contractors section with entries for Contractors List and Add New Contractor for OWNER. STAFF sees the leaderboard and can open read-only contractor details, but no Add/Edit/Deactivate controls. Do not show export/share buttons here; report export belongs under Reports Hub.
```

### 28. QR Status Report

```text
Create QR Status Report. Show status summary for Printed/Unclaimed, Scanned/Claimed, Expired, Cancelled, Reprinted, Reversed. Include filters by date/status/category and compact rows with QR ID, product, invoice, status. OWNER export/share; STAFF view-only.
```

### 29. Reward Claims Report

```text
Create Reward Claims Report. Show Pending Pickup, Fulfilled, Revoked/Unclaimed counts, claim rows with Claim ID, contractor, reward, points, status, and date. Include action to Fulfill Reward for eligible pending claim. OWNER export/share; STAFF view-only except fulfillment flow.
```

### 30. Returns and Reversals Report

```text
Create Returns and Reversals Report. Show cancelled QR count, reversed QR count, points reversed, and rows with QR ID, product, invoice, contractor if applicable, reason Product Returned, actor, and timestamp. OWNER export/share; STAFF view-only.
```

### 31. Product and Category Performance Report

```text
Create Product and Category Performance Report. Show product/category scan performance, points issued, returns/reversals impact, and top categories. Include date/category filters. OWNER export/share; STAFF view-only.
```

### 32. Staff Management

```text
Create OWNER Staff Management screen. It is reached from More, so bottom nav More is selected. Header title "Staff Management" with back affordance to More. Show staff list with name, mobile, status Active/Deactivated, last active, and role STAFF. Actions: Add Staff and open Staff Detail. STAFF users cannot access this screen.
```

### 33. Add Staff

```text
Create OWNER Add Staff screen reached from Staff Management. Bottom nav More selected. Fields: staff name, mobile number, optional photo. Primary action: Add Staff. On success, show generated 4-digit PIN and instruction that OWNER should share it with staff. Keep PIN visible only on this success moment and Staff Detail reset flow.
```

### 34. Staff Detail / PIN and Access

```text
Create OWNER Staff Detail / PIN and Access screen reached from Staff Management. Bottom nav More selected. Show staff name, mobile, optional photo, status, last active, and actions Reset PIN, Deactivate, Reactivate. Reset PIN generates a new 4-digit PIN and invalidates old login. No STAFF access.
```

### 35. More

```text
Create More screen. Bottom nav More selected. OWNER sees Staff Management, Reports, Profile and Language, Support, About, Privacy, Terms, Logout. STAFF sees Reports, Profile and Language, Support, About, Privacy, Terms, Logout. Hide Staff Management for STAFF.
```

### 36. Profile and Language

```text
Create Profile and Language screen. Show user name, role OWNER/STAFF, mobile number, language setting English/Hindi, and save action. Explain selected language applies across Volt Admin. Include Logout. No per-screen language toggle.
```

### 37. About, Support, Privacy, Terms

```text
Create About/Support/Legal screen. Show Volt Admin app version, retailer support contact placeholders, Help & Support, Privacy Policy, Terms & Conditions, and plain operational copy. No marketing hero.
```

## Visual Consistency Checklist

Use this after every Stitch generation or edit pass:

- App name is `Volt Admin`.
- Roles are consistently labeled OWNER and STAFF.
- Bottom nav is exactly Dashboard, Return Scan, Contractors, More.
- No QR printing screens or print commands appear in mobile.
- No manual points editing controls appear.
- No per-screen language toggle appears.
- Profile contains language setting.
- STAFF never sees Add Contractor, Edit Contractor, Deactivate Contractor, Staff Management, Reset PIN, export/share, or manual point controls.
- OWNER can register contractors, manage staff, export/share reports, and use all return/reward workflows.
- Cancel shows product name, QR ID, invoice number only.
- Reverse shows product name, QR ID, invoice number, contractor name, contractor mobile, points to reverse, and scan date.
- Cancel and Reverse both require `QR label removed and discarded` checkbox.
- Reward handover uses Claim ID plus contractor OTP and final status `Fulfilled`.
- Report export/share appears only for OWNER.
- Contractors tab opens Contractor Leaderboard first; Reports Hub only provides the export/report version of that same leaderboard data.
- Cancel flow never shows points or contractor details; Reverse flow always shows contractor and points to reverse.
- Screens feel dense, operational, and production-ready, not like marketing pages.

## Open UI / PRD Decisions

- Exact automatic audit fields for Cancel, Reverse, and Reward Fulfillment actions.
- Exact report filters per report beyond the confirmed baseline.
- Exact reward catalog, points thresholds, voucher/prize list, and expiry rules.
- Final brand assets, support contact, privacy, and terms copy.
