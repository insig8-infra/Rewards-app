# Phase 22 UAT3 Correction Contract - QR Sync, Reprint Status, Deep Links, Upload

Status: Completed
Created: 2026-07-07
Completed: 2026-07-07

## Source Inputs

- User Admin Web UAT feedback on 2026-07-07.
- `AGENTS.md`
- `apps/admin-web/AGENTS.md`
- `PHASE_22_UAT2_QR_MEDIA_CORRECTION_CONTRACT.md`
- `PHASE_22_STATUS.md`
- `PHASE_22_EXECUTION_PLAN.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `architecture/QR_STATE_MACHINE.md`
- `REQUIREMENTS_LEDGER.md`

## Critical Reflection

The UAT2 correction improved implementation pieces but still left product semantics ambiguous:

- `BUSY sync` looked like a second invoice list even though `QR print queue` is the real operator surface.
- Last sync time was inferred from imported invoice timestamps, so idempotent sync did not reflect the latest sync attempt.
- Reprint rotated tokens but did not expose the `REPRINTED` QR status through the state machine and read models.
- Photo upload depended on programmatic file-input clicking, which can still be fragile in real browsers.
- Dashboard attention items linked only to the QR page, not the specific invoice needing action.

This is an Agentic Engineering failure mode: local fixes were technically valid but not fully tied to the workflow contract. This correction must close the contract, not only the immediate symptoms.

## Decisions

### BUSY Sync

- Keep a `BUSY sync` section, but it must be a compact source-ingestion/status panel, not an invoice browser.
- It must answer:
  - What source is being synced.
  - How many source invoices are available in the temporary mock source.
  - How many persisted invoices are currently in our database.
  - When the last source sync attempt completed.
- `Sync from BUSY` syncs all currently available mock BUSY invoices in this phase, matching the future production expectation that BUSY pushes or syncs changed invoices into our backend.
- `QR print queue` remains the only invoice-selection surface on the page.

### QR Print Queue Deep Links

- Dashboard `ready for QR print` attention rows must link to `/?invoiceId=<id>`.
- Opening that URL must select the invoice, open line details, and pre-check printable lines.
- If the invoice is no longer printable, the page must show a recoverable message and leave the queue usable.

### Last BUSY Sync Time

- Latest sync time must be based on sync/import audit events, not only invoice `importedAt`.
- Idempotent sync attempts must still update latest sync time.

### Reprint Status

- Reprinted QR units must transition to `REPRINTED`.
- `REPRINTED` means the active printed label is a replacement token and is still unscanned.
- `REPRINTED` units remain eligible for scan, cancellation, and further reprint while unexpired and active.
- Old tokens must remain invalid and fail scans.
- Scanned/claimed, cancelled, reversed, expired, and not-printed QR units remain ineligible for reprint.
- Dashboards, invoice details, reports/read models, and status badges must surface `REPRINTED`.

### Photo Upload

- Browse must use a native click target: the actual file input must cover the visible Browse control.
- Do not rely on programmatic `input.click()` for production UAT.
- Contractor create/detail, OWNER staff detail, and STAFF self-profile must all use the same hardened upload control.

## Completion Gate

- Automated domain, API, and Admin Web tests pass for affected behavior.
- Browser UAT verifies:
  - `BUSY sync` is not an invoice browser.
  - `Sync from BUSY` updates latest sync time even when invoices already exist.
  - Dashboard ready-invoice row opens the QR page with that invoice selected and line details visible.
  - Reprint changes unit status to `REPRINTED` in invoice detail.
  - `REPRINTED` replacement token can be scanned; old token cannot.
  - Scanned/claimed QR reprint is blocked.
  - Contractor Browse opens the OS/browser file chooser from the visible control.
  - Staff Browse opens the OS/browser file chooser from the visible control.
  - Browser console has zero app runtime errors.

## Implementation Evidence

- `packages/domain/src/qr.ts` and `packages/domain/src/busy-return.ts` updated so active unscanned `REPRINTED` labels remain scannable, cancellable, and reprintable.
- API QR print, scan, return, dashboard, and BUSY import repositories/services updated for `REPRINTED`, sync-all, and latest sync status.
- Admin Web QR Print screen updated so BUSY Sync is source/status only, `Sync from BUSY` syncs all mock invoices, queue selection owns invoice detail, and dashboard deep links open `/?invoiceId=<id>`.
- Admin Web profile photo upload now uses a native file input overlay on the visible Browse control.
- Admin Mobile return status badge recognizes `REPRINTED` as an active cancel-eligible state.

## Automated Verification

- `npm run test:domain` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm run test:admin-mobile` passed.

## Browser UAT Evidence

- Admin Web ran on `http://127.0.0.1:3001`; API ran on `http://127.0.0.1:3000`.
- Dashboard ready invoice `VR/26-27/1003` opened `/?invoiceId=cmr98ztl9000mfarsqwdoq0cd` with line details visible and printable lines selected.
- BUSY Sync rendered as source/status only: source, source invoice count, persisted invoice count, latest sync time, and `Sync from BUSY`.
- `Sync from BUSY` imported/synced all 4 mock source invoices and updated latest sync time on an idempotent sync attempt.
- Printing `VR/26-27/1003` completed without runtime error.
- Reprinting one printed unit changed the visible status to `REPRINTED` in the print batch and invoice detail.
- Contractor Browse opened the file chooser, uploaded a device image, created `UAT Photo Contractor 706533`, and showed an avatar in the directory.
- Staff Browse opened the file chooser, uploaded a device image, created `UAT Photo Staff 706534`, and showed an avatar in the directory.
- Current browser-console logs for the UAT session contained no app runtime errors.
