# Phase 6 Status - Admin Web Database-Backed QR Foundation

Updated: 2026-06-22

## Completed

- Added Admin Web persisted invoice read API:
  - `GET /admin-web/invoices`
  - `GET /admin-web/invoices/:invoiceId`
- Added Admin Web print history API:
  - `GET /admin-web/qr/print-history`
- Added read-side Prisma repositories and services for invoice detail and print history.
- Invoice detail now returns:
  - Invoice number, date/time, status, customer, GST total, final total.
  - Seller/customer GST metadata from `rawSource`.
  - Taxable subtotal, CGST, SGST, IGST, round-off, amount in words.
  - Persisted invoice line ids.
  - Product metadata, quantity, returned quantity, printed quantity, not-printed quantity, printable quantity, points per unit, and tax line metadata.
- Admin Web API client now supports persisted invoice list/detail and print history.
- Admin Web UI now:
  - Lists mock BUSY source invoices for import.
  - Lists persisted imported invoices.
  - Loads persisted invoice detail after import.
  - Uses persisted invoice line ids for QR print requests.
  - Refreshes invoice availability after printing.
  - Shows invoice totals from persisted detail.
  - Shows print history from audit events.
  - Displays navigation skeleton for full Admin Web scope: dashboard, QR printing, print history, contractors, staff, rewards, reports, and promotions.
- Removed hardcoded mock line-id templates from Admin Web print selection.

## Files Added

- `apps/api/src/busy/admin-web-invoice-read.repository.ts`
- `apps/api/src/busy/admin-web-invoice-read.service.ts`
- `apps/api/src/busy/admin-web-invoices.controller.ts`
- `apps/api/src/busy/prisma-admin-web-invoice-read.repository.ts`
- `apps/api/src/busy/admin-web-invoice-read.service.test.ts`
- `apps/api/src/busy/busy-import.service.test.ts`
- `apps/api/src/qr/qr-print-history.repository.ts`
- `apps/api/src/qr/qr-print-history.service.ts`
- `apps/api/src/qr/prisma-qr-print-history.repository.ts`

## Files Updated

- `apps/api/src/busy/busy.module.ts`
- `apps/api/src/qr/admin-web-qr.controller.ts`
- `apps/api/src/qr/qr.module.ts`
- `apps/api/src/auth/controller-actor-context.test.ts`
- `apps/admin-web/src/api/adminApi.ts`
- `apps/admin-web/src/api/adminApi.test.ts`
- `apps/admin-web/src/components/QrPrintWorkspace.tsx`
- `apps/admin-web/app/globals.css`

## Verification

- `npm run typecheck` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run prisma:validate --workspace @volt-rewards/api` passed.
- `npm run build --workspace @volt-rewards/admin-web` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.
- Playwright desktop smoke check passed.
- Playwright mobile smoke check passed.

Current test count: 40 passing.

## Important Implementation Notes

- Mock BUSY remains the active invoice source.
- The product build remains unblocked by actual BUSY API integration.
- Admin Web is still not feature-complete as a full admin portal; this phase only establishes the persisted QR print foundation and route skeleton.
- Returned-product QR status scan, cancel, and reverse remain Admin Mobile only.
- Print history currently reads QR print audit events. A dedicated print job table can be added later if label batches need richer lifecycle tracking.

## Next Slice

The next slice was selected and delivered as `PHASE_7_STATUS.md`: Admin Web dashboard and role-scoped shell routes.
