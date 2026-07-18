import type { BalanceBookEntry } from "./api";

export type BalanceBookFilter =
  | "ALL"
  | "CREDITS"
  | "QR_REVERSALS"
  | "REWARD_CANCELLATIONS"
  | "REWARD_CLAIMS"
  | "REWARD_REVOCATIONS";

export type BalanceBookSort = "LATEST" | "OLDEST" | "POINTS_HIGH" | "POINTS_LOW";

export interface BalanceBookPresentationInput {
  readonly entries: readonly BalanceBookEntry[];
  readonly filter: BalanceBookFilter;
  readonly query: string;
  readonly sort: BalanceBookSort;
}

export function presentBalanceBook(input: BalanceBookPresentationInput): readonly BalanceBookEntry[] {
  const query = input.query.trim().toLowerCase();
  return input.entries
    .filter((entry) => matchesBalanceFilter(entry, input.filter))
    .filter((entry) => !query || balanceSearchText(entry).includes(query))
    .toSorted((left, right) => compareBalanceRows(left, right, input.sort));
}

function matchesBalanceFilter(entry: BalanceBookEntry, filter: BalanceBookFilter): boolean {
  if (filter === "CREDITS") {
    return entry.type === "SCAN_CREDIT" || entry.pointsDelta > 0;
  }
  if (filter === "REWARD_CLAIMS") {
    return entry.type === "REWARD_REDEEM";
  }
  if (filter === "REWARD_CANCELLATIONS") {
    return entry.type === "REWARD_CANCEL_RESTORE";
  }
  if (filter === "QR_REVERSALS") {
    return entry.type.includes("REVERS");
  }
  if (filter === "REWARD_REVOCATIONS") {
    return entry.type.includes("REVOK") || entry.type.includes("REVOC");
  }
  return true;
}

function compareBalanceRows(left: BalanceBookEntry, right: BalanceBookEntry, sort: BalanceBookSort): number {
  if (sort === "OLDEST") {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  }
  if (sort === "POINTS_HIGH") {
    return right.pointsDelta - left.pointsDelta || latestFirst(left, right);
  }
  if (sort === "POINTS_LOW") {
    return left.pointsDelta - right.pointsDelta || latestFirst(left, right);
  }
  return latestFirst(left, right);
}

function latestFirst(left: BalanceBookEntry, right: BalanceBookEntry): number {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function balanceSearchText(entry: BalanceBookEntry): string {
  return [
    entry.type,
    entry.sourceType,
    entry.sourceId,
    entry.rewardClaimId,
    entry.claimId,
    entry.rewardName,
    entry.qrUnitId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
