import { ACTOR_ROLE, DomainError, type ActorRole } from "./types.js";

export const QR_EXPIRY_DAYS = 45;

export interface QrPrintLineRequest {
  readonly invoiceLineId: string;
  readonly quantity: number;
}

export interface QrPrintLineAvailability {
  readonly invoiceLineId: string;
  readonly totalQuantity: number;
  readonly returnedQuantity: number;
  readonly notPrintedQuantity: number;
}

export function calculateQrExpiry(printedAt: Date, expiryDays = QR_EXPIRY_DAYS): Date {
  const expiry = new Date(printedAt);
  expiry.setUTCDate(expiry.getUTCDate() + expiryDays);
  return expiry;
}

export function getPrintableQuantity(availability: QrPrintLineAvailability): number {
  const returnAdjustedQuantity = Math.max(0, availability.totalQuantity - availability.returnedQuantity);
  const alreadyUnavailableQuantity = Math.max(0, availability.totalQuantity - availability.notPrintedQuantity);
  return Math.max(0, returnAdjustedQuantity - alreadyUnavailableQuantity);
}

export function assertCanPrintQr(
  actorRole: ActorRole,
  selections: readonly QrPrintLineRequest[],
  availabilities: readonly QrPrintLineAvailability[],
): void {
  if (actorRole !== ACTOR_ROLE.OWNER && actorRole !== ACTOR_ROLE.STAFF) {
    throw new DomainError("QR_PRINT_FORBIDDEN_ACTOR", "Only OWNER or STAFF can print QR codes.");
  }

  if (selections.length === 0) {
    throw new DomainError("QR_PRINT_SELECTION_REQUIRED", "At least one invoice line must be selected.");
  }

  const availabilityByLine = new Map(availabilities.map((availability) => [availability.invoiceLineId, availability]));
  const selectedLineIds = new Set<string>();

  for (const selection of selections) {
    if (selectedLineIds.has(selection.invoiceLineId)) {
      throw new DomainError("QR_PRINT_DUPLICATE_LINE", "Each invoice line can appear only once per print request.");
    }
    selectedLineIds.add(selection.invoiceLineId);

    if (!Number.isInteger(selection.quantity) || selection.quantity <= 0) {
      throw new DomainError("QR_PRINT_INVALID_QUANTITY", "Print quantity must be a positive whole number.");
    }

    const availability = availabilityByLine.get(selection.invoiceLineId);
    if (!availability) {
      throw new DomainError("QR_PRINT_LINE_NOT_FOUND", "Invoice line is not available for QR printing.");
    }

    const printableQuantity = getPrintableQuantity(availability);
    if (selection.quantity > printableQuantity) {
      throw new DomainError(
        "QR_PRINT_QUANTITY_EXCEEDS_AVAILABLE",
        "Print quantity cannot exceed non-returned, not-yet-printed units.",
      );
    }
  }
}
