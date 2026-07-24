export interface QrPrintSelectableLine {
  readonly invoiceLineId: string;
  readonly available: number;
  readonly points: number;
}

export interface QrPrintSelectionState {
  readonly checked: boolean;
  readonly quantityInput: string;
}

export interface QrPrintLineSelection {
  readonly invoiceLineId: string;
  readonly quantity: number;
}

export function getSelectionQuantity(line: QrPrintSelectableLine, selection?: QrPrintSelectionState): number {
  if (!selection?.checked || line.available <= 0) {
    return 0;
  }

  return normalizeQuantity(selection.quantityInput, line.available);
}

export function getSelectionPoints(line: QrPrintSelectableLine, selection?: QrPrintSelectionState): number {
  return getSelectionQuantity(line, selection) * line.points;
}

export function buildQrPrintSelections(
  lines: readonly QrPrintSelectableLine[],
  selection: Readonly<Record<string, QrPrintSelectionState>>,
): readonly QrPrintLineSelection[] {
  return lines.flatMap((line) => {
    const quantity = getSelectionQuantity(line, selection[line.invoiceLineId]);
    return quantity > 0 ? [{ invoiceLineId: line.invoiceLineId, quantity }] : [];
  });
}

export function normalizeQuantityInput(input: string, available: number): string {
  if (available <= 0) {
    return "0";
  }

  return String(normalizeQuantity(input, available));
}

function normalizeQuantity(input: string, available: number): number {
  const min = available > 0 ? 1 : 0;
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed)) {
    return min;
  }
  return Math.min(available, Math.max(min, parsed));
}
