# Phase 7 Status - Admin Web Dashboard And Role-Scoped Shell

Updated: 2026-06-22

## Completed

- Added Admin Web dashboard backend module:
  - `GET /admin-web/dashboard`
  - `AdminWebDashboardService`
  - Prisma dashboard repository
- Dashboard endpoint now returns:
  - Actor role and role label.
  - Role-scoped allowed section ids.
  - Counts for contractors, staff, invoices, QR units by important statuses, and reward claims.
  - Recent audit events.
- Admin Web API client now supports `getDashboard`.
- Added shared `AdminPortalShell` with:
  - OWNER/STAFF development actor selector.
  - Centralized actor context for API headers.
  - Role-scoped navigation.
  - Desktop sidebar and mobile horizontal nav.
- Refactored QR printing to use the shared shell while preserving `/` as the landing route.
- Added Admin Web routes:
  - `/dashboard`
  - `/contractors`
  - `/staff`
  - `/rewards`
  - `/reports`
  - `/promotions`
- Added non-camera workflow route maps for contractor, staff, rewards, reports, and promotions.
- Confirmed no Admin Web route exposes returned-product QR status scan, cancel, or reverse controls.

## Files Added

- `apps/api/src/admin-web/admin-web-dashboard.controller.ts`
- `apps/api/src/admin-web/admin-web-dashboard.repository.ts`
- `apps/api/src/admin-web/admin-web-dashboard.service.ts`
- `apps/api/src/admin-web/admin-web-dashboard.service.test.ts`
- `apps/api/src/admin-web/admin-web.module.ts`
- `apps/api/src/admin-web/prisma-admin-web-dashboard.repository.ts`
- `apps/admin-web/src/components/AdminPortalShell.tsx`
- `apps/admin-web/src/components/AdminDashboardWorkspace.tsx`
- `apps/admin-web/src/components/AdminPlaceholderWorkspace.tsx`
- `apps/admin-web/app/dashboard/page.tsx`
- `apps/admin-web/app/contractors/page.tsx`
- `apps/admin-web/app/staff/page.tsx`
- `apps/admin-web/app/rewards/page.tsx`
- `apps/admin-web/app/reports/page.tsx`
- `apps/admin-web/app/promotions/page.tsx`

## Files Updated

- `apps/api/src/app.module.ts`
- `apps/api/src/auth/controller-actor-context.test.ts`
- `apps/admin-web/src/api/adminApi.ts`
- `apps/admin-web/src/api/adminApi.test.ts`
- `apps/admin-web/src/components/QrPrintWorkspace.tsx`
- `apps/admin-web/app/globals.css`
- `.planning/v1-agentic-build/architecture/API_CONTRACTS_DRAFT.md`

## Verification

- `npm run typecheck` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run prisma:validate --workspace @volt-rewards/api` passed.
- `npm run build --workspace @volt-rewards/admin-web` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.
- Playwright desktop smoke check passed for route rendering and STAFF nav scoping.
- Playwright mobile smoke check passed for `/` and `/reports` layout.

Current test count: 42 passing.

## Important Implementation Notes

- Admin Web now has the browser route structure for full non-camera admin scope, but most management routes are still route maps rather than completed workflows.
- The dashboard API is read-only and count-based.
- The live browser dashboard showed `Failed to fetch` because the API server was not running on `127.0.0.1:3000` during UI smoke; this is an environment limitation, not a compile/test failure.
- Mock BUSY remains the active invoice source.
- Actual BUSY integration remains replaceable behind the adapter boundary.
- Returned-product QR status scan, cancel, and reverse remain Admin Mobile only.

## Next Slice

The next slice was delivered as `PHASE_8_STATUS.md`: contractor management foundation with OWNER mutations and STAFF read-only access.
