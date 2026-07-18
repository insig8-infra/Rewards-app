# Phase 5 Execution Plan - Admin Web QR Print Shell

## Goal

Create the first Admin Web UI surface for QR printing against the guarded backend contracts.

## Source Requirements

- WEB-001 through WEB-018
- QR-001 through QR-010
- PLAT-005

## Tasks

- [x] Scaffold `apps/admin-web` as a Next.js App Router workspace.
- [x] Add Admin Web root layout and first screen.
- [x] Add central development actor API client.
- [x] Ensure actor headers are added only by the API client, not individual components.
- [x] Add API client test proving QR print body does not include actor authority fields.
- [x] Build QR print workspace as the first screen.
- [x] Add mock BUSY invoice list/import action.
- [x] Add line selection, quantity controls, and max quantity clamping.
- [x] Add print action and printed unit/token display.
- [x] Use lucide-react icons in operational controls.
- [x] Add responsive desktop/mobile CSS.
- [x] Include Admin Web in root `test`, `typecheck`, and `lint` scripts.
- [x] Run visual smoke check with Playwright at desktop and mobile viewports.

## Out Of Scope

- Real OWNER/STAFF login.
- Real Admin Web non-camera management workflows beyond QR print.
- Real invoice list/detail endpoints.
- Print history endpoint and UI.
- PDF/label rendering.
- Live database-backed manual browser workflow.
- Returned-product QR status scan, cancel, or reverse on Admin Web.

## Scope Clarification

Admin Web is expected to support all non-camera OWNER/STAFF admin workflows over future slices. This phase remains the QR print shell only. Returned-product QR status scan, cancel, and reverse are excluded from Admin Web in v1 and must stay in Admin Mobile.

## Acceptance Criteria

- Admin Web first screen is the QR print workflow, not a landing page.
- Actor headers are centralized in the development API client.
- QR print body does not contain actor role or actor user id.
- UI has quantity controls bounded by available mock quantities.
- UI renders without desktop/mobile overlap.
- Admin Web typecheck, test, build, and monorepo gates pass.
- Dependency audit remains clean.

## Verification

- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - 36 tests passing.
- `npm run build --workspace @volt-rewards/admin-web` - passed.
- `npm --cache .npm-cache audit --omit=dev` - found 0 vulnerabilities.
- Playwright desktop smoke check - passed.
- Playwright mobile smoke check - passed.

## Next Slice

Add database-backed Admin Web invoice read endpoints and align the UI to real persisted invoice line ids:

1. Add `GET /admin-web/invoices`.
2. Add `GET /admin-web/invoices/:invoiceId`.
3. Return line-level availability from backend instead of UI mock line templates.
4. Update Admin Web to load imported invoice details from API.
5. Add print history endpoint and UI table.
6. Plan the remaining Admin Web non-camera management workflows as separate slices after the QR print foundation is database-backed.
