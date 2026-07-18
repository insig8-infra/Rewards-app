# Phase 28 Output Eval - BUSY Adapter Payload Hardening

Status: PASS  
Created: 2026-07-16

## Output Cases

| ID | Requirement | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- |
| P28-BUSY-001 | `WEB-005`, `WEB-018`, `WEB-020` | Actual BUSY sale payload fields map into `BusyInvoiceImport` without requiring mock-only field names. | PASS | `BUSY SaleWithRef-style XML maps invoice metadata and item details` covers `Date`, numeric `VchType`, `tmpVchCode`, `PartyName`, `SrNo`, `ItemName`, `tmpItemCode`, `Price`, and `Qty`. |
| P28-BUSY-002 | `ITEM-001` through `ITEM-009`, `RWD-023` | Sale line `tmpItemCode`, `ItemName`, `Price`, and `Qty` feed ItemCodes and QR print placeholders through the existing import path. | PASS | `actual BUSY sale and return payloads import through the repository contract` imports a real-shaped Sale payload and creates five QR placeholders through the existing repository. |
| P28-BUSY-003 | `WEB-023`, `QR-019`, `QR-020` | Return voucher payload maps separately from sale invoices and carries the linked original sale voucher id. | PASS | Adapter return test verifies linked original sale id and original line reference; service-level test verifies return allocation count through repository contract. |
| P28-BUSY-004 | `WEB-019`, `WEB-020` | Unsupported voucher types are rejected/ignored before they create invoices or QR placeholders. | PASS | `BUSY adapter ignores unsupported voucher types` returns `kind: "ignored"` for Purchase. |
| P28-BUSY-005 | Adapter validation | Missing required BUSY fields fail deterministically. | PASS | `BUSY adapter rejects required sale line fields deterministically` verifies `BUSY_ADAPTER_FIELD_REQUIRED`. |

## Current Verdict

`PASS`: The actual BUSY Sale/Return adapter seam is implemented and covered by automated API tests. Production BUSY authentication, PUSH sync-agent/retry mechanics, partial/full return samples, exact return-link field naming, and full GST/discount semantics remain explicitly deferred.

## Verification

- `npm run test --workspace @volt-rewards/api` - PASS, 108/108.
- Exact `SaleWithRef.txt` parse probe - PASS: `kind=sale`, `tmpVchCode=25`, line `tmpItemCode=40291`, quantity `100`, price `200.00`.
- `git diff --check` - PASS.
