# BUSY Developer API Handoff - Volt Rewards (working name of the app)

Status: Ready for BUSY developer review  
Updated: 2026-07-17  
Reference sample: `SaleWithRef.txt`

## Purpose

Volt Rewards currently uses a mock BUSY adapter. We now need BUSY to PUSH live sale invoices, return invoices, and item master data to Volt Rewards so the mock adapter can be replaced with actual BUSY data.

This document explains what data we need from BUSY, using the exact field names visible in `SaleWithRef.txt`.

## How We Need This To Work

We want the live integration to work through API calls, not manual file export/import.

Because the integration mode is PUSH only, please create the BUSY-side API/sync capability that can call Volt Rewards whenever relevant BUSY data changes. We will provide final staging/production API URLs and credentials once the receiving endpoints are ready. For now, BUSY developer should build the PUSH connector so the destination URL and credentials are configurable.

We need this API/sync capability for these purposes:

1. Send sale invoice create/update data to Volt Rewards.
2. Send return invoice create/update data to Volt Rewards.
3. Send the first full item master / ItemCodes list to Volt Rewards.
4. Send later item master / ItemCodes changes to Volt Rewards.

Please make sure this capability can authenticate securely, retry safely after internet failure, avoid duplicate pushes, and provide enough success/failure status for troubleshooting.

## What Is Fixed

- Integration mode is PUSH only.
- BUSY will push sale invoices, return invoices, and item master data to Volt Rewards.
- Volt Rewards will not pull from BUSY.
- BUSY must not write directly to the Volt Rewards database.
- The unique invoice field is `tmpVchCode`.
- `VchNo` is the BUSY billing invoice number, but it is not the unique invoice id for our system.
- BUSY sends business facts only. Volt Rewards decides QR generation, QR status changes, points, reversals, rewards, and audit behavior.

## Data BUSY Must Push

BUSY must push these event types or equivalent records:

| Event / record type | When BUSY should push it | Why Volt Rewards needs it |
| --- | --- | --- |
| Sale invoice create/update | When a sale invoice is created or edited | Creates/updates invoice rows and QR-printable quantities |
| Return invoice | When a partial or full sale return invoice is created or edited | Reduces future printable quantity and links returned items/quantity to the original invoice |
| Item master full sync | First setup and periodic validation | Populates the Admin Web ItemCodes list |
| Item master change sync | When item code, item name, category/group, price, or active status changes | Keeps ItemCodes current after first setup |

## Sale Invoice Requirements

The unique sale invoice field is:

| Required meaning | BUSY field |
| --- | --- |
| Unique invoice id | `tmpVchCode` |

In `SaleWithRef.txt`, this appears at both:

- `Sale.tmpVchCode`
- `Sale.BillingDetails.tmpVchCode`

Both have value `25` in the sample. Volt Rewards will treat this value as the unique invoice id.

### Sale Header Fields Needed

| Volt Rewards meaning | BUSY field from `SaleWithRef.txt` | Required? | Notes |
| --- | --- | --- | --- |
| Unique invoice id | `tmpVchCode` | Yes | This is the primary identifier. |
| Invoice date | `Date` | Yes | Sample value: `07-02-2026`. |
| Voucher type | `VchType` | Yes | Sample sale value: `9`. |
| BUSY billing invoice number | `VchNo` | Yes | Billing invoice number; not unique id. |
| Party/customer name | `BillingDetails.PartyName` | Yes | Fallback can be `MasterName1` if needed. |
| Party/customer state | `BillingDetails.tmpStateName` | Preferred | Useful for invoice display/reporting. |
| Store/retailer name | `MasterName2` | Preferred | Sample value: `Main Store`. |
| BUSY original identity | `OriginalID` | Preferred | Useful for audit/debugging. |
| Total quantity | `tmpTotalQty` | Preferred | Useful for validation/reporting. |
| Total amount | `tmpTotalAmt` or `tmpSalePurcAmt` | Preferred | Useful for invoice display/reporting. |

### Sale Line Fields Needed

For every `ItemEntries.ItemDetail`, BUSY should push:

| Volt Rewards meaning | BUSY field from `SaleWithRef.txt` | Required? | Notes |
| --- | --- | --- | --- |
| Invoice id on line | `tmpVchCode` | Yes | Should match sale header `tmpVchCode`. |
| Line number | `SrNo` | Yes | Used as line reference unless BUSY has a stronger stable line id. |
| Product/item name | `ItemName` | Yes | Display and ItemCodes sync. |
| Item code | `tmpItemCode` | Yes | Used to match ItemCodes and reward rules. |
| Quantity sold | `Qty` | Yes | Determines QR unit quantity. |
| Unit name | `UnitName` or `tmpMainUnitName` | Yes | Display and matching support. |
| Unit price | `Price` | Yes | Used for ItemCodes price sync unless another confirmed price field is chosen. |
| Line amount | `Amt` | Preferred | Validation/reporting. |
| Net line amount | `NettAmount` | Preferred | Validation/reporting. |
| Item group/category | `tmpGroupName` | Preferred | ItemCodes category/group. |
| Tax category | `ItemTaxCategory` | Preferred | Example: `GST 12%`. |
| Store code | `tmpMCCode` | Optional | Useful if multiple stores/locations exist. |

### Confirmed Sample Mapping

From `SaleWithRef.txt`:

| Meaning | BUSY field and value |
| --- | --- |
| Unique invoice id | `tmpVchCode = 25` |
| Invoice date | `Date = 07-02-2026` |
| Voucher type | `VchType = 9` |
| BUSY billing invoice number | `VchNo = 12/2025-26` |
| Party name | `BillingDetails.PartyName = Busy Infotech Pvt. Ltd.` |
| Store name | `MasterName2 = Main Store` |
| Line number | `ItemDetail.SrNo = 1` |
| Item code | `ItemDetail.tmpItemCode = 40291` |
| Item name | `ItemDetail.ItemName = TestItem` |
| Quantity | `ItemDetail.Qty = 100` |
| Price | `ItemDetail.Price = 200` |
| Net amount | `ItemDetail.NettAmount = 20000` |
| Item group | `ItemDetail.tmpGroupName = General` |

## Return Invoice Requirements

When a product comes for return or partial return in BUSY, BUSY creates a new invoice that looks like a sales invoice but has a different `VchType`. The original sale invoice is not edited.

This return invoice must include a field that links it to the original sale invoice. The invoices are linked at invoice level, not at line-item level. Volt Rewards will read what is being returned from the return invoice item lines: `tmpItemCode` and `Qty`.

If all products from an original sale invoice are returned, Volt Rewards expects the same pattern: a return invoice containing all original invoice line items and quantities. In that case, the sale and return net to zero. Volt Rewards does not need anything additional beyond the normal return invoice fields.

For every return invoice, BUSY must push:

| Volt Rewards meaning | BUSY field needed | Required? | Notes |
| --- | --- | --- | --- |
| Unique return invoice id | Return invoice `tmpVchCode` | Yes | This identifies the return invoice. |
| BUSY billing invoice number | Return invoice `VchNo` | Yes | Billing invoice number; not unique id. |
| Return invoice date | Return invoice `Date` | Yes | Return invoice date. |
| Return invoice type | Return invoice `VchType` | Yes | Must identify this as return/partial return, not sale. |
| Original sale invoice id | Field that stores original sale `tmpVchCode` | Yes | This exact BUSY field name is still needed. |
| Party/customer name | `BillingDetails.PartyName` | Preferred | If available on return invoice. |

For every returned item line on the return invoice, BUSY must push:

| Volt Rewards meaning | BUSY field needed | Required? | Notes |
| --- | --- | --- | --- |
| Return invoice line number | Return line `SrNo` | Yes | Return invoice line reference. |
| Returned item code | Return line `tmpItemCode` | Yes | Used to identify which original invoice item is being returned. |
| Returned item name | Return line `ItemName` | Yes | Display and validation. |
| Returned quantity | Return line `Qty` | Yes | Quantity being returned. |
| Unit name | Return line `UnitName` | Preferred | Matching/display. |
| Price | Return line `Price` | Preferred | Validation/display. |

Important: Volt Rewards needs the exact BUSY field that links the return invoice to the original sale `tmpVchCode`. If that field is not yet known, please confirm it from BUSY.

Volt Rewards will identify the returned original invoice item by matching:

1. Original sale `tmpVchCode` from the return invoice link field.
2. Return invoice line `tmpItemCode`.
3. Return invoice line `Qty`.

If the original sale invoice has multiple lines with the same `tmpItemCode`, Volt Rewards can allocate returned quantity across those matching item-code lines unless BUSY provides an additional line reference.

## Item Master / ItemCodes Requirements

Volt Rewards has an Admin Web `ItemCodes` tab. BUSY owns item facts. Volt Rewards owns reward rules.

BUSY must push an initial full item master list and then push item changes after that.

BUSY-owned fields needed:

| Volt Rewards meaning | BUSY field | Required? | Notes |
| --- | --- | --- | --- |
| Item code | `tmpItemCode` | Yes | Stable item identifier. |
| Item name | `ItemName` | Yes | Display name. |
| Category/group | `tmpGroupName` or item master category/group field | Preferred | Exact item master field can be confirmed. |
| Price | `Price` or confirmed item master price field | Yes | Used for `% of Price` reward-rule calculation. |
| Active/inactive/deleted status | Exact BUSY item status field | Preferred | Needed to mark missing/deactivated items. |
| Last updated timestamp/cursor | BUSY updated field, if available | Preferred | Useful for reliable sync ordering. |

BUSY should not manage these Volt Rewards fields:

- `Absolute Points`
- `% of Price`
- `% of Price Points`
- `Final Points`
- QR label text
- Contractor point balances
- Reward claims

## Invoice Update Requirements

If a sale invoice is edited after creation, BUSY must push the updated invoice facts using the same `tmpVchCode`.

Please include:

- Same unique invoice id: `tmpVchCode`.
- Full current invoice snapshot, if possible.
- All current item lines.
- Stable line references.
- Clear changed quantities.
- Clear return invoice facts if quantity is reduced.

Volt Rewards rule:

- QR points freeze when QR labels are printed.
- Later ItemCode rule changes do not change already printed QR point values.
- Not-yet-printed quantities can still be affected by later BUSY return invoices.

## Retry And Duplicate Prevention

BUSY pushes must be safe to retry.

Required behavior:

- Retrying the same BUSY event should not create duplicate sale invoices, item lines, item codes, QR placeholders, or return invoices/records.
- Repeated pushes for the same sale invoice must keep the same `tmpVchCode`.
- If a sale invoice is edited, send it as a newer event/update for the same `tmpVchCode`.
- If the same event is retried after network failure, it should carry the same event identity or enough same-source information for Volt Rewards to detect it as a retry.

Recommended source identities:

| Entity | Stable identity |
| --- | --- |
| Sale invoice | `tmpVchCode` |
| Sale line | `tmpVchCode` plus `SrNo`, if `SrNo` is stable |
| Return invoice | Return invoice `tmpVchCode` |
| Return invoice line | Return invoice `tmpVchCode` plus return line `SrNo` |
| ItemCode | `tmpItemCode` |

If `SrNo` can change after invoice edits, we need a stronger stable line identifier from BUSY.

## What We Need From BUSY Developer

Please provide or confirm:

1. Confirmation that BUSY will PUSH data to Volt Rewards.
2. Whether a local sync agent/service is needed on the BUSY machine for PUSH.
3. Whether `ItemDetail.SrNo` is stable after invoice edits.
4. One real sale invoice sample matching `SaleWithRef.txt`, ideally with multiple item lines.
5. One sale invoice update sample.
6. One partial return invoice sample.
7. One full return invoice sample where all original sale invoice line items and quantities are returned.
8. The exact BUSY field that links a return invoice to the original sale `tmpVchCode`.
9. One item master full-sync sample.
10. One item master change sample for a new item.
11. One item master change sample for an edited item.
12. One item master change sample for an inactive/deleted/missing item.
13. Confirmation of which price field Volt Rewards should use for ItemCodes `% of Price`: `Price`, `tmpNettPrice`, `tmpNettPriceAfterDisc`, GST-inclusive value, or another field.
14. Confirmation whether GSTIN, customer address, customer mobile, HSN/SAC, CGST, SGST, IGST, brand, and category are available.
15. Expected daily invoice volume and maximum line count per invoice.
16. Retry/outbox behavior during internet downtime.

## Acceptance Checks

The live BUSY connector will be accepted when:

1. `SaleWithRef.txt` maps to unique invoice id `tmpVchCode = 25`.
2. The same sample maps line `SrNo = 1`, `tmpItemCode = 40291`, `Qty = 100`, and `Price = 200`.
3. A repeated sale push does not create duplicate invoice lines or QR placeholders.
4. A sale update keeps the same sale invoice identity when `tmpVchCode` is unchanged.
5. A partial return invoice links to the original sale invoice by original sale `tmpVchCode`.
6. A full return invoice containing all original sale line items and quantities is stored as a return record and is not treated as a QR-printable sale invoice.
7. ItemCodes initial sync creates or updates `tmpItemCode`, `ItemName`, category/group, and price.
8. An item missing/deactivated in BUSY can be marked as `Not in BUSY` in Volt Rewards.
9. BUSY never sends or changes reward-point rules; Volt Rewards manages `Absolute Points` and `% of Price`.

## Not Required From BUSY

BUSY does not need to provide:

- QR code values.
- QR token generation.
- QR label printing logic.
- Contractor point balances.
- Reward points per item.
- Reward catalog data.
- Reward claim or fulfillment status.
- Decision on whether a returned product should cancel or reverse points.
- Direct database writes.

## Field Questions To Resolve

Please confirm these exact field names before final connector implementation:

1. Return invoice field that stores original sale `tmpVchCode`.
2. Stable line identifier if `SrNo` can change.
3. Item master category/group field.
4. Item master active/inactive/deleted field.
5. Item master price field to use for `% of Price`.
