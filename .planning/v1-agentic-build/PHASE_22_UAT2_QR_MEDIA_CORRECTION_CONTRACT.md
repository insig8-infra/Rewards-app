# Phase 22 UAT2 Correction Contract - QR Print Semantics And Photo Upload

Status: Complete
Created: 2026-07-07
Completed: 2026-07-07

## Source Inputs

- User Admin Web UAT feedback on 2026-07-07.
- `AGENTS.md`
- `apps/admin-web/AGENTS.md`
- `PHASE_22_STATUS.md`
- `PHASE_22_EXECUTION_PLAN.md`
- `PHASE_22C_INVOICE_PRINT_HISTORY_CONTRACT.md`
- `PHASE_22D_CONTRACTOR_STAFF_MANAGEMENT_CONTRACT.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `REQUIREMENTS_LEDGER.md`

## Corrections

### QR Print Queue Semantics

- The QR print screen must not present "Mock BUSY Source" as if it is a product workflow.
- Until the live BUSY connector is available, the screen may expose a local/dev sync action, but it must be framed as `BUSY Sync`.
- `Sync from BUSY` pulls or imports invoices from the external source into our database.
- `Refresh queue` reloads the queue from our database only.
- The screen must show the latest invoice sync/import timestamp from our database.
- The QR Print Queue remains the primary operator surface for selecting printable sale invoices and printing QR units.

### Print Runtime Stability

- Clicking Print must never produce an app runtime error for normal operator mistakes.
- The Print action must be disabled unless an invoice is selected and selected line quantities are valid.
- If the API rejects a print request, the UI must show a recoverable status message and keep the page usable.

### QR Reprint

- Admin Web must support reprinting an already printed, unscanned QR unit when the original label was misplaced, torn, or unusable.
- Reprint must invalidate the old active QR token and return a new QR token once.
- Reprint is allowed only for active unscanned QR units. UAT2 introduced this for `PRINTED_UNCLAIMED`; UAT3 extends and locks the current rule so `REPRINTED` replacement labels remain eligible for scan, cancellation, and further reprint while active and unexpired.
- Reprint is blocked for scanned/claimed QR units, because points may already have been collected.
- Reprint is blocked for expired QR units in v1.
- Reprint must be audited with actor, target QR unit, previous token invalidation, and replacement metadata.

### Photo Upload

- The Browse control must be a reliable, real button-triggered device file picker, not a label-only hidden-input proxy.
- Contractor photo upload/update remains OWNER-only in Admin Web.
- Contractors may update their own photo later from the end-user app profile.
- Staff photo upload/update is allowed for OWNER on staff detail and for STAFF on their own Admin Web profile.
- STAFF self-photo update must not grant access to staff-management routes or other staff records.

## Completion Gate

- Automated API and Admin Web tests pass.
- Browser UAT verifies:
  - `Sync from BUSY` and `Refresh queue` have distinct visible meanings.
  - Latest sync timestamp is visible after invoice data exists.
  - Print action has no runtime error on valid print or invalid/stale API rejection.
  - Reprint on an unscanned printed QR returns a new token and invalidates the old one.
  - Reprint on scanned/claimed QR is blocked.
  - Contractor Browse opens file chooser and preview updates.
  - Staff detail Browse opens file chooser and preview updates for OWNER.
  - STAFF self-profile Browse opens file chooser and preview updates without staff-management access.
  - Browser console has zero app runtime errors.

## Completion Evidence

- QR Print screen now uses `BUSY sync` for source ingestion and `QR print queue` for persisted database queue review.
- `Sync from BUSY` and `Refresh queue` are distinct visible controls.
- Latest BUSY sync/import time is visible on the QR Print screen.
- Print is disabled until there is a valid invoice selection, preventing the prior normal-operator runtime path.
- QR reprint for an unscanned printed unit returns a replacement token and leaves the old token invalidated.
- Running backend rejected reprint for scanned/claimed QR unit `cmr34buk3000258rsc30zvawd` with `QR_REPRINT_INVALID_STATUS`.
- Contractor create flow uploaded a device image, persisted it, routed to detail, and showed the image avatar in the contractor directory for `Anil Deshmukh`.
- OWNER updated `Aarti Deshmukh` staff photo from Staff detail.
- STAFF `Aarti Deshmukh` updated their own photo from `/profile`.
- STAFF direct `/staff` access redirected to `/dashboard?denied=1`.
- Browser console check returned zero app runtime errors.
- Screenshots captured:
  - `.planning/v1-agentic-build/evidence/admin-web-uat2-qr-sync-queue.png`
  - `.planning/v1-agentic-build/evidence/admin-web-uat2-invoice-detail-reprint.png`
  - `.planning/v1-agentic-build/evidence/admin-web-uat2-contractor-photo-directory.png`
  - `.planning/v1-agentic-build/evidence/admin-web-uat2-staff-photo-owner.png`
  - `.planning/v1-agentic-build/evidence/admin-web-uat2-staff-self-profile.png`
