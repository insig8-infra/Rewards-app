export interface QrStatusDisplay {
  readonly status: string;
  readonly label: string;
  readonly count: number;
  readonly badgeClassName: string;
}

export const invoiceQrStatusDisplayOrder = [
  "NOT_PRINTED",
  "PRINTED_UNCLAIMED",
  "REPRINTED",
  "SCANNED_CLAIMED",
  "CANCELLED",
  "REVERSED",
] as const;

const qrStatusLabels: Readonly<Record<string, string>> = {
  NOT_PRINTED: "Not_Printed",
  PRINTED_UNCLAIMED: "Printed",
  REPRINTED: "Reprinted",
  SCANNED_CLAIMED: "Claimed",
  CANCELLED: "Cancelled",
  REVERSED: "Reversed_AND_Cancelled",
  EXPIRED: "Expired",
};

const qrStatusTones: Readonly<Record<string, "neutral" | "good" | "warn" | "danger">> = {
  NOT_PRINTED: "neutral",
  PRINTED_UNCLAIMED: "good",
  REPRINTED: "warn",
  SCANNED_CLAIMED: "good",
  CANCELLED: "warn",
  REVERSED: "danger",
  EXPIRED: "danger",
};

export function getQrStatusDisplayLabel(status: string): string {
  return qrStatusLabels[status] ?? status;
}

export function getQrStatusBadgeClassName(status: string): string {
  const tone = qrStatusTones[status] ?? "neutral";
  return tone === "neutral" ? "badge qr-status" : `badge qr-status ${tone}`;
}

export function getQrStatusDisplays(statuses: readonly string[]): readonly QrStatusDisplay[] {
  const counts = new Map<string, number>();

  for (const status of statuses) {
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  const knownStatusDisplays = invoiceQrStatusDisplayOrder
    .map((status) => buildQrStatusDisplay(status, counts.get(status) ?? 0))
    .filter((display) => display.count > 0);
  const unknownStatusDisplays = [...counts.entries()]
    .filter(([status]) => !invoiceQrStatusDisplayOrder.includes(status as (typeof invoiceQrStatusDisplayOrder)[number]))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([status, count]) => buildQrStatusDisplay(status, count));

  return [...knownStatusDisplays, ...unknownStatusDisplays];
}

function buildQrStatusDisplay(status: string, count: number): QrStatusDisplay {
  return {
    status,
    label: getQrStatusDisplayLabel(status),
    count,
    badgeClassName: getQrStatusBadgeClassName(status),
  };
}
