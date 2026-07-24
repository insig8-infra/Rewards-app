import assert from "node:assert/strict";
import test from "node:test";
import {
  buildQrPrintSelections,
  getSelectionPoints,
  getSelectionQuantity,
  normalizeQuantityInput,
  type QrPrintSelectableLine,
} from "./qrPrintSelection";

const line: QrPrintSelectableLine = {
  invoiceLineId: "line_1",
  available: 5,
  points: 20,
};

test("QR print selection lets operators clear and enter a lower quantity before commit", () => {
  assert.equal(getSelectionQuantity(line, { checked: true, quantityInput: "" }), 1);
  assert.equal(getSelectionQuantity(line, { checked: true, quantityInput: "2" }), 2);
  assert.equal(normalizeQuantityInput("", 5), "1");
  assert.equal(normalizeQuantityInput("2", 5), "2");
});

test("QR print selection clamps payload quantities and selected points to available units", () => {
  const selections = buildQrPrintSelections(
    [line, { invoiceLineId: "line_2", available: 0, points: 100 }],
    {
      line_1: { checked: true, quantityInput: "99" },
      line_2: { checked: true, quantityInput: "10" },
    },
  );

  assert.deepEqual(selections, [{ invoiceLineId: "line_1", quantity: 5 }]);
  assert.equal(getSelectionPoints(line, { checked: true, quantityInput: "99" }), 100);
});
