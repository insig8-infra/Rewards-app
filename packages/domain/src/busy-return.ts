import { DomainError, QR_STATUS, type QrStatus } from "./types.js";

export const BUSY_RETURN_ALLOCATION_TYPE = {
  NOT_PRINTED_UNAVAILABLE: "NOT_PRINTED_UNAVAILABLE",
  PRINTED_CANCEL_ELIGIBLE: "PRINTED_CANCEL_ELIGIBLE",
  SCANNED_REVIEW_NEEDED: "SCANNED_REVIEW_NEEDED",
  SCANNED_REVERSED: "SCANNED_REVERSED",
} as const;

export type BusyReturnAllocationType =
  (typeof BUSY_RETURN_ALLOCATION_TYPE)[keyof typeof BUSY_RETURN_ALLOCATION_TYPE];

export interface BusyReturnQrUnitCandidate {
  readonly qrUnitId: string;
  readonly status: QrStatus;
}

export interface BusyReturnOriginalLineCandidate {
  readonly originalInvoiceLineId: string;
  readonly soldQuantity: number;
  readonly alreadyReturnedQuantity: number;
  readonly qrUnits: readonly BusyReturnQrUnitCandidate[];
}

export interface BusyReturnAllocationDecision {
  readonly originalInvoiceLineId: string;
  readonly qrUnitId: string;
  readonly type: BusyReturnAllocationType;
  readonly quantity: 1;
}

export interface BusyReturnAllocationResult {
  readonly allocations: readonly BusyReturnAllocationDecision[];
  readonly pooledByItemCode: boolean;
}

export function allocateBusyReturnLine(input: {
  readonly returnedQuantity: number;
  readonly candidates: readonly BusyReturnOriginalLineCandidate[];
  readonly pooledByItemCode?: boolean;
}): BusyReturnAllocationResult {
  if (!Number.isInteger(input.returnedQuantity) || input.returnedQuantity <= 0) {
    throw new DomainError("BUSY_RETURN_INVALID_QUANTITY", "Returned quantity must be a positive whole number.");
  }

  if (input.candidates.length === 0) {
    throw new DomainError("BUSY_RETURN_ORIGINAL_LINE_NOT_FOUND", "Return line did not match the original sale invoice.");
  }

  const soldQuantity = input.candidates.reduce((total, candidate) => total + candidate.soldQuantity, 0);
  const alreadyReturnedQuantity = input.candidates.reduce(
    (total, candidate) => total + candidate.alreadyReturnedQuantity,
    0,
  );

  if (alreadyReturnedQuantity + input.returnedQuantity > soldQuantity) {
    throw new DomainError(
      "BUSY_RETURN_QUANTITY_EXCEEDS_SOLD",
      "Returned quantity cannot exceed the original sold quantity.",
    );
  }

  const allocations: BusyReturnAllocationDecision[] = [];
  let remaining = input.returnedQuantity;

  for (const status of [
    QR_STATUS.NOT_PRINTED,
    QR_STATUS.PRINTED_UNCLAIMED,
    QR_STATUS.REPRINTED,
    QR_STATUS.SCANNED_CLAIMED,
  ]) {
    for (const candidate of input.candidates) {
      for (const qrUnit of candidate.qrUnits) {
        if (remaining === 0) {
          break;
        }
        if (qrUnit.status !== status) {
          continue;
        }
        allocations.push({
          originalInvoiceLineId: candidate.originalInvoiceLineId,
          qrUnitId: qrUnit.qrUnitId,
          type: allocationTypeForStatus(status),
          quantity: 1,
        });
        remaining -= 1;
      }
    }
  }

  if (remaining > 0) {
    throw new DomainError(
      "BUSY_RETURN_NO_ALLOCATABLE_QR_UNITS",
      "Return quantity could not be allocated to available QR units.",
    );
  }

  return {
    allocations,
    pooledByItemCode: input.pooledByItemCode === true,
  };
}

function allocationTypeForStatus(status: QrStatus): BusyReturnAllocationType {
  if (status === QR_STATUS.NOT_PRINTED) {
    return BUSY_RETURN_ALLOCATION_TYPE.NOT_PRINTED_UNAVAILABLE;
  }
  if (status === QR_STATUS.PRINTED_UNCLAIMED || status === QR_STATUS.REPRINTED) {
    return BUSY_RETURN_ALLOCATION_TYPE.PRINTED_CANCEL_ELIGIBLE;
  }
  return BUSY_RETURN_ALLOCATION_TYPE.SCANNED_REVIEW_NEEDED;
}
