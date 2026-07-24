import assert from "node:assert/strict";
import test from "node:test";
import { buildQrStickerLabels } from "./qrStickerSheet";

test("buildQrStickerLabels preserves token value and points label for sticker printing", () => {
  const labels = buildQrStickerLabels({
    invoiceNumber: "VR/26-27/1001",
    customerName: "Sharma Electrical Contractors",
    lines: [
      {
        invoiceLineId: "line_1",
        productName: "Havells Life Line Plus Cable",
        sku: "40291",
      },
    ],
    units: [
      {
        qrUnitId: "qr_1",
        invoiceLineId: "line_1",
        unitIndex: 3,
        tokenValue: "volt_qr_1234567890",
        points: 25,
        expiresAt: "2026-09-05T00:00:00.000Z",
      },
    ],
  });

  assert.equal(labels.length, 1);
  assert.equal(labels[0]?.tokenValue, "volt_qr_1234567890");
  assert.equal(labels[0]?.pointsLabel, "Get 25 Points");
  assert.equal(labels[0]?.productName, "Havells Life Line Plus Cable");
  assert.equal(labels[0]?.sku, "40291");
  assert.equal(labels[0]?.unitLabel, "Unit 3");
  assert.equal(labels[0]?.shortToken, "34567890");
});

test("buildQrStickerLabels keeps a printable fallback when line metadata is unavailable", () => {
  const labels = buildQrStickerLabels({
    invoiceNumber: "VR/26-27/1002",
    customerName: "Patel Electrical Works",
    lines: [],
    units: [
      {
        qrUnitId: "qr_2",
        invoiceLineId: "missing_line",
        unitIndex: 1,
        tokenValue: "short",
        points: 10,
        expiresAt: "2026-09-05T00:00:00.000Z",
      },
    ],
  });

  assert.equal(labels[0]?.productName, "Product");
  assert.equal(labels[0]?.sku, "missing_line");
  assert.equal(labels[0]?.shortToken, "short");
});
