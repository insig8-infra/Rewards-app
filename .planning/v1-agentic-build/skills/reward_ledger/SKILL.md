---
name: reward-ledger
description: |
  Implement or review reward, points, Balance Book, redeem, cancellation, fulfillment, and reversal-ledger behavior. Use for reward domain rules and tests. Do NOT use for QR printing or BUSY invoice import.
version: 0.1.0
authority: draft-only
---
# Reward Ledger

## When To Use

- Implementing points ledger entries.
- Implementing Balance Book.
- Implementing reward redeem and Claim ID creation.
- Implementing reward cancellation before collection.
- Implementing Delivered/Collected fulfillment.
- Handling QR reversal impact on chosen or fulfilled rewards.

## When Not To Use

- QR label printing.
- Admin report layout.
- BUSY field mapping.

## Workflow

1. Read Reward and Scan History requirements in `REQUIREMENTS_LEDGER.md`.
2. Identify whether the event changes available points, total accumulated points, tier, reward status, or all of these.
3. Use append-only ledger entries for point mutations.
4. Store derived balances after each activity for Balance Book display.
5. Add tests for redeem, cancel, fulfill, revoke, and negative balance cases.

## Required Checks

- Redeem deducts points only if enough points are available.
- Ineligible rewards remain disabled.
- Chosen reward gets a Claim ID.
- Contractor can cancel/change chosen reward only before physical collection.
- Canceling chosen reward restores points and recalculates eligibility/tier.
- OWNER fulfillment marks reward Delivered/Collected.
- QR reversal before fulfillment revokes/unclaims the reward.
- QR reversal after fulfillment can create negative balance and must be logged.

