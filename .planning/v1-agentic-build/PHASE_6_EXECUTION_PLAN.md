# Phase 6 Execution Plan - Admin Web Database-Backed QR Foundation

## Goal

Close the Admin Web QR foundation gap by reading persisted mock BUSY invoices, using real persisted invoice line ids in the UI, and showing database-backed print history.

## Source Requirements

- WEB-004 through WEB-018
- QR-001 through QR-010
- PLAT-005

## Tasks

- [x] Add `GET /admin-web/invoices`.
- [x] Add `GET /admin-web/invoices/:invoiceId`.
- [x] Return invoice number, date/time, customer, GST totals, final total, line counts, QR unit counts, and print counts from persisted data.
- [x] Return persisted line ids, product metadata, points, returned quantity, printed quantity, not-printed quantity, and printable quantity.
- [x] Add `GET /admin-web/qr/print-history`.
- [x] Update Admin Web API client for invoice list/detail and print history.
- [x] Remove Admin Web hardcoded mock line-id templates from print selection.
- [x] Load persisted invoice detail after mock BUSY import.
- [x] Print using persisted invoice line ids.
- [x] Refresh persisted invoice detail and print history after print.
- [x] Add Admin Web navigation skeleton for all non-camera admin workflows.
- [x] Add focused API and client tests.
- [x] Run desktop/mobile browser smoke checks.

## Out Of Scope

- Actual BUSY API integration.
- Real OWNER/STAFF login.
- Label PDF/printer rendering.
- Persistent QR reprint endpoint implementation.
- Admin Web dashboard, contractor management, staff management, reward fulfillment, reports/exports, promotions, and analytics implementation.
- Returned-product QR status scan, cancel, or reverse on Admin Web.

## Acceptance Criteria

- Admin Web no longer fabricates `line_1` / `line_2` ids for print requests.
- Admin Web print requests use persisted invoice line ids returned by API.
- Admin Web can list persisted imported invoices.
- Admin Web can show persisted invoice detail and line-level print availability.
- Admin Web can show print history from backend audit events.
- Mock BUSY remains the active invoice data source and does not block full product build.
- Admin Web route skeleton makes the full non-camera admin portal scope visible.
- Typecheck, lint, tests, build, audit, and browser smoke checks pass.

## Verification

- `npm run typecheck` - passed.
- `npm test` - 40 tests passing.
- `npm run lint` - passed.
- `npm run prisma:validate --workspace @volt-rewards/api` - passed.
- `npm run build --workspace @volt-rewards/admin-web` - passed.
- `npm --cache .npm-cache audit --omit=dev` - found 0 vulnerabilities.
- Playwright desktop smoke check - passed.
- Playwright mobile smoke check - passed.

## Next Slice

Continue the full product build on mock BUSY. The next planning step should select the next production slice from:

1. Admin Web dashboard and role-scoped shell routes.
2. Contractor management shared by Admin Web and Admin Mobile.
3. Staff management shared by Admin Web and Admin Mobile.
4. Reward fulfillment shared by Admin Web and Admin Mobile.
5. End-user Contractor/Team Member auth and scan flows.

Do not implement Admin Web returned-product QR status scan, cancel, or reverse in v1.
