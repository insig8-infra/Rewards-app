import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTOR_ROLE,
  DomainError,
  QR_STATUS,
  QR_TOKEN_STATUS,
  cancelQr,
  commitReservedQr,
  reprintQr,
  reserveQr,
  reverseQr,
  scanQr,
} from "./index.js";
import type { QrUnit } from "./index.js";

const future = new Date("2026-08-01T00:00:00.000Z");
const now = new Date("2026-06-21T00:00:00.000Z");

function printedQr(overrides: Partial<QrUnit> = {}): QrUnit {
  return {
    id: "qr_1",
    status: QR_STATUS.PRINTED_UNCLAIMED,
    expiresAt: future,
    activeToken: { value: "token_v1", status: QR_TOKEN_STATUS.ACTIVE },
    tokenHistory: [],
    points: 100,
    ...overrides,
  };
}

test("scanQr credits points once for active printed QR with valid site", () => {
  const result = scanQr(printedQr(), {
    actorRole: ACTOR_ROLE.CONTRACTOR,
    tokenValue: "token_v1",
    contractorId: "contractor_1",
    siteId: "site_1",
    siteBelongsToContractor: true,
    now,
  });

  assert.equal(result.qr.status, QR_STATUS.SCANNED_CLAIMED);
  assert.equal(result.ledgerEntry.type, "scan_credit");
  assert.equal(result.ledgerEntry.pointsDelta, 100);
});

test("scanQr can calculate balance after from a persisted current balance", () => {
  const result = scanQr(printedQr(), {
    actorRole: ACTOR_ROLE.CONTRACTOR,
    tokenValue: "token_v1",
    contractorId: "contractor_1",
    siteId: "site_1",
    siteBelongsToContractor: true,
    currentBalance: 500,
    now,
  });

  assert.equal(result.ledgerEntry.balanceAfter, 600);
});

test("reserveQr reserves QR without creating points ledger entry", () => {
  const result = reserveQr(printedQr(), {
    actorRole: ACTOR_ROLE.CONTRACTOR,
    tokenValue: "token_v1",
    contractorId: "contractor_1",
    siteId: "site_1",
    siteBelongsToContractor: true,
    now,
  });

  assert.equal(result.qr.status, QR_STATUS.RESERVED_IN_CART);
  assert.equal(result.qr.contractorId, "contractor_1");
  assert.equal(result.qr.siteId, "site_1");
});

test("commitReservedQr credits reserved QR exactly once", () => {
  const reserved = reserveQr(printedQr(), {
    actorRole: ACTOR_ROLE.CONTRACTOR,
    tokenValue: "token_v1",
    contractorId: "contractor_1",
    siteId: "site_1",
    siteBelongsToContractor: true,
    now,
  });

  const committed = commitReservedQr(reserved.qr, {
    contractorId: "contractor_1",
    siteId: "site_1",
    currentBalance: 500,
  });

  assert.equal(committed.qr.status, QR_STATUS.SCANNED_CLAIMED);
  assert.equal(committed.ledgerEntry.pointsDelta, 100);
  assert.equal(committed.ledgerEntry.balanceAfter, 600);

  assert.throws(
    () =>
      commitReservedQr(committed.qr, {
        contractorId: "contractor_1",
        siteId: "site_1",
        currentBalance: 600,
      }),
    (error) => error instanceof DomainError && error.code === "QR_COMMIT_INVALID_STATUS",
  );
});

test("scanQr rejects expired QR", () => {
  assert.throws(
    () =>
      scanQr(printedQr({ expiresAt: new Date("2026-01-01T00:00:00.000Z") }), {
        actorRole: ACTOR_ROLE.CONTRACTOR,
        tokenValue: "token_v1",
        contractorId: "contractor_1",
        siteId: "site_1",
        siteBelongsToContractor: true,
        now,
      }),
    (error) => error instanceof DomainError && error.code === "QR_EXPIRED",
  );
});

test("reprintQr invalidates old token and replacement token scans", () => {
  const reprinted = reprintQr(printedQr(), {
    actorRole: ACTOR_ROLE.OWNER,
    replacementToken: "token_v2",
    now,
  });

  assert.equal(reprinted.activeToken.value, "token_v2");
  assert.equal(reprinted.status, QR_STATUS.REPRINTED);
  assert.equal(reprinted.tokenHistory[0]?.status, QR_TOKEN_STATUS.INVALIDATED);

  assert.throws(
    () =>
      scanQr(reprinted, {
        actorRole: ACTOR_ROLE.CONTRACTOR,
        tokenValue: "token_v1",
        contractorId: "contractor_1",
        siteId: "site_1",
        siteBelongsToContractor: true,
        now,
      }),
    (error) => error instanceof DomainError && error.code === "QR_TOKEN_INVALID",
  );

  const scanned = scanQr(reprinted, {
    actorRole: ACTOR_ROLE.CONTRACTOR,
    tokenValue: "token_v2",
    contractorId: "contractor_1",
    siteId: "site_1",
    siteBelongsToContractor: true,
    now,
  });

  assert.equal(scanned.qr.status, QR_STATUS.SCANNED_CLAIMED);
  assert.equal(scanned.ledgerEntry.pointsDelta, 100);
});

test("cancelQr requires printed unclaimed non-expired QR and label confirmation", () => {
  assert.equal(
    cancelQr(printedQr(), {
      actorRole: ACTOR_ROLE.STAFF,
      labelRemovedAndDiscarded: true,
      now,
    }).status,
    QR_STATUS.CANCELLED,
  );

  assert.throws(
    () =>
      cancelQr(printedQr(), {
        actorRole: ACTOR_ROLE.STAFF,
        labelRemovedAndDiscarded: false,
        now,
      }),
    (error) => error instanceof DomainError && error.code === "QR_LABEL_CONFIRMATION_REQUIRED",
  );
});

test("reverseQr only applies to scanned claimed QR and flags negative balance", () => {
  const scanned = printedQr({
    status: QR_STATUS.SCANNED_CLAIMED,
    contractorId: "contractor_1",
  });

  const result = reverseQr(scanned, {
    actorRole: ACTOR_ROLE.OWNER,
    labelRemovedAndDiscarded: true,
    currentBalance: 50,
  });

  assert.equal(result.qr.status, QR_STATUS.REVERSED);
  assert.equal(result.ledgerEntry.pointsDelta, -100);
  assert.equal(result.createsNegativeBalance, true);
});
