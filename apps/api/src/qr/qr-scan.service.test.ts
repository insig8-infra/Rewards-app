import assert from "node:assert/strict";
import test from "node:test";
import { ACTOR_ROLE, DomainError, QR_STATUS, QR_TOKEN_STATUS } from "@volt-rewards/domain";
import { InMemoryQrScanRepository } from "./in-memory-qr-scan.repository.js";
import { hashQrToken } from "./qr-token.js";
import type { CommitScanCartInput, CommitScanCartResult } from "./qr-scan.repository.js";
import { QrScanService } from "./qr-scan.service.js";

test("QR scan service reserves QR without crediting contractor balance", async () => {
  const token = "qr-token-1";
  const tokenHash = hashQrToken(token);
  const repository = new InMemoryQrScanRepository({
    qrs: [
      {
        id: "qr_1",
        status: QR_STATUS.PRINTED_UNCLAIMED,
        expiresAt: new Date("2026-08-01T00:00:00.000Z"),
        activeTokenHash: tokenHash,
        points: 125,
      },
    ],
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 500,
        totalAccumulatedPoints: 900,
      },
    ],
    sites: [{ id: "site_1", contractorId: "contractor_1" }],
  });
  const service = new QrScanService(repository);

  const result = await service.scanQr({
    tokenValue: token,
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-22T00:00:00.000Z"),
  });

  assert.equal(result.qrId, "qr_1");
  assert.equal(result.qrValuePoints, 125);
  assert.equal(result.pointsCredited, 0);
  assert.equal(result.cart.cartTotalPoints, 125);
  assert.equal(result.cart.items.length, 1);
  assert.equal(repository.attempts[0]?.result, "RESERVED");
  assert.equal(repository.attempts[0]?.creditedPoints, 0);
});

test("QR scan cart commit credits reserved QR exactly once", async () => {
  const token = "qr-token-commit";
  const tokenHash = hashQrToken(token);
  const repository = new InMemoryQrScanRepository({
    qrs: [
      {
        id: "qr_commit",
        status: QR_STATUS.PRINTED_UNCLAIMED,
        expiresAt: new Date("2026-08-01T00:00:00.000Z"),
        activeTokenHash: tokenHash,
        points: 125,
      },
    ],
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 500,
        totalAccumulatedPoints: 900,
      },
    ],
    sites: [{ id: "site_1", contractorId: "contractor_1" }],
  });
  const service = new QrScanService(repository);

  await service.scanQr({
    tokenValue: token,
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-22T00:00:00.000Z"),
  });

  const committed = await service.commitScanCart({
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-22T00:01:00.000Z"),
  });

  assert.equal(committed.pointsCredited, 125);
  assert.equal(committed.balanceAfter, 625);
  assert.equal(committed.totalAccumulatedPoints, 1025);
  assert.equal(committed.committedItems.length, 1);
  assert.equal(repository.attempts[0]?.result, "SUCCESS");
  assert.equal(repository.attempts[0]?.creditedPoints, 125);
});

test("QR scan cart remains retryable when cart commit fails technically", async () => {
  const token = "qr-token-commit-failure";
  const tokenHash = hashQrToken(token);
  const repository = new CommitFailingQrScanRepository({
    qrs: [
      {
        id: "qr_commit_failure",
        status: QR_STATUS.PRINTED_UNCLAIMED,
        expiresAt: new Date("2026-08-01T00:00:00.000Z"),
        activeTokenHash: tokenHash,
        points: 90,
      },
    ],
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 500,
        totalAccumulatedPoints: 900,
      },
    ],
    sites: [{ id: "site_1", contractorId: "contractor_1" }],
  });
  const service = new QrScanService(repository);

  await service.scanQr({
    tokenValue: token,
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-22T00:00:00.000Z"),
  });

  await assert.rejects(
    service.commitScanCart({
      actorRole: ACTOR_ROLE.CONTRACTOR,
      contractorId: "contractor_1",
      siteId: "site_1",
      now: new Date("2026-06-22T00:01:00.000Z"),
    }),
    /SIMULATED_COMMIT_FAILURE/,
  );

  const cart = await repository.getScanCart("contractor_1", "site_1");
  assert.equal(cart.status, "ACTIVE");
  assert.equal(cart.cartTotalPoints, 90);
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0]?.status, "RESERVED");
  assert.equal(repository.attempts[0]?.result, "RESERVED");
});

test("QR scan service records replaced token attempts without crediting points", async () => {
  const token = "qr-token-2";
  const tokenHash = hashQrToken(token);
  const repository = new InMemoryQrScanRepository({
    qrs: [
      {
        id: "qr_2",
        status: QR_STATUS.PRINTED_UNCLAIMED,
        expiresAt: new Date("2026-08-01T00:00:00.000Z"),
        activeTokenHash: tokenHash,
        tokenStatus: QR_TOKEN_STATUS.INVALIDATED,
        points: 125,
      },
    ],
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 500,
        totalAccumulatedPoints: 900,
      },
    ],
    sites: [{ id: "site_1", contractorId: "contractor_1" }],
  });
  const service = new QrScanService(repository);

  await assert.rejects(
    service.scanQr({
      tokenValue: token,
      actorRole: ACTOR_ROLE.CONTRACTOR,
      contractorId: "contractor_1",
      siteId: "site_1",
      now: new Date("2026-06-22T00:00:00.000Z"),
    }),
    (error) => error instanceof DomainError && error.code === "QR_TOKEN_INVALID",
  );

  assert.equal(repository.attempts[0]?.result, "REPLACED");
  assert.equal(repository.attempts[0]?.contractorId, "contractor_1");
  assert.equal(repository.attempts[0]?.siteId, "site_1");
});

test("QR scan service enforces contractor site ownership", async () => {
  const token = "qr-token-3";
  const tokenHash = hashQrToken(token);
  const repository = new InMemoryQrScanRepository({
    qrs: [
      {
        id: "qr_3",
        status: QR_STATUS.PRINTED_UNCLAIMED,
        expiresAt: new Date("2026-08-01T00:00:00.000Z"),
        activeTokenHash: tokenHash,
        points: 125,
      },
    ],
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 500,
        totalAccumulatedPoints: 900,
      },
    ],
    sites: [{ id: "site_2", contractorId: "contractor_2" }],
  });
  const service = new QrScanService(repository);

  await assert.rejects(
    service.scanQr({
      tokenValue: token,
      actorRole: ACTOR_ROLE.CONTRACTOR,
      contractorId: "contractor_1",
      siteId: "site_2",
      now: new Date("2026-06-22T00:00:00.000Z"),
    }),
    (error) => error instanceof DomainError && error.code === "QR_SITE_FORBIDDEN",
  );

  assert.equal(repository.attempts[0]?.result, "PERMISSION_DENIED");
});

test("QR scan service records Team Member scan attribution in history", async () => {
  const token = "qr-token-team-member";
  const tokenHash = hashQrToken(token);
  const repository = new InMemoryQrScanRepository({
    qrs: [
      {
        id: "qr_team",
        status: QR_STATUS.PRINTED_UNCLAIMED,
        expiresAt: new Date("2026-08-01T00:00:00.000Z"),
        activeTokenHash: tokenHash,
        points: 75,
      },
    ],
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 20,
        totalAccumulatedPoints: 40,
      },
    ],
    sites: [{ id: "site_1", contractorId: "contractor_1" }],
  });
  const service = new QrScanService(repository);

  await service.scanQr({
    tokenValue: token,
    actorRole: ACTOR_ROLE.TEAM_MEMBER,
    contractorId: "contractor_1",
    siteId: "site_1",
    teamMemberMobile: "9876543210",
    teamMemberSessionId: "tm-session-1",
    now: new Date("2026-06-22T00:00:00.000Z"),
  });
  await service.commitScanCart({
    actorRole: ACTOR_ROLE.TEAM_MEMBER,
    contractorId: "contractor_1",
    siteId: "site_1",
    teamMemberMobile: "9876543210",
    teamMemberSessionId: "tm-session-1",
    now: new Date("2026-06-22T00:01:00.000Z"),
  });

  const history = await service.listScanHistory({
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
  });

  assert.equal(history[0]?.result, "SUCCESS");
  assert.equal(history[0]?.actorRole, ACTOR_ROLE.TEAM_MEMBER);
  assert.equal(history[0]?.teamMemberMobile, "9876543210");
  assert.equal(history[0]?.teamMemberSessionId, "tm-session-1");
  assert.equal(history[0]?.qrCodeId, "qr_team");
});

test("QR scan service reserves and commits high-value QR above old cap", async () => {
  const firstToken = "qr-token-high-1";
  const secondToken = "qr-token-high-2";
  const repository = new InMemoryQrScanRepository({
    qrs: [
      {
        id: "qr_high_1",
        status: QR_STATUS.PRINTED_UNCLAIMED,
        expiresAt: new Date("2026-08-01T00:00:00.000Z"),
        activeTokenHash: hashQrToken(firstToken),
        points: 700,
      },
      {
        id: "qr_high_2",
        status: QR_STATUS.PRINTED_UNCLAIMED,
        expiresAt: new Date("2026-08-01T00:00:00.000Z"),
        activeTokenHash: hashQrToken(secondToken),
        points: 4000,
      },
    ],
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 500,
        totalAccumulatedPoints: 900,
      },
    ],
    sites: [{ id: "site_1", contractorId: "contractor_1" }],
  });
  const service = new QrScanService(repository);

  const firstReservation = await service.scanQr({
    tokenValue: firstToken,
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-22T00:00:00.000Z"),
  });

  const secondReservation = await service.scanQr({
    tokenValue: secondToken,
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-22T00:01:00.000Z"),
  });

  assert.equal(firstReservation.cart.cartTotalPoints, 700);
  assert.equal(secondReservation.cart.cartTotalPoints, 4700);
  assert.equal(repository.attempts[0]?.result, "RESERVED");
  assert.equal(repository.attempts[1]?.result, "RESERVED");

  const commit = await service.commitScanCart({
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-22T00:02:00.000Z"),
  });

  assert.equal(commit.pointsCredited, 4700);
  assert.equal(commit.balanceAfter, 5200);
  assert.equal(commit.totalAccumulatedPoints, 5600);
});

test("QR scan history gives Contractor full history and Team Member only their attempts", async () => {
  const repository = new InMemoryQrScanRepository({
    qrs: [],
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 20,
        totalAccumulatedPoints: 40,
      },
    ],
    sites: [
      { id: "site_1", contractorId: "contractor_1" },
      { id: "site_2", contractorId: "contractor_1" },
      { id: "site_3", contractorId: "contractor_1" },
    ],
  });
  const service = new QrScanService(repository);

  await repository.recordScanAttempt({
    tokenHash: "hash_1",
    actorRole: ACTOR_ROLE.TEAM_MEMBER,
    contractorId: "contractor_1",
    siteId: "site_1",
    teamMemberMobile: "9876543210",
    teamMemberSessionId: "tm-session-1",
    result: "SUCCESS",
    at: new Date("2026-06-22T10:00:00.000Z"),
  });
  await repository.recordScanAttempt({
    tokenHash: "hash_2",
    actorRole: ACTOR_ROLE.TEAM_MEMBER,
    contractorId: "contractor_1",
    siteId: "site_2",
    teamMemberMobile: "9123456780",
    teamMemberSessionId: "tm-session-2",
    result: "INVALID",
    failureReason: "QR_TOKEN_INVALID",
    at: new Date("2026-06-22T10:05:00.000Z"),
  });
  await repository.recordScanAttempt({
    tokenHash: "hash_3",
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_3",
    result: "EXPIRED",
    failureReason: "QR_EXPIRED",
    at: new Date("2026-06-22T10:10:00.000Z"),
  });

  const contractorHistory = await service.listScanHistory({
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
  });
  const teamMemberHistory = await service.listScanHistory({
    actorRole: ACTOR_ROLE.TEAM_MEMBER,
    contractorId: "contractor_1",
    teamMemberMobile: "9876543210",
  });

  assert.equal(contractorHistory.length, 3);
  assert.equal(teamMemberHistory.length, 1);
  assert.equal(teamMemberHistory[0]?.teamMemberMobile, "9876543210");
  assert.equal(teamMemberHistory[0]?.siteId, "site_1");
});

class CommitFailingQrScanRepository extends InMemoryQrScanRepository {
  override async commitScanCart(_input: CommitScanCartInput): Promise<CommitScanCartResult> {
    throw new Error("SIMULATED_COMMIT_FAILURE");
  }
}
