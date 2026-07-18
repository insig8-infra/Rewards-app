# Phase 22C Contract - QR Print Queue, Invoice Ledger, Invoice Detail, Print History

Status: Complete
Created: 2026-07-07
Completed: 2026-07-07

## Source Inputs

- `AGENTS.md`
- `apps/admin-web/AGENTS.md`
- `PHASE_20_ADMIN_WEB_CONTRACT.md`
- `PHASE_21_STATUS.md`
- `PHASE_22_STATUS.md`
- `PHASE_22_EXECUTION_PLAN.md`
- `OPEN_QUESTIONS.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `architecture/DATA_MODEL_DRAFT.md`
- `architecture/DECISIONS.md`

## Open-Question Review

Relevant Phase 22C questions are resolved:

- Use the first-pass search/filter/sort fields from `PHASE_20_ADMIN_WEB_CONTRACT.md`.
- Admin Web supports OWNER and STAFF for QR print, invoice ledger, invoice detail, and print history.
- Return vouchers are separate BUSY records linked to the original sale invoice and must not appear as printable invoices.
- Returned-product QR status scan, cancel, and reverse remain Admin Mobile only in v1.
- Production BUSY APIs are still pending; Phase 22C continues with persisted mock BUSY invoice/return data.

No user decision blocks Phase 22C.

## Primary Job

Give admin operators a clean browser workflow for:

1. Finding sale invoices that still have printable QR units.
2. Reviewing the full invoice ledger and return impact.
3. Opening invoice detail to understand line-level print/return/QR status.
4. Auditing historical QR print batches.

## Route Map

| Route | Screen | OWNER | STAFF | Purpose |
| --- | --- | --- | --- | --- |
| `/` | QR Print Queue | yes | yes | Printable sale invoices and line-level batch print selection |
| `/invoices` | Invoice Ledger | yes | yes | Complete sale invoice ledger with return/QR status |
| `/invoices/[invoiceId]` | Invoice Detail | yes | yes | Invoice metadata, line facts, return history, and print context |
| `/print-history` | Print History | yes | yes | Print-run audit list with search/filter/sort and invoice drilldown |

## QR Print Queue Requirements

- Show only persisted sale invoices with `printableUnitCount > 0`.
- Exclude return vouchers and cancelled invoices.
- Exclude fully non-printable invoices.
- Keep mock BUSY import available because production BUSY API is not ready.
- Search by invoice number, customer, GSTIN, product, and category.
- Filters: ready to print, partially printed, imported today, has returns.
- Sort: latest import first, invoice date, invoice number, customer, printable units.
- Row/card shows invoice number, invoice date/time, import date/time, customer, GST/final total, line count, printable units, printed units, returned units, and return/review badges.
- Opening a row loads invoice detail and line-level print selection.
- Staff can select/unselect eligible lines and reduce quantity but cannot exceed printable quantity.

## Invoice Ledger Requirements

- Show all imported sale invoices, not only printable invoices.
- Show linked return activity against the original invoice.
- Return vouchers are visible only as linked invoice history, not as standalone printable invoices.
- Search by invoice number, customer, GSTIN, product, category.
- Filters: all, printable, fully printed, returned, review needed, cancelled.
- Sort: latest invoice/import, invoice number, customer, final total, printable units.
- Row/card shows invoice number, customer, invoice date/time, import date/time, totals, line count, QR counts, return voucher count, returned units, and review-needed count.
- Row click opens `/invoices/[invoiceId]`.

## Invoice Detail Requirements

- Show invoice metadata: invoice number, invoice date/time, import date/time, status, customer, GSTIN, seller, payment facts, and totals.
- Show line items with sold, returned, printable, printed, scanned, cancelled, reversed quantities, points per unit, GST, and line total.
- Show linked return vouchers with return number, date/time, status, line quantity, allocation quantity, and review-needed quantity.
- Show print-run history for that invoice.
- Show allowed next action:
  - If printable units exist, link back to QR Print Queue.
  - If no printable units remain, show that printing is complete or blocked by returns/cancellation.
- Do not expose Admin Web cancel/reverse controls.

## Print History Requirements

- Separate route at `/print-history`.
- Search by invoice number, customer, product/category, and actor.
- Filters: date range preset, actor, high-volume runs.
- Sort: latest printed first, invoice number, printed units, actor.
- Row/card shows invoice number, customer, printed units, actor, actor name where available, printed timestamp, line count, and product summary.
- Row click opens `/invoices/[invoiceId]`.

## Data Contract Additions

Admin Web invoice summaries should expose:

- `importedAt`
- `printableUnitCount`
- `returnedUnitCount`
- `scannedUnitCount`
- `cancelledUnitCount`
- `reversedUnitCount`
- `returnVoucherCount`
- `reviewNeededCount`
- `productSummary`
- `categorySummary`

Admin Web invoice detail should expose:

- Line-level scanned/cancelled/reversed counts.
- Invoice-level print history.

Print history entries should expose:

- `customerName`
- `actorName`
- `productSummary`

## Visual And Interaction Direction

- Dense operations surface with compact rows, strong search/filter controls, and predictable drilldowns.
- No placeholder planned rows on Phase 22C routes after implementation.
- No nested cards.
- Buttons sit next to the data they act on.
- Links must point only to implemented routes.
- Text must not overflow rows or controls.

## Verification Gate

Phase 22C is complete only when:

- `/` QR Print Queue shows only printable persisted sale invoices plus a mock BUSY source import area.
- `/invoices` shows all persisted sale invoices, including invoices with no printable units.
- `/invoices/[invoiceId]` renders invoice metadata, line facts, linked return history, and print-run history.
- `/print-history` renders print-run audit rows with search/filter/sort and invoice drilldown.
- OWNER and STAFF can open all Phase 22C routes.
- Browser UAT verifies search/filter/sort, invoice detail drilldown, print-history drilldown, and QR print queue exclusion of fully non-printable invoices.
- Automated tests pass for API and Admin Web.
- Full `npm test` passes before marking the slice complete.

## Completion Evidence

Completed on 2026-07-07:

- `/` QR Print Queue renders printable persisted sale invoices, mock BUSY import, search/filter/sort controls, and line-level print selection.
- `/invoices` renders all persisted sale invoices with lifecycle counts, linked return indicators, product/category summaries, and detail drilldown.
- `/invoices/[invoiceId]` renders invoice metadata, line facts, linked return history, print-run history, and next action.
- `/print-history` renders print-run audit rows with search/filter/sort, actor filtering, product summaries, and invoice drilldown.
- OWNER and STAFF browser UAT passed for Phase 22C routes.
- Browser console checks showed zero app runtime errors.
- API smoke checks confirmed enriched invoice and print-history fields.
- `npm run build --workspace @volt-rewards/api` passed.
- `npm run typecheck --workspace @volt-rewards/admin-web` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm test` passed across all workspaces.
- Screenshot evidence:
  - `/tmp/admin-web-phase22c-qr-print-queue.png`
  - `/tmp/admin-web-phase22c-invoice-detail.png`
  - `/tmp/admin-web-phase22c-invoice-ledger.png`
  - `/tmp/admin-web-phase22c-print-history.png`
  - `/tmp/admin-web-phase22c-staff-print-queue.png`

## Client Demo 2 Amendment - 2026-07-14

Phase 22C remains historically complete for its original scope, but Client Demo 2 adds a Phase 26A requirement:

- Invoice Ledger must include the same date-range filter pattern used by Reports, including presets and explicit `From` / `To` fields.
- This is not covered by the original Phase 22C completion evidence and must be verified in Phase 26A output eval and visible Admin Web UAT.
