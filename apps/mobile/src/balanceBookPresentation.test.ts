import assert from "node:assert/strict";
import { test } from "node:test";
import type { BalanceBookEntry } from "./api";
import { presentBalanceBook } from "./balanceBookPresentation";

test("Balance Book search matches reward, claim, QR, and source labels", () => {
  const entries = [
    entry({ ledgerEntryId: "1", type: "SCAN_CREDIT", qrUnitId: "QRU-1001", sourceId: "scan-1" }),
    entry({ ledgerEntryId: "2", type: "REWARD_REDEEM", rewardName: "Premium Toolbox", claimId: "CLM-1" }),
  ];

  assert.deepEqual(presentBalanceBook({ entries, filter: "ALL", query: "toolbox", sort: "LATEST" }).map((item) => item.ledgerEntryId), ["2"]);
  assert.deepEqual(presentBalanceBook({ entries, filter: "ALL", query: "CLM-1", sort: "LATEST" }).map((item) => item.ledgerEntryId), ["2"]);
  assert.deepEqual(presentBalanceBook({ entries, filter: "ALL", query: "QRU-1001", sort: "LATEST" }).map((item) => item.ledgerEntryId), ["1"]);
});

test("Balance Book filters credits, reward claims, cancellations, reversals, and revocations", () => {
  const entries = [
    entry({ ledgerEntryId: "credit", type: "SCAN_CREDIT", pointsDelta: 30, createdAt: "2026-07-07T10:00:00.000Z" }),
    entry({ ledgerEntryId: "claim", type: "REWARD_REDEEM", pointsDelta: -500 }),
    entry({ ledgerEntryId: "cancel", type: "REWARD_CANCEL_RESTORE", pointsDelta: 500, createdAt: "2026-07-08T10:00:00.000Z" }),
    entry({ ledgerEntryId: "reverse", type: "QR_REVERSAL", pointsDelta: -30 }),
    entry({ ledgerEntryId: "revoke", type: "REWARD_REVOCATION", pointsDelta: 0 }),
  ];

  assert.deepEqual(presentBalanceBook({ entries, filter: "CREDITS", query: "", sort: "LATEST" }).map((item) => item.ledgerEntryId), ["cancel", "credit"]);
  assert.deepEqual(presentBalanceBook({ entries, filter: "REWARD_CLAIMS", query: "", sort: "LATEST" }).map((item) => item.ledgerEntryId), ["claim"]);
  assert.deepEqual(presentBalanceBook({ entries, filter: "REWARD_CANCELLATIONS", query: "", sort: "LATEST" }).map((item) => item.ledgerEntryId), ["cancel"]);
  assert.deepEqual(presentBalanceBook({ entries, filter: "QR_REVERSALS", query: "", sort: "LATEST" }).map((item) => item.ledgerEntryId), ["reverse"]);
  assert.deepEqual(presentBalanceBook({ entries, filter: "REWARD_REVOCATIONS", query: "", sort: "LATEST" }).map((item) => item.ledgerEntryId), ["revoke"]);
});

test("Balance Book sort supports latest, oldest, and point direction", () => {
  const entries = [
    entry({ ledgerEntryId: "1", createdAt: "2026-07-07T10:00:00.000Z", pointsDelta: 20 }),
    entry({ ledgerEntryId: "2", createdAt: "2026-07-08T10:00:00.000Z", pointsDelta: -500 }),
    entry({ ledgerEntryId: "3", createdAt: "2026-07-06T10:00:00.000Z", pointsDelta: 50 }),
  ];

  assert.deepEqual(presentBalanceBook({ entries, filter: "ALL", query: "", sort: "LATEST" }).map((item) => item.ledgerEntryId), ["2", "1", "3"]);
  assert.deepEqual(presentBalanceBook({ entries, filter: "ALL", query: "", sort: "OLDEST" }).map((item) => item.ledgerEntryId), ["3", "1", "2"]);
  assert.deepEqual(presentBalanceBook({ entries, filter: "ALL", query: "", sort: "POINTS_HIGH" }).map((item) => item.ledgerEntryId), ["3", "1", "2"]);
  assert.deepEqual(presentBalanceBook({ entries, filter: "ALL", query: "", sort: "POINTS_LOW" }).map((item) => item.ledgerEntryId), ["2", "1", "3"]);
});

function entry(overrides: Partial<BalanceBookEntry>): BalanceBookEntry {
  return {
    ledgerEntryId: overrides.ledgerEntryId ?? "entry",
    type: overrides.type ?? "SCAN_CREDIT",
    pointsDelta: overrides.pointsDelta ?? 10,
    balanceAfter: overrides.balanceAfter ?? 100,
    sourceType: overrides.sourceType ?? "QR_SCAN",
    sourceId: overrides.sourceId ?? "source",
    createdAt: overrides.createdAt ?? "2026-07-08T10:00:00.000Z",
    negativeBalance: overrides.negativeBalance ?? false,
    ...(overrides.rewardClaimId ? { rewardClaimId: overrides.rewardClaimId } : {}),
    ...(overrides.claimId ? { claimId: overrides.claimId } : {}),
    ...(overrides.rewardName ? { rewardName: overrides.rewardName } : {}),
    ...(overrides.qrUnitId ? { qrUnitId: overrides.qrUnitId } : {}),
  };
}
