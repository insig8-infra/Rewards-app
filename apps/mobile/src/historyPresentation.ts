import type { ScanHistoryEntry } from "./api";

export type HistoryFilter = "ALL" | "CONTRACTOR" | "FAILED" | "SUCCESS" | "TEAM_MEMBER";
export type HistorySort = "LATEST" | "POINTS" | "PRODUCT";

export interface HistoryPresentationInput {
  readonly entries: readonly ScanHistoryEntry[];
  readonly filter: HistoryFilter;
  readonly query: string;
  readonly sort: HistorySort;
}

export function presentScanHistory(input: HistoryPresentationInput): readonly ScanHistoryEntry[] {
  const query = input.query.trim().toLowerCase();
  return input.entries
    .filter((entry) => matchesHistoryFilter(entry, input.filter))
    .filter((entry) => !query || historySearchText(entry).includes(query))
    .toSorted((left, right) => compareHistoryRows(left, right, input.sort));
}

function matchesHistoryFilter(entry: ScanHistoryEntry, filter: HistoryFilter): boolean {
  if (filter === "SUCCESS") {
    return entry.result === "SUCCESS";
  }
  if (filter === "FAILED") {
    return entry.result !== "SUCCESS";
  }
  if (filter === "CONTRACTOR") {
    return entry.actorRole === "CONTRACTOR";
  }
  if (filter === "TEAM_MEMBER") {
    return entry.actorRole === "TEAM_MEMBER";
  }
  return true;
}

function compareHistoryRows(left: ScanHistoryEntry, right: ScanHistoryEntry, sort: HistorySort): number {
  if (sort === "PRODUCT") {
    return (left.productSku ?? "").localeCompare(right.productSku ?? "") || latestFirst(left, right);
  }
  if (sort === "POINTS") {
    return historyPointValue(right) - historyPointValue(left) || latestFirst(left, right);
  }
  return latestFirst(left, right);
}

function historyPointValue(entry: ScanHistoryEntry): number {
  return entry.creditedPoints ?? entry.qrValuePoints ?? 0;
}

function latestFirst(left: ScanHistoryEntry, right: ScanHistoryEntry): number {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function historySearchText(entry: ScanHistoryEntry): string {
  return [
    entry.productSku,
    entry.qrCodeId,
    entry.qrUnitId,
    entry.siteLabel,
    entry.siteId,
    entry.teamMemberMobile,
    entry.result,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
