# BUSY API Handoff

Status: Draft contract created from client call and `SaleWithRef.txt`  
Updated: 2026-07-06  
Shareable external document: `client-deliverables/BUSY_API_INTEGRATION_SPEC.md`

## Decision

The production BUSY integration will use backend API ingestion, not direct database writes from the BUSY local server.

BUSY or a local BUSY sync service pushes sale invoice, return invoice, and item master facts to Volt Rewards API endpoints. A full return invoice contains all original sale line items and quantities, so the sale and return net to zero. The Volt Rewards backend validates, deduplicates, stores raw source data, and writes to PostgreSQL.

Current BUSY developer answer: `tmpVchCode` is the stable invoice id and should be treated as the primary external invoice identifier unless a stronger immutable id is provided later.

Current BUSY developer update from Manual UAT 1: a product return does not mutate the original sale invoice. BUSY creates a new Return of Sale voucher linked to the original sale voucher. The link is voucher-level, not item-line-level, and BUSY does not provide a unique identifier for each physical item.

## Why

- Keeps database credentials away from the BUSY machine.
- Gives Volt Rewards one place for validation, audit logging, idempotency, and versioned API contracts.
- Keeps QR units, token hashes, points, rewards, and audit tables protected from external direct writes.
- Lets the database provider stay portable between developer-owned and client-owned accounts.

## Current Sample Coverage

`SaleWithRef.txt` provides a sale voucher with:

- Voucher series, date, type, number, auto number, and `OriginalID`.
- Party, state, store, currency, and price/tax type.
- Two item lines with quantities, unit names, item names, item codes, tax category, price, amount, net amount, group, store code, party code, and order references.
- Account entries.
- Pending bill/order references.
- Totals for quantity and sale amount.

The sample does not fully answer:

- Partial return payload shape.
- Full return payload shape.
- Full return sample represented as a return voucher with all original sale lines.
- GSTIN/address/mobile fields.
- CGST/SGST/IGST breakup.
- HSN/SAC, brand, and QR eligibility fields.
- Whether line `SrNo` remains stable after edits and how return lines reference original sale lines.
- The exact stable field that links a Return of Sale voucher to the original sale voucher.
- How returns behave when the original sale invoice has multiple lines with the same `tmpItemCode`.
- Item master/change-feed shape for the Admin Web ItemCodes tab, including TempItemCode, item name, product category, price field, active/deactivated/missing status, and last-updated timestamp.
- Which BUSY price field should be used if Volt Rewards enables `% of Price` reward points.

## Adapter Boundary

Until BUSY APIs are ready:

- Use the realistic mock BUSY adapter as the active product invoice source.
- Keep Admin Web, Admin Mobile, QR, scan, rewards, and reports development moving.
- Test behavior against the adapter contract and domain outcomes.

When BUSY APIs are ready:

- Replace the mock BUSY adapter with a production connector that satisfies the handoff spec.
- Preserve the canonical invoice, line, and return shape.
- Use `tmpVchCode` as the stable invoice key and include line-level changes for every sale and return invoice event.
- Let Volt Rewards decide QR effects; BUSY only sends sale/return invoice facts.
- Keep QR lifecycle and rewards behavior unchanged.
- Treat Return of Sale vouchers as return events linked to original sale invoices, not as printable invoices.

## Required Production Events

- Sale invoice upsert.
- Full return represented as a linked Return of Sale voucher with all original sale lines.
- Sale return or partial return as a linked Return of Sale voucher.
- Line-level sale edits affecting quantity, price, or discount under a stable `tmpVchCode`.
- Item master upsert/change feed for ItemCodes reward-rule management.
- Optional historical backfill.
- Optional reconciliation/polling by `updatedSince`.

## ItemCodes Requirement From Client Demo 2

Admin Web now needs an `ItemCodes` tab that lists BUSY `TempItemCode` / `tmpItemCode` values and lets Volt Rewards manage fixed Points or `% of Price` Points for future QR printing.

BUSY integration should provide:

- Stable TempItemCode / item code.
- Item name.
- Product category/group.
- Price field and its exact meaning.
- Active/deactivated/missing status or enough change-feed data for Volt Rewards to infer `Not in BUSY`.
- Last updated timestamp or monotonically increasing sync marker where possible.

Volt Rewards will not ask BUSY to decide QR points. BUSY supplies item facts; Volt Rewards stores reward rules and copies the resolved point value onto QR units at print time. Already printed QR points remain valid even if the ItemCode later changes or disappears from BUSY.

## Return Voucher Handling Rule

When Volt Rewards receives a Return of Sale voucher:

1. Identify the linked original sale invoice.
2. Match each return line by `tmpItemCode` and any stronger line reference BUSY provides.
3. Validate cumulative returned quantity against original sold quantity.
4. Exclude the return voucher from Admin Web QR printing.
5. Update the original invoice's return history and printable quantity.
6. Allocate returned quantity against original invoice QR units by item code.
7. Cancel active unscanned QR units first.
8. Reverse scanned/claimed QR units only for returned quantity that cannot be covered by active unscanned units.

## Planning Impact

- `WEB-005`, `WEB-006`, `WEB-012`, `WEB-018`, `WEB-019`, `WEB-020`, and `QR-005` depend on invoice/line quantity correctness.
- Full product build remains unblocked by real BUSY API availability.
- Production launch remains blocked until BUSY partial/full return samples, linked original voucher field names, duplicate-item line matching rules, discount semantics, ItemCodes/item master change feed, `% of Price` source field if used, and API authentication are verified.
