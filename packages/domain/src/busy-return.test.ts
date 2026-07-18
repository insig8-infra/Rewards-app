import assert from "node:assert/strict";
import test from "node:test";
import {
  BUSY_RETURN_ALLOCATION_TYPE,
  DomainError,
  QR_STATUS,
  allocateBusyReturnLine,
} from "./index.js";

test("allocateBusyReturnLine consumes not-yet-printed units before printed, reprinted, or scanned units", () => {
  const result = allocateBusyReturnLine({
    returnedQuantity: 4,
    pooledByItemCode: true,
    candidates: [
      {
        originalInvoiceLineId: "line_1",
        soldQuantity: 5,
        alreadyReturnedQuantity: 0,
        qrUnits: [
          { qrUnitId: "qr_printed_1", status: QR_STATUS.PRINTED_UNCLAIMED },
          { qrUnitId: "qr_reprinted_1", status: QR_STATUS.REPRINTED },
          { qrUnitId: "qr_scanned_1", status: QR_STATUS.SCANNED_CLAIMED },
          { qrUnitId: "qr_not_printed_1", status: QR_STATUS.NOT_PRINTED },
          { qrUnitId: "qr_not_printed_2", status: QR_STATUS.NOT_PRINTED },
        ],
      },
    ],
  });

  assert.equal(result.pooledByItemCode, true);
  assert.deepEqual(
    result.allocations.map((allocation) => [allocation.qrUnitId, allocation.type]),
    [
      ["qr_not_printed_1", BUSY_RETURN_ALLOCATION_TYPE.NOT_PRINTED_UNAVAILABLE],
      ["qr_not_printed_2", BUSY_RETURN_ALLOCATION_TYPE.NOT_PRINTED_UNAVAILABLE],
      ["qr_printed_1", BUSY_RETURN_ALLOCATION_TYPE.PRINTED_CANCEL_ELIGIBLE],
      ["qr_reprinted_1", BUSY_RETURN_ALLOCATION_TYPE.PRINTED_CANCEL_ELIGIBLE],
    ],
  );
});

test("allocateBusyReturnLine creates review-needed allocation for scanned QR without physical scan", () => {
  const result = allocateBusyReturnLine({
    returnedQuantity: 1,
    candidates: [
      {
        originalInvoiceLineId: "line_1",
        soldQuantity: 1,
        alreadyReturnedQuantity: 0,
        qrUnits: [{ qrUnitId: "qr_scanned_1", status: QR_STATUS.SCANNED_CLAIMED }],
      },
    ],
  });

  assert.equal(result.allocations[0]?.type, BUSY_RETURN_ALLOCATION_TYPE.SCANNED_REVIEW_NEEDED);
});

test("allocateBusyReturnLine validates cumulative returned quantity", () => {
  assert.throws(
    () =>
      allocateBusyReturnLine({
        returnedQuantity: 2,
        candidates: [
          {
            originalInvoiceLineId: "line_1",
            soldQuantity: 2,
            alreadyReturnedQuantity: 1,
            qrUnits: [
              { qrUnitId: "qr_1", status: QR_STATUS.NOT_PRINTED },
              { qrUnitId: "qr_2", status: QR_STATUS.NOT_PRINTED },
            ],
          },
        ],
      }),
    (error) => error instanceof DomainError && error.code === "BUSY_RETURN_QUANTITY_EXCEEDS_SOLD",
  );
});
