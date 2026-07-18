# Phase 21 Execution Plan - BUSY Return Voucher Domain Correction

Status: Complete
Created: 2026-07-07
Completed: 2026-07-07

## Goal

Correct the backend/domain model so BUSY returns are represented as linked Return of Sale vouchers, not as `returnedQty` fields silently mutating the original sale invoice.

This phase is backend/domain first. It prepares the platform for Admin Web and mobile product-grade recovery by making invoice return behavior correct before UI redesign work resumes.

## Source Inputs

- `AGENTS.md`
- `PHASE_20_BUSY_RETURN_CONTRACT.md`
- `PHASE_20_STATUS.md`
- `MANUAL_UAT1_TRIAGE.md`
- `OPEN_QUESTIONS.md`
- `architecture/DECISIONS.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `integrations/BUSY_API_HANDOFF.md`
- `client-deliverables/BUSY_API_INTEGRATION_SPEC.md`
- Current code:
  - `apps/api/prisma/schema.prisma`
  - `apps/api/src/busy/busy-import.repository.ts`
  - `apps/api/src/busy/busy-import.service.ts`
  - `apps/api/src/busy/mock-busy-invoices.ts`
  - `apps/api/src/busy/prisma-busy-import.repository.ts`
  - `apps/api/src/busy/prisma-admin-web-invoice-read.repository.ts`
  - `apps/api/src/qr/prisma-qr-print.repository.ts`
  - `apps/api/src/qr/qr-print.service.ts`
  - `packages/domain/src/qr-print.ts`

## Current Code Reality

The current backend stores returns as `BusyInvoiceLine.returnedQty` on the original sale invoice line.

This is no longer correct as the source model because BUSY creates a new linked Return of Sale voucher and does not mutate the original invoice.

Current implementation consequences:

- `BusyInvoiceLine.returnedQty` reduces printable quantity directly.
- Mock invoices include `returnedQty` inside sale lines.
- QR placeholders are created for full sale line quantity.
- QR print availability uses `quantity - returnedQty - alreadyUnavailableQuantity`.
- No durable return voucher table exists.
- No return-voucher idempotency exists.
- No linked return history exists for Admin Web invoice detail.
- No allocation state exists for review-needed return cases.

## Blocking Decisions Before Implementation

These were brought forward and approved before implementation.

### Q1 - Scanned QR Without Physical Return Scan

If a Return of Sale voucher arrives from BUSY without Admin Mobile scanning the returned product QR, and all matching QR units for the returned item quantity are already scanned, should Volt Rewards:

- Approved: create a `review-needed` return allocation item and do not automatically reverse points.
- Alternative: auto-select a scanned QR unit and reverse points.

Recommended rationale:

- The approved v1 return flow depends on Admin Mobile scanning the physical returned product QR.
- Auto-reversing without a physical QR scan could deduct points from the wrong contractor when BUSY only gives voucher-level/item-code data.
- A review-needed state preserves auditability and avoids silent point mutation.

### Q2 - Duplicate Same Item Code On Original Invoice

If the original sale invoice has multiple lines with the same `tmpItemCode` and BUSY provides no original line reference, is pooled allocation by original invoice + item code acceptable?

- Approved: yes, pool by original invoice + `tmpItemCode`, validate cumulative quantity, and record allocation metadata.
- Alternative: block allocation until BUSY provides a stronger original line reference.

Recommended rationale:

- BUSY currently gives voucher-level linkage and no unique physical item id.
- Pooled allocation is deterministic and auditable.
- It keeps product build moving while still allowing stronger matching later if BUSY provides original line identity.

### Q3 - No Physical QR Scan, Mixed Not-Printed And Printed-Unscanned Units

When a Return of Sale voucher arrives without Admin Mobile scanning a physical returned product QR, should not-yet-printed units be consumed before printed-unscanned units?

- Approved: yes. Allocate returned quantity to not-yet-printed placeholders first, then printed-unscanned QR units, then scanned units as review-needed.
- Alternative: printed-unscanned units should be cancelled first even without a physical QR scan.

Recommended rationale:

- Not-yet-printed units have no label in the field, so reducing future print availability is the least risky adjustment.
- Printed-unscanned units have physical labels; cancelling them without scanning the actual label can create operational mismatch.
- Admin Mobile scan remains the exact-unit action when a physical QR label exists.

## Proposed Implementation Shape After Decisions

### Data Model

Add return-voucher persistence rather than relying on only `BusyInvoiceLine.returnedQty`.

Candidate models:

- `BusyReturnVoucher`
  - return external id.
  - linked original invoice id.
  - voucher number/date/type.
  - status.
  - raw source.
  - imported timestamp.
  - idempotency/event fields.

- `BusyReturnVoucherLine`
  - return voucher id.
  - returned `tmpItemCode`/sku.
  - product name.
  - unit.
  - returned quantity.
  - original line id when known.
  - allocation metadata.

- `BusyReturnAllocation`
  - return line id.
  - original invoice line id when known.
  - quantity.
  - allocation type: `NOT_PRINTED_UNAVAILABLE`, `PRINTED_CANCEL_ELIGIBLE`, `SCANNED_REVIEW_NEEDED`, `SCANNED_REVERSED`.
  - optional QR unit id when an exact unit is selected.

Exact names can be refined during implementation, but the persisted model must support linked voucher history and idempotency.

### Domain Rules

Create deterministic domain functions for:

- Matching return line to original invoice lines.
- Validating positive return quantity.
- Validating cumulative returned quantity does not exceed sold quantity.
- Allocating returned quantity by approved priority.
- Producing review-needed allocation instead of silent point reversal where required.

### Mock BUSY Adapter

Update mock data to separate sale invoices from return vouchers.

Required fixtures:

- Sale invoice with printable lines.
- Return voucher before any QR print.
- Return voucher after partial print.
- Return voucher where printed unscanned QR is cancel-eligible when scanned by Admin Mobile.
- Return voucher where all matching QR is scanned and review/reversal is required.
- Full return voucher.
- Cancelled invoice.
- Duplicate same `tmpItemCode` sale lines.
- Invalid original reference.
- Excess returned quantity.

### QR Print Integration

Update QR print availability so it is derived from:

- Original sold quantity.
- Linked return-voucher allocations.
- Current QR unit state.

Do not show return vouchers in QR Print Queue.

### Admin Web Read Integration

Admin Web invoice read models should expose:

- Return history linked to original invoice.
- Sold quantity.
- Returned quantity.
- Printable quantity.
- Printed quantity.
- Scanned quantity.
- Cancelled quantity.
- Reversed quantity.
- Allocation status where relevant.

This phase may expose backend read fields without doing the Phase 22 UI redesign.

## Planned Work Sequence

1. Lock the three blocking decisions in `OPEN_QUESTIONS.md` and `architecture/DECISIONS.md`.
2. Add Prisma migration and regenerate Prisma client.
3. Update mock BUSY types and fixtures to include return vouchers.
4. Add return import repository/service contract.
5. Add domain allocation functions and tests.
6. Update Prisma repository to persist return vouchers and allocations idempotently.
7. Update QR print availability to use linked return allocations.
8. Update Admin Web invoice read contract to expose linked return history.
9. Update in-memory repository for API/domain tests.
10. Run targeted tests, full API tests, lint/typecheck, and `git diff --check`.
11. Update Phase 21 status with verified behavior and residual risks.

## Verification Plan

Automated tests:

- Domain tests for allocation priority and conflicts.
- Busy import service tests for return voucher idempotency.
- QR print flow tests proving returned units reduce printability.
- Invoice read tests proving return history is linked to original invoice.
- Conflict tests for unknown original invoice and returned quantity exceeding sold quantity.

Commands:

- `npm run test --workspace @volt-rewards/domain`
- `npm run test --workspace @volt-rewards/api`
- `npm run lint`
- `npm run typecheck --workspace @volt-rewards/api`
- `git diff --check`

## Non-Goals

- No Admin Web visual redesign in this phase.
- No Admin Mobile UI redesign in this phase.
- No native camera implementation in this phase.
- No production BUSY connector implementation beyond the mock/domain contract.
- No automatic point reversal without the approved allocation decision.

## Exit Gate

Phase 21 can be marked complete only if:

- Linked Return of Sale vouchers persist separately from sale invoices.
- Return vouchers do not appear as printable invoices.
- Return quantities reduce future printability.
- Return allocation is deterministic and tested.
- Scanned QR without physical returned-product scan follows the approved decision.
- Duplicate same-item-code behavior follows the approved decision.
- Admin Web read model can expose linked return history for Phase 22.
