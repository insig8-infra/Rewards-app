# Phase 21 Status - BUSY Return Voucher Domain Correction

Completed: 2026-07-07.

## Completed Goal

Corrected the BUSY return model so Return of Sale vouchers are persisted as linked return records instead of silently mutating original sale invoice lines.

This phase is backend/domain complete. It deliberately does not redesign Admin Web or mobile screens; Phase 22 must use this corrected model when rebuilding invoice, QR print, and return-history UX.

## Requirement IDs Covered

- `WEB-005`
- `WEB-018` through `WEB-020`
- `WEB-023`
- `WEB-024`
- `QR-001`
- `QR-004`
- `QR-005`
- `QR-019`
- `QR-020`

## Questions And Decisions

- The three Phase 21 blocking questions were brought forward before implementation and resolved in `DEC-045`.
- BUSY return import creates review-needed allocation for scanned QR when no Admin Mobile physical QR scan identifies the exact unit.
- Duplicate same-`tmpItemCode` original invoice lines can be pooled by original invoice + item code, with allocation metadata.
- Return import consumes not-yet-printed units before printed-unscanned units when physical QR is unknown.

## Files Changed

- `packages/domain/src/busy-return.ts`
- `packages/domain/src/busy-return.test.ts`
- `packages/domain/src/index.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/202607070001_busy_return_vouchers/migration.sql`
- `apps/api/src/busy/busy-import.repository.ts`
- `apps/api/src/busy/busy-import.service.ts`
- `apps/api/src/busy/mock-busy-invoices.ts`
- `apps/api/src/busy/admin-web-busy.controller.ts`
- `apps/api/src/busy/prisma-busy-import.repository.ts`
- `apps/api/src/busy/admin-web-invoice-read.repository.ts`
- `apps/api/src/busy/prisma-admin-web-invoice-read.repository.ts`
- `apps/api/src/qr/prisma-qr-print.repository.ts`
- `apps/api/src/testing/in-memory-platform.repository.ts`
- `apps/api/src/qr/qr-print-flow.test.ts`
- `apps/api/src/busy/busy-import.service.test.ts`
- `apps/admin-web/src/api/adminApi.ts`
- `.planning/v1-agentic-build/PHASE_21_EXECUTION_PLAN.md`
- `.planning/v1-agentic-build/PHASE_20_BUSY_RETURN_CONTRACT.md`
- `.planning/v1-agentic-build/REQUIREMENTS_LEDGER.md`
- `.planning/v1-agentic-build/OPEN_QUESTIONS.md`
- `.planning/v1-agentic-build/ROADMAP.md`
- `.planning/v1-agentic-build/architecture/DECISIONS.md`
- `.planning/v1-agentic-build/architecture/API_CONTRACTS_DRAFT.md`
- `.planning/v1-agentic-build/architecture/DATA_MODEL_DRAFT.md`
- `.planning/STATE.md`

## Implementation Notes

- Added `BusyReturnVoucher`, `BusyReturnVoucherLine`, and `BusyReturnAllocation` persistence.
- Added idempotent return-voucher import by `externalReturnId`.
- Added deterministic domain allocation for return quantity across original invoice lines and local QR unit state.
- Added mock BUSY return vouchers separate from sale invoices, including before-print, scanned-review, duplicate same-item pooled allocation, invalid original invoice, and excess quantity cases.
- Updated QR print availability and commit selection to exclude QR units consumed by return allocations.
- Updated Admin Web invoice read contracts to expose linked return history and returned quantities derived from return allocations.
- Kept returned-product QR cancel/reverse actions on Admin Mobile only; Phase 21 does not add Admin Web cancel/reverse controls.

## Verification

Automated gates:

- `npm run prisma:validate --workspace @volt-rewards/api` - pass.
- `npm run test --workspace @volt-rewards/domain` - pass, 36/36.
- `npm run test --workspace @volt-rewards/api` - pass, 63/63.
- `npm run typecheck --workspace @volt-rewards/admin-web` - pass.
- `npm run lint` - pass across workspaces.
- `npm run test` - pass across domain, API, Admin Web, mobile, and Admin Mobile.
- `git diff --check` - pass, with limitation that the repository currently appears fully untracked to Git.

Key regression cases added:

- Return import reduces future QR print availability.
- Return import retry is idempotent.
- Scanned matching QR without physical return scan becomes review-needed, not automatic point reversal.
- Duplicate same-item-code invoice lines are pooled when BUSY gives no original line reference.

## Residual Risk

- Production BUSY connector endpoints are still not implemented; Phase 21 prepares the domain/repository model and mock adapter.
- Real BUSY partial return, full return, SrNo stability, discount, GST, and authentication samples are still pending from the BUSY developer.
- Admin Web does not yet render a product-grade return-history UI; Phase 22 must expose this model properly in invoice detail and operational dashboards.
- Admin Mobile physical QR scan remains the exact-unit cancel/reverse path; native camera/device validation is still required before public app-store readiness.
- The all-lines case should arrive as a linked full return invoice with all original sale line items and quantities; no additional BUSY workflow is planned.

## Next Phase

Phase 22 - Admin Web Product-Grade Recovery.

Phase 22 must use the corrected return-voucher model, not the legacy assumption that sale invoice lines are directly mutated by returns.
