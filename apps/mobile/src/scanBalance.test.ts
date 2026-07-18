import assert from "node:assert/strict";
import test from "node:test";
import { applyScanBalance } from "./scanBalance";
import type { CommitScanCartResult } from "./api";
import type { StoredSession } from "./storage";

test("scan balance applies committed cart balance from the server", () => {
  const session: StoredSession = {
    role: "CONTRACTOR",
    token: "token_1",
    expiresAt: "2026-07-03T00:00:00.000Z",
    contractorId: "contractor_1",
    contractor: {
      name: "Demo Contractor",
      mobileNumber: "9000001001",
      totalAccumulatedPoints: 200,
      availablePoints: 80,
    },
  };
  const result: CommitScanCartResult = {
    contractorId: "contractor_1",
    siteId: "site_1",
    pointsCredited: 120,
    balanceAfter: 200,
    totalAccumulatedPoints: 320,
    committedAt: "2026-07-02T00:00:00.000Z",
    committedItems: [],
    cart: {
      cartId: "cart_1",
      contractorId: "contractor_1",
      siteId: "site_1",
      status: "COMMITTED",
      cartTotalPoints: 0,
      scanCapPoints: 0,
      lastActivityAt: "2026-07-02T00:00:00.000Z",
      items: [],
    },
  };

  const next = applyScanBalance(session, result);

  assert.equal(next.contractor.availablePoints, 200);
  assert.equal(next.contractor.totalAccumulatedPoints, 320);
  assert.equal(session.contractor.availablePoints, 80);
});
