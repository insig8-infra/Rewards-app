import assert from "node:assert/strict";
import { test } from "node:test";
import type { ScanCartItemSummary } from "./api";
import {
  getReservedScanCartItems,
  hasReservedScanCartItems,
  reservedScanCartItemCount,
  shouldResetScanSiteOnEntry,
  totalReservedScanCartPoints,
} from "./scanSiteWorkflow";

function cartItem(input: Pick<ScanCartItemSummary, "cartItemId" | "pointsToCredit" | "status">): ScanCartItemSummary {
  return {
    cartItemId: input.cartItemId,
    qrUnitId: `qr-${input.cartItemId}`,
    scanAttemptId: `attempt-${input.cartItemId}`,
    qrValuePoints: input.pointsToCredit,
    pointsToCredit: input.pointsToCredit,
    status: input.status,
    reservedAt: "2026-07-15T08:30:00.000Z",
  };
}

test("fresh scan entry resets selected site only when no reserved cart is active", () => {
  assert.equal(shouldResetScanSiteOnEntry(0), true);
  assert.equal(shouldResetScanSiteOnEntry(2), false);
});

test("reserved cart helpers ignore committed and invalidated cart rows", () => {
  const items = [
    cartItem({ cartItemId: "reserved-1", pointsToCredit: 120, status: "RESERVED" }),
    cartItem({ cartItemId: "committed-1", pointsToCredit: 220, status: "COMMITTED" }),
    cartItem({ cartItemId: "invalidated-1", pointsToCredit: 320, status: "INVALIDATED" }),
    cartItem({ cartItemId: "removed-1", pointsToCredit: 420, status: "REMOVED_BY_USER" }),
    cartItem({ cartItemId: "reserved-2", pointsToCredit: 80, status: "RESERVED" }),
  ];

  assert.deepEqual(
    getReservedScanCartItems(items).map((item) => item.cartItemId),
    ["reserved-1", "reserved-2"],
  );
  assert.equal(reservedScanCartItemCount(items), 2);
  assert.equal(hasReservedScanCartItems(items), true);
  assert.equal(totalReservedScanCartPoints(items), 200);
});

test("reserved cart helpers handle an empty cart safely", () => {
  assert.equal(reservedScanCartItemCount(undefined), 0);
  assert.equal(hasReservedScanCartItems(undefined), false);
  assert.equal(totalReservedScanCartPoints(undefined), 0);
});
