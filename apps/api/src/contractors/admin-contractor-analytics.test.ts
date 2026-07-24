import assert from "node:assert/strict";
import test from "node:test";
import { summarizeSuccessfulScans } from "./admin-contractor-analytics.js";

test("summarizeSuccessfulScans groups successful scans by item, unit price, and credited points", () => {
  const summary = summarizeSuccessfulScans([
    {
      creditedPoints: 10,
      qrUnit: {
        points: 10,
        productSku: "40291",
        invoiceLine: {
          productName: "TestItem",
          rawSource: { Price: "200.00" },
        },
      },
    },
    {
      creditedPoints: 10,
      qrUnit: {
        points: 10,
        productSku: "40291",
        invoiceLine: {
          productName: "TestItem",
          rawSource: { Price: "200.00" },
        },
      },
    },
    {
      creditedPoints: 4,
      qrUnit: {
        points: 4,
        productSku: "50021",
        invoiceLine: {
          productName: "Switch Plate",
          rawSource: { unitRate: "85.50" },
        },
      },
    },
  ]);

  assert.equal(summary.successfulScanCount, 3);
  assert.equal(summary.scannedBusinessInr, "485.50");
  assert.equal(summary.pointsCollected, 24);
  assert.deepEqual(summary.scannedItems, [
    {
      sku: "50021",
      productName: "Switch Plate",
      quantity: 1,
      unitPriceInr: "85.50",
      totalAmountInr: "85.50",
      pointsCollected: 4,
    },
    {
      sku: "40291",
      productName: "TestItem",
      quantity: 2,
      unitPriceInr: "200.00",
      totalAmountInr: "400.00",
      pointsCollected: 20,
    },
  ]);
});
