# Phase 22 UAT4 Correction Contract - Invoice Tables And QR Status Labels

Status: Completed
Created: 2026-07-07
Completed: 2026-07-07

## Source Inputs

- User Admin Web UAT feedback on 2026-07-07.
- `AGENTS.md`
- `apps/admin-web/AGENTS.md`
- `REQUIREMENTS_LEDGER.md`
- `PHASE_22_STATUS.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`

## Problem

Invoice Detail line items were visually dense because each product row repeated the same mini headers such as Sold, Returned, Printable, Printed, Scanned, Cancelled, and Reversed. This made the screen feel less like a production operator table and more like stacked debug cards.

QR item status language was also inconsistent across surfaces. Raw/backend states such as `PRINTED_UNCLAIMED`, `SCANNED_CLAIMED`, and `REVERSED` leaked into UI in some places, while other places used friendlier labels.

## Decisions

- Keep backend/domain QR enum names unchanged because they encode lifecycle transitions and existing business logic depends on them.
- Standardize displayed invoice/QR item statuses as:
  - `Not_Printed`
  - `Printed`
  - `Reprinted`
  - `Claimed`
  - `Cancelled`
  - `Reversed_AND_Cancelled`
- Use one Admin Web status display helper for QR lifecycle labels, badge tone, and ordered status counts.
- Invoice Detail line items must render as a structured data table with one header row and per-line QR status mix, not repeated fact-card labels.
- QR Print latest batch, Invoice Detail QR unit reprint rows, and dashboard QR status mix must use the same display language.
- Existing invoice-level statuses remain separate from QR item statuses unless explicitly mapped later.

## Completion Gate

- Admin Web typecheck/test passes.
- API test passes if backend dashboard labels change.
- Browser UAT verifies Invoice Detail line items have one table header and no raw QR enum labels in visible QR status chips.
- Browser UAT verifies QR Print latest batch and dashboard QR status mix use the approved display statuses.
- Planning docs are updated with delivered/verified outcome.

## Implementation Evidence

- Added `apps/admin-web/src/lib/qrStatusDisplay.ts` as the single Admin Web helper for QR item display labels, badge tones, and ordered status-count output.
- Added unit coverage in `apps/admin-web/src/lib/qrStatusDisplay.test.ts`.
- Replaced Invoice Detail repeated line-item fact cards with one structured data table.
- Replaced the long QR unit reprint card list with one structured data table using the same approved status labels.
- Updated QR Print latest-batch labels to use the shared helper.
- Updated Admin Dashboard QR summary/status mix labels to use `Claimed` and `Reversed_AND_Cancelled` display language.
- Added shared data-table CSS and `danger` QR status badge styling.

## Automated Verification

- `npm run test:admin-web` passed.
- `npm run test:api` passed.

## Browser UAT Evidence

- Verified `http://127.0.0.1:3001/invoices/cmr34bubx000058rsx9sy9w1u`.
- Invoice line table has one `Item` header and one `QR status` header.
- Invoice line table rendered 4 product rows.
- QR unit reprint table has one `Unit`, one `Status`, and one `Action` header.
- QR unit reprint table rendered 33 QR unit rows.
- Visible approved QR status labels included `Not_Printed`, `Printed`, `Reprinted`, and `Claimed` for the tested invoice state.
- Raw QR enum labels `PRINTED_UNCLAIMED`, `SCANNED_CLAIMED`, `NOT_PRINTED`, and `REVERSED` were not visible on the tested invoice detail screen.
- Dashboard QR status mix rendered approved labels and no raw QR enum labels.
- Browser console had zero app runtime errors during the UAT pass.
- Screenshot evidence: `/tmp/admin-web-uat4-invoice-table-final.png`.
