# BUSY Developer Requirements - Volt Rewards (working name of the app)


## Purpose

Volt Rewards currently uses a mock BUSY adapter. We now need BUSY to PUSH live sale invoices, return invoices, and item master data to Volt Rewards so the mock adapter can be replaced with actual BUSY data.

This document explains what data we need from BUSY, using the exact field names visible in `SaleWithRef.txt`.

## How We Need This To Work

We want the live integration to work through API calls, not manual file export/import.

Because the integration mode is PUSH only, please create the BUSY-side API/sync capability that can call Volt Rewards whenever relevant BUSY data changes.

Volt Rewards now has a test receiving API shape ready for connector testing. The test receiver will be deployed on Railway as a public HTTPS endpoint for live connector testing. Please keep the destination API base URL and credentials configurable, not hard-coded, so the same BUSY connector can point first to the test environment and later to staging/production.

The API base URL includes the `/api` prefix. For example, once Volt Rewards provides a test host, the BUSY connector should call:

`https://<volt-railway-test-domain>/api/integrations/busy/v1/health`

| Environment | API base URL |
| --- | --- |
| Test API Deployment | `https://<volt-railway-test-domain>/api` after Volt Rewards deploys the Railway test API and configures connector credentials |
| Deployed staging | `https://<volt-staging-api-host>/api`, using the same paths below unless Volt Rewards confirms a new version |
| Production | `https://<volt-production-api-host>/api`, using the same paths below unless Volt Rewards confirms a new version |

Volt Rewards receiving API paths:

| Purpose | Method | Path |
| --- | --- | --- |
| Connectivity/authentication check | GET | `/integrations/busy/v1/health` |
| Push Sale or Return voucher create/update | POST | `/integrations/busy/v1/vouchers/upsert` |
| Push first full ItemCodes/item master list | POST | `/integrations/busy/v1/item-codes/full-sync` |
| Push later ItemCodes/item master changes | POST | `/integrations/busy/v1/item-codes/upsert` |

Every BUSY call must include these headers:

| Header | Purpose |
| --- | --- |
| `x-volt-client-id` | Identifies the BUSY connector/client environment |
| `x-volt-api-key` | Shared secret for that environment |

Volt Rewards will generate the test `x-volt-client-id` and `x-volt-api-key` for connector testing and share them separately from this document. Please store these values securely and make them replaceable per environment.

We need this API/sync capability for these purposes:

1. Send sale invoice create/update data to Volt Rewards.
2. Send return invoice create/update data to Volt Rewards.
3. Send the first full item master / ItemCodes list to Volt Rewards.
4. Send later item master / ItemCodes changes to Volt Rewards.

Please make sure this capability can authenticate securely, retry safely after internet failure, avoid duplicate pushes, and provide enough success/failure status for troubleshooting.


## Data BUSY Must Push

BUSY must push these event types or equivalent records:

| Event / record type | When BUSY should push it | Why Volt Rewards needs it |
| --- | --- | --- |
| Sale invoice create/update | When a sale invoice is created or edited | Creates/updates invoice rows and QR-printable quantities |
| Return of Sale voucher | When a partial or full sale return is created or edited | Reduces future printable quantity and links returns to original invoices |
| Item master full sync | First setup and periodic validation | Populates the Admin Web ItemCodes list |
| Item master change sync | When item code, item name, category/group, price, or active status changes | Keeps ItemCodes current after first setup |



### Sale Header Fields Needed

| Volt Rewards meaning | BUSY field from `SaleWithRef.txt` | Required? | Notes |
| --- | --- | --- | --- |
| Unique invoice id | `tmpVchCode` | Yes | This is the primary identifier. |
| Invoice date | `Date` | Yes | Sample value: `07-02-2026`. |
| Voucher type | `VchType` | Yes | Identifies whether the voucher is Sale or Return. Sample sale value: `9`. |
| Billing Invoice Number| `VchNo` | Yes | Display/reference only; not unique id. |
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
| Billing invoice number | `VchNo = 12/2025-26` |
| Party name | `BillingDetails.PartyName = Busy Infotech Pvt. Ltd.` |
| Store name | `MasterName2 = Main Store` |
| Line number | `ItemDetail.SrNo = 1` |
| Item code | `ItemDetail.tmpItemCode = 40291` |
| Item name | `ItemDetail.ItemName = TestItem` |
| Quantity | `ItemDetail.Qty = 100` |
| Price | `ItemDetail.Price = 200` |
| Net amount | `ItemDetail.NettAmount = 20000` |
| Item group | `ItemDetail.tmpGroupName = General` |

## Return Of Sale Requirements

BUSY returns must be pushed as separate Return of Sale vouchers. The original sale invoice should not be the only signal for a return.

For a full return, the Return of Sale voucher should contain all original sale invoice line items and quantities. In that case the sale and return net to zero.

For every Return of Sale voucher, BUSY must push:

| Volt Rewards meaning | BUSY field needed | Required? | Notes |
| --- | --- | --- | --- |
| Unique return voucher id | Return voucher `tmpVchCode` | Yes | This identifies the return voucher. |
| Billing return invoice voucher number | Return voucher `VchNo` | Yes | Display/reference. |
| Return date | Return voucher `Date` | Yes | Return date. |
| Return voucher type | Return voucher `VchType` or equivalent return flag | Yes | Must identify this as Return of Sale. |
| Original sale invoice id | Field that stores original sale `tmpVchCode` | Yes | This exact BUSY field name is needed to link the return voucher to the original sale invoice. |
| Party/customer name | `BillingDetails.PartyName` | Preferred | If available on return voucher. |

For every return line, BUSY must push:

| Volt Rewards meaning | BUSY field needed | Required? | Notes |
| --- | --- | --- | --- |
| Return line number | Return line `SrNo` | Yes | Return line reference. |
| Original sale line reference | Original sale `SrNo` or stronger original line id | Preferred | Needed when same `tmpItemCode` appears multiple times on one invoice. |
| Returned item code | Return line `tmpItemCode` | Yes | Must match original sale line item code. |
| Returned item name | Return line `ItemName` | Yes | Display and validation. |
| Returned quantity | Return line `Qty` | Yes | Quantity returned. |
| Unit name | Return line `UnitName` | Preferred | Matching/display. |
| Price | Return line `Price` | Preferred | Validation/display. |

Important: Volt Rewards needs the exact BUSY field that links a Return of Sale voucher to the original sale `tmpVchCode`. If that field is not yet known, please confirm it from BUSY.

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



## Retry And Duplicate Prevention

BUSY pushes must be safe to retry.

Required behavior:

- Retrying the same BUSY event should not create duplicate sale invoices, item lines, item codes, QR placeholders, or return invoices/records.
- Repeated pushes for the same sale invoice must keep the same `tmpVchCode`.
- If the same event is retried after network failure, it should carry the same event identity or enough same-source information for Volt Rewards to detect it as a retry.
