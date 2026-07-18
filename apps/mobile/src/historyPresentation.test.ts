import assert from "node:assert/strict";
import { test } from "node:test";
import type { ScanHistoryEntry } from "./api";
import { presentScanHistory } from "./historyPresentation";

test("scan history search matches product, QR, site, and team member mobile", () => {
  const entries = [
    history({ scanAttemptId: "1", productSku: "HAVELLS-WIRE", qrCodeId: "QR-101", siteLabel: "Joshi Residence" }),
    history({ scanAttemptId: "2", productSku: "ATOMBERG-FAN", teamMemberMobile: "9123456789", siteLabel: "Patel Villa" }),
  ];

  assert.deepEqual(presentScanHistory({ entries, filter: "ALL", query: "patel", sort: "LATEST" }).map((entry) => entry.scanAttemptId), ["2"]);
  assert.deepEqual(presentScanHistory({ entries, filter: "ALL", query: "QR-101", sort: "LATEST" }).map((entry) => entry.scanAttemptId), ["1"]);
  assert.deepEqual(presentScanHistory({ entries, filter: "ALL", query: "9123", sort: "LATEST" }).map((entry) => entry.scanAttemptId), ["2"]);
});

test("scan history filters success, failed, contractor, and team member rows", () => {
  const entries = [
    history({ scanAttemptId: "1", actorRole: "CONTRACTOR", result: "SUCCESS" }),
    history({ scanAttemptId: "2", actorRole: "TEAM_MEMBER", result: "ALREADY_CLAIMED" }),
  ];

  assert.deepEqual(presentScanHistory({ entries, filter: "SUCCESS", query: "", sort: "LATEST" }).map((entry) => entry.scanAttemptId), ["1"]);
  assert.deepEqual(presentScanHistory({ entries, filter: "FAILED", query: "", sort: "LATEST" }).map((entry) => entry.scanAttemptId), ["2"]);
  assert.deepEqual(presentScanHistory({ entries, filter: "CONTRACTOR", query: "", sort: "LATEST" }).map((entry) => entry.scanAttemptId), ["1"]);
  assert.deepEqual(presentScanHistory({ entries, filter: "TEAM_MEMBER", query: "", sort: "LATEST" }).map((entry) => entry.scanAttemptId), ["2"]);
});

test("scan history sort supports latest, product, and points", () => {
  const entries = [
    history({ scanAttemptId: "1", createdAt: "2026-07-07T10:00:00.000Z", creditedPoints: 20, productSku: "WIPRO-BULB" }),
    history({ scanAttemptId: "2", createdAt: "2026-07-08T10:00:00.000Z", creditedPoints: 50, productSku: "ATOMBERG-FAN" }),
    history({ scanAttemptId: "3", createdAt: "2026-07-06T10:00:00.000Z", qrValuePoints: 30, productSku: "HAVELLS-WIRE", result: "RESERVED" }),
  ];

  assert.deepEqual(presentScanHistory({ entries, filter: "ALL", query: "", sort: "LATEST" }).map((entry) => entry.scanAttemptId), ["2", "1", "3"]);
  assert.deepEqual(presentScanHistory({ entries, filter: "ALL", query: "", sort: "PRODUCT" }).map((entry) => entry.scanAttemptId), ["2", "3", "1"]);
  assert.deepEqual(presentScanHistory({ entries, filter: "ALL", query: "", sort: "POINTS" }).map((entry) => entry.scanAttemptId), ["2", "3", "1"]);
});

function history(overrides: Partial<ScanHistoryEntry>): ScanHistoryEntry {
  return {
    scanAttemptId: overrides.scanAttemptId ?? "scan",
    actorRole: overrides.actorRole ?? "CONTRACTOR",
    result: overrides.result ?? "SUCCESS",
    createdAt: overrides.createdAt ?? "2026-07-08T10:00:00.000Z",
    ...(overrides.qrUnitId ? { qrUnitId: overrides.qrUnitId } : {}),
    ...(overrides.qrCodeId ? { qrCodeId: overrides.qrCodeId } : {}),
    ...(overrides.productSku ? { productSku: overrides.productSku } : {}),
    ...(typeof overrides.qrValuePoints === "number" ? { qrValuePoints: overrides.qrValuePoints } : {}),
    ...(typeof overrides.creditedPoints === "number" ? { creditedPoints: overrides.creditedPoints } : {}),
    ...(overrides.teamMemberMobile ? { teamMemberMobile: overrides.teamMemberMobile } : {}),
    ...(overrides.contractorId ? { contractorId: overrides.contractorId } : {}),
    ...(overrides.siteId ? { siteId: overrides.siteId } : {}),
    ...(overrides.siteLabel ? { siteLabel: overrides.siteLabel } : {}),
    ...(overrides.failureReason ? { failureReason: overrides.failureReason } : {}),
  };
}
