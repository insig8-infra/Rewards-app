# Phase 20 Admin Web Recovery Contract

Status: Active contract for Phase 22 implementation  
Created: 2026-07-06

## Purpose

Admin Web must become the full browser operations portal for all non-camera OWNER/STAFF workflows. Manual UAT 1 showed that the current surface is too QR-print-centered and too static to be treated as production-grade.

## Requirement Coverage

- `WEB-001` through `WEB-020`
- `PLAT-005`, `PLAT-012`
- `QR-001` through `QR-018` where browser-visible non-camera behavior applies
- `MADM-*` only where Admin Web mirrors non-camera admin workflows
- `REP-*` for reporting routes where surfaced

## Required Route Map

| Route | Purpose | OWNER | STAFF |
| --- | --- | --- | --- |
| `/login` | Real Admin Web login | yes | yes |
| `/dashboard` | Operational dashboard | full | limited |
| `/` or `/qr-print` | QR Print Queue | yes | yes |
| `/invoices` | Full Invoice Ledger | yes | yes |
| `/invoices/:invoiceId` | Invoice detail, print/return/history context | yes | yes |
| `/print-history` | Print History | yes | yes |
| `/contractors` | Contractor Directory | yes | read-only |
| `/contractors/new` | Add Contractor | yes | no |
| `/contractors/:contractorId` | Contractor detail | full allowed actions | read-only |
| `/staff` | Staff Directory | yes | no |
| `/staff/new` | Add Staff | yes | no |
| `/rewards` | Reward fulfillment/claims | yes | no unless future read-only approved |
| `/reports` | Reports hub | full/export | read-only if exposed |
| `/promotions` | Promotions management | yes | no |

Returned-product QR status scan, cancel, and reverse are not exposed in Admin Web for v1.

## Real Admin Web Login

Current dev actor selector must be removed from normal product UAT.

Required behavior:

- Use backend OWNER/STAFF mobile + PIN auth, aligned with Admin Mobile.
- Session stored securely for browser context.
- Logout is available.
- Session expiry/invalid token returns to login.
- OWNER and STAFF role differences come from the authenticated session.
- Dev actor switching may remain only behind an explicit local/dev-only flag and must not be visible in product UAT.

Open implementation question to confirm before Phase 22:

- Use the exact same `/api/auth/admin/login` contract as Admin Mobile unless a web-specific session endpoint is deliberately needed.

## Dashboard Contract

Dashboard should be the hawk-eye operational page.

Required sections:

- Top summary: active contractors, active staff, invoices ready to print, pending reward claims, QR printed/scanned/cancelled/reversed.
- Attention queue: invoices ready for QR print, pending rewards, recent returns/reversals, failed BUSY sync or validation errors.
- Recent activity: human-readable actor, action, target, date/time.
- Shortcuts: Print QR, Add Contractor, Contractor Directory, Print History, Reports, Staff Management for OWNER.
- Trends or small charts: QR printed by date/category, scan status mix, contractor leaderboard preview.

Required drilldowns:

| Metric/Card | Destination |
| --- | --- |
| Contractors | `/contractors` with active filter |
| Staff | `/staff` |
| Invoices ready to print | `/qr-print` |
| Total invoices | `/invoices` |
| QR printed | `/print-history` |
| QR cancelled/reversed | `/reports` returns/reversals view or invoice ledger filtered to returned/reversed |
| Pending rewards | `/rewards` filtered to chosen/pending fulfillment |
| Top contractors | `/contractors` sorted by total/available points |

## QR Print Queue Contract

QR Print Queue is not the full invoice ledger.

It should show only:

- Active sale invoices.
- Imported invoices with printable quantity greater than zero.
- Lines with QR-eligible products and unprinted/non-returned quantity.

It should not show:

- Return of Sale vouchers.
- Cancelled invoices.
- Fully printed invoices unless a reprint/remaining-print action exists.
- Invoices where every line has no printable quantity.

Required controls:

- Search by invoice number, customer, product, GSTIN.
- Filters: ready to print, partially printed, imported today, product/category.
- Sort: latest import first by default, invoice date, invoice number, customer, printable units.
- Invoice card/row shows import date/time, invoice date/time, customer, final total, GST, line count, printable unit count, and return/cancel badges.
- Click invoice opens detail.

## Invoice Ledger Contract

Invoice Ledger is the complete record of sale and return facts from BUSY/mock BUSY. The all-lines case is represented as a full return invoice with all original sale line items and quantities.

Required behavior:

- Show all imported sale invoices.
- Show linked return activity against the original invoice.
- Return vouchers are visible in invoice detail/history, not as printable invoices.
- Search/filter/sort support the same operational needs as QR Print Queue plus status filters.
- Invoice detail shows:
  - Invoice metadata.
  - Seller/customer/GST/totals.
  - Import timestamp.
  - Line items with sold, returned, printable, printed, scanned, cancelled, reversed quantities.
  - Linked return vouchers.
  - Print jobs and QR history.
  - Allowed next action.

## Print History Contract

Print History must be a separate route, not a static section at the bottom of QR print.

Required behavior:

- Search by invoice number, product, customer, actor.
- Filters: date range, actor, product/category, reprint vs first print.
- Sort: latest printed first by default, invoice date, units printed, actor.
- Row/card shows invoice number, customer, printed units, actor, printed date/time, product summary.
- Click row opens invoice detail with print job history highlighted.

## Contractor Directory Contract

Required layout:

- Add Contractor action near top for OWNER.
- Search and filters above the list.
- Contractor rows/cards show name, photo/avatar, mobile, contractor code, tier, available points, total points, active/deactivated, site count, scan count.
- Row click opens detail.

Required filters/sorts:

- Search: name, mobile, contractor code, site/city.
- Filters: active, deactivated, tier, has rewards, has scans.
- Sort: newest, name, available points, total points, scan count.

Contractor detail:

- Identity header with photo, name, mobile, contractor code, tier, status.
- Identity fields name and mobile are read-only after registration.
- Photo update is allowed for OWNER.
- Deactivate/reactivate is separated from photo update.
- Sites count is clickable and opens site list/detail.
- Show scan summary, reward summary, Balance Book/ledger summary, and recent activity.
- STAFF sees read-only state with no mutation controls.

Add Contractor:

- Separate route or modal, not buried below the directory.
- Captures name, mobile, optional photo.
- Duplicate mobile shows existing contractor summary and blocks creation.
- Success routes to new contractor detail.

## Staff Directory Contract

Required layout:

- Add Staff action near top for OWNER.
- Search, filters, and sort above list.
- Staff rows/cards show name, mobile, status, created date, last opened if available.
- Row click opens detail.

Required filters/sorts:

- Search: name, mobile.
- Filters: active, deactivated.
- Sort: newest, name, last opened.

Staff detail:

- Reset PIN.
- Deactivate/reactivate.
- Show created by, created date, status, last opened if available.
- STAFF has no access to staff management.

## Visual And Interaction Rules

- Admin Web should feel like a dense operations portal, not a marketing page.
- Avoid oversized cards for small forms.
- Avoid controls that push major content around unexpectedly.
- Use tables or compact cards depending on viewport.
- Use side panels or routed detail pages for details/edit flows instead of expanding large inline sections.
- Buttons must sit near the data they act on.
- Text must not overflow boxes.

## Phase 22 UAT Gate

Phase 22 must verify:

- OWNER login and STAFF login.
- OWNER sees all allowed sections.
- STAFF cannot access owner-only sections by nav or direct URL.
- Dashboard metric drilldowns work.
- QR Print Queue excludes return vouchers and fully non-printable invoices.
- Invoice Ledger shows linked return activity.
- Print History route supports search/filter/sort and detail navigation.
- Contractor add/photo update/deactivate works and name/mobile immutability is enforced by backend.
- Staff add/reset/deactivate/reactivate works for OWNER only.
