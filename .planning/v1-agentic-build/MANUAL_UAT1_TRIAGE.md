
# Manual UAT 1 Triage - Product-Grade Recovery Plan

Source: `ManulUAT1.md`
Date: 2026-07-06
Status: Active correction input before further feature build

## Executive Diagnosis

Manual UAT 1 confirms that the platform has useful backend/API foundations, but several visible surfaces still behave like validation shells instead of production-grade products.

This is not a collection of isolated UI bugs. The deeper issue is phase completion discipline: some phases were marked functionally complete after API wiring, basic rendered screens, or narrow visible-control checks without a full product-grade screen contract, information architecture, navigation behavior, list behavior, and cross-surface UAT.

## Critical New Product Inputs

### BUSY Return Behavior

BUSY does not mutate the original sale invoice when a return happens. It creates a new Return of Sale voucher linked to the original sale voucher. The link is voucher-level, not item-line-level, and BUSY does not provide a unique identifier for each physical item.

Volt Rewards must therefore:

- Detect return vouchers.
- Link each return voucher to the original sale invoice.
- Validate that the returned `tmpItemCode` existed on the original invoice.
- Compare sold quantity, cumulative returned quantity, printed quantity, scanned quantity, cancelled quantity, and reversed quantity.
- Allocate return quantity against original invoice QR units by item code.
- Prefer cancelling unscanned active QR units before reversing scanned QR units.
- Keep return vouchers out of the QR printing queue.
- Show return activity as an update/history event on the original invoice.

### Contractor Identity Immutability

After contractor registration, contractor name and mobile number should not be casually editable. If the retailer entered the wrong name or phone number, they should deactivate the contractor and create a new one. Contractor photo can remain editable.

This changes the current Admin Web edit behavior and requires backend/API correction, not just UI hiding.

## Prioritized Findings

| ID | Area | Severity | Classification | Summary | Required Direction |
| --- | --- | --- | --- | --- | --- |
| UAT1-001 | Admin Web Dashboard | High | UX/product gap | Dashboard tiles and numbers are static or low-value. | Redesign as a true operations dashboard with clickable metrics, shortcuts, insights, and drilldowns. |
| UAT1-002 | Admin Web QR/Invoicing | Critical | Product rule + integration gap | BUSY return vouchers are linked to original sales and should not appear as print invoices. | Update BUSY adapter/domain model before deeper QR return work. |
| UAT1-003 | Admin Web Invoices | High | UX/product gap | Latest imports not prioritized; no import timestamps; invoices with nothing to print appear in print queue. | Split printable queue from full invoice ledger, with search/filter/sort and invoice detail drilldown. |
| UAT1-004 | Admin Web Print History | High | UX/product gap | Print History is a static section inside QR print page. | Make Print History its own route with filters, search, sort, and clickable invoice history. |
| UAT1-005 | Admin Web Contractors | High | UX/permissions/data rule gap | Register form is buried; details/edit layout is poor; name/mobile should be immutable. | Redesign list/detail/create flows and change backend edit contract to photo-only/status-only after registration. |
| UAT1-006 | Admin Web Staff | High | UX/product gap | Staff list and create flows have poor layout and no list tooling. | Redesign as a real staff directory with search/filter/sort and focused create/reset/deactivate flows. |
| UAT1-007 | Admin Web Auth | High | Security/product gap | Dev actor selector is not production-grade. | Add real Admin Web OWNER/STAFF login using backend admin auth; keep dev actor only as test-only tooling if needed. |
| UAT1-008 | Admin Mobile UX | High | UX/product gap | App feels web/static; dashboard controls are text-like and non-operational. | Rebuild Admin Mobile around native app patterns, operational cards, shortcuts, drilldowns, and role-aware actions. |
| UAT1-009 | Admin Mobile OWNER Scope | High | Requirement gap | Staff management is missing for OWNER. | Add OWNER staff management screen after UI contract and API gate. |
| UAT1-010 | Admin Mobile Contractors | Medium/High | UX/product gap | Contractor section lacks leaderboard, filters, search, and detail quality. | Create leaderboard plus contractor directory patterns with role-aware actions. |
| UAT1-011 | End-User Mobile App Feel | High | UX/product gap | Expo web view does not feel like a real mobile app; navigation and controls need native-grade polish. | Verify native device flow and redesign around approved Stitch patterns, not web-style panels. |
| UAT1-012 | Mobile PIN Fields | Medium | UX/security convenience | PIN inputs need mask/unmask control. | Add reveal/hide control to Contractor, OWNER, and STAFF PIN fields. |
| UAT1-013 | Contractor Sites | High | Product workflow gap | Dashboard says selected site but create/select/manage site path is not obvious. | Make site selection/creation a first-class route and scan prerequisite. |
| UAT1-014 | Rewards | High | UX/product gap | Featured rewards show delivered/collected items and reward tiles lack images/polish. | Separate featured/eligible rewards from reward history and enforce image-backed reward tiles. |
| UAT1-015 | Histories/Balance Book | High | Data presentation gap | Internal IDs appear in user-facing history; filters/search/sort are missing. | Replace internal IDs with human-readable invoice/product/site/actor metadata; add list tooling. |
| UAT1-016 | Dashboard Navigation | Medium/High | UX gap | Points Available and other summaries do not drill into details. | Make key dashboard values clickable and route to Balance Book/history/details. |

## Process Failure Analysis

The build drifted in three ways:

1. API foundations were sometimes treated as if they validated the complete user journey.
2. UI completion relied too much on whether a screen rendered and too little on information architecture, list behavior, navigation, and role-specific user jobs.
3. Visible-control UAT was too narrow. It verified selected interactions, but did not evaluate whether the screen was a production-grade product surface.

## Corrected Build Direction

No new feature breadth should be added until these recovery phases are planned and executed:

1. **Phase 20 - Manual UAT 1 Product Recovery Contract**
   - Produce corrected screen maps and interaction contracts for Admin Web, Admin Mobile, and End-User Mobile.
   - Lock dashboard, list, detail, create/edit, search/filter/sort, back/navigation, loading/empty/error, and data-identity standards.
   - Update implementation plans and open questions before code changes.

2. **Phase 21 - BUSY Return Voucher Domain Correction**
   - Update mock BUSY adapter and domain model for linked return vouchers.
   - Ensure return vouchers do not enter QR print queue.
   - Add allocation rules: cancel unscanned QR units first, reverse scanned units only for remaining returned quantity.
   - Add tests before UI work.

3. **Phase 22 - Admin Web Product-Grade Recovery**
   - Real Admin Web login.
   - Real dashboard with clickable metrics and drilldowns.
   - Separate Print History and Invoices pages.
   - Contractor/staff list/detail/create redesign.
   - Contractor name/mobile immutability enforced in backend and UI.

4. **Phase 23 - End-User Mobile Product-Grade Recovery**
   - Native-app feel and native-device validation path.
   - PIN reveal/hide.
   - Clear site select/create/manage path.
   - Reward tiles with images and correct featured/history separation.
   - Human-readable history and Balance Book with filters/search/sort.

5. **Phase 24 - Admin Mobile Product-Grade Recovery**
   - Native-app feel.
   - PIN reveal/hide.
   - Dynamic OWNER/STAFF dashboards.
   - OWNER staff management.
   - Contractor leaderboard plus searchable/filterable directory.

## Updated Completion Rule

For every future UI-bearing phase, completion must require:

- Screen contract before implementation.
- Applicable Stitch/reference mapping.
- Clickable dashboard/list/detail behavior where surfaced.
- Search, filters, and sorting for operational lists unless explicitly deferred.
- Human-readable data labels instead of raw database IDs.
- Role-specific visible-control UAT.
- API/database readback after mutation.
- Screenshot evidence for key states.
- Explicit product-grade review against `FRONTEND_EXPERIENCE_STANDARD.md` and `PRODUCT_GRADE_PLATFORM_STANDARD.md`.

