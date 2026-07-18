# QR Management Workflow

**Updated:** 2026-06-13  
**Status:** PRD input draft

## Confirmed Intent

The admin web portal should make QR printing the primary landing workflow. QR labels are not printed inside the BUSY invoice. BUSY generates the normal invoice, invoice data becomes available in the client's database, and our platform pulls the invoice details through API integration.

The admin mobile app is not purely view-only. It includes a focused return-processing QR scan workflow for cancelling unused/uncollected non-expired QR codes or reversing points for already collected/scanned QR codes.

## Web Portal QR Print Flow

1. Staff generates invoice in BUSY.
2. Invoice data becomes available in the client's database.
3. Staff opens admin web portal.
4. Admin web portal shows `Print QR codes` on the front/landing page.
5. Staff selects or opens the relevant invoice.
6. Portal shows invoice details and line items.
7. Each line item is pre-checked for QR printing.
8. Staff can uncheck products that should not receive QR labels.
9. Staff can reduce QR print quantity for a line item.
10. System prevents QR print quantity from exceeding the original invoice quantity.
11. Staff clicks `Print QR codes`.
12. System creates individual QR/unit records linked to the invoice and line item.
13. System prints QR labels for selected units.
14. System records selected/printed individual units as `Printed`.
15. System records skipped/unprinted individual units as `Not Printed`.

Example: if an invoice line item is `Fans` with quantity 5 and staff prints only 2 QR labels, the system tracks 2 individual units as `Printed` and 3 individual units as `Not Printed`.

## Later Printing For Skipped Items

If a product or quantity was skipped during QR printing, staff can later select the `Not Printed` units for printing only if the system verifies through API that the product/invoice line item has not been returned.

Later printing can happen in multiple partial batches. For example, if 3 units remain `Not Printed`, staff can print 1 now and 2 later, subject to return-status validation.

This requires the BUSY/client database integration to expose enough return-of-sale or returned-product data to verify print eligibility.

## QR Status Lifecycle

- `Printed/Unclaimed`: QR label has been issued but not scanned by contractor/helper.
- `Scanned/Claimed`: QR was scanned and points/reward were credited to contractor.
- `Expired`: QR is unscanned and past expiry.
- `Cancelled`: QR was unused/uncollected, non-expired, and cancelled during return/cancellation handling.
- `Reprinted`: QR label was reprinted with a replacement QR token, and the earlier QR token was invalidated.
- `Reversed`: QR was Scanned/Claimed, then points/reward were reversed due to return/exchange.

## Admin Mobile Return Flow

1. Customer brings product for return/exchange.
2. OWNER or STAFF opens Volt Admin.
3. OWNER or STAFF scans QR label on the returned product.
4. App checks QR status.
5. If QR is unused/uncollected, Printed/Unclaimed, and non-expired, app shows Cancel action.
6. Cancel details show product name, QR ID, and invoice number only; no contractor, points, balance, or Reverse action appears.
7. OWNER or STAFF removes QR label from product and discards it.
8. OWNER or STAFF checks a confirmation checkbox that the QR label was removed and discarded.
9. OWNER or STAFF confirms Cancel in mobile app.
10. If QR is already collected/scanned and Scanned/Claimed, app shows Reverse action.
11. Reverse details show product name, QR ID, invoice number, contractor name, contractor mobile number, points to reverse, and scan date.
12. OWNER or STAFF removes QR label from product and discards it.
13. OWNER or STAFF checks a confirmation checkbox that the QR label was removed and discarded.
14. App warns if reversal may create a negative contractor balance.
15. OWNER or STAFF confirms Reverse in mobile app.
16. System reverses the points credited to the contractor for that QR and discards the QR.
17. If the returned QR points were claimed but not fulfilled, system unclaims/revokes the claim.
18. If the returned QR points were already fulfilled, system reverses the points and can create a negative contractor balance.

## Admin Mobile Reward Fulfillment Flow

1. Contractor visits counter to collect a claimed reward.
2. Contractor presents Claim ID from the frontend app.
3. OWNER or STAFF opens Volt Admin and enters Claim ID.
4. App verifies the claim and shows claim details.
5. App sends OTP to the registered contractor mobile number.
6. OWNER or STAFF enters OTP in Volt Admin.
7. After OTP verification and handover, OWNER or STAFF marks the claim as `Fulfilled`.

## Confirmed Rules

- QR print quantity cannot exceed invoice quantity.
- QR status is tracked per individual QR/unit, not only at invoice line item level.
- QR labels are generated/printed separately from the BUSY invoice.
- QR expiry is 45 days for now.
- Reprint is allowed only for unscanned and non-expired QR codes.
- Reprint generates a replacement QR token and invalidates the earlier QR token.
- Cancellation is allowed only for unused/uncollected, Printed/Unclaimed, non-expired QR codes.
- Reversal is allowed only for already collected/scanned, Scanned/Claimed QR codes.
- Expired means unscanned and past expiry.
- Cancel/Reverse reason is fixed as `Product Returned`.
- Cancel/Reverse does not require extra proof upload.
- Cancel/Reverse requires confirmation that the QR label was removed and discarded.
- Admin mobile has OWNER and STAFF personas.
- OWNER is the master store admin and can manage staff and contractors.
- STAFF can cancel/reverse returned-product QR codes and fulfill verified reward claims.
- STAFF cannot manage contractor records, staff records, points, or exports.
- QR printing remains a web portal workflow.
- OWNER can register, edit, and deactivate/unregister contractors from admin mobile.

## Reprint Token Rule

When a QR label is reprinted, the system must use the safer replacement-token behavior:

1. System invalidates the earlier QR token.
2. System generates a fresh replacement QR token.
3. System prints the replacement QR label.
4. If the old physical label is later scanned, the app must reject it as invalid/replaced.

This prevents a lost, damaged, or incorrectly printed old label from remaining usable.

## Open PRD Questions

- What exact BUSY/API fields identify invoice, line item, product/SKU, invoice quantity, returned quantity, cancellation, return, and exchange?
- What exact automatic audit fields are needed for Cancel/Reverse and reward fulfillment?
