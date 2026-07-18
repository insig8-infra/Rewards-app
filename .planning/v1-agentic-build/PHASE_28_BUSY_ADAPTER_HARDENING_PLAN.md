# Phase 28 Plan - BUSY Adapter Payload Hardening

Status: Complete - Output And Trajectory Gates Passed  
Created: 2026-07-16  
Source: `SaleWithRef.txt`, Phase 20/21 BUSY return contract, Phase 26B ItemCodes decisions

## Intent

Prepare the existing mock-BUSY-backed product for real BUSY replacement by adding a deterministic adapter layer for the actual BUSY sale/return payload shape. This phase does not connect to the production BUSY server, schedule polling, or decide authentication. It makes the field mapping explicit and testable.

## Source Contracts

- `REQUIREMENTS_LEDGER.md`
- `OPEN_QUESTIONS.md`
- `architecture/DECISIONS.md`
- `PHASE_20_BUSY_RETURN_CONTRACT.md`
- `PHASE_21_EXECUTION_PLAN.md`
- `PHASE_26B_ITEMCODES_MASTER_PLAN.md`
- `PHASE_26_CLIENT_DEMO_2_ALIGNMENT_PLAN.md`
- `SaleWithRef.txt`
- `client-deliverables/BUSY_API_INTEGRATION_SPEC.md`

## Requirements Covered

- `WEB-005`, `WEB-018`, `WEB-019`, `WEB-020`
- `WEB-023`, `WEB-024`, `WEB-025`
- `ITEM-001` through `ITEM-009`
- `RWD-023`
- `QR-019`, `QR-020`

## Open Questions Review

Resolved for this phase:

1. `tmpVchCode` is treated as the stable sale invoice id until BUSY gives a stronger identifier.
2. Sale payload metadata uses `Date`, `BillingDetails.tmpVchCode`, and `BillingDetails.PartyName`.
3. Sale line item details use `SrNo`, `ItemName`, `tmpItemCode`, `Price`, and `Qty`.
4. ItemCodes use BUSY-owned `tmpItemCode`, `ItemName`, and `Price`, while `Absolute Points` and `% of Price` remain Volt-owned fields.
5. QR point values freeze at QR print.

Completion-relevant but not blocking adapter hardening:

1. Need real partial return and full return samples from BUSY.
2. Need exact return-voucher field name for linked original sale `tmpVchCode`.
3. Need production BUSY authentication and PUSH sync-agent/retry mechanics.

## Implementation Scope

- Add BUSY payload adapter functions that convert actual BUSY sale/return payloads into existing `BusyInvoiceImport` and `BusyReturnVoucherImport` contracts.
- Treat `VchType = Sale` and numeric sale voucher type `9` as sale vouchers.
- Treat `VchType = Return` and documented return aliases as return vouchers only when a linked original sale voucher id is present.
- Map `Date`, `tmpVchCode`, `PartyName`, `SrNo`, `ItemName`, `tmpItemCode`, `Price`, and `Qty` exactly.
- Keep normalized BUSY payload details inside import raw source through the existing repository path.
- Reject/ignore non-sale and non-return voucher types before they affect QR printing.
- Add focused tests for sale mapping, return mapping, quantity/price parsing, and unsupported voucher handling.

## Out Of Scope

- Real BUSY API authentication.
- Network polling/push listener.
- Production cancellation semantics.
- New Admin Web UI.
- New database tables, unless implementation finds a hard persistence gap.

## Output Eval Criteria

1. Sale payload from `SaleWithRef.txt` maps to one `BusyInvoiceImport` with invoice id `tmpVchCode`, invoice date, party name, and line-level `SrNo`/`tmpItemCode`/`ItemName`/`Price`/`Qty`.
2. Return payload maps to `BusyReturnVoucherImport` with separate return id and linked original sale id.
3. Unsupported voucher types do not create sale invoices or QR placeholders.
4. Adapter output can be handed to the existing repository without changing QR print point-freeze behavior.
5. Tests cover invalid missing required BUSY fields with deterministic errors.

## Trajectory Eval Criteria

1. Field mapping stays traceable to `SaleWithRef.txt` and recorded decisions.
2. The phase does not silently resolve production BUSY authentication, cancellation, or return-link field questions.
3. Implementation reuses existing BUSY import contracts instead of creating parallel invoice/return models.
4. Phase docs/evals are updated after verification.

## Implementation Tasks

- [x] Read requirements, open questions, durable decisions, Phase 20/21 return contract, Phase 26B ItemCodes plan, and `SaleWithRef.txt`.
- [x] Create Phase 28 output and trajectory eval gates before implementation.
- [x] Add a dependency-free BUSY payload adapter for object/XML payload normalization.
- [x] Ensure explicit `VchType` wins over the XML/root wrapper name.
- [x] Map real BUSY Sale fields into existing `BusyInvoiceImport`.
- [x] Map real BUSY Return fields into existing `BusyReturnVoucherImport`.
- [x] Keep ItemCodes as the point-rule source by setting actual BUSY adapter `pointsPerUnit` to `0`.
- [x] Add service-level import path that hands mapped sale/return payloads to the existing repository contract.
- [x] Add focused adapter/service tests.
- [x] Run API output eval and whitespace check.
- [x] Record DEC-053 and update phase evals/docs.

## Delivery Notes - 2026-07-16

- Added `apps/api/src/busy/busy-payload-adapter.ts` to normalize real BUSY Sale/Return payloads from object or simple XML input.
- Sale mapping now captures `Date`, `BillingDetails.tmpVchCode`, `BillingDetails.PartyName`, and line-level `SrNo`, `ItemName`, `tmpItemCode`, `Price`, `Qty`, `UnitName`, `NettAmount`, and GST-rate text where present.
- Return mapping now supports linked original invoice id aliases while preserving Phase 21 return-allocation behavior for original-line references and item-code pooling.
- `BusyImportService.importBusyVoucherPayload` now routes mapped Sale and Return payloads into `upsertInvoiceWithQrPlaceholders` and `upsertReturnVoucherWithAllocations`.
- Unsupported voucher types return an ignored adapter result and do not create QR placeholders.
- Missing required BUSY fields fail deterministically with `BUSY_ADAPTER_FIELD_REQUIRED`.
- The actual BUSY adapter does not invent reward points; it lets ItemCodes resolve and freeze points at QR print time.
- Production BUSY auth, push/polling, cancellation semantics, exact return-link field naming, and deeper GST/discount mapping remain launch/connector follow-ups.

## Verification Summary - 2026-07-16

- `npm run test --workspace @volt-rewards/api` - PASS, 108/108.
- Exact `SaleWithRef.txt` parse probe - PASS: `kind=sale`, `tmpVchCode=25`, line `tmpItemCode=40291`, quantity `100`, price `200.00`.
- `git diff --check` - PASS.
