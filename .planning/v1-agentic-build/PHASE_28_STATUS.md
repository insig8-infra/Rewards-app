# Phase 28 Status - BUSY Adapter Payload Hardening

Status: Complete - Output And Trajectory Gates Passed  
Date: 2026-07-16  
Plan: `PHASE_28_BUSY_ADAPTER_HARDENING_PLAN.md`

## Delivered

- Added a real BUSY payload normalization adapter for Sale/Return object payloads and simple BUSY XML payloads.
- Mapped `SaleWithRef.txt` sale fields into the existing `BusyInvoiceImport` contract.
- Mapped linked return voucher fields into the existing `BusyReturnVoucherImport` contract.
- Added `BusyImportService.importBusyVoucherPayload` so actual BUSY-shaped payloads can flow through the current repository, ItemCodes, QR placeholder, and return-allocation paths.
- Preserved ItemCodes as the reward-rule source by keeping actual BUSY adapter line `pointsPerUnit` at `0`.
- Recorded DEC-053 for BUSY `VchType` precedence and normalized import behavior.

## Verified

- `npm run test --workspace @volt-rewards/api` - PASS, 108/108.
- Exact `SaleWithRef.txt` parse probe - PASS: `kind=sale`, `tmpVchCode=25`, line `tmpItemCode=40291`, quantity `100`, price `200.00`.
- `git diff --check` - PASS.

## Residual Gaps

- Production BUSY authentication and push/polling mechanics are not implemented.
- Exact BUSY return-link field name is still awaiting real return samples; the adapter currently supports known aliases.
- Partial return, full return, duplicate-line edge, discount/GST, and item-master/change-feed samples are still needed from BUSY before production connector completion.
