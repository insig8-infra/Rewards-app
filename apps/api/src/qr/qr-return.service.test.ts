import assert from "node:assert/strict";
import test from "node:test";
import { ACTOR_ROLE, DomainError } from "@volt-rewards/domain";
import type { PrismaService } from "../prisma/prisma.service.js";
import { hashQrToken } from "./qr-token.js";
import { QrReturnService, planChosenClaimRevocations } from "./qr-return.service.js";

const now = new Date("2026-07-06T10:00:00.000Z");

test("planChosenClaimRevocations uses newest chosen claims until balance is non-negative", () => {
  const result = planChosenClaimRevocations(-75, [
    claim("claim_new", "CLM-NEW", 50, "2026-07-06T09:00:00.000Z"),
    claim("claim_old", "CLM-OLD", 40, "2026-07-05T09:00:00.000Z"),
    claim("claim_older", "CLM-OLDER", 100, "2026-07-04T09:00:00.000Z"),
  ]);

  assert.deepEqual(
    result.claimsToRevoke.map((candidate) => candidate.claimId),
    ["CLM-NEW", "CLM-OLD"],
  );
  assert.equal(result.projectedBalanceAfterClaimRevocations, 15);
});

test("QrReturnService cancels only after label confirmation and invalidates active token", async () => {
  const fake = createFakePrisma({
    qrUnits: [
      printedQr({
        id: "qr_cancel",
        tokenHash: hashQrToken("cancel-token"),
      }),
    ],
  });
  const service = new QrReturnService(fake.prisma);

  await assert.rejects(
    service.cancelQr(ownerActor, "qr_cancel", { labelRemovedAndDiscarded: false, now }),
    (error) => error instanceof DomainError && error.code === "QR_LABEL_CONFIRMATION_REQUIRED",
  );
  assert.equal(fake.state.qrUnits.get("qr_cancel")?.status, "PRINTED_UNCLAIMED");

  const result = await service.cancelQr(ownerActor, "qr_cancel", { labelRemovedAndDiscarded: true, now });

  assert.equal(result.operation.type, "CANCELLED");
  assert.equal(result.action, "NONE");
  assert.equal(result.reasonCode, "TOKEN_INACTIVE");
  assert.equal(fake.state.qrUnits.get("qr_cancel")?.status, "CANCELLED");
  assert.equal(fake.state.tokens.get(hashQrToken("cancel-token"))?.status, "INVALIDATED");
  assert.equal(fake.state.audits.at(-1)?.action, "QR_CANCEL");
});

test("QrReturnService cancels active reprinted QR labels", async () => {
  const fake = createFakePrisma({
    qrUnits: [
      printedQr({
        id: "qr_reprinted_cancel",
        tokenHash: hashQrToken("reprinted-cancel-token"),
        status: "REPRINTED",
      }),
    ],
  });
  const service = new QrReturnService(fake.prisma);

  const lookup = await service.lookupByToken(ownerActor, "reprinted-cancel-token", now);

  assert.equal(lookup.action, "CAN_CANCEL");

  const result = await service.cancelQr(ownerActor, "qr_reprinted_cancel", {
    labelRemovedAndDiscarded: true,
    now,
  });

  assert.equal(result.operation.type, "CANCELLED");
  assert.equal(fake.state.qrUnits.get("qr_reprinted_cancel")?.status, "CANCELLED");
  assert.equal(fake.state.tokens.get(hashQrToken("reprinted-cancel-token"))?.status, "INVALIDATED");
});

test("QrReturnService reverses scanned QR and revokes newest unfulfilled claim when balance goes negative", async () => {
  const tokenHash = hashQrToken("reverse-token");
  const fake = createFakePrisma({
    contractors: [
      {
        id: "contractor_1",
        code: "CTR-0001",
        availablePoints: 80,
        totalAccumulatedPoints: 500,
        user: { displayName: "Ramesh Kumar", mobileNumber: "9000001001" },
      },
    ],
    qrUnits: [
      scannedQr({
        id: "qr_reverse",
        tokenHash,
        claimedByContractorId: "contractor_1",
        points: 100,
      }),
    ],
    rewardClaims: [
      rewardClaim({
        id: "claim_old",
        claimId: "CLM-OLD",
        contractorId: "contractor_1",
        pointsDeducted: 50,
        chosenAt: new Date("2026-07-05T09:00:00.000Z"),
        rewardName: "Toolbox",
      }),
      rewardClaim({
        id: "claim_new",
        claimId: "CLM-NEW",
        contractorId: "contractor_1",
        pointsDeducted: 30,
        chosenAt: new Date("2026-07-06T09:00:00.000Z"),
        rewardName: "Air Fryer",
      }),
      rewardClaim({
        id: "claim_done",
        claimId: "CLM-DONE",
        contractorId: "contractor_1",
        pointsDeducted: 20,
        chosenAt: new Date("2026-07-06T08:00:00.000Z"),
        rewardName: "LED Lamp",
        status: "FULFILLED",
      }),
    ],
  });
  const service = new QrReturnService(fake.prisma);

  const lookup = await service.lookupByToken(ownerActor, "reverse-token", now);

  assert.equal(lookup.action, "CAN_REVERSE");
  assert.equal(lookup.reverseImpact?.projectedBalanceAfterQrReverse, -20);
  assert.deepEqual(lookup.reverseImpact?.claimsToRevoke.map((candidate) => candidate.claimId), ["CLM-NEW"]);

  const result = await service.reverseQr(ownerActor, "qr_reverse", {
    labelRemovedAndDiscarded: true,
    now,
  });

  assert.equal(result.operation.type, "REVERSED");
  assert.equal(result.operation.balanceAfter, 10);
  assert.deepEqual(result.operation.revokedClaims.map((candidate) => candidate.claimId), ["CLM-NEW"]);
  assert.equal(fake.state.qrUnits.get("qr_reverse")?.status, "REVERSED");
  assert.equal(fake.state.tokens.get(tokenHash)?.status, "INVALIDATED");
  assert.equal(fake.state.contractors.get("contractor_1")?.availablePoints, 10);
  assert.equal(fake.state.rewardClaims.get("claim_new")?.status, "REVOKED_DUE_TO_RETURN");
  assert.equal(fake.state.rewardClaims.get("claim_old")?.status, "CHOSEN");
  assert.equal(fake.state.rewardClaims.get("claim_done")?.status, "FULFILLED");
  assert.deepEqual(
    fake.state.ledgerEntries.map((entry) => [entry.type, entry.pointsDelta, entry.balanceAfter]),
    [
      ["QR_REVERSE", -100, -20],
      ["REWARD_REVOKED_DUE_TO_RETURN", 30, 10],
    ],
  );
  assert.equal(fake.state.audits.at(-1)?.action, "QR_REVERSE");
});

const ownerActor = { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" };

interface FakeContractor {
  id: string;
  code: string;
  availablePoints: number;
  totalAccumulatedPoints: number;
  tier?: string;
  user: {
    displayName: string;
    mobileNumber: string;
  };
}

interface FakeQrUnit {
  id: string;
  status: string;
  productSku: string | null;
  points: number;
  expiresAt: Date | null;
  printedAt: Date | null;
  scannedAt: Date | null;
  claimedByContractorId: string | null;
  siteId: string | null;
  tokenHash: string;
}

interface FakeRewardClaim {
  id: string;
  claimId: string;
  contractorId: string;
  rewardItemId: string;
  status: string;
  pointsDeducted: number;
  chosenAt: Date;
  rewardItem: {
    name: string;
  };
}

function createFakePrisma(seed: {
  contractors?: readonly FakeContractor[];
  qrUnits?: readonly FakeQrUnit[];
  rewardClaims?: readonly FakeRewardClaim[];
}) {
  const state = {
    contractors: new Map((seed.contractors ?? []).map((contractor) => [contractor.id, { ...contractor }])),
    qrUnits: new Map((seed.qrUnits ?? []).map((qr) => [qr.id, { ...qr }])),
    tokens: new Map(
      (seed.qrUnits ?? []).map((qr) => [
        qr.tokenHash,
        {
          id: `token_${qr.id}`,
          qrUnitId: qr.id,
          tokenHash: qr.tokenHash,
          status: "ACTIVE",
          issuedAt: new Date("2026-07-01T09:00:00.000Z"),
          invalidatedAt: null as Date | null,
        },
      ]),
    ),
    rewardClaims: new Map((seed.rewardClaims ?? []).map((reward) => [reward.id, { ...reward }])),
    ledgerEntries: [] as {
      id: string;
      type: string;
      pointsDelta: number;
      balanceAfter: number;
    }[],
    audits: [] as {
      id: string;
      action: string;
    }[],
  };

  const prisma: Record<string, unknown> = {};
  Object.assign(prisma, {
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => callback(prisma),
    qrToken: {
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        const token = state.tokens.get(where.tokenHash);
        return token ? { ...token, qrUnit: hydrateQr(state, token.qrUnitId) } : null;
      },
      findFirst: async ({ where }: { where: { qrUnitId: string } }) => {
        const token = [...state.tokens.values()].find((candidate) => candidate.qrUnitId === where.qrUnitId);
        return token ? { ...token, qrUnit: hydrateQr(state, token.qrUnitId) } : null;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { qrUnitId: string; status?: string };
        data: { status?: string; invalidatedAt?: Date };
      }) => {
        let count = 0;
        for (const token of state.tokens.values()) {
          if (token.qrUnitId === where.qrUnitId && (!where.status || token.status === where.status)) {
            token.status = data.status ?? token.status;
            token.invalidatedAt = data.invalidatedAt ?? token.invalidatedAt;
            count += 1;
          }
        }
        return { count };
      },
    },
    qrUnit: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const qr = state.qrUnits.get(where.id);
        if (!qr) {
          return null;
        }
        return {
          ...hydrateQr(state, qr.id),
          tokens: [...state.tokens.values()].filter((token) => token.qrUnitId === qr.id),
        };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status?: string | { in: readonly string[] } };
        data: { status: string };
      }) => {
        const qr = state.qrUnits.get(where.id);
        const activeToken = [...state.tokens.values()].some(
          (token) => token.qrUnitId === where.id && token.status === "ACTIVE",
        );
        if (!qr || !matchesWhereStatus(qr.status, where.status) || !activeToken) {
          return { count: 0 };
        }
        qr.status = data.status;
        return { count: 1 };
      },
    },
    contractor: {
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { availablePoints?: { decrement?: number; increment?: number }; tier?: string };
      }) => {
        const contractor = state.contractors.get(where.id);
        if (!contractor) {
          throw new Error("missing contractor");
        }
        contractor.availablePoints -= data.availablePoints?.decrement ?? 0;
        contractor.availablePoints += data.availablePoints?.increment ?? 0;
        if (data.tier) {
          contractor.tier = data.tier;
        }
        return { id: contractor.id, availablePoints: contractor.availablePoints };
      },
    },
    pointsLedgerEntry: {
      create: async ({ data }: { data: { type: string; pointsDelta: number; balanceAfter: number } }) => {
        const entry = { id: `ledger_${state.ledgerEntries.length + 1}`, ...data };
        state.ledgerEntries.push(entry);
        return entry;
      },
    },
    auditEvent: {
      create: async ({ data }: { data: { action: string } }) => {
        const event = { id: `audit_${state.audits.length + 1}`, ...data };
        state.audits.push(event);
        return event;
      },
    },
    rewardClaim: {
      findMany: async ({ where }: { where: { contractorId: string; status: string } }) =>
        [...state.rewardClaims.values()]
          .filter((claimRecord) => claimRecord.contractorId === where.contractorId && claimRecord.status === where.status)
          .sort((left, right) => right.chosenAt.getTime() - left.chosenAt.getTime()),
      update: async ({ where, data }: { where: { id: string }; data: { status: string } }) => {
        const claimRecord = state.rewardClaims.get(where.id);
        if (!claimRecord) {
          throw new Error("missing claim");
        }
        claimRecord.status = data.status;
        return claimRecord;
      },
    },
  });

  return { prisma: prisma as unknown as PrismaService, state };
}

function hydrateQr(state: ReturnType<typeof createFakePrisma>["state"], qrUnitId: string) {
  const qr = state.qrUnits.get(qrUnitId);
  if (!qr) {
    throw new Error(`Missing QR ${qrUnitId}`);
  }
  const contractor = qr.claimedByContractorId ? state.contractors.get(qr.claimedByContractorId) ?? null : null;
  return {
    ...qr,
    invoice: {
      id: "invoice_1",
      invoiceNumber: "VR/26-27/1001",
      invoiceDate: new Date("2026-07-01T00:00:00.000Z"),
    },
    invoiceLine: {
      id: "line_1",
      sku: qr.productSku ?? "SKU-1",
      productName: "Havells Wire",
      category: "Wires",
    },
    claimedByContractor: contractor,
  };
}

function printedQr(input: { id: string; tokenHash: string; status?: string }): FakeQrUnit {
  return {
    id: input.id,
    status: input.status ?? "PRINTED_UNCLAIMED",
    productSku: "WIRE-90M",
    points: 30,
    expiresAt: new Date("2026-08-01T00:00:00.000Z"),
    printedAt: new Date("2026-07-01T09:00:00.000Z"),
    scannedAt: null,
    claimedByContractorId: null,
    siteId: null,
    tokenHash: input.tokenHash,
  };
}

function matchesWhereStatus(actual: string, expected?: string | { in: readonly string[] }): boolean {
  if (!expected) {
    return true;
  }
  if (typeof expected === "string") {
    return actual === expected;
  }
  return expected.in.includes(actual);
}

function scannedQr(input: {
  id: string;
  tokenHash: string;
  claimedByContractorId: string;
  points: number;
}): FakeQrUnit {
  return {
    ...printedQr({ id: input.id, tokenHash: input.tokenHash }),
    status: "SCANNED_CLAIMED",
    points: input.points,
    scannedAt: new Date("2026-07-02T09:00:00.000Z"),
    claimedByContractorId: input.claimedByContractorId,
    siteId: "site_1",
  };
}

function rewardClaim(input: {
  id: string;
  claimId: string;
  contractorId: string;
  pointsDeducted: number;
  chosenAt: Date;
  rewardName: string;
  status?: string;
}): FakeRewardClaim {
  return {
    id: input.id,
    claimId: input.claimId,
    contractorId: input.contractorId,
    rewardItemId: `reward_${input.id}`,
    status: input.status ?? "CHOSEN",
    pointsDeducted: input.pointsDeducted,
    chosenAt: input.chosenAt,
    rewardItem: { name: input.rewardName },
  };
}

function claim(id: string, claimId: string, pointsDeducted: number, chosenAt: string) {
  return {
    rewardClaimId: id,
    claimId,
    rewardItemId: `reward_${id}`,
    rewardName: claimId,
    pointsDeducted,
    chosenAt: new Date(chosenAt),
  };
}
