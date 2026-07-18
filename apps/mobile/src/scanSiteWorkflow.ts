import type { ScanCartItemSummary } from "./api";

export function shouldResetScanSiteOnEntry(reservedItemCount: number): boolean {
  return reservedItemCount === 0;
}

export function getReservedScanCartItems(
  items: readonly ScanCartItemSummary[] | undefined,
): readonly ScanCartItemSummary[] {
  return (items ?? []).filter((item) => item.status === "RESERVED");
}

export function reservedScanCartItemCount(items: readonly ScanCartItemSummary[] | undefined): number {
  return getReservedScanCartItems(items).length;
}

export function hasReservedScanCartItems(items: readonly ScanCartItemSummary[] | undefined): boolean {
  return reservedScanCartItemCount(items) > 0;
}

export function totalReservedScanCartPoints(items: readonly ScanCartItemSummary[] | undefined): number {
  return getReservedScanCartItems(items).reduce((total, item) => total + item.pointsToCredit, 0);
}
