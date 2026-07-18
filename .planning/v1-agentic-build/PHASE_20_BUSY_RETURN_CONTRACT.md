# Phase 20 BUSY Return Contract

Status: Active contract for Phase 21 implementation  
Created: 2026-07-06

## Purpose

Manual UAT 1 introduced a critical BUSY integration correction: product returns are represented as new Return of Sale vouchers linked to the original sale voucher. The original sale invoice does not change.

This contract defines how Volt Rewards should model return vouchers before UI recovery continues.

## Locked Decisions

- `DEC-018`: BUSY pushes facts to Volt Rewards backend APIs; it does not write directly to PostgreSQL.
- `DEC-023`: BUSY does not decide QR action.
- `DEC-034`: QR points come from configurable `tmpItemCode` reward values.
- `DEC-041`: QR reversal may revoke newest chosen/unfulfilled reward claims until available balance recovers.
- `DEC-042`: BUSY returns arrive as linked Return of Sale vouchers.

## Terminology

- Original sale voucher: the BUSY sale invoice that originally sold products.
- Return voucher: the BUSY Return of Sale voucher created later.
- Linked original voucher: the sale voucher referenced by the return voucher.
- Returned line: a line on the return voucher with `tmpItemCode`, quantity, unit, and product metadata.
- QR unit: Volt Rewards unit-level QR record created from the original sale invoice.
- Printable quantity: original sold quantity minus returned quantity minus already printed quantity, adjusted by current QR state.

## Canonical Return Voucher Requirements

Required fields:

- Source system: `BUSY`.
- Event type: `SALE_RETURN_UPSERT`.
- Event id.
- Event timestamp.
- Company/store id.
- Return voucher id, preferably return `tmpVchCode`.
- Return voucher number/date/time.
- Return voucher type/flag showing Return of Sale.
- Linked original sale voucher id, preferably original sale `tmpVchCode`.
- Return lines:
  - `tmpItemCode`.
  - Item name.
  - Unit.
  - Returned quantity.
  - Original line id if BUSY provides it.
  - `SrNo` if meaningful/stable.
  - Product/category/brand where available.
- Raw BUSY payload for audit/debugging.

Return vouchers must not be inserted into the QR Print Queue as printable sale invoices.

## Matching Rule

Preferred matching order:

1. Original sale voucher id + original line id from BUSY.
2. Original sale voucher id + stable `SrNo` + `tmpItemCode`.
3. Original sale voucher id + `tmpItemCode` pooled across matching sale lines.

Recommended default if BUSY cannot identify the original line:

- Pool by original invoice + `tmpItemCode`.
- Validate cumulative returned quantity across all matching lines.
- Mark duplicate same-item-line allocation as auditable metadata.

This default must be brought forward before Phase 21 implementation if the user wants a different allocation rule.

## Return Allocation Rule

For each return voucher line:

1. Find the linked original sale invoice.
2. Find original sale lines matching the returned `tmpItemCode` and stronger line reference if available.
3. Validate returned quantity is positive.
4. Validate cumulative returned quantity does not exceed sold quantity for the match scope.
5. Reduce future printable quantity.
6. Allocate returned quantity against local QR state in this order:
   - Not-yet-printed placeholders or units: mark unavailable/returned, no QR token action.
   - Active printed but unscanned QR units: create cancel-eligible allocation candidates; exact cancellation still requires Admin Mobile physical QR scan in v1.
   - Scanned/claimed QR units: create review-needed allocation when no physical QR scan identifies the exact unit; exact reversal still requires Admin Mobile physical QR scan in v1.
7. Write audit events for import, allocation, QR cancel/reverse impact, and conflicts.

Physical returned-product handling:

- If Admin Mobile scans a specific returned product QR, that scanned QR unit is the exact target.
- If the QR is printed/unscanned and eligible, Admin Mobile cancel flow applies.
- If the QR is scanned/claimed and eligible, Admin Mobile reverse flow applies.
- If BUSY return data arrives without a matching Admin Mobile scan for a scanned QR, create a review-needed allocation and do not silently reverse points. This is locked by `DEC-045`.

## State/Action/Outcome Scenarios

### Scenario 1 - Return Before QR Print

State:

- Original invoice has 5 Atomberg Fans.
- No QR printed.
- Return voucher says 1 Atomberg Fan returned.

Outcome:

- Original invoice remains visible in Invoice Ledger.
- QR Print Queue printable quantity for Atomberg Fans becomes 4.
- No QR cancel/reverse action.
- Return appears in original invoice history.

### Scenario 2 - Return After Partial Print, Unscanned QR Available

State:

- Original invoice has 5 Atomberg Fans.
- 2 QR units printed and unscanned.
- 3 units not printed.
- Return voucher says 1 Atomberg Fan returned.

Outcome:

- Prefer reducing not-yet-printed availability first when no physical QR scan is present.
- If Admin Mobile scans a printed unscanned QR on the returned product, cancel that QR.
- No points reversal.
- Invoice detail shows sold 5, returned 1, printed/cancelled state.

### Scenario 3 - Return With Printed Unscanned QR

State:

- Original invoice has 5 Atomberg Fans.
- 5 QR units printed.
- At least 1 QR unit remains printed/unscanned.
- Admin Mobile scans the returned product QR.

Outcome:

- Lookup shows cancel eligible.
- Cancel invalidates that QR token.
- Points are not affected.
- Audit records product returned and label removed confirmation.

### Scenario 4 - Return With All Matching QR Scanned

State:

- Original invoice has 5 Atomberg Fans.
- 5 QR units printed and scanned.
- Return voucher says 1 Atomberg Fan returned.
- Admin Mobile scans the returned product QR.

Outcome:

- Lookup shows reverse eligible.
- Reverse deducts that QR unit's points.
- If available balance becomes negative, `DEC-041` claim revocation applies.
- Balance Book and scan history show reversal with human-readable metadata.

### Scenario 5 - Return Voucher Cannot Match Original Invoice

State:

- Return voucher references unknown original sale voucher.

Outcome:

- Ingestion rejects or stores as unresolved according to Phase 21 error policy.
- No QR cancel/reverse occurs.
- Admin Web/Admin Mobile show sync issue only if a review surface exists.
- Audit records validation failure.

### Scenario 6 - Returned Quantity Exceeds Sold Quantity

State:

- Original invoice has 2 Wipro Bulbs.
- Existing cumulative returns are 1.
- New return voucher says 2 more Wipro Bulbs returned.

Outcome:

- Ingestion blocks or flags conflict.
- No QR state mutation happens for excess quantity.
- Audit records validation conflict.

### Scenario 7 - Duplicate Original Lines With Same Item Code

State:

- Original invoice has two lines with same `tmpItemCode`.
- Return voucher provides only voucher-level link and `tmpItemCode`.

Outcome:

- Recommended default: allocate against pooled quantity for that original invoice + `tmpItemCode`.
- Record allocation metadata.
- If user rejects pooled allocation, Phase 21 must wait for BUSY line-reference clarification.

## Mock BUSY Fixture Requirements

Phase 21 must add or update mock data for:

- Active sale invoice with printable lines.
- Return voucher linked to an original sale invoice before any QR print.
- Return voucher after partial print.
- Return voucher where printed unscanned QR can be cancelled.
- Return voucher where scanned QR must be reversed.
- Full return voucher.
- Cancelled invoice.
- Duplicate same `tmpItemCode` sale lines.
- Return voucher with invalid original reference.
- Return voucher with excess returned quantity.

Fixtures must use realistic electrical products, such as Havells Wire, Atomberg Fans, Wipro Bulb, switches, MCBs, lights, and tools.

## Required API/Domain Tests For Phase 21

Phase 21 must include tests for:

- Return voucher import is idempotent.
- Return voucher does not create printable invoice rows.
- Return voucher links to original invoice.
- Printable quantity is reduced after returns.
- Return quantity cannot exceed sold quantity.
- Duplicate same item-code handling follows approved rule.
- Printed unscanned QR allocation produces cancel-eligible state.
- Scanned QR allocation produces reverse-eligible or review-needed state.
- Return voucher validation failure is auditable.
- Admin Web invoice ledger can read linked return history.
- QR Print Queue excludes fully non-printable invoices.

## Admin Web Implications

- QR Print Queue shows only printable sale invoices.
- Invoice Ledger shows all sale invoices with linked return history.
- Invoice detail shows sold, returned, printable, printed, scanned, cancelled, and reversed quantities.
- Return vouchers are never shown as separate QR-printable invoices.

## Admin Mobile Implications

- Return Scan remains the physical QR action surface.
- Admin Mobile lookup should combine exact QR state with linked invoice/return context when available.
- Cancel vs reverse remains driven by the scanned QR unit state and backend validation.

## Phase 21 Confirmations

Resolved by `DEC-045` before Phase 21 implementation:

1. If a return voucher arrives without Admin Mobile scanning the returned product QR and all matching QR units are already scanned, Volt Rewards creates a review-needed allocation and does not auto-reverse points.
2. If the original sale has duplicate lines with the same `tmpItemCode` and BUSY provides no original line reference, allocation may pool by original invoice + item code with audit metadata.
3. If a return voucher arrives without scanned physical QR, not-yet-printed units are consumed before printed-unscanned units.
