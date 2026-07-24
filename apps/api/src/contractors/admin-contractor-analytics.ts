export interface ContractorScanMetricInput {
  readonly creditedPoints?: number | null;
  readonly qrValuePoints?: number | null;
  readonly qrUnit?: {
    readonly points: number;
    readonly productSku?: string | null;
    readonly invoiceLine?: {
      readonly productName: string;
      readonly rawSource?: unknown;
    } | null;
  } | null;
}

export interface AdminContractorScannedItemAnalytics {
  readonly sku: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPriceInr: string;
  readonly totalAmountInr: string;
  readonly pointsCollected: number;
}

export interface AdminContractorScanMetricSummary {
  readonly successfulScanCount: number;
  readonly scannedBusinessInr: string;
  readonly pointsCollected: number;
  readonly scannedItems: readonly AdminContractorScannedItemAnalytics[];
}

export function summarizeSuccessfulScans(
  attempts: readonly ContractorScanMetricInput[],
): AdminContractorScanMetricSummary {
  const scannedItems = buildScannedItemAnalytics(attempts);
  return {
    successfulScanCount: attempts.length,
    scannedBusinessInr: formatMoney(scannedItems.reduce((total, item) => total + Number(item.totalAmountInr), 0)),
    pointsCollected: scannedItems.reduce((total, item) => total + item.pointsCollected, 0),
    scannedItems,
  };
}

export function buildScannedItemAnalytics(
  attempts: readonly ContractorScanMetricInput[],
): readonly AdminContractorScannedItemAnalytics[] {
  const rows = new Map<string, { sku: string; productName: string; unitPrice: number; quantity: number; pointsCollected: number }>();

  for (const attempt of attempts) {
    const invoiceLine = attempt.qrUnit?.invoiceLine ?? null;
    const productName = invoiceLine?.productName ?? "Unknown item";
    const sku = attempt.qrUnit?.productSku ?? readString(asRecord(invoiceLine?.rawSource), "tmpItemCode", "Unknown code");
    const unitPrice = readMoney(asRecord(invoiceLine?.rawSource), ["Price", "unitRate"]);
    const key = `${sku}::${productName}::${unitPrice.toFixed(2)}`;
    const existing = rows.get(key);
    const pointsCollected = attempt.creditedPoints ?? attempt.qrValuePoints ?? attempt.qrUnit?.points ?? 0;

    if (existing) {
      existing.quantity += 1;
      existing.pointsCollected += pointsCollected;
    } else {
      rows.set(key, {
        sku,
        productName,
        unitPrice,
        quantity: 1,
        pointsCollected,
      });
    }
  }

  return [...rows.values()]
    .sort((left, right) => left.productName.localeCompare(right.productName))
    .map((row) => ({
      sku: row.sku,
      productName: row.productName,
      quantity: row.quantity,
      unitPriceInr: formatMoney(row.unitPrice),
      totalAmountInr: formatMoney(row.unitPrice * row.quantity),
      pointsCollected: row.pointsCollected,
    }));
}

function readMoney(raw: Record<string, unknown>, keys: readonly string[]): number {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const normalized = Number(value.replace(/,/g, ""));
      if (Number.isFinite(normalized)) {
        return normalized;
      }
    }
  }
  return 0;
}

function readString(raw: Record<string, unknown>, key: string, fallback: string): string {
  const value = raw[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}
