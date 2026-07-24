export interface QrStickerUnitInput {
  readonly qrUnitId: string;
  readonly invoiceLineId: string;
  readonly unitIndex: number;
  readonly tokenValue: string;
  readonly points: number;
  readonly expiresAt: string;
}

export interface QrStickerLineInput {
  readonly invoiceLineId: string;
  readonly productName: string;
  readonly sku: string;
}

export interface QrStickerBatchInput {
  readonly invoiceNumber: string;
  readonly customerName: string;
  readonly units: readonly QrStickerUnitInput[];
  readonly lines: readonly QrStickerLineInput[];
}

export interface QrStickerLabel {
  readonly qrUnitId: string;
  readonly tokenValue: string;
  readonly points: number;
  readonly pointsLabel: string;
  readonly productName: string;
  readonly sku: string;
  readonly unitLabel: string;
  readonly invoiceNumber: string;
  readonly customerName: string;
  readonly expiresAt: string;
  readonly shortToken: string;
}

export function buildQrStickerLabels(input: QrStickerBatchInput): readonly QrStickerLabel[] {
  const lineById = new Map(input.lines.map((line) => [line.invoiceLineId, line]));

  return input.units.map((unit) => {
    const line = lineById.get(unit.invoiceLineId);
    return {
      qrUnitId: unit.qrUnitId,
      tokenValue: unit.tokenValue,
      points: unit.points,
      pointsLabel: `Get ${unit.points} Points`,
      productName: line?.productName ?? "Product",
      sku: line?.sku ?? unit.invoiceLineId,
      unitLabel: `Unit ${unit.unitIndex}`,
      invoiceNumber: input.invoiceNumber,
      customerName: input.customerName,
      expiresAt: unit.expiresAt,
      shortToken: unit.tokenValue.slice(-8),
    };
  });
}
