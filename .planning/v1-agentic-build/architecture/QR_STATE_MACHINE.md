# QR State Machine Draft

Source requirements: QR-001 through QR-018, WEB-004 through WEB-017, SCAN-001 through SCAN-009, MADM-013 through MADM-015.

## States

- `NOT_PRINTED`: Unit exists as invoice quantity but no QR label has been printed.
- `PRINTED_UNCLAIMED`: QR label has been printed and is active, unscanned, and not expired.
- `RESERVED_IN_CART`: QR has been successfully scanned, reserved server-side in a contractor/site scan cart, and is pending `Add to account`; points have not been credited yet.
- `SCANNED_CLAIMED`: QR has been scanned successfully and points credited.
- `EXPIRED`: QR was unscanned and passed expiry.
- `CANCELLED`: QR was unused/uncollected, non-expired, and cancelled during return handling.
- `REPRINTED`: Earlier token was invalidated and replaced by a new active token; the replacement label is active, unscanned, and not expired.
- `REVERSED`: QR had been scanned/claimed, then points were reversed due to return.

## Events

- `print_qr_units`
- `scan_reserve_success`
- `add_to_account`
- `scan_failed`
- `expire_unscanned`
- `cancel_returned_unscanned`
- `reprint_qr`
- `reverse_returned_scanned`

## Allowed Transitions

| From | Event | To | Actor |
| --- | --- | --- | --- |
| NOT_PRINTED | print_qr_units | PRINTED_UNCLAIMED | Admin web |
| PRINTED_UNCLAIMED | scan_reserve_success | RESERVED_IN_CART | Contractor or Team Member |
| PRINTED_UNCLAIMED | expire_unscanned | EXPIRED | System job |
| PRINTED_UNCLAIMED | cancel_returned_unscanned | CANCELLED | Admin Mobile OWNER or STAFF |
| PRINTED_UNCLAIMED | reprint_qr | REPRINTED | Admin web |
| REPRINTED | scan_reserve_success | RESERVED_IN_CART | Contractor or Team Member |
| REPRINTED | expire_unscanned | EXPIRED | System job |
| REPRINTED | cancel_returned_unscanned | CANCELLED | Admin Mobile OWNER or STAFF |
| REPRINTED | reprint_qr | REPRINTED | Admin web |
| RESERVED_IN_CART | add_to_account | SCANNED_CLAIMED | Contractor or Team Member |
| SCANNED_CLAIMED | reverse_returned_scanned | REVERSED | Admin Mobile OWNER or STAFF |

## Denied Transitions

- NOT_PRINTED cannot be scanned.
- EXPIRED cannot be scanned.
- CANCELLED cannot be scanned.
- REVERSED cannot be scanned.
- Old token after reprint cannot be scanned.
- SCANNED_CLAIMED cannot be cancelled; it can only be reversed.
- PRINTED_UNCLAIMED cannot be reversed; it can only be cancelled.
- REPRINTED cannot be reversed while unscanned; it can only be scanned, cancelled, expired, or reprinted again.
- RESERVED_IN_CART cannot be scanned by another contractor/session and cannot credit points until `Add to account` commits the cart.
- RESERVED_IN_CART is not automatically expired by the original QR expiry after successful reservation unless an explicit invalidation rule applies.
- Failed scans cannot create RESERVED_IN_CART records.
- Admin Web cannot perform returned-product QR status scan, cancel, or reverse in v1.

## Required Side Effects

### Print

- Create unit-level QR records.
- Create active token.
- Record print audit event.

### Scan Reserve Success

- Validate token active.
- Validate QR not expired.
- Validate selected site belongs to contractor.
- Reserve QR unit server-side for the contractor/site/cart.
- Do not credit points yet.
- Record successful scan reservation.
- Record audit event.
- Keep the cart persistent across app visits.
- Preserve the reservation after later QR expiry unless an explicit invalidation rule applies.
- Do not block valid scans by reserved-cart point value in v1. Guard navigation away from Scan when reserved items exist.

### Add To Account

- Validate reserved cart ownership and contractor/site context.
- Credit points once for reserved cart items.
- Transition credited reserved items to SCANNED_CLAIMED.
- Record points ledger entries and balance after.
- Clear credited items from reserved cart.
- If a technical failure occurs, leave reserved items in cart for retry.
- If an item was invalidated after reservation, do not credit it; surface item-level remediation.

### Failed Scan

- Record scan attempt with reason where possible.
- Do not credit points.
- Do not add the QR to the reserved cart.

### Cancel

- Require label removed/discarded confirmation.
- Use fixed reason `Product Returned`.
- Do not show contractor/points if QR was unclaimed.
- Record audit event.

### Reprint

- Invalidate old token.
- Create replacement token.
- Set QR unit status to `REPRINTED`.
- Record audit event.

### Reverse

- Require label removed/discarded confirmation.
- Use fixed reason `Product Returned`.
- Reverse points.
- If reward chosen but not fulfilled, revoke/unclaim.
- If reward fulfilled, allow negative balance if needed.
- Record audit event.
