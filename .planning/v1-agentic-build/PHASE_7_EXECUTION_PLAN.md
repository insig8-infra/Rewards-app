# Phase 7 Execution Plan - Admin Web Dashboard And Role-Scoped Shell

## Goal

Continue Milestone 3 by turning the Admin Web from a QR-only screen into the browser portal shell for all non-camera admin workflows, with a database-backed dashboard read model and role-scoped navigation.

## Source Requirements

- PLAT-005
- WEB-001
- WEB-003
- WEB-004
- WEB-013 through WEB-018
- MADM-012
- MADM-023
- MADM-024
- REP-001 through REP-010

## Tasks

- [x] Add `GET /admin-web/dashboard`.
- [x] Scope dashboard access through guarded actor context and `REPORT_VIEW`.
- [x] Return dashboard metrics from persisted invoices, QR units, contractors, staff, reward claims, and audit events.
- [x] Return role-scoped Admin Web sections for OWNER and STAFF.
- [x] Add Admin Web client support for the dashboard endpoint.
- [x] Replace the QR-only page chrome with a shared `AdminPortalShell`.
- [x] Preserve `Print QR codes` as the Admin Web landing page.
- [x] Add browser routes for dashboard, contractors, staff, rewards, reports, and promotions.
- [x] Hide OWNER-only nav entries when the dev actor is STAFF.
- [x] Keep returned-product QR status scan, cancel, and reverse absent from Admin Web routes.
- [x] Add focused API/client tests.
- [x] Run desktop/mobile browser smoke checks.

## Out Of Scope

- Real OWNER/STAFF login.
- Production dashboard analytics aggregation beyond current persisted counts.
- Contractor registration/edit/deactivation implementation.
- Staff create/reset/deactivate implementation.
- Reward fulfillment implementation.
- Report filter/export implementation.
- Promotion CRUD implementation.
- Returned-product QR status scan, cancel, or reverse on Admin Web.

## Acceptance Criteria

- Admin Web still opens to `Print QR codes`.
- Admin Web has route structure for every non-camera admin workflow expected in v1.
- OWNER can see dashboard, QR printing, print history, contractors, staff, rewards, reports, and promotions.
- STAFF can see dashboard, QR printing, print history, contractors, and reports only.
- Dashboard API uses backend actor context, not client-provided body authority.
- Dashboard route renders with metrics and recent activity fallback.
- No Admin Web route exposes returned-product QR scan/cancel/reverse controls.
- Typecheck, lint, tests, build, audit, and browser smoke checks pass.

## Verification

- `npm run typecheck` - passed.
- `npm test` - 42 tests passing.
- `npm run lint` - passed.
- `npm run prisma:validate --workspace @volt-rewards/api` - passed.
- `npm run build --workspace @volt-rewards/admin-web` - passed.
- `npm --cache .npm-cache audit --omit=dev` - found 0 vulnerabilities.
- Playwright desktop smoke check:
  - `/` rendered the shared shell and QR print workspace.
  - `/dashboard` rendered dashboard route; live API fetch showed `Failed to fetch` because API server was not running on port 3000 during browser smoke.
  - STAFF dev actor hid OWNER-only nav entries.
- Playwright mobile smoke check:
  - `/` rendered the mobile shell and QR print workspace without overlap.
  - `/reports` rendered the non-camera reports route without overlap.

## Implementation Notes

- `GET /admin-web/dashboard` is a read-only operational summary endpoint.
- Current dashboard data is intentionally count-based and backed by existing persisted models.
- Route placeholders establish the Admin Web surface area but do not yet implement each workflow.
- Report columns, export formats, reward catalog rules, and promotion targeting remain open questions for their later slices.
- The browser dashboard smoke test could not verify live API data because the API process was not running; API compile/tests passed.

## Next Slice

Build the next full-product management workflow against the same shell and backend permission model. Recommended order:

1. Contractor management shared by Admin Web and Admin Mobile.
2. Staff management shared by Admin Web and Admin Mobile.
3. OWNER-only reward fulfillment shared by Admin Web and Admin Mobile.
4. Reports/export implementation.
5. Promotions implementation.

Do not implement Admin Web returned-product QR status scan, cancel, or reverse in v1.
