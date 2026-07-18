# BUSY API Integration Spec For Volt Rewards

Status: Internal detailed reference; external handoff is `BUSY_DEVELOPER_API_HANDOFF.md`  
Updated: 2026-07-17  
Sample source reviewed: `SaleWithRef.txt`

## Developer Handoff

For the BUSY developer, use `client-deliverables/BUSY_DEVELOPER_API_HANDOFF.md`. That file is the external handoff: PUSH-only, no code snippets, exact `SaleWithRef.txt` field names, samples needed from BUSY, and acceptance checks.

This file remains an internal technical reference and may include implementation-shaped examples for Volt Rewards engineering. Do not use this file as the first-share document for the BUSY developer.

## Purpose

Volt Rewards will use realistic mock invoices until the BUSY APIs are ready. After the BUSY integration is available, the mock invoice adapter will be replaced by a production BUSY connector without changing QR printing, scan, reward, or report workflows.

BUSY remains the source of truth for sale invoice, item line, item master, and return invoice facts. Volt Rewards remains the source of truth for QR units, QR tokens, scan status, ItemCode reward rules, points ledger, reward ledger, reward fulfillment, and audit events.

Current return-behavior clarification: when a product is returned, BUSY creates a new return invoice that looks like a sale invoice but has a different `VchType`. The original sale invoice does not change. The linkage is invoice-level, not line-item-level, and BUSY does not identify the exact physical item that was returned. A full return uses the same pattern with all original sale invoice line items and quantities, so the sale and return net to zero.

## Required Integration Shape

Required mode: the local BUSY server or a local sync process pushes sale invoice and return invoice events to the Volt Rewards backend API in near real time. The backend validates the payload, deduplicates it, stores the raw BUSY source for audit/debugging, and writes to the Volt Rewards PostgreSQL database.

Do not write directly from the BUSY server into the Volt Rewards PostgreSQL database. The BUSY integration should call our backend ingestion API. This keeps credentials safer, lets us validate payloads, supports audit trails, and makes the database provider portable if the app is moved from the developer account to the client account.

The managed PostgreSQL provider is not part of this BUSY contract. Volt Rewards may use Supabase or another Postgres-compatible provider, but the BUSY integration should not depend on provider-specific table access.

Pull mode is not part of the current BUSY developer handoff because the client has confirmed PUSH is the only possible integration mode.

## Real-Time Requirement

When a sale invoice is created/updated or a return invoice is created/updated in BUSY:

- Send the event immediately if possible.
- Send an event whenever any line under a stable `tmpVchCode` changes.
- Treat `tmpVchCode` as the unique invoice identifier for Volt Rewards.
- Include the full current invoice snapshot and enough return invoice facts for Volt Rewards to link return invoices to original sale invoices and match returned quantities by item code and quantity.
- Send item master changes or expose an item master change feed for the Admin Web ItemCodes tab.
- If immediate push is not possible, send within 1 to 5 minutes.
- Retry failed requests with the same idempotency key.
- Keep an outbox or sync log on the BUSY side so network downtime does not lose events.
- Return success only after the receiving endpoint acknowledges the event.

## Security Requirements

All production calls must use HTTPS.

Required request headers:

```http
Content-Type: application/json
Idempotency-Key: busy:<companyId>:<eventType>:<tmpVchCode>:<eventId-or-updatedAt>
x-volt-client-id: <client/store identifier issued by Volt Rewards>
x-volt-event-id: <stable uuid or BUSY sync event id>
x-volt-timestamp: <ISO-8601 timestamp>
x-volt-signature: sha256=<HMAC-SHA256 of timestamp + body using shared secret>
```

Security rules:

- Do not send database credentials to the BUSY machine.
- Do not send QR token secrets to BUSY.
- Do not hardcode API keys in source code.
- Redact or avoid unnecessary customer personal data where possible.
- Retry using the same `Idempotency-Key`; do not generate a new key for the same source event retry.

## Volt Rewards Ingestion Endpoints

Runtime paths include the `/api` prefix.

### Health

```http
GET /api/integrations/busy/v1/health
```

Purpose: BUSY sync process can verify connectivity and credentials before sending events.

Expected response:

```json
{
  "status": "ok",
  "service": "volt-rewards",
  "busyIntegrationVersion": "v1"
}
```

### Upsert Sale Invoice

```http
POST /api/integrations/busy/v1/invoices/upsert
```

Purpose: create or update a sale invoice and its line items in Volt Rewards.

BUSY should send this when a sale invoice is created or edited. If one item line changes, the payload should still identify the same stable `tmpVchCode` and include enough line data for Volt Rewards to compare old and new line state.

Expected response:

```json
{
  "accepted": true,
  "externalInvoiceId": "25",
  "idempotencyKey": "busy:default:SALE_INVOICE_UPSERT:25:busy-sync-event-000001",
  "lineCount": 2,
  "qrPlaceholderCount": 220,
  "status": "upserted"
}
```

### Full Return Invoice

If all products from an original sale invoice are returned, BUSY should send a return invoice containing all original sale invoice line items and quantities. Volt Rewards handles this through the same return invoice ingestion path used for partial returns.

### Register Return Or Partial Return

```http
POST /api/integrations/busy/v1/invoices/return
```

Purpose: tell Volt Rewards that one or more invoice line quantities have been returned.

Required information:

- Stable original sale invoice identifier: original sale `tmpVchCode`.
- Return invoice identifier: return invoice `tmpVchCode`.
- Exact stable field that links the return invoice to the original sale invoice `tmpVchCode`.
- Return date/time.
- Return invoice `VchType` showing it is return/partial return, not sale.
- Returned item code: `tmpItemCode`.
- Returned quantity.
- Original item line identifier if BUSY can provide it. If not, provide enough fields to match the original invoice item by `tmpItemCode`, unit, and product name.
- For a full return, include all original sale invoice line items and quantities on the return invoice.

This is required because Volt Rewards must block later printing of returned, not-yet-printed units, and Admin Mobile must know whether a printed/scanned QR should be cancelled or reversed.

BUSY must not decide the QR action. BUSY sends sale invoice and return invoice facts. Volt Rewards decides whether returned units affect `NOT_PRINTED`, `PRINTED_UNCLAIMED`, or `SCANNED_CLAIMED` QR units and whether a mobile return scan should cancel or reverse the unit.

Return invoice handling inside Volt Rewards:

1. Return invoices are not shown in the Admin Web QR printing queue.
2. Return invoices are shown as updates/history on the linked original sale invoice.
3. Volt Rewards validates that the returned `tmpItemCode` existed on the original sale invoice.
4. Volt Rewards validates cumulative returned quantity against original sold quantity.
5. Volt Rewards allocates returned quantity against original invoice QR units for that `tmpItemCode`.
6. Active unscanned QR units are cancelled first.
7. Scanned/claimed QR units are reversed only for returned quantity that cannot be covered by active unscanned QR units.

### Item Master / ItemCodes Feed

```http
POST /api/integrations/busy/v1/item-codes/upsert
```

Purpose: provide the item master facts needed for the Admin Web `ItemCodes` tab and future QR reward-rule resolution.

Required information:

- Stable TempItemCode / `tmpItemCode`.
- Item name.
- Product category/group.
- Price field and exact meaning.
- Active/deactivated status if available.
- Last updated timestamp or change cursor if available.
- Raw BUSY source for audit/debugging.

Volt Rewards manages the reward rules: fixed Points and `% of Price` Points. BUSY should not decide QR points or send instructions to credit/reverse points. Volt Rewards copies the resolved point value onto QR units at print time. Already printed QR points remain valid even if the item later changes or disappears from BUSY.

## Superseded Pull Fallback

Earlier drafts mentioned a pull fallback. That is now superseded. The current BUSY developer handoff is PUSH-only because the client confirmed pull is not an available integration mode.

## Canonical Invoice Payload

Send canonical JSON. Include the raw BUSY XML or raw BUSY JSON in `rawSource` for audit/debugging.

Use ISO date/time strings in canonical fields. The reviewed BUSY sample uses `DD-MM-YYYY` dates such as `07-02-2026`; the canonical payload converts that to `2026-02-07`. Decimal money and quantity values should be strings to avoid floating point errors.

```json
{
  "sourceSystem": "BUSY",
  "companyId": "client-company-or-store-id",
  "eventType": "SALE_INVOICE_UPSERT",
  "eventId": "busy-sync-event-000001",
  "eventTimestamp": "2026-02-07T10:30:00+05:30",
  "invoice": {
    "externalInvoiceId": "25",
    "busyOriginalId": "Main;07-02-2026;12/2025-26;Sale",
    "voucherCode": "25",
    "voucherType": "9",
    "voucherSeriesName": "Main",
    "voucherSeriesCode": "258",
    "voucherNo": "12/2025-26",
    "autoVoucherNo": "12",
    "invoiceNumber": "12/2025-26",
    "invoiceDate": "2026-02-07",
    "invoiceTime": null,
    "stockUpdationDate": "2026-02-07",
    "currency": "INR",
    "priceTaxTypeName": "Local-Exempt",
    "priceTaxTypeCode": "40218",
    "party": {
      "name": "Busy Infotech Pvt. Ltd.",
      "code": "40109",
      "state": "Delhi",
      "gstin": null,
      "mobile": null,
      "address": null
    },
    "store": {
      "name": "Main Store",
      "code": "201"
    },
    "totals": {
      "totalQuantity": "220",
      "taxableAmount": "56000",
      "gstAmount": null,
      "cgstAmount": null,
      "sgstAmount": null,
      "igstAmount": null,
      "roundOffAmount": null,
      "finalAmount": "56000"
    },
    "status": "ACTIVE"
  },
  "lines": [
    {
      "externalLineId": "Main;07-02-2026;12/2025-26;Sale#1",
      "srNo": 1,
      "itemCode": "40291",
      "itemName": "TestItem",
      "itemGroupName": "General",
      "sku": "40291",
      "brand": null,
      "category": "General",
      "hsnCode": null,
      "unitName": "Pcs.",
      "altUnitName": "Pcs.",
      "conversionFactor": "1",
      "quantity": "100",
      "quantityMainUnit": "100",
      "quantityAltUnit": "100",
      "returnedQuantity": "0",
      "taxCategory": "GST 12%",
      "taxRate": "12",
      "price": "200",
      "listPrice": "200",
      "discountAmountPerUnit": "0.00",
      "discountPercent": null,
      "netUnitPriceAfterDiscount": "200",
      "amount": "20000",
      "netAmount": "20000",
      "discount": "0.00",
      "rewardBaseAmountPerUnit": "200",
      "storeName": "Main Store",
      "storeCode": "201",
      "recType": "2",
      "orderRefs": [
        {
          "refNo": "1",
          "itemSrNo": 1,
          "quantity": "-100",
          "price": "200",
          "dueDate": "2025-04-01",
          "tmpRefCode": "20"
        }
      ]
    },
    {
      "externalLineId": "Main;07-02-2026;12/2025-26;Sale#2",
      "srNo": 2,
      "itemCode": "40294",
      "itemName": "Item",
      "itemGroupName": "General",
      "sku": "40294",
      "brand": null,
      "category": "General",
      "hsnCode": null,
      "unitName": "Pcs.",
      "altUnitName": "Pcs.",
      "conversionFactor": "1",
      "quantity": "120",
      "quantityMainUnit": "120",
      "quantityAltUnit": "120",
      "returnedQuantity": "0",
      "taxCategory": "<<---None--->",
      "taxRate": null,
      "price": "300",
      "listPrice": "300",
      "discountAmountPerUnit": "0.00",
      "discountPercent": null,
      "netUnitPriceAfterDiscount": "300",
      "amount": "36000",
      "netAmount": "36000",
      "discount": "0.00",
      "rewardBaseAmountPerUnit": "300",
      "storeName": "Main Store",
      "storeCode": "201",
      "recType": "2",
      "orderRefs": [
        {
          "refNo": "1",
          "itemSrNo": 2,
          "quantity": "-120",
          "price": "300",
          "dueDate": "2025-04-01",
          "tmpRefCode": "21"
        }
      ]
    }
  ],
  "accounts": [
    {
      "srNo": 1,
      "accountName": "Busy Infotech Pvt. Ltd.",
      "amountType": "1",
      "amountMainCurrency": "-56000",
      "groupName": "Sundry Creditors",
      "accountCode": "40109"
    },
    {
      "srNo": 2,
      "accountName": "Sales",
      "amountType": "2",
      "amountMainCurrency": "56000",
      "groupName": "Sale",
      "accountCode": "4"
    }
  ],
  "rawSource": {
    "format": "BUSY_XML",
    "fileName": "SaleWithRef.txt",
    "payload": "<Sale>...</Sale>"
  }
}
```

## Field Mapping From `SaleWithRef.txt`

| Volt Rewards field | BUSY sample field |
| --- | --- |
| `externalInvoiceId` | `Sale.tmpVchCode` or `BillingDetails.tmpVchCode` |
| `busyOriginalId` | `Sale.OriginalID` |
| `voucherCode` | `Sale.tmpVchCode` or `BillingDetails.tmpVchCode` |
| `voucherType` | `Sale.VchType` |
| `voucherSeriesName` | `Sale.VchSeriesName` |
| `voucherSeriesCode` | `Sale.tmpVchSeriesCode` |
| `invoiceNumber` / `voucherNo` | `Sale.VchNo` |
| `autoVoucherNo` | `Sale.AutoVchNo` |
| `invoiceDate` | `Sale.Date` |
| `stockUpdationDate` | `Sale.StockUpdationDate` |
| `party.name` | `BillingDetails.PartyName` or `Sale.MasterName1` |
| `party.code` | `Sale.tmpMasterCode1` or line `tmpPartyCode` |
| `party.state` | `BillingDetails.tmpStateName` |
| `store.name` | `Sale.MasterName2` or line `MC` |
| `store.code` | `Sale.tmpMasterCode2` or line `tmpMCCode` |
| `currency` | `Sale.TranCurName` mapped to `INR` when value is `Rs.` |
| `totals.totalQuantity` | `Sale.tmpTotalQty` |
| `totals.finalAmount` | `Sale.tmpTotalAmt` / `tmpSalePurcAmt` |
| `line.externalLineId` | `tmpVchCode + ":" + ItemDetail.SrNo + ":" + tmpItemCode` |
| `line.srNo` | `ItemEntries.ItemDetail.SrNo` |
| `line.itemName` | `ItemEntries.ItemDetail.ItemName` |
| `line.itemCode` | `ItemEntries.ItemDetail.tmpItemCode` |
| `line.unitName` | `ItemEntries.ItemDetail.UnitName` |
| `line.quantity` | `ItemEntries.ItemDetail.Qty` |
| `line.taxCategory` | `ItemEntries.ItemDetail.ItemTaxCategory` |
| `line.price` | `ItemEntries.ItemDetail.Price` |
| `line.discountAmountPerUnit` / `line.discountPercent` | BUSY developer must confirm exact item-level discount fields and whether `CompoundDiscount` is amount or percent. |
| `line.netUnitPriceAfterDiscount` | Prefer a BUSY-provided net unit price after discount; do not infer from `CompoundDiscount` unless confirmed. |
| `line.rewardBaseAmountPerUnit` | Optional. Needed only if the client enables `% of Price` ItemCode reward rules. BUSY must confirm the price base semantics before Volt Rewards uses it for point calculation. |
| `line.amount` | `ItemEntries.ItemDetail.Amt` |
| `line.netAmount` | `ItemEntries.ItemDetail.NettAmount` |

## Validation Rules

Required for every sale invoice:

- `externalInvoiceId`
- `tmpVchCode` or canonical `externalInvoiceId` derived from `tmpVchCode`
- `voucherNo`
- `invoiceDate`
- `party.name`
- At least one line item.
- For every line: stable `srNo`, `itemName`, `quantity`, `unitName`, `price`, and `amount`.
- Quantity must be numeric and non-negative for sale invoices.
- Return events must identify the linked original sale invoice `tmpVchCode`, the return invoice `tmpVchCode`, returned item code, and returned quantity.
- A full return must arrive as a return invoice that identifies the original sale `tmpVchCode` and includes all original sale line items and quantities.
- Item line changes must include stable line matching fields: original sale `tmpVchCode`, `SrNo` if stable, `tmpItemCode`, and returned/changed quantity.
- Discount data must include either a confirmed net unit price after discount or explicit discount amount/percent semantics.
- Item master data must include stable `tmpItemCode`, item name, category/group, price field, and active/deactivated signal or change-feed data.
- Totals must reconcile with line amounts or include an explicit reason if BUSY rounding/discount rules explain a difference.

## Idempotency And Conflict Handling

The same invoice or retry must not create duplicate invoices, duplicate line items, or duplicate QR unit placeholders.

Recommended invoice identity:

1. `tmpVchCode`

Recommended line identity:

1. `tmpVchCode + ":" + SrNo + ":" + tmpItemCode`
2. `OriginalID + "#" + SrNo`

If the same `Idempotency-Key` is received again with the same payload hash, return the earlier successful response. If the same idempotency key arrives with a different payload hash, return a conflict so the sync process can investigate.

## Error Responses

Validation error:

```json
{
  "accepted": false,
  "errorCode": "BUSY_VALIDATION_ERROR",
  "message": "Invoice line quantity is required.",
  "fieldErrors": [
    {
      "path": "lines[1].quantity",
      "message": "Required numeric quantity"
    }
  ]
}
```

Conflict error:

```json
{
  "accepted": false,
  "errorCode": "BUSY_IDEMPOTENCY_CONFLICT",
  "message": "Same idempotency key was received with a different payload hash."
}
```

## Test Cases BUSY Developer Should Support

- New sale invoice with multiple item lines.
- Retry the same invoice event after timeout; no duplicate data is created.
- Update an existing invoice before QR print.
- Update an existing invoice after some QR units are printed; returned/changed quantities must be explicit.
- Partial return invoice linked to an original sale invoice.
- Full return invoice linked to an original sale invoice.
- Return invoice for an invoice where some QR units are printed but unscanned.
- Return invoice for an invoice where all matching QR units are already scanned.
- Return invoice where the original sale invoice contains multiple lines with the same `tmpItemCode`.
- Full return invoice linked to an original sale invoice and containing all original sale line items and quantities.
- Partial return invoice for one item while other original sale lines remain active.
- Discounted item where net unit price after discount differs from list price.
- Missing required item field produces clear validation error.
- Network outage followed by retry from BUSY outbox.
- GST-inclusive invoice with CGST/SGST/IGST totals.
- Item master update for a new electrical product ItemCode.
- Item master deactivation/removal case so Volt Rewards can mark the ItemCode `Not in BUSY`.
- Invoice with electrical product examples such as Havells Wire, Atomberg Fans, Wipro Bulb, switches, MCBs, and related goods.

## Questions For BUSY Developer

1. Can BUSY PUSH an event on sale invoice create/update and return invoice create/update?
2. Does the local BUSY server need an installed sync agent/service for PUSH retries and outbox handling?
3. Can each line item keep a stable identifier after invoice edits, or can `SrNo` change?
4. How are sales returns represented in BUSY XML/API? Please provide one partial return invoice and one full return invoice sample where all original sale line items and quantities are returned, including the field that links the return invoice to the original sale `tmpVchCode`.
5. Are GSTIN, customer address, customer mobile, HSN/SAC, CGST, SGST, IGST, taxable amount, discount, round-off, and final amount available in the API?
6. Are item master fields such as brand, category, product code/SKU, HSN, and QR eligibility available?
7. Can the local BUSY server or sync agent call an internet HTTPS endpoint directly?
8. What is the expected daily invoice volume and maximum invoice line count?
9. Can BUSY provide item master PUSH events for all `tmpItemCode` values and for newly added, edited, and deactivated item codes?
10. Which BUSY price field should Volt Rewards use if the client enables `% of Price` ItemCode reward rules: list price, net unit price after discount, pre-GST taxable unit value, or GST-inclusive value?
11. If an original sale invoice has multiple lines with the same `tmpItemCode`, can the return invoice identify which original line the return belongs to, or should Volt Rewards pool by item code?
12. Is the return invoice link to the original sale `tmpVchCode` always mandatory and stable for partial and full returns?

## Build Boundary

Volt Rewards development will continue with the mock BUSY adapter. The production BUSY connector should satisfy this contract so the adapter implementation can be swapped without rebuilding the product flows.
