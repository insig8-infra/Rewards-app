# Reward Ledger Rules Draft

Source requirements: RWD-001 through RWD-017, MADM-024, QR-017, QR-018.

## Concepts

- Total accumulated points: lifetime gross display value; it does not decrease when points are later reversed.
- Points available: spendable balance for rewards.
- Reward display value: contractor-facing QR/reward/balance copy displays points, not rupee-equivalent marketing copy.
- Balance Book: chronological reward-related ledger.
- Claim ID: identifier generated when contractor chooses/redeems a reward.
- Delivered/Collected: physical handover completed by OWNER fulfillment.
- Tiers: Silver, Gold, Platinum, and Diamond. Tiers unlock sets of rewards based on total points collected and current points available.
- QR earning rule: scan reward points are resolved from the managed BUSY ItemCodes table keyed by `TempItemCode` / `tmpItemCode`. Each ItemCode uses exactly one active editable rule: `Absolute Points` or `% of Price`. `% of Price` uses latest synced ItemCode `Price` and rounds resolved points to the nearest integer unless a later product decision changes rounding.
- Reserved scan cart: successful QR scans are reserved server-side in a contractor/site cart first; points are credited only when `Add to account` commits the reserved cart.

## Reward Statuses

- `available`: catalog item can be redeemed if points and any tier requirement are sufficient.
- `chosen`: contractor selected reward and points were deducted; not physically collected.
- `cancelled_by_contractor`: contractor cancelled chosen reward before collection; points restored.
- `revoked_due_to_return`: QR reversal invalidated chosen but unfulfilled reward.
- `fulfilled`: OWNER marked reward Delivered/Collected after Claim ID and OTP verification.

## Ledger Events

- `scan_credit`
- `reward_redeem`
- `reward_cancel_restore`
- `reward_fulfilled`
- `qr_reverse`
- `reward_revoked_due_to_return`

## Rules

1. Reward redeem requires available points >= points required.
2. Redeem deducts points and creates Claim ID.
3. Ineligible reward action remains disabled.
4. Reward tiles must show how far the contractor is from unlocking or affording the reward.
5. Contractor can cancel/change chosen reward before physical collection.
6. OTP initiation does not block cancellation. The cutoff is OWNER marking the reward Fulfilled/Delivered after OTP entry.
7. Cancel before collection restores points.
8. Cancel before collection recalculates available rewards and tier.
9. Balance Book records every points-affecting reward event with balance after.
10. OWNER fulfillment requires Claim ID lookup, OTP to contractor mobile, OTP entry, and mark Fulfilled.
11. STAFF cannot fulfill rewards unless requirement changes.
12. QR reversal before reward fulfillment revokes/unclaims affected reward where applicable.
13. QR reversal after reward fulfillment reverses points and may create negative available balance; the fulfilled reward remains fulfilled.
14. QR label and reward copy must show points. Monetary INR copy is reserved for actual money fields such as invoice totals or admin-only reward catalog value.
15. QR reward points are calculated from the approved ItemCodes rule for the BUSY item code. Until production BUSY APIs exist, dummy ItemCodes use absolute integer values such as Wire 30, Switches 10, Fans 50, and Lights 20 with `% of Price` blank.
16. Once QR units are printed, the reward points/display value copied onto those QR units remains fixed even if future ItemCode rules change or the item later disappears from BUSY.
17. Printed QR label copy says `Collect X points` using the frozen print-time point value.
18. Initial successful QR scan reservation does not create a points ledger credit.
19. `scan_credit` ledger events are written during `Add to account` for reserved cart items.
20. Failed, invalid, expired, duplicate, or already-claimed scan attempts record `0 credited points`; QR value may be shown separately only as informational value.
21. If `Add to account` fails due technical/network failure, reserved cart items remain uncredited and retryable; no partial ledger event should be written without a successful commit transaction.

## Configurable Business Data

- Final reward catalog item list, images, point costs, and tier requirements.
- Silver, Gold, Platinum, and Diamond threshold values.
- ItemCodes mapping, including eligible, ineligible, unmapped, `Not In Use`, `Not in BUSY`, and which eligible items use `Absolute Points` versus `% of Price`.

## Resolved Semantics

- Total accumulated points does not decrease when points are reversed.
- Points Available is the current redeemable balance and may become negative after post-fulfillment QR reversal.
- Tier names are Silver, Gold, Platinum, and Diamond.
- Contractor cancellation is allowed until OWNER marks Fulfilled/Delivered; OTP sent alone does not block cancellation.
- Reward earning is ItemCode based for v1. Price-based earning is allowed only through the ItemCodes `% of Price` rule using latest synced ItemCode `Price`, rounded to the nearest integer.
- QR earning is reserved first, credited later through `Add to account`.
