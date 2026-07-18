import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTOR_ROLE,
  DomainError,
  assertCanPrintQr,
  calculateQrExpiry,
  getPrintableQuantity,
} from "./index.js";

test("assertCanPrintQr allows OWNER and STAFF to print available units", () => {
  const availability = {
    invoiceLineId: "line_1",
    totalQuantity: 10,
    returnedQuantity: 2,
    notPrintedQuantity: 10,
  };

  assert.equal(getPrintableQuantity(availability), 8);

  assert.doesNotThrow(() =>
    assertCanPrintQr(ACTOR_ROLE.OWNER, [{ invoiceLineId: "line_1", quantity: 8 }], [availability]),
  );
  assert.doesNotThrow(() =>
    assertCanPrintQr(ACTOR_ROLE.STAFF, [{ invoiceLineId: "line_1", quantity: 8 }], [availability]),
  );
});

test("assertCanPrintQr rejects client actors and over-quantity requests", () => {
  const availability = {
    invoiceLineId: "line_1",
    totalQuantity: 10,
    returnedQuantity: 1,
    notPrintedQuantity: 4,
  };

  assert.throws(
    () => assertCanPrintQr(ACTOR_ROLE.CONTRACTOR, [{ invoiceLineId: "line_1", quantity: 1 }], [availability]),
    (error) => error instanceof DomainError && error.code === "QR_PRINT_FORBIDDEN_ACTOR",
  );

  assert.throws(
    () => assertCanPrintQr(ACTOR_ROLE.OWNER, [{ invoiceLineId: "line_1", quantity: 5 }], [availability]),
    (error) => error instanceof DomainError && error.code === "QR_PRINT_QUANTITY_EXCEEDS_AVAILABLE",
  );
});

test("calculateQrExpiry applies the v1 45 day QR expiry", () => {
  assert.equal(
    calculateQrExpiry(new Date("2026-06-22T00:00:00.000Z")).toISOString(),
    "2026-08-06T00:00:00.000Z",
  );
});
