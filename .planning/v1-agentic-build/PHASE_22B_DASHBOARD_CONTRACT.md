# Phase 22B Dashboard Contract - Admin Web

Status: Complete
Created: 2026-07-07
Completed: 2026-07-07

## Source Inputs

- `PHASE_22_STATUS.md`
- `PHASE_22_EXECUTION_PLAN.md`
- `PHASE_22_UI_SPEC.md`
- `PHASE_20_ADMIN_WEB_CONTRACT.md`
- `MANUAL_UAT1_TRIAGE.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `OPEN_QUESTIONS.md`

## Open-Question Review

Relevant Phase 22 dashboard questions are resolved:

- Admin Web uses real OWNER/STAFF login and cookie-backed session.
- Dashboard metrics may share backend calculations with Admin Mobile, but Admin Web drilldowns optimize for desk/batch operations.
- First-pass list/filter/search defaults are locked for later list routes.

No new user decision blocks Phase 22B.

## Persona

- OWNER: needs a desk operations command surface across invoices, QR printing, contractors, staff, rewards, reports, and promotions.
- STAFF: needs operational visibility and allowed non-owner actions without staff management, rewards fulfillment, or promotions.

## Primary Job

After login, the admin should understand what needs attention, what changed recently, and where to act next.

## Screen Map

| Route | Screen | Entry | Exit/Drilldown |
| --- | --- | --- | --- |
| `/dashboard` | Admin Dashboard | Login success, sidebar Dashboard, denied redirect fallback | Existing route anchors: `/`, `/invoices`, `/print-history`, `/contractors`, `/staff`, `/rewards`, `/reports`, `/promotions` |

Phase 22B must not create deep list/detail routes that belong to Phase 22C/22D/22E. It may link to route anchors created in Phase 22A.

## Required Sections

1. Operational summary metrics:
   - Active contractors.
   - Active staff.
   - Invoices ready to print.
   - Total invoices.
   - QR printed.
   - QR scanned.
   - QR cancelled/reversed.
   - Pending reward claims.
2. Attention queue:
   - Invoices ready for QR print.
   - Pending reward claims for OWNER only.
   - Recent return vouchers and reversal/cancellation activity when available.
   - Empty state when no attention item exists.
3. Shortcuts:
   - Print QR.
   - Invoice Ledger.
   - Print History.
   - Contractor Directory.
   - Reports.
   - Staff Management for OWNER.
   - Rewards and Promotions for OWNER.
   - Add Contractor is explicitly deferred until Phase 22D creates `/contractors/new`.
4. Recent activity:
   - Human-readable action.
   - Human-readable actor where available.
   - Target type/label.
   - Date/time.
5. Operational insight panels:
   - QR status mix.
   - Recent print trend.
   - Top contractors by points/scan activity preview.

## Drilldown Rules

| Dashboard item | Destination | Phase 22B behavior |
| --- | --- | --- |
| Contractors | `/contractors` | clickable |
| Staff | `/staff` | OWNER clickable, STAFF hidden/read-only based on route permissions |
| Invoices ready to print | `/` | clickable |
| Total invoices | `/invoices` | clickable route anchor |
| QR printed | `/print-history` | clickable route anchor |
| QR scanned | `/reports` | clickable route anchor until report filters exist |
| QR cancelled/reversed | `/reports` | clickable route anchor until return/reversal report filters exist |
| Pending rewards | `/rewards` | OWNER clickable, STAFF not shown as action |
| Top contractors | `/contractors` | clickable route anchor |

No link may point to an unimplemented route.

## Data Identity

- Contractor names come from `User.displayName`.
- Actor names come from audit actor user `displayName` when present.
- Invoice labels use `BusyInvoice.invoiceNumber` and `customerRef`.
- Reward labels use `RewardCatalogItem.name` and `RewardClaim.claimId`.
- Return labels use `BusyReturnVoucher.returnNumber` and linked original invoice number.

## States

- Loading: dashboard shell with clear loading status.
- Empty: attention queue and activity panels show purposeful empty text.
- Error: failed API request shows an error status and a retry button.
- Permission denied: `/dashboard?denied=1` shows a visible banner explaining the role restriction.
- STAFF: owner-only shortcuts and nav are absent.

## Visual Direction

- Dense operations layout, not marketing.
- Compact clickable metric cards.
- Attention queue as compact rows with clear action links.
- Recent activity as compact rows with human-readable labels.
- Use bars/chips for status mix and trends; no decorative charts or gradients.
- Desktop-first admin layout with mobile stacking preserved.

## Verification Gate

Phase 22B is complete only when:

- Dashboard API returns the enriched read model.
- OWNER and STAFF dashboards render role-appropriate shortcuts and metrics.
- Implemented metrics/shortcuts navigate to valid routes.
- STAFF direct owner-only denial shows visible dashboard blocked status.
- Recent activity uses human-readable action labels and actor names where available.
- Attention queue has meaningful rows or empty state.
- Automated tests pass for API and Admin Web.
- Browser UAT verifies OWNER dashboard, STAFF dashboard, metric navigation, denied banner, and no console errors.

## Completion Evidence

Completed on 2026-07-07:

- Dashboard API enriched with metrics, attention queue, shortcuts, QR status mix, print trend, top contractors, and labeled recent activity.
- OWNER and STAFF dashboard UI implemented against this contract.
- Browser UAT passed logged-out redirect, OWNER dashboard, metric navigation, invoice shortcut navigation, STAFF dashboard, STAFF denied banner, and console-error checks.
- Screenshots captured:
  - `/tmp/admin-web-phase22b-owner-dashboard.png`
  - `/tmp/admin-web-phase22b-staff-dashboard.png`
- Automated verification passed:
  - `npm run test:api`
  - `npm run test:admin-web`
  - `npm run typecheck`
  - `npm test`
