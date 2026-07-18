# Phase 22H Reports Implementation Plan

Status: Implemented - Manual UAT2 Corrections Applied, Visible Browser Download UAT Pending
Created: 2026-07-08
Implemented: 2026-07-08
Manual UAT2 correction: 2026-07-08

## Manual UAT2 Correction Addendum

Source: `ManualUAT2_Reports.md`.

Corrections applied after owner UAT:

- Report Library no longer occupies a left sidebar that reduces report-table space; it is a compact horizontal selector above the active report.
- Top report cards are platform-wide attention metrics and no longer change with the selected report or report filters.
- Lightweight owner-useful charts were added for QR lifecycle mix, reward fulfillment funnel, points movement, and top claimed products.
- `Rewards Analytics` was removed because it duplicated `Reward Claims`.
- `Product/Category Performance` and `Contractor Deep Dive` were removed from first-pass Reports until a distinct owner use case is approved.
- Custom date range controls occupy reserved slots, so selecting `Custom` does not push existing filters down.
- A visible `Clear filters` action was added.
- Report tables now use sticky headers.
- Sorting moved from a long dropdown to per-column header buttons that cycle ascending, descending, and no sort.
- Scan failure reasons now show owner-facing business labels rather than internal codes such as `QR_NOT_SCANNABLE`.
- Reward claim reports now surface `Claim Raised`, `Delivered`, and `Claim Cancelled`; internal return/revocation states do not surface as a separate owner-facing status unless the business later approves that lifecycle.
- PDF/Excel export runtime defect fixed: the controller now uses Fastify `reply.header(...)` for download headers, export audit validates optional actor user linkage before writing `actorUserId`, and a controller boundary test protects the response-adapter path.

Harness rule carried forward:

- Future report/list surfaces must explicitly specify useful report purpose, stable filter layout, clear-filter behavior, sticky headers for long tables, per-column sorting, and owner-facing status vocabulary before implementation.
- File download endpoints require controller/adapter tests plus one live HTTP smoke proof during UAT; service-level byte generation tests are not enough.

## Goal

Replace the Admin Web Reports placeholder with a production-grade Reports workspace backed by persisted platform data, OWNER-only PDF/Excel exports, STAFF view-only access, exact report filters, and auditable export behavior.

This slice implements Reports only. Promotions remain a separate follow-up slice using the decisions already recorded in `PHASE_22H_REPORTS_PROMOTIONS_DECISION_CONTRACT.md`.

## Source Requirements

- `WEB-015`: Admin web supports reports/exports, promotions, analytics, and admin management screens according to role permissions.
- `REP-001`: Reports give OWNER all information needed for platform visibility.
- `REP-002`: Reports include QR codes printed by day/week/last week/month/3-month/custom date range with product category and quantity.
- `REP-003`: Reports include contractor leaderboard by collected points.
- `REP-004`: Reports include QR status.
- `REP-005`: Reports include reward claims.
- `REP-006`: Reports include returns/reversals.
- `REP-007`: Reports landing shows owner-useful platform-wide charts and attention metrics.
- `REP-008`: Report/list tables use sticky headers, stable filters, per-column sort controls, and clear-all filters.
- `REP-009`: STAFF reports are view-only.
- `REP-010`: OWNER can export/share reports as PDF, Excel, and WhatsApp.
  - Phase 22H v1 decision: implement OWNER PDF/Excel export only. WhatsApp is deferred.

## Required Context Read

- `AGENTS.md`
- `.planning/v1-agentic-build/APPROACH.md`
- `.planning/v1-agentic-build/PHASE_22H_REPORTS_PROMOTIONS_DECISION_CONTRACT.md`
- `.planning/v1-agentic-build/REQUIREMENTS_LEDGER.md`
- `.planning/v1-agentic-build/OPEN_QUESTIONS.md`
- `.planning/v1-agentic-build/ROADMAP.md`
- `.planning/v1-agentic-build/PHASE_22_STATUS.md`
- `.planning/v1-agentic-build/SECURITY_AND_EVALUATION_PLAN.md`
- `.planning/v1-agentic-build/FRONTEND_EXPERIENCE_STANDARD.md`
- `.planning/v1-agentic-build/PRODUCT_GRADE_PLATFORM_STANDARD.md`
- Local skills read for this plan:
  - `skills/ai_driven_sdlc_iteration/SKILL.md`
  - `skills/role_permissions/SKILL.md`
  - `skills/ui_surface_implementation/SKILL.md`
  - `skills/security_eval_gate/SKILL.md`
  - `skills/frontend_experience_quality/SKILL.md`
- Existing implementation patterns inspected:
  - `apps/api/prisma/schema.prisma`
  - `apps/api/src/admin-web/*dashboard*`
  - `apps/api/src/busy/*invoice-read*`
  - `apps/api/src/rewards/*`
  - `apps/api/src/qr/*print*`
  - `apps/admin-web/app/reports/page.tsx`
  - `apps/admin-web/src/api/adminApi.ts`
  - `apps/admin-web/src/components/AdminPortalShell.tsx`
  - `apps/admin-web/src/components/AdminDashboardWorkspace.tsx`
  - `apps/admin-web/app/globals.css`

## Scope

Included:

- Admin Web `/reports` becomes a real Reports workspace, not a placeholder.
- OWNER and STAFF can view reports.
- OWNER can export filtered report data as PDF and Excel.
- STAFF cannot export; backend must deny export APIs even if called directly.
- Reports landing page shows basic but important OWNER/STAFF analytics and insights.
- Current first-pass report set after Manual UAT2:
  - QR Print Analytics.
  - Scan History Analytics.
  - Contractor Leaderboard.
  - QR Status.
  - Reward Claims.
  - Returns/Reversals.
- Removed from first-pass Reports after Manual UAT2:
  - Rewards Analytics because it duplicated Reward Claims.
  - Product/Category Performance until it has a distinct owner use case.
  - Contractor Deep Dive until it has a distinct owner use case. Client Demo 2 later routes focused site analytics to Contractor Detail > Sites instead.
- Shared filters:
  - Today.
  - This Week including today.
  - Last Week.
  - This Month.
  - Last 3 Months.
  - Custom date range.
- Relevant status filters:
  - QR Print and Scan History reports.
  - Rewards and Reward Claims reports.
  - Returns/Reversals report.
- Additional report-specific filters:
  - Product/category.
  - Contractor.
  - Site.
  - Invoice number.
  - Staff/actor where relevant.
  - Reward name.
- Export rows include all columns relevant to the selected report.
- Export actions create audit events.
- Browser UAT covers OWNER, STAFF, filters, export denial, responsive layout, console/network checks, and exact data readback.

Excluded:

- Promotions implementation.
- WhatsApp report share.
- Hindi report output.
- Admin Mobile report depth and visible Admin Mobile polish.
- Returned-product camera scan/cancel/reverse workflows.
- Actual BUSY API replacement work.
- Advanced charting libraries or decorative dashboard visuals.
- Promotion targeting or all-user banner display.

## Open Questions

Relevant questions from `OPEN_QUESTIONS.md`:

- Report filters/columns/export format: resolved for first pass.
- Promotions: resolved but excluded from this slice.

Blocking before implementation:

- None from the product side.

Technical implementation assumptions:

- Report date presets are interpreted in India business time. Implementation should compute concrete `from`/`to` boundaries server-side and return the resolved range in the response.
- Existing Prisma models are sufficient for first-pass reports. Avoid schema changes unless implementation reveals an unavoidable audit/export metadata gap.
- Canonical user-facing QR report statuses are:
  - `Not_Printed`
  - `Printed`
  - `Reprinted`
  - `Claimed`
  - `Cancelled`
  - `Reversed_AND_Cancelled`
- Underlying Prisma status mapping:
  - `NOT_PRINTED` -> `Not_Printed`
  - `PRINTED_UNCLAIMED` -> `Printed`
  - `REPRINTED` -> `Reprinted`
  - `SCANNED_CLAIMED` -> `Claimed`
  - `CANCELLED` -> `Cancelled`
  - `REVERSED` -> `Reversed_AND_Cancelled`
- Export implementation must produce real downloadable files. If new packages are required for true `.xlsx` and `.pdf`, verify package docs/supply-chain risk before adding them. Do not silently downgrade Excel to CSV unless explicitly recorded as a temporary residual risk and accepted.
- The Admin Web generic API client currently assumes JSON. Binary exports should use a dedicated export/download helper rather than forcing files through the JSON `request<T>()` path.

Safe to defer with explicit assumption:

- Pixel-perfect PDF design. First pass requires clear formatted summary plus table.
- WhatsApp share.
- Hindi output.
- Admin Mobile reports.
- Large-scale data warehouse optimization. First pass can use indexed transactional tables and straightforward queries against current V1 data scale.

## Spec-To-Eval Criteria

BDD/state-action-outcome scenarios:

- Given OWNER opens `/reports`, when the page loads, then landing insight cards show persisted QR, scan, points, reward, return, contractor, and product metrics.
- Given STAFF opens `/reports`, when the page loads, then the same view-only report data is available but export controls are absent or disabled with clear role copy.
- Given OWNER selects `QR Print Analytics` and `This Month`, when the report loads, then rows and summary match persisted QR print/audit data for the resolved date range.
- Given OWNER changes a QR status filter, when the report reloads, then table rows, summary totals, and export payload use the same filtered source rows.
- Given OWNER exports a report as PDF, when the file downloads, then its summary and table match the visible filtered report data and a `REPORT_EXPORTED` audit event is persisted.
- Given OWNER exports a report as Excel, when the file downloads, then all report columns are present and a `REPORT_EXPORTED` audit event is persisted.
- Given STAFF calls the export API directly, when the request reaches the backend, then it returns forbidden and creates no export file.
- Superseded scenario: generic `Contractor Deep Dive` is no longer a first-pass Reports tab. Client Demo 2 routes focused site analytics to Contractor Detail > Sites.
- Given no rows match filters, when a report loads, then the empty state explains the current filters and keeps filter/export controls stable.
- Given the API fails, when a report load or export fails, then the UI shows a specific retryable error and does not show stale success text.

Business invariants:

- Report values are derived from persisted backend data, not frontend-only calculations.
- Export data matches the same backend query used for visible report rows.
- `QrStatus` values are consistently labeled using the approved v1 status language.
- Reward claims history preserves cancelled/revoked/fulfilled states even though active Claim Desk shows only active claims.
- Returns/reversals report distinguishes not-printed allocation, printed-cancel-eligible allocation, scanned-review-needed allocation, and scanned-reversed allocation where data exists.
- Product/category performance is not a first-pass report tab after Manual UAT2; persisted BUSY line/item insights should surface through approved focused workflows such as ItemCodes or top-product summary cards.
- Contractor names come from `User.displayName`.
- Mock invoice/product data remains realistic and electric-shop specific.

Role/permission invariants:

- OWNER can view and export reports.
- STAFF can view reports only.
- STAFF export denial is enforced by backend `REPORT_EXPORT`, not only UI hiding.
- Contractor and Team Member report surfaces are not part of this slice.
- Admin Web still does not expose returned-product camera scan/cancel/reverse controls.

Data persistence/readback invariants:

- Report landing metrics can be verified by direct API readback.
- Each report response returns the resolved filter range and summary totals.
- Exports persist an `AuditEvent` with actor, role, surface `ADMIN_WEB`, action `REPORT_EXPORTED`, report ID, format, filters, and row count.
- Export audit events are not created for forbidden STAFF requests.
- Seed reset keeps stable report fixtures for manual UAT.

UI/UX acceptance criteria:

- Reports page is dense, operational, and scan-friendly.
- Landing page shows meaningful analytics before detailed tables.
- Report selection is obvious and does not bury daily report access.
- Filters are grouped in a sticky or stable control bar near the report title.
- Tables use compact headers, human-readable labels, stable columns, and no repeated header clutter.
- Search, filters, sort, pagination, empty/loading/error/denied states are designed.
- Export controls are visible only to OWNER, or disabled for STAFF with clear role copy if the UI needs to show why.
- No raw database IDs are primary labels; IDs such as Claim ID or invoice number are shown when business-meaningful.
- Desktop and mobile-width web layouts do not overflow text or controls.

Security acceptance criteria:

- Backend applies `@RequireAction(ACTION.REPORT_VIEW)` to report reads.
- Backend applies `@RequireAction(ACTION.REPORT_EXPORT)` to exports.
- Export implementation does not expose unauthenticated or shareable permanent URLs.
- No secrets are added.
- New dependencies, if any, are verified before install and recorded in the phase status.
- Export responses include safe filenames and content types.
- Report filters are validated and bounded to prevent broad accidental heavy queries.

Explicit non-goals:

- WhatsApp export/share.
- Hindi report output.
- Promotions management.
- Mobile reports.
- BI warehouse, scheduled reports, or email delivery.
- Client-final PDF visual design.

## UI Experience Contract

Surface:

- Admin Web Reports.

Personas:

- OWNER.
- STAFF.

Primary job:

- OWNER: understand platform performance and exceptions, then export filtered reports for business review.
- STAFF: inspect report data to support operations without export authority.

Screen map:

- `/reports`
  - Reports landing analytics and report selector.
  - Detail workspace controlled by URL query state:
    - `?report=qr-print`
    - `?report=scan-history`
    - `?report=contractor-leaderboard`
    - `?report=qr-status`
    - `?report=reward-claims`
    - `?report=returns-reversals`
  - Filters encoded in query string where practical so dashboard shortcuts can deep-link to filtered reports.

Entry path:

- Admin Web sidebar `Reports`.
- Dashboard shortcuts and exception cards may deep-link to `/reports` with a selected report/filter.

Navigation/back behavior:

- Back from `/reports?report=...` returns to prior route or previous report query state.
- Changing report or filters updates state without losing loaded landing metrics.
- Failed report loads keep the user on the same report with a retry control.

Dashboard impact:

- Existing dashboard links to `/reports` remain valid.
- If touched during implementation, dashboard exception links should point to the most useful filtered report, for example QR exceptions -> `qr-status`.

Primary action:

- Select report from compact horizontal report selector and inspect filtered rows.

Secondary actions:

- Search.
- Filter.
- Sort by clicking column headers.
- Paginate.
- Export PDF (OWNER).
- Export Excel (OWNER).
- Clear filters.

Data shown:

- Platform-wide landing analytics cards:
  - QR ready to print.
  - Active printed QR.
  - QR claimed.
  - Active claim requests.
  - Return attention.
  - Lifetime points issued.
  - Active contractors.
  - Top contractor.
  - Top product/category.
- Platform-wide charts:
  - QR lifecycle mix.
  - Reward fulfillment funnel.
  - Points movement.
  - Top claimed products.
- Detailed tables follow the corrected Manual UAT2 report set and the active API contract below.

Data identity source:

- Contractor/admin human names: `User.displayName`.
- Contractor code/tier/points: `Contractor`.
- Invoice identity: `BusyInvoice.invoiceNumber`, `BusyInvoice.invoiceDate`, `BusyInvoice.customerRef`.
- Product/category: `BusyInvoiceLine.productName`, `sku`, `category`.
- QR status: `QrUnit.status`, mapped to approved labels.
- Scan history: `ScanAttempt` plus related `QrUnit`, `Contractor`, `TeamMember`, `Site`.
- Reward claims: `RewardClaim`, `RewardCatalogItem`, `Contractor`, `User`.
- Returns/reversals: `BusyReturnVoucher`, `BusyReturnVoucherLine`, `BusyReturnAllocation`, `PointsLedgerEntry`, `AuditEvent`.
- Points: `PointsLedgerEntry`.

Asset strategy:

- Reports do not require imagery.
- Icons should use existing `lucide-react`.
- No decorative report illustrations.

Empty/loading/success/error/denied states:

- Loading: report-specific skeleton or compact loading rows; no full-screen generic spinner.
- Empty: name the selected filters and suggest reset.
- Success: updated timestamp or clear loaded state.
- Error: specific retryable message; do not silently keep old rows as if current.
- Denied: STAFF export denied in UI; direct API denial tested.

Role differences:

- OWNER sees PDF and Excel export controls.
- STAFF sees no export controls or disabled controls with clear view-only role copy; backend denial remains required.

Reference inputs used:

- Existing Admin Web operational table/filter/card patterns.
- `FRONTEND_EXPERIENCE_STANDARD.md`.
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`.
- `Sample_References/` may inform polish if visual refinement is needed, but this slice must not become a marketing dashboard.

Mobile/desktop layout expectations:

- Desktop: two-level operational layout with platform-wide summary cards/charts, compact horizontal report selector, stable filter bar, sticky table headers, per-column sorting, and data table.
- Mobile-width web: filter controls stack cleanly; tables use horizontal scroll within `data-table-wrap`; buttons and selects remain within bounds.

Persistence/API readback after mutation:

- Reports are read-only except exports.
- Export actions must be verified by API response plus `AuditEvent` readback.

Exact UAT target:

- Admin Web: `http://127.0.0.1:3001/reports`
- API: `http://127.0.0.1:3000/api/admin-web/reports`

## API Contract

Report IDs:

- `qr-print`
- `scan-history`
- `contractor-leaderboard`
- `qr-status`
- `reward-claims`
- `returns-reversals`

Read endpoints:

- `GET /admin-web/reports/landing`
- `GET /admin-web/reports/:reportId`

Export endpoint:

- `POST /admin-web/reports/:reportId/export`

Common query/body fields:

- `rangePreset`: `today | this-week | last-week | this-month | last-3-months | custom`
- `from`: ISO date/datetime, required only for custom range.
- `to`: ISO date/datetime, required only for custom range.
- `qrStatus`: approved status label or backend enum where relevant.
- `rewardStatus`: reward claim status where relevant.
- `returnStatus`: return/reversal allocation status where relevant.
- `contractorId`
- `siteId`
- `productCategory`
- `invoiceNumber`
- `rewardName`
- `actorUserId`
- `search`
- `sort`
- `page`
- `pageSize`

Read response shape:

```ts
interface AdminReportResponse<Row> {
  readonly reportId: string;
  readonly title: string;
  readonly resolvedRange: {
    readonly label: string;
    readonly from: string;
    readonly to: string;
    readonly timezone: string;
  };
  readonly summary: readonly { readonly label: string; readonly value: string | number; readonly meta?: string }[];
  readonly columns: readonly { readonly key: string; readonly label: string; readonly align?: "left" | "right" | "center" }[];
  readonly rows: readonly Row[];
  readonly totalRows: number;
  readonly page: number;
  readonly pageSize: number;
}
```

Landing response shape:

```ts
interface AdminReportsLanding {
  readonly resolvedRange: AdminReportResponse<unknown>["resolvedRange"];
  readonly cards: readonly { readonly key: string; readonly label: string; readonly value: string | number; readonly meta?: string; readonly href?: string; readonly tone?: string }[];
  readonly reportShortcuts: readonly { readonly reportId: string; readonly title: string; readonly description: string; readonly metric?: string }[];
  readonly generatedAt: string;
}
```

Export request shape:

```ts
interface AdminReportExportRequest {
  readonly format: "PDF" | "EXCEL";
  readonly filters: Record<string, string | number | undefined>;
}
```

Export response:

- File download response, not JSON.
- PDF content type: `application/pdf`.
- Excel content type: `.xlsx` content type if using real XLSX generation.
- Filename must include report ID, date range label, and timestamp.

## Architecture Touchpoints

Domain/services:

- Add report filter/date range helpers either in API reports module or shared domain if reused later.
- Do not put report business rules only in Admin Web UI.

API routes:

- `apps/api/src/reports/admin-web-reports.controller.ts`
- `apps/api/src/reports/reports.service.ts`
- `apps/api/src/reports/admin-web-reports.repository.ts`
- `apps/api/src/reports/prisma-admin-web-reports.repository.ts`
- `apps/api/src/reports/report-export.service.ts`
- `apps/api/src/reports/reports.module.ts`
- Register `ReportsModule` in `apps/api/src/app.module.ts`.

Database tables:

- Read from existing tables:
  - `BusyInvoice`
  - `BusyInvoiceLine`
  - `QrUnit`
  - `QrToken`
  - `ScanAttempt`
  - `PointsLedgerEntry`
  - `RewardClaim`
  - `RewardCatalogItem`
  - `BusyReturnVoucher`
  - `BusyReturnVoucherLine`
  - `BusyReturnAllocation`
  - `Contractor`
  - `TeamMember`
  - `Site`
  - `User`
  - `AuditEvent`
- Write:
  - `AuditEvent` for exports only.
- No planned schema migration for this slice.

Admin Web:

- Replace `apps/admin-web/app/reports/page.tsx` placeholder with real page using session guard.
- Add `apps/admin-web/src/components/AdminReportsWorkspace.tsx`.
- Extend `apps/admin-web/src/api/adminApi.ts` with report response types, JSON report fetchers, and a dedicated export/download helper.
- Extend `apps/admin-web/src/api/adminApi.test.ts`.
- Add CSS only as needed in `apps/admin-web/app/globals.css`, reusing existing `.summary-grid`, `.panel`, `.data-table`, `.button`, `.select-input`, `.text-input`, and status badge patterns.

Audit events:

- `REPORT_EXPORTED`
  - `targetType`: `REPORT`
  - `targetId`: report ID.
  - `metadata`: format, filters, resolved range, row count.

Background jobs:

- N/A.

## Tests And Evals

Unit:

- Date preset resolver.
- QR status label mapping.
- Report filter parser/validator.
- Report column definitions.
- Export row mapping.

Integration/API:

- OWNER can read landing and each report.
- STAFF can read landing and each report.
- OWNER can export PDF and Excel.
- STAFF export returns forbidden.
- Export action writes `REPORT_EXPORTED` audit event for OWNER.
- Forbidden STAFF export writes no `REPORT_EXPORTED` audit event.
- Report rows match seeded data for at least:
  - QR status report.
  - Reward claims report.
  - Contractor leaderboard.
- Product/category performance was removed from first-pass Reports after Manual UAT2.
  - Returns/reversals report if seeded return data exists.

API contract:

- Add Admin Web API client tests for:
  - `getReportsLanding`.
  - `getReport`.
  - `exportReport`.
  - Dedicated binary export path not parsed as JSON.

UI/E2E:

- OWNER `/reports` loads landing cards and report selector.
- OWNER changes date range and status filter.
- OWNER opens at least QR Status, Reward Claims, and Returns/Reversals.
- OWNER downloads PDF and Excel.
- STAFF `/reports` loads report data.
- STAFF export controls absent/disabled.
- Direct STAFF export API returns forbidden.
- Empty state exercised by a filter combination with no rows.
- Network/API error state exercised with a mocked failure if practical.

Frontend experience quality:

- Review against `FRONTEND_EXPERIENCE_STANDARD.md`.
- Admin Web remains operational, dense, scan-friendly, and not decorative.
- Tables do not repeat headers inside rows and do not overflow labels.
- Desktop and mobile-width layout checked.

Product-grade platform review:

- Landing metrics answer OWNER operational questions.
- Drilldowns use human names and business identifiers.
- Status labels match approved v1 language.
- Reports are not claimed product-complete until export readback and Browser UAT pass.

Output eval:

- `npm run test:api`
- `npm run test:admin-web`
- `npm run typecheck`
- Browser UAT at `http://127.0.0.1:3001/reports`
- API/database readback for `REPORT_EXPORTED`

Trajectory eval:

- Confirm Phase 22H contract and open questions were read before implementation.
- Confirm no Promotions/Admin Mobile work was pulled in ad hoc.
- Confirm export technical dependency decision was recorded.
- Confirm any surprise updates this plan/status before continuing.

Browser workflow UAT:

- Exact URL:
  - `http://127.0.0.1:3001/reports`
- Browser profile matrix:
  - Clean isolated/incognito-like profile is required.
  - User persistent Chrome profile is not required unless user reports a profile-specific issue.
- Persona/actor context:
  - OWNER session.
  - STAFF session.
- Hydration/console/network check:
  - No unhandled hydration or client chunk errors.
  - Report API calls return expected status.
  - Export calls return file response for OWNER and forbidden for STAFF.
- Visible-control interaction proof:
  - Click report selector.
  - Change date range.
  - Change status filter.
  - Type search.
  - Sort table where implemented.
  - Click export buttons as OWNER.
  - Verify STAFF export absence/denial.
- Upload controls:
  - N/A for this slice.
- Happy path:
  - OWNER loads landing, filters report, exports PDF/Excel.
- Edit/update path:
  - N/A; reports are read-only.
- Delete/deactivate/cancel path:
  - N/A; reports are read-only.
- Denied/read-only role path:
  - STAFF view-only plus direct export denial.
- Persistence checks after each mutation:
  - Export audit event readback after OWNER export.
- Desktop/mobile layout checks:
  - Desktop viewport.
  - Mobile-width web viewport.

Security:

- No client-only authorization.
- No new secrets.
- No unauthenticated export URLs.
- STAFF denied-path tests.
- Export audit events.

Manual review:

- Verify first-pass reports are useful to OWNERs and do not feel like placeholder analytics.
- Verify filter/control placement is sensible for repeated operations.
- Verify exported column names match table/report language.

## Implementation Tasks

- [x] Preflight framework/dependency docs.
  - [x] Read project-local Next docs under `node_modules/next/dist/docs/` before editing Admin Web code, per `apps/admin-web/AGENTS.md`.
  - [x] Verified dependency choice. `exceljs`/`pdfkit` were not retained; export generation is implemented in-repo to avoid new runtime dependency/audit surface.
- [x] Backend report contracts.
  - [x] Create Reports module, controller, service, repository interface, Prisma repository, and export service.
  - [x] Define report IDs, filter DTOs, date preset resolver, status label mapping, column definitions, and response types.
  - [x] Add filter validation and bounded pagination.
- [x] Backend report read models.
  - [x] Implement reports landing analytics.
  - [x] Implement QR Print Analytics.
  - [x] Implement Scan History Analytics.
  - [x] Implement Rewards Analytics initially; superseded/removed after Manual UAT2 because Reward Claims covers the needed owner workflow.
  - [x] Implement Contractor Leaderboard.
  - [x] Implement QR Status.
  - [x] Implement Reward Claims.
  - [x] Implement Returns/Reversals.
  - [x] Product/Category Performance initially explored; superseded/removed after Manual UAT2 and should not be treated as an active first-pass report.
  - [x] Contractor Deep Dive initially explored; superseded/removed after Manual UAT2. Client Demo 2 routes focused site analytics to Contractor Detail > Sites.
- [x] Export implementation.
  - [x] Generate PDF file from the same report query rows.
  - [x] Generate Excel file from the same report query rows.
  - [x] Persist `REPORT_EXPORTED` audit events for successful OWNER exports.
  - [x] Export behavior covered by service tests; STAFF denial remains enforced by `ACTION.REPORT_EXPORT`.
- [x] Admin Web API client.
  - [x] Add report read types and methods.
  - [x] Add dedicated export/download helper that does not JSON-parse file responses.
  - [x] Add client tests.
- [x] Admin Web Reports UI.
  - [x] Replace placeholder `/reports`.
  - [x] Add `AdminReportsWorkspace`.
  - [x] Build landing analytics cards.
  - [x] Build report selector.
  - [x] Build filter bar for shared and report-specific filters.
  - [x] Build compact table with pagination/search/sort.
  - [x] Build OWNER-only export actions.
  - [x] Build STAFF view-only state.
  - [x] Build loading, empty, error, denied states.
  - [x] Ensure responsive layout and text containment through type/CSS review.
- [x] Tests and eval harness.
  - [x] Add API tests for export/file/audit behavior.
  - [x] Add Admin Web client tests.
  - [x] Run `npm run test:api`.
  - [x] Run `npm run test:admin-web`.
  - [x] Run `npm run typecheck`.
  - [x] Start local API/Admin Web servers only for Browser UAT and close/reuse sessions afterward.
  - [ ] Browser UAT OWNER and STAFF at exact URL.
  - [ ] Record screenshot/evidence paths.
- [x] Documentation/status.
  - [x] Update `PHASE_22_STATUS.md` with implementation result, output eval, trajectory eval, evidence, and residual risks.
  - [x] Update `ROADMAP.md` next active slice after Reports implementation completes.
  - [x] Update harness notes in `PHASE_22_STATUS.md` because the slice exposed process-limit/browser-tooling gaps.

## Exit Gates

- [ ] Requirement IDs satisfied or explicitly deferred.
- [ ] Phase-relevant open questions were brought forward before implementation.
- [ ] Product decisions and technical assumptions recorded.
- [ ] UI experience contract completed.
- [ ] Spec-to-eval criteria written before implementation.
- [ ] Backend report reads enforce `REPORT_VIEW`.
- [ ] Backend export enforces `REPORT_EXPORT`.
- [ ] STAFF export denied by backend and UI.
- [ ] OWNER PDF and Excel exports work.
- [ ] Export data matches visible filtered report rows.
- [ ] `REPORT_EXPORTED` audit event readback verified.
- [ ] Report status labels match approved v1 wording.
- [ ] Reports landing analytics are useful and persisted-data-backed.
- [ ] UI is product-grade, not a placeholder shell.
- [ ] Tests pass.
- [ ] Browser workflow UAT completed on `http://127.0.0.1:3001/reports`.
- [ ] Browser UAT uses visible controls and checks console/network/hydration.
- [ ] Desktop and mobile-width layout checked.
- [ ] Output eval completed.
- [ ] Trajectory eval completed.
- [ ] Security/eval gate completed.
- [ ] Residual risks documented.

## Local Plan Verification

Verdict: PASS for implementation readiness.

Checks:

- Requirements are mapped to eval criteria.
- Reports decisions from Phase 22H are reflected.
- Promotions are explicitly excluded from this implementation slice.
- OWNER/STAFF role behavior is specified at both UI and backend levels.
- Export audit/readback is included because report export is a high-risk action.
- UI-bearing work has a screen contract and browser UAT contract.
- Existing code paths and file locations were inspected before naming tasks.

Implementation result:

- Verdict: PASS for automated/API/Admin Web client verification.
- `npm run test:api` passed with 81 tests.
- `npm run test:admin-web` passed with 12 tests.
- `npm run typecheck` passed across all workspaces.
- Authenticated Admin Web proxy checks verified `/reports` SSR, reports landing JSON, and QR Status report JSON with approved status columns.
- Dependency check confirmed no retained `exceljs` or `pdfkit` API workspace dependency; PDF/XLSX generation is covered by in-repo tests.

Output eval:

- PASS for backend report reads, role-guarded export surface, Admin Web report API client, Admin Web Reports workspace implementation, status-label mapping, and deterministic export file generation.
- PARTIAL for frontend UAT because visible Browser verification and real download UX proof were blocked by unavailable browser tooling.

Trajectory eval:

- PASS with caveat: implementation followed the approved reports-only scope and did not pull Promotions/Admin Mobile polish into the slice.
- Harness improvement carried forward: browser/tool/process health must be checked before starting visible UAT, and temporary dev sessions must be closed promptly.

Residual verification:

- Visible Browser UAT and screenshot evidence are pending. In-app Browser returned `Browser is not available: iab`; fallback Playwright MCP failed with closed transport.
- Real browser download UX for PDF/Excel is pending. PDF/XLSX byte generation and export audit behavior are covered by deterministic API tests.
