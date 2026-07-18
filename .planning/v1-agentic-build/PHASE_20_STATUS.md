# Phase 20 Status - Manual UAT 1 Product Recovery Contract

Completed: 2026-07-06.

## Completed Goal

Converted Manual UAT 1 findings into product-grade recovery contracts before further implementation.

This phase intentionally made no app code changes. It created the contract layer needed to prevent the next build steps from drifting back into shell-like UI or unreviewed business assumptions.

## Requirement Areas Covered

- `PLAT-005`, `PLAT-009`, `PLAT-012`, `PLAT-013`, `PLAT-014`, `PLAT-015`
- `WEB-001` through `WEB-020`
- `SITE-001` through `SITE-010`
- `SCAN-001` through `SCAN-012`
- `RWD-001` through `RWD-025`
- `MADM-001` through `MADM-026` where recovery contracts apply
- `QR-001` through `QR-018`
- `REP-001` through `REP-010`

## Deliverables

- `PHASE_20_UI_RECOVERY_CONTRACT.md`
- `PHASE_20_ADMIN_WEB_CONTRACT.md`
- `PHASE_20_MOBILE_CONTRACT.md`
- `PHASE_20_BUSY_RETURN_CONTRACT.md`

## Key Decisions Applied

- `DEC-042`: BUSY returns arrive as linked Return of Sale vouchers.
- `DEC-043`: Contractor name and mobile are immutable after registration.
- `DEC-044`: Manual UAT 1 blocks feature breadth until recovery phases.

## What The Contracts Lock

- Dashboards must be operational command surfaces with clickable metrics or documented no-click rationale.
- Operational lists and histories need search, filters, sorting, and clickable detail rows unless explicitly deferred.
- Histories must show human-readable business labels instead of raw database IDs.
- Admin Web needs real OWNER/STAFF login before product-grade UAT.
- QR Print Queue and Invoice Ledger are separate concepts.
- Return vouchers are not printable invoices; they appear as linked return history on the original invoice.
- Contractor name and mobile are immutable after registration; photo/status can change.
- Mobile PIN fields need reveal/hide controls.
- End-user and Admin Mobile recovery must target native-app quality, not web-shell quality.

## Open Questions Carried Forward

Phase 21 must bring forward:

1. If a return voucher arrives without Admin Mobile scanning the returned product QR and all matching QR units are already scanned, should Volt Rewards create a review-needed item or auto-select a scanned QR unit for reversal?
2. If an original sale invoice has duplicate lines with the same `tmpItemCode` and BUSY provides no original line reference, is pooled allocation by invoice + item code acceptable?
3. Should not-yet-printed units be consumed before printed unscanned units when a return voucher arrives without a scanned physical QR?

Resolved note: these questions were resolved in Phase 21 and locked in `DEC-045`.

Phase 22 through Phase 24 must bring forward:

1. Final first-pass filters/sorts/columns for each directory, history, and ledger.
2. Whether Admin Web and Admin Mobile dashboard metrics share identical definitions or optimize separately for desk vs counter/field work.

## Verification

- Documentation consistency review completed through local search.
- `git diff --check` passed.

## Next Phase

Phase 21 - BUSY Return Voucher Domain Correction.

Implementation should not begin until Phase 21 brings forward and resolves or explicitly defers the three return-allocation questions above.
