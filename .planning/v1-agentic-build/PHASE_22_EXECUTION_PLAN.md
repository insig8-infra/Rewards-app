# Phase 22 Execution Plan - Admin Web Product-Grade Recovery

Status: In Progress - Phase 22 UAT2 Correction Complete
Created: 2026-07-07
Last Updated: 2026-07-07

## Goal

Recover the Admin Web portal from a QR-print-centered shell into a product-grade operations portal for OWNER and STAFF non-camera workflows.

Phase 22 is intentionally split into gated sub-slices so each user-facing area can be verified before broadening.

## Source Inputs

- `AGENTS.md`
- `apps/admin-web/AGENTS.md`
- `PHASE_20_ADMIN_WEB_CONTRACT.md`
- `PHASE_20_UI_RECOVERY_CONTRACT.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `MANUAL_UAT1_TRIAGE.md`
- `OPEN_QUESTIONS.md`
- `PHASE_21_STATUS.md`
- `architecture/DECISIONS.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `REQUIREMENTS_LEDGER.md`
- Current Admin Web code in `apps/admin-web`
- Current backend auth and Admin Web APIs in `apps/api`

## Approved Phase 22 Decisions

1. Admin Web uses real OWNER/STAFF login based on the existing backend `POST /api/auth/admin/login` identity rules.
2. Admin Web stores the sensitive session token only in an HttpOnly, same-site cookie. Browser JavaScript must not read or persist the bearer token.
3. A small Next.js server-side proxy/BFF layer forwards Admin Web API calls to the Nest API with `Authorization: Bearer <token>` from the HttpOnly cookie.
4. The visible dev actor selector is removed from product UAT. Dev actor-header mode may remain only as explicit test-only fallback.
5. Admin Web dashboard metric definitions may share backend calculations with Admin Mobile, but Admin Web drilldowns optimize for desk and batch operations.
6. First-pass search/filter/sort fields are accepted from `PHASE_20_ADMIN_WEB_CONTRACT.md`; refinements happen after UAT.

## Phase 22 Sub-Slices

### Phase 22A - Login, Session, Route Guards, Shell

Status: Complete on 2026-07-07

Scope:

- Add `/login` with OWNER/STAFF role choice, mobile number, and PIN.
- Add Next route handlers for login, logout, and backend proxying.
- Set Admin Web session token in HttpOnly cookie.
- Protect Admin Web routes server-side before rendering.
- Enforce owner-only routes for Staff, Rewards, and Promotions.
- Remove normal visible dev actor selector from the shell.
- Keep route-level STAFF denial honest and visible where the route is intentionally inaccessible.

Exit gate:

- OWNER can login and reach dashboard.
- STAFF can login and reach allowed routes.
- Unauthenticated protected route redirects to `/login`.
- STAFF direct access to owner-only route is blocked before rendering management controls.
- Logout clears cookie and returns to login.
- Client-side Admin API calls no longer need actor headers in product path.

### Phase 22B - Dashboard Recovery

Status: Complete on 2026-07-07

Scope:

- Operational dashboard with attention queues, recent activity, shortcuts, and clickable metrics.
- Drilldowns route to filtered Admin Web operational lists.
- Role-aware dashboard for OWNER and STAFF.
- Detailed contract: `PHASE_22B_DASHBOARD_CONTRACT.md`.

Exit gate:

- Every dashboard metric either has a drilldown or documented no-click rationale.
- Recent activity uses human-readable labels, not raw IDs.
- OWNER and STAFF dashboards pass browser UAT with role-appropriate navigation and no console errors.

### Phase 22C - QR Print Queue, Invoice Ledger, Invoice Detail, Print History

Status: Complete on 2026-07-07

Scope:

- Split QR Print Queue from full Invoice Ledger.
- Add `/invoices`, `/invoices/:invoiceId`, and `/print-history`.
- Exclude return vouchers and fully non-printable invoices from QR Print Queue.
- Show linked return history from Phase 21 on invoice detail.
- Add first-pass search/filter/sort controls.
- Detailed contract: `PHASE_22C_INVOICE_PRINT_HISTORY_CONTRACT.md`.

Exit gate:

- QR Print Queue only shows printable sale invoices.
- Invoice Ledger shows linked returns against original sale invoices.
- Print History is a separate route and supports list tooling.
- Invoice Detail shows invoice metadata, line-level lifecycle facts, linked return history, print-run history, and next action.
- OWNER and STAFF pass browser UAT for Phase 22C routes.

### Phase 22D - Contractor And Staff Management Recovery

Status: Complete on 2026-07-07

Scope:

- Add dedicated `/contractors/new`, `/contractors/:contractorId`, `/staff/new`, and staff detail/control flows where needed.
- Enforce contractor name/mobile immutability in backend and UI.
- Keep photo update and deactivate/reactivate separate.
- Add list search/filter/sort.
- Detailed contract: `PHASE_22D_CONTRACTOR_STAFF_MANAGEMENT_CONTRACT.md`.

Exit gate:

- OWNER create/update/deactivate flows pass visible UAT and API/database readback.
- STAFF sees read-only contractor state and cannot access staff management.

### Phase 22 UAT2 Correction - QR Print Semantics And Photo Upload

Status: Complete on 2026-07-07

Scope:

- Clarify QR Print screen semantics so BUSY source sync and persisted QR queue refresh are distinct user actions.
- Show latest BUSY sync/import timestamp.
- Stabilize QR print action against normal operator mistakes and transaction-timeout runtime errors.
- Add QR reprint for misplaced/torn printed labels with old-token invalidation.
- Block reprint for scanned/claimed and otherwise ineligible QR units.
- Repair device photo upload clickability and persistence for contractor and staff flows.
- Add STAFF self-photo update without opening staff-management routes.

Exit gate:

- QR queue, reprint, and photo upload behaviors pass browser UAT.
- Scanned/claimed QR reprint rejection is verified against the running backend.
- API and Admin Web automated tests pass.

### Phase 22E - Rewards, Reports, Promotions Recovery

Scope:

- Product-grade reward fulfillment queue/lookup.
- Reports hub and read/export permissions.
- Promotions management access state.

Exit gate:

- OWNER-only reward fulfillment remains enforced.
- STAFF report access is read-only if exposed.
- Promotions management is OWNER-only.

## Phase 22A Implementation Plan

1. Add Admin Web auth/session types and server helpers.
2. Add Next route handlers:
   - `POST /api/admin/session/login`
   - `POST /api/admin/session/logout`
   - `GET/POST/PATCH /api/admin/backend/[...path]`
3. Add `/login` page and login form.
4. Update protected pages to require a valid Admin Web session server-side.
5. Update `AdminPortalShell` to receive authenticated session context instead of owning a dev actor selector.
6. Update Admin Web API client to default to the Next proxy path without actor headers.
7. Keep actor-header direct mode only when a test explicitly supplies `actor`.
8. Add Admin Web tests for login/proxy client behavior and route guards where practical.
9. Run typecheck/tests and visible-control UAT at `http://127.0.0.1:3001`.

## Verification Plan

Automated:

- `npm run test --workspace @volt-rewards/admin-web`
- `npm run test --workspace @volt-rewards/api`
- `npm run typecheck`
- `npm test`

Visible UAT for Phase 22A:

- Start API and Admin Web dev servers.
- Visit `http://127.0.0.1:3001/dashboard` while logged out; expect `/login`.
- Login as OWNER seeded user.
- Verify dashboard shell, OWNER nav, and logout.
- Login as STAFF seeded user.
- Verify STAFF nav excludes owner-only entries.
- Direct visit `/staff` as STAFF; expect blocked/redirect behavior.

Seed test credentials:

- OWNER: `9000000091` / PIN `1111`
- STAFF: `9000000092` / PIN `2222`

## Phase 22A Verification Results

Completed on 2026-07-07:

- `npm run test --workspace @volt-rewards/admin-web` passed.
- `npm run test --workspace @volt-rewards/api` passed.
- `npm run typecheck` passed across all workspaces.
- `npm test` passed across all workspaces.
- API health returned `{"status":"ok","service":"volt-rewards-api"}` at `http://127.0.0.1:3000/api/health`.
- Browser UAT confirmed unauthenticated `/dashboard` redirects to `/login?next=%2Fdashboard`.
- Browser UAT confirmed OWNER login reaches `/dashboard`, sees OWNER navigation including Staff, Rewards, and Promotions, and can open `/staff`.
- Browser UAT confirmed logout clears the web session and returns to `/login`.
- Browser UAT confirmed STAFF login reaches `/dashboard`, hides owner-only navigation, and direct `/staff` access redirects to `/dashboard?denied=1`.
- Browser console check showed only React DevTools/HMR development messages, no app runtime errors.
- Recent activity now labels Admin Web logins as `Admin Web Login`.

## Phase 22B Implementation Plan

1. Lock dashboard-specific UI/data contract before editing.
2. Expand the Admin Web dashboard repository contract and Prisma read model.
3. Add role-aware attention queue, shortcuts, QR status mix, print trend, top contractors, and human-readable recent activity.
4. Update Admin Web dashboard API types and dashboard UI.
5. Verify OWNER and STAFF route behavior through browser UAT.

## Phase 22B Verification Results

Completed on 2026-07-07:

- Dashboard contract written in `PHASE_22B_DASHBOARD_CONTRACT.md`.
- Dashboard API returns enriched role-aware read model.
- OWNER dashboard shows operational sections: Attention queue, Shortcuts, Recent activity, QR status mix, Print trend, and Top contractors.
- OWNER dashboard shows all expected metrics and owner shortcuts.
- `Ready to print` metric routes to `/` and lands on `Print QR codes`.
- `Invoice Ledger` shortcut routes to `/invoices` and lands on `Invoice Ledger`.
- STAFF dashboard hides owner-only nav items and shortcuts: Staff, Rewards, and Promotions.
- STAFF direct `/staff` access redirects to `/dashboard?denied=1` and shows `Owner-only area blocked`.
- Browser console check showed zero app runtime errors.
- Screenshots captured at `/tmp/admin-web-phase22b-owner-dashboard.png` and `/tmp/admin-web-phase22b-staff-dashboard.png`.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm run typecheck` passed.
- `npm test` passed across all workspaces.

Runtime migration note:

- Dashboard UAT exposed that Supabase runtime DB had not applied migration `202607070001_busy_return_vouchers`.
- `npm run prisma:migrate:deploy --workspace @volt-rewards/api` was run successfully before final browser UAT.

## Phase 22C Implementation Plan

1. Lock QR Print Queue, Invoice Ledger, Invoice Detail, and Print History contract before editing.
2. Expand Admin Web invoice and print-history read models with lifecycle counts, linked return facts, actor names, and product/category summaries.
3. Keep `/` focused on printable sale invoices and mock BUSY import.
4. Add `/invoices` as the complete sale-invoice ledger.
5. Add `/invoices/[invoiceId]` as the line-level operational detail page.
6. Add `/print-history` as the standalone print-run audit list.
7. Verify OWNER and STAFF access through visible browser UAT.

## Phase 22C Verification Results

Completed on 2026-07-07:

- Phase 22C contract written in `PHASE_22C_INVOICE_PRINT_HISTORY_CONTRACT.md`.
- QR Print Queue at `/` shows printable sale invoices and mock BUSY import, with search/filter/sort and line-level print selection.
- Invoice Ledger at `/invoices` shows all persisted sale invoices with lifecycle counts, product/category summaries, return indicators, and detail drilldown.
- Invoice Detail at `/invoices/[invoiceId]` shows metadata, line item lifecycle facts, linked return vouchers, print runs, and allowed next action.
- Print History at `/print-history` shows searchable/filterable/sortable print-run audit rows with customer, actor, product summary, and invoice drilldown.
- STAFF can access `/`, `/invoices`, and `/print-history`; owner-only management routes remain restricted elsewhere.
- Browser console check showed zero app runtime errors.
- Screenshots captured at `/tmp/admin-web-phase22c-qr-print-queue.png`, `/tmp/admin-web-phase22c-invoice-detail.png`, `/tmp/admin-web-phase22c-invoice-ledger.png`, `/tmp/admin-web-phase22c-print-history.png`, and `/tmp/admin-web-phase22c-staff-print-queue.png`.
- `npm run build --workspace @volt-rewards/api` passed.
- `npm run typecheck --workspace @volt-rewards/admin-web` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm test` passed across all workspaces.

## Phase 22D Implementation Plan

1. Lock contractor/staff management route, permission, and backend contract before editing.
2. Correct contractor update behavior so name/mobile are immutable and only photo update is accepted after registration.
3. Add contractor reactivation and staff detail backend endpoints.
4. Split contractor management into routed directory, create, and detail screens.
5. Split staff management into routed OWNER-only directory, create, and detail screens.
6. Keep STAFF contractor access read-only and block all staff-management routes before rendering management data.
7. Verify OWNER and STAFF behavior through automated tests, API readback, visible browser UAT, and screenshots.

## Phase 22D Verification Results

Completed on 2026-07-07:

- Phase 22D contract written in `PHASE_22D_CONTRACTOR_STAFF_MANAGEMENT_CONTRACT.md`.
- Contractor directory at `/contractors` shows searchable/filterable/sortable operational rows with contractor identity, points, sites, scans, and reward facts.
- Contractor create at `/contractors/new` accepts name, mobile, optional uploaded photo, and routes to contractor detail after success.
- Contractor detail at `/contractors/[contractorId]` shows immutable name/mobile, photo-only update, reset MPIN, deactivate/reactivate, sites, and metrics.
- Backend rejects attempts to mutate contractor name or mobile through `PATCH /admin-web/contractors/:contractorId`.
- STAFF can view contractor list/detail read-only and cannot see mutation controls.
- Staff directory at `/staff` shows searchable/filterable/sortable OWNER-only rows.
- Staff create at `/staff/new` creates staff, shows the generated PIN once, and links to detail.
- Staff detail at `/staff/[staffId]` supports reset PIN, deactivate, and reactivate.
- STAFF direct access to `/staff`, `/staff/new`, and `/staff/[staffId]` redirects to `/dashboard?denied=1`.
- Browser console check showed zero app runtime errors.
- Screenshots captured at `/tmp/admin-web-phase22d-contractors-directory.png`, `/tmp/admin-web-phase22d-contractor-detail.png`, `/tmp/admin-web-phase22d-staff-directory.png`, `/tmp/admin-web-phase22d-staff-detail.png`, and `/tmp/admin-web-phase22d-staff-readonly-contractor.png`.
- `npm run build --workspace @volt-rewards/api` passed.
- `npm run typecheck --workspace @volt-rewards/admin-web` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm test` passed across all workspaces.

## Phase 22 UAT2 Correction Verification Results

Completed on 2026-07-07:

- UAT2 correction contract written and completed in `PHASE_22_UAT2_QR_MEDIA_CORRECTION_CONTRACT.md`.
- QR Print screen labels changed to `BUSY sync` and `QR print queue`.
- `Sync from BUSY` now represents source ingestion/import, while `Refresh queue` reloads the persisted queue.
- Latest BUSY sync/import timestamp is visible on the QR Print screen.
- Print action is disabled when no invoice is selected.
- QR print persistence path was batched to avoid per-unit transaction timeout during normal print runs.
- `POST /admin-web/qr/:qrUnitId/reprint` returns a new one-time token for active unscanned `PRINTED_UNCLAIMED` or `REPRINTED` units, invalidates the old active token, and sets/keeps the QR unit status as `REPRINTED`.
- Running backend rejected scanned/claimed QR unit `cmr34buk3000258rsc30zvawd` with `QR_REPRINT_INVALID_STATUS`.
- Contractor create with device photo upload created `Anil Deshmukh` and showed the persisted image avatar in the directory.
- OWNER updated `Aarti Deshmukh` staff photo from staff detail.
- STAFF `Aarti Deshmukh` updated their own profile photo from `/profile`.
- STAFF direct `/staff` access redirected to `/dashboard?denied=1`.
- Browser console check showed zero app runtime errors.
- Screenshots captured at `.planning/v1-agentic-build/evidence/admin-web-uat2-qr-sync-queue.png`, `.planning/v1-agentic-build/evidence/admin-web-uat2-invoice-detail-reprint.png`, `.planning/v1-agentic-build/evidence/admin-web-uat2-contractor-photo-directory.png`, `.planning/v1-agentic-build/evidence/admin-web-uat2-staff-photo-owner.png`, and `.planning/v1-agentic-build/evidence/admin-web-uat2-staff-self-profile.png`.
- `npm run build --workspace @volt-rewards/api` passed.
- `npm run typecheck --workspace @volt-rewards/admin-web` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.

## Phase 22 UAT3 Correction Verification Results

Completed on 2026-07-07:

- UAT3 correction contract written and completed in `PHASE_22_UAT3_QR_SYNC_REPRINT_UPLOAD_CONTRACT.md`.
- BUSY Sync is source-ingestion/status only and no longer renders as a second invoice browser.
- `Sync from BUSY` syncs all current mock BUSY source invoices and updates latest sync time from audit events.
- QR Print Queue remains the only invoice-selection surface.
- Dashboard ready invoice rows deep-link to `/?invoiceId=<id>` and open the invoice with line details visible.
- `REPRINTED` is now wired as an active unscanned replacement-label state across domain, API, Admin Web, Admin Mobile badge logic, and tests.
- Contractor and staff Browse controls use the native file input as the visible click target.
- Browser UAT confirmed `VR/26-27/1003` deep-link selection, BUSY sync timestamp refresh, print without runtime error, reprint showing `REPRINTED`, contractor/staff image upload and avatar persistence, and zero current-session app runtime console errors.
- `npm run test:domain` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm run test:admin-mobile` passed.

## Historical Non-Goals For 22A

These were true during Phase 22A. Phase 22B and Phase 22C later completed the dashboard and invoice/print-history recovery items listed here.

- Dashboard redesign was deferred to Phase 22B and is now complete.
- QR Print Queue and Invoice Ledger split was deferred to Phase 22C and is now complete.
- Contractor/staff detail route redesign was deferred to Phase 22D and is now complete.
- Production BUSY connector remained deferred pending the BUSY developer API contract.
- Returned-product QR status/cancel/reverse controls remained excluded from Admin Web.

## Current Remaining Non-Goals

- No production BUSY connector until the BUSY developer API contract is ready.
- No returned-product QR status/cancel/reverse controls in Admin Web for v1.
- No rewards/reports/promotions recovery until Phase 22E.

## Residual Risks To Track

- Admin Web cookie session validates through backend protected API calls; if a session expires, UI must redirect cleanly and clear local view state.
- Full production hardening still needs failed-attempt throttling, lockout policy, and deployment-specific secure-cookie checks before launch.
- Phase 22E must recover rewards, reports, and promotions with OWNER/STAFF permission behavior, visible persistence readback, screenshot evidence, and reward-fulfillment auditability before further feature breadth.
