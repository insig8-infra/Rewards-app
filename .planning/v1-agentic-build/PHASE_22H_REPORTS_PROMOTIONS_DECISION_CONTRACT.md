# Phase 22H Contract - Reports And Promotions Decision Gate

Status: Decisions Recorded - Ready For Reports Implementation Planning
Created: 2026-07-08
Updated: 2026-07-08

## Source Inputs

- `AGENTS.md`
- `app-requirementsV1.md`
- `ROADMAP.md`
- `REQUIREMENTS_LEDGER.md`
- `OPEN_QUESTIONS.md`
- `PHASE_22_STATUS.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`

## User Direction

On 2026-07-08, the user confirmed that visible Admin Mobile issues should not interrupt the planned build trajectory. Remaining Admin Mobile product-grade issues are deferred to Phase 24 unless a specific issue blocks a current phase requirement.

Phase 22H must therefore avoid ad-hoc Admin Mobile cleanup and focus on the planned reports/export/promotions decision gate.

## Goal

Lock the first-pass product contract for Reports, Exports, and Promotions before implementation, so Phase 22H/22I can build the right Admin Web and downstream mobile surfaces without guessing filters, columns, export behavior, or promotion visibility.

## Source Requirements

- `WEB-015`: Admin web supports reports/exports, promotions, analytics, and admin management screens according to role permissions.
- `CAPP-009`: End-user app includes banner/ad placements for client offers/promotions.
- `CAPP-010`: Banner/ad placements appear for Contractor and Team Member personas.
- `REP-001`: Reports give OWNER all information needed for platform visibility.
- `REP-002`: Reports include QR codes printed by day/week/last week/month/3-month/custom date range with product category and quantity.
- `REP-003`: Reports include contractor leaderboard by collected points.
- `REP-004`: Reports include QR status.
- `REP-005`: Reports include reward claims.
- `REP-006`: Reports include returns/reversals.
- `REP-007`: Reports landing shows owner-useful platform-wide charts and attention metrics.
- `REP-008`: Report/list tables use sticky headers, stable filters, per-column sort, and clear-all filters.
- `REP-009`: STAFF reports are view-only.
- `REP-010`: OWNER can export/share reports as PDF, Excel, and WhatsApp.

## Scope

Included:

- Decide first-pass report surfaces, filters, columns, and drilldowns.
- Decide export behavior for PDF, Excel, and whether WhatsApp is included.
- Decide STAFF report visibility and export restrictions.
- Decide promotion/banner placements, assets, scheduling, and all-user visibility rules.
- Decide whether promotions are built immediately after reports or split into a later phase.
- Produce an implementation-ready contract for the next build slice.

Excluded:

- Ad-hoc Admin Mobile UI/UX fixes.
- Native iOS/Android validation.
- Returned-product camera workflows.
- Production SMS/WhatsApp Business provider integration.
- Final client branding/copy beyond configurable placeholders.

## Open Questions

Relevant questions from `OPEN_QUESTIONS.md`:

- Reports And Exports:
  - What filters are required per report? Resolved: date range filters are required across reports using Today, This Week including today, Last Week, This Month, Last 3 Months, and Custom. Status filters are required for QR Print, Scan History, and Rewards reports. Additional report-specific filters may be added where clearly relevant.
  - What columns are required in PDF and Excel exports? Resolved: include all columns relevant to that report.
  - Should WhatsApp share send file attachments, links, or summaries? Resolved: no WhatsApp share in the initial reports implementation.
  - Do reports need Hindi output? Resolved: no Hindi report output for v1 initial reports.
- Promotions:
  - What banner placements are required? Resolved: simple advertisement banners on Contractor/Team Member dashboards and other high-attention app areas where the banner does not interrupt operational workflows or important messaging.
  - What asset types are allowed? Resolved: images, GIFs, or images with animated elements.
  - Can promotions be scheduled? Resolved: no future campaign scheduler for v1. OWNER can add a promotion, set an optional expiry date, edit header overlay text such as "NEW SALE IS ON!", change header font size/style/color, deactivate a promotion, and manage promotions from a separate `Manage Promotions` section inside Promotions.
  - Can promotions target tier, city, category, persona, or all users only? Resolved: all users only for v1 initial promotions.

Blocking before implementation:

1. Which reports are in the first implementation. Resolved: prioritize reports most useful to OWNER analytics around QR Print, Scan History, Rewards, and related operational visibility.
2. First-pass filters and columns per report. Resolved: date range plus relevant status filters; exports include all relevant columns for that report.
3. OWNER vs STAFF behavior for report viewing and exporting. Resolved: OWNER can view and export; STAFF can view only.
4. WhatsApp share mode. Resolved: no WhatsApp share initially.
5. Promotion placements and all-user visibility rules if promotions are built in this milestone. Resolved: all users see the same promotion placement; use dashboard and other high-attention areas where banners do not interfere with workflows.

Safe to defer with explicit assumption:

- Final visual design of export PDFs.
- Final client-approved promotion images. Use dummy public-source or generated placeholder promotion images during development.
- Automated WhatsApp Business API sending. Not needed for initial reports implementation.
- Hindi report output. Not needed for v1 initial reports.

- Reports tab landing page must give basic but important analytics and insights into numbers useful for OWNERs.

## Recommended First-Pass Defaults For User Approval

Reports:

- Build Reports first, then Promotions as a separate slice.
- Admin Web is the primary Reports surface.
- Admin Mobile reports depth waits for Phase 24, except any already visible dashboard counts.
- STAFF can view report pages but cannot export.
- OWNER can export PDF and Excel. WhatsApp share is not included initially.
- Reports landing page must include useful OWNER analytics/insight cards before drilling into individual report tables.

First reports:

- QR Print Analytics Report.
- Scan History Analytics Report.
- Rewards Analytics Report.
- Contractor Leaderboard.
- QR Status Report.
- Reward Claims Report.
- Returns/Reversals Report.
- Product/Category Performance Report and Contractor Deep Dive were considered in the original decision gate, then removed by Manual UAT2 until each has a distinct owner use case.

Shared filters:

- Date range: Today, This Week including today, Last Week, This Month, Last 3 Months, Custom.
- Product/category where relevant.
- Contractor where relevant.
- QR status where relevant, especially QR Print and Scan History.
- Reward status where relevant.
- Staff/actor where relevant for operational audit views.

Exports:

- PDF: formatted summary plus table.
- Excel: raw rows plus summary sheet.
- WhatsApp: excluded from initial reports implementation.

## First-Pass Report Matrix

Shared date filter:

- Today.
- This Week including today.
- Last Week.
- This Month.
- Last 3 Months.
- Custom date range.

Reports landing analytics:

- Purpose: give OWNER a quick operational picture before opening detailed report tables.
- Cards/insights: QR printed, QR scanned/claimed, QR cancelled, QR reversed, points issued, points reversed, active reward claims, delivered rewards, top contractor, top product/category, return/reversal attention count.
- STAFF: can view landing analytics but cannot export.

QR Print Analytics Report:

- Filters: date range, QR status, product/category, invoice number, printed by.
- Columns: invoice number, invoice date/time, print date/time, print run ID, product name, product code/SKU, category, quantity printed, QR status, points per unit, printed by, latest BUSY sync/import reference.
- Export: all visible/detail columns plus summary counts.

Scan History Analytics Report:

- Filters: date range, QR status/outcome, contractor, product/category, site, scanner persona.
- Columns: scan date/time, outcome/status, contractor name, contractor mobile, contractor code, site/client, scanner persona, team member mobile where applicable, invoice number, product name, category, QR short code, points credited/rejected, failure reason where applicable.
- Export: all visible/detail columns plus scan outcome totals.

Rewards Analytics Report:

- Filters: date range, reward status, contractor, reward name.
- Columns: claim ID, contractor name, contractor phone, reward name, points spent, claim raised date/time, current status, delivered date/time, cancelled/revoked date/time, fulfilled by owner where applicable.
- Export: all visible/detail columns plus status totals.

Contractor Leaderboard:

- Filters: date range where applicable, tier, city/site where available.
- Columns: rank, contractor name, contractor mobile, contractor code, tier, total accumulated points, points available, scan count, successful scan count, reward claims raised, rewards delivered, last scan date/time.
- Export: all visible/detail columns.

QR Status Report:

- Filters: date range, QR status, product/category, invoice number.
- Columns: invoice number, product name, product code/SKU, category, total units, Not_Printed, Printed, Reprinted, Claimed, Cancelled, Reversed_AND_Cancelled, returned/review-needed count.
- Export: all visible/detail columns plus status totals.

Reward Claims Report:

- Filters: date range, claim status, contractor, reward name.
- Columns: claim ID, contractor name, contractor phone, reward name, points spent, claim raised date/time, status, OTP sent date/time where available, delivered date/time, cancellation/revocation reason where available.
- Export: all visible/detail columns.

Returns/Reversals Report:

- Filters: date range, return/reversal status, product/category, contractor, invoice number.
- Columns: return voucher number where available, return date/time, original invoice number, product name, product code/SKU, category, returned quantity, allocation status, QR short code where known, contractor name where known, points reversed, claim revocation impact, action actor, action date/time.
- Export: all visible/detail columns plus reversal totals.

Product/Category Performance Report:

- Superseded by Manual UAT2 for first-pass Reports. Useful product/category insight can be handled through focused owner workflows such as ItemCodes and top-product summary cards until a distinct report use case is approved.

Contractor Deep Dive:

- Superseded by Manual UAT2 for first-pass Reports. Client Demo 2 reintroduces a focused contractor site analytics need under Admin Web Contractor Detail > Sites, not as a generic Reports tab.

Promotions:

- Build after Reports unless user says promotions are urgent.
- Admin Web OWNER manages promotions.
- Promotions has a separate `Manage Promotions` section inside Promotions.
- Contractor and Team Member apps show simple advertisement banners.
- First-pass placements: dashboard plus other high-attention areas where banners do not interrupt operations or important messages.
- First-pass targeting: all users only.
- First-pass asset types: images, GIFs, or images with animated elements.
- OWNER can upload promotion media, edit header overlay text, adjust header font size/style/color, set optional expiry date, and deactivate promotions.
- Client Demo 2 addition: OWNER can also configure horizontal marquee text scroller controls with a capped Hindi-safe font list, bold, italic, and color.
- Scheduling: no future campaign scheduler in v1; optional expiry date only.

## Spec-To-Eval Criteria

BDD/state-action-outcome scenarios:

- Given OWNER opens Reports, when they choose a report and filters, then the table and summary update from persisted backend data.
- Given OWNER exports a report, when they choose PDF or Excel, then the exported file matches the visible filtered source rows.
- Given STAFF opens Reports, when they view report data, then export controls are hidden or disabled and backend export APIs deny access.
- Given OWNER opens the Reports landing page, then they see useful analytics and insights before selecting detailed reports.
- Given OWNER manages a promotion, when they activate it, then all end-user personas can see the banner in approved placements.
- Given a promotion is inactive or expired, then it is not shown.

Business invariants:

- Report values must be derived from persisted source-of-truth data, not frontend-only calculations.
- Export data must match filtered report data.
- STAFF can view reports but cannot export.
- Promotions must never expose admin-only data to contractors or team members.
- Promotions are all-user for v1 initial implementation; tier/city/category/persona targeting is not included.

Role/permission invariants:

- OWNER: view, filter, export PDF/Excel, and manage promotions.
- STAFF: view reports only, no export, no promotion management.
- Contractor/Team Member: view active, non-expired all-user promotions in approved placements.

Data persistence/readback invariants:

- Report query inputs are reproducible.
- Export generation records audit events for OWNER export actions.
- Promotion create/update/activate/deactivate records audit events.
- Promotion visibility can be tested through API readback for Contractor and Team Member personas.

UI/UX acceptance criteria:

- Reports use dense, operational tables with search/filter/sort and drilldowns.
- Export controls are visually clear and role-aware.
- Promotion management is not placed on an unrelated landing page; it must sit behind a clear management action.
- No UI surface should use raw database IDs as primary labels.
- Promotion banners must not interrupt core scan, reward, login, or operational messaging flows.

Security acceptance criteria:

- Backend enforces STAFF export denial.
- Backend enforces OWNER-only promotion mutation.
- Export URLs/files do not expose data without authorization unless explicitly designed as temporary signed links.

Explicit non-goals:

- Automated WhatsApp Business outbound messaging unless separately approved.
- WhatsApp report share is excluded from the initial reports implementation.
- Native mobile report polish before Phase 24.
- Final client imagery for promotions.
- Advanced promotion targeting beyond all users.
- Promotion future start scheduling.

## UI Experience Contract

Surface:

- Admin Web Reports.
- Admin Web Promotion Management if promotions are included after decision.
- End-user mobile promotion banner placements in later implementation slice.

Personas:

- OWNER.
- STAFF.
- Contractor.
- Team Member.

Primary jobs:

- OWNER: inspect performance, operational exceptions, and export PDF/Excel reports.
- STAFF: inspect report data without export authority.
- Contractor/Team Member: see active all-user client offer/promotional banners without admin data leakage.

Screen map:

- Admin Web `/reports`.
- Report detail/drilldown sections inside `/reports`.
- Admin Web `/promotions` with nested `Manage Promotions` only after the promotion implementation slice starts.
- Contractor dashboard banner placement and other approved high-attention placements.
- Team Member dashboard/landing banner placement and other approved high-attention placements.

Entry path:

- Admin Web sidebar `Reports`.
- OWNER-only `Promotions` management route if built.
- End-user mobile banner placements are passive display surfaces.

Navigation/back behavior:

- Reports list -> report detail -> filtered drilldown -> back to previous filter state.
- Promotion management list -> create/edit detail -> back to list.

Dashboard impact:

- Admin Web dashboard shortcuts can link into filtered reports after reports exist.
- Admin Mobile dashboard report cards are deferred to Phase 24 unless explicitly pulled forward.

Data shown:

- Report-specific summary cards, filtered rows, and drilldown rows.
- Reports landing analytics/insight cards for OWNERs.
- Promotion media, header overlay text, header font settings, expiry date, active/deactivated status, and all-user visibility.

Asset strategy:

- Promotion images use dummy public-source or generated placeholder images until client-approved media is available.
- Reports do not require generated imagery.

Exact UAT target:

- Admin Web: `http://127.0.0.1:3001`
- End-user mobile banner UAT target to be set in the promotions implementation slice.

## Architecture Touchpoints

- Domain/read models:
  - Report query/read services.
  - Promotion visibility/expiry service.
- API routes:
  - Admin Web reports read APIs.
  - OWNER-only export APIs.
  - OWNER-only promotion management APIs if included.
  - End-user promotion visibility API if included.
- Database:
  - Report views can derive from existing tables first.
  - Promotion tables likely needed if promotion management is in scope.
- Audit events:
  - Report export.
  - Promotion create/update/activate/deactivate.
  - Promotion expiry handling.

## Tests And Evals

Unit:

- Report filter builders.
- Export row mapping.
- Promotion visibility/expiry logic.

Integration/API:

- OWNER report read/export.
- STAFF report read but export denied.
- OWNER promotion mutation.
- STAFF promotion mutation denied.
- Contractor/Team Member all-user active/non-expired promotion visibility.

UI/E2E:

- OWNER Reports filter/sort/search/drilldown/export.
- STAFF Reports view-only.
- OWNER Promotion management if included.
- End-user banner visibility if included.

Output eval:

- `npm run test:api`
- `npm run test:admin-web`
- Relevant mobile tests only when promotion placement reaches mobile.
- Browser UAT on exact URLs.

Trajectory eval:

- Confirm report/export/promotion questions were brought forward before implementation.
- Confirm Admin Mobile polish was not pulled into this slice.
- Confirm exact report rows/exports are verified by source-data readback.
- Confirm no broad text-only assertions are accepted for mutation/export evidence.

## Implementation Tasks After Decisions

- [x] Finalize report matrix with filters, columns, summaries, and exports.
- [x] Decide WhatsApp share mode: not included initially.
- [x] Decide Hindi report output: not included initially.
- [x] Decide whether promotions follow reports immediately or defer: Reports first, Promotions separate next slice unless reprioritized.
- [x] If promotions proceed, finalize placements, assets, scheduling, and targeting for v1: all-user banners, dashboard/high-attention placements, image/GIF media, no future scheduler, optional expiry date.
- [x] Create implementation plan for Reports slice: `PHASE_22H_REPORTS_IMPLEMENTATION_PLAN.md`.
- [x] Create implementation plan for Promotions slice if approved: `PHASE_22I_PROMOTIONS_IMPLEMENTATION_PLAN.md`.

## Client Demo 2 Amendment - 2026-07-14

Phase 22H/22I remain historically complete for the first-pass Reports and Promotions scope. Client Demo 2 adds Phase 26A requirements:

- Reuse the Reports date-range and column-sort pattern on Invoice Ledger and Reward History.
- Promotions must support horizontal marquee text scroller controls: font family from a capped Hindi-safe list, bold, italic, and color.
- Focused site analytics moves to Contractor Detail > Sites.
- Focused product/item reward-rule governance moves to the new ItemCodes tab.

## Exit Gates

- [x] User decisions recorded for all blocking questions.
- [x] Reports implementation scope is clear.
- [x] Promotions implementation scope is clear for a separate follow-up slice.
- [x] Admin Mobile polish issues are parked for Phase 24 unless blocking.
- [x] Spec-to-eval criteria ready for implementation.
