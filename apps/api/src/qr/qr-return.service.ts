import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  DomainError,
  QR_TOKEN_STATUS,
  cancelQr,
  reverseQr,
  type ActorRole,
  type QrUnit,
} from "@volt-rewards/domain";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { getTier } from "../rewards/rewards.service.js";
import { hashQrToken } from "./qr-token.js";

const returnReason = "Product Returned";

export type ReturnQrAction = "CAN_CANCEL" | "CAN_REVERSE" | "NONE";
export type ReturnQrOperation = "LOOKUP" | "CANCELLED" | "REVERSED";

export interface ReturnQrClaimImpact {
  readonly rewardClaimId: string;
  readonly claimId: string;
  readonly rewardName: string;
  readonly pointsDeducted: number;
  readonly chosenAt: Date;
}

export interface ReturnQrLookupResponse {
  readonly qrUnitId: string;
  readonly status: string;
  readonly tokenStatus: string;
  readonly action: ReturnQrAction;
  readonly reason: string;
  readonly reasonCode: string;
  readonly qr: {
    readonly qrUnitId: string;
    readonly shortCode: string;
    readonly status: string;
    readonly productName: string;
    readonly productSku?: string;
    readonly category?: string;
    readonly invoiceNumber: string;
    readonly invoiceDate: Date;
    readonly points: number;
    readonly printedAt?: Date;
    readonly expiresAt?: Date;
    readonly scannedAt?: Date;
  };
  readonly contractor?: {
    readonly contractorId: string;
    readonly contractorCode: string;
    readonly name: string;
    readonly mobileNumber: string;
    readonly currentTier: string;
    readonly totalAccumulatedPoints: number;
    readonly pointsAvailable: number;
  };
  readonly reverseImpact?: {
    readonly pointsToReverse: number;
    readonly currentBalance: number;
    readonly projectedBalanceAfterQrReverse: number;
    readonly projectedBalanceAfterClaimRevocations: number;
    readonly createsNegativeBalance: boolean;
    readonly claimsToRevoke: readonly ReturnQrClaimImpact[];
  };
}

export interface ReturnQrMutationResponse extends ReturnQrLookupResponse {
  readonly operation: {
    readonly type: ReturnQrOperation;
    readonly completedAt: Date;
    readonly reason: string;
    readonly auditEventId: string;
    readonly ledgerEntryId?: string;
    readonly revokedClaims: readonly ReturnQrClaimImpact[];
    readonly balanceAfter?: number;
  };
}

interface LoadedQrToken {
  readonly id: string;
  readonly status: string;
  readonly qrUnit: LoadedQrUnit;
}

interface LoadedQrUnit {
  readonly id: string;
  readonly status: string;
  readonly productSku: string | null;
  readonly points: number;
  readonly expiresAt: Date | null;
  readonly printedAt: Date | null;
  readonly scannedAt: Date | null;
  readonly claimedByContractorId: string | null;
  readonly siteId: string | null;
  readonly invoice: {
    readonly id: string;
    readonly invoiceNumber: string;
    readonly invoiceDate: Date;
  };
  readonly invoiceLine: {
    readonly id: string;
    readonly sku: string;
    readonly productName: string;
    readonly category: string | null;
  } | null;
  readonly claimedByContractor: LoadedContractor | null;
}

interface LoadedContractor {
  readonly id: string;
  readonly code: string;
  readonly totalAccumulatedPoints: number;
  readonly availablePoints: number;
  readonly user: {
    readonly displayName: string;
    readonly mobileNumber: string;
  };
}

interface ChosenClaimRecord extends ReturnQrClaimImpact {
  readonly rewardItemId: string;
}

@Injectable()
export class QrReturnService {
  constructor(private readonly prisma: PrismaService) {}

  async lookupByToken(
    actor: AuthenticatedActor,
    tokenValue: string,
    now = new Date(),
  ): Promise<ReturnQrLookupResponse> {
    const tokenHash = hashQrToken(requireToken(tokenValue));
    const token = await this.prisma.qrToken.findUnique({
      where: { tokenHash },
      include: qrTokenInclude,
    });
    if (!token) {
      throw new NotFoundException("QR token was not found.");
    }

    const claims = await this.getClaimImpactCandidates(token.qrUnit, now);
    const response = buildLookupResponse(token, now, claims);

    await this.prisma.auditEvent.create({
      data: {
        actorRole: actor.role,
        ...(actor.userId ? { actorUserId: actor.userId } : {}),
        surface: "ADMIN_MOBILE",
        action: "QR_RETURN_LOOKUP",
        targetType: "QR_UNIT",
        targetId: token.qrUnit.id,
        metadata: {
          qrStatus: token.qrUnit.status,
          tokenStatus: token.status,
          action: response.action,
        },
        createdAt: now,
      },
    });

    return response;
  }

  async cancelQr(
    actor: AuthenticatedActor,
    qrUnitId: string,
    input: { readonly labelRemovedAndDiscarded?: boolean; readonly now?: Date },
  ): Promise<ReturnQrMutationResponse> {
    const now = input.now ?? new Date();

    return this.prisma.$transaction(
      async (tx) => {
        const qr = await findQrUnitForMutation(tx, qrUnitId);
        const activeToken = getActiveTokenOrThrow(qr);
        cancelQr(toDomainQr(qr, activeToken.tokenHash), {
          actorRole: actor.role as ActorRole,
          labelRemovedAndDiscarded: input.labelRemovedAndDiscarded === true,
          now,
        });

        const updated = await tx.qrUnit.updateMany({
          where: {
            id: qr.id,
            status: { in: ["PRINTED_UNCLAIMED", "REPRINTED"] },
            tokens: { some: { status: "ACTIVE" } },
          },
          data: { status: "CANCELLED" },
        });
        if (updated.count !== 1) {
          throw new DomainError("QR_CANCEL_INVALID_STATUS", "QR is no longer eligible for cancellation.");
        }

        await tx.qrToken.updateMany({
          where: { qrUnitId: qr.id, status: "ACTIVE" },
          data: {
            status: "INVALIDATED",
            invalidatedAt: now,
          },
        });

        const audit = await tx.auditEvent.create({
          data: {
            actorRole: actor.role,
            ...(actor.userId ? { actorUserId: actor.userId } : {}),
            surface: "ADMIN_MOBILE",
            action: "QR_CANCEL",
            targetType: "QR_UNIT",
            targetId: qr.id,
            beforeJson: {
              status: qr.status,
              tokenStatus: activeToken.status,
            },
            afterJson: {
              status: "CANCELLED",
              tokenStatus: "INVALIDATED",
              reason: returnReason,
            },
            metadata: {
              reason: returnReason,
              labelRemovedAndDiscarded: true,
              invoiceNumber: qr.invoice.invoiceNumber,
              productName: qr.invoiceLine?.productName ?? qr.productSku,
            },
            createdAt: now,
          },
        });

        const token = await findLatestTokenByQrUnit(tx, qr.id);
        const response = buildLookupResponse(token, now, []);
        return {
          ...response,
          operation: {
            type: "CANCELLED",
            completedAt: now,
            reason: returnReason,
            auditEventId: audit.id,
            revokedClaims: [],
          },
        };
      },
      { isolationLevel: "Serializable" },
    );
  }

  async reverseQr(
    actor: AuthenticatedActor,
    qrUnitId: string,
    input: { readonly labelRemovedAndDiscarded?: boolean; readonly now?: Date },
  ): Promise<ReturnQrMutationResponse> {
    const now = input.now ?? new Date();

    return this.prisma.$transaction(
      async (tx) => {
        const qr = await findQrUnitForMutation(tx, qrUnitId);
        const activeToken = getActiveTokenOrThrow(qr);
        if (!qr.claimedByContractor) {
          throw new DomainError("QR_REVERSE_INVALID_STATUS", "Only scanned/claimed QR can be reversed.");
        }

        const domainResult = reverseQr(toDomainQr(qr, activeToken.tokenHash), {
          actorRole: actor.role as ActorRole,
          labelRemovedAndDiscarded: input.labelRemovedAndDiscarded === true,
          currentBalance: qr.claimedByContractor.availablePoints,
        });

        const updated = await tx.qrUnit.updateMany({
          where: {
            id: qr.id,
            status: "SCANNED_CLAIMED",
            tokens: { some: { status: "ACTIVE" } },
          },
          data: { status: "REVERSED" },
        });
        if (updated.count !== 1) {
          throw new DomainError("QR_REVERSE_INVALID_STATUS", "QR is no longer eligible for reversal.");
        }

        await tx.qrToken.updateMany({
          where: { qrUnitId: qr.id, status: "ACTIVE" },
          data: {
            status: "INVALIDATED",
            invalidatedAt: now,
          },
        });

        const contractorAfterQrReverse = await tx.contractor.update({
          where: { id: qr.claimedByContractor.id },
          data: {
            availablePoints: { decrement: qr.points },
            tier: getTier(qr.claimedByContractor.totalAccumulatedPoints),
          },
          select: {
            id: true,
            availablePoints: true,
          },
        });

        const reverseLedger = await tx.pointsLedgerEntry.create({
          data: {
            contractorId: qr.claimedByContractor.id,
            type: "QR_REVERSE",
            pointsDelta: domainResult.ledgerEntry.pointsDelta,
            balanceAfter: contractorAfterQrReverse.availablePoints,
            sourceType: "QR_UNIT",
            sourceId: qr.id,
            qrUnitId: qr.id,
            idempotencyKey: `qr-reverse:${qr.id}`,
            ...(actor.userId ? { createdByUserId: actor.userId } : {}),
            createdAt: now,
          },
        });

        const revokedClaims = await revokeChosenClaimsUntilRecovered({
          tx,
          actor,
          contractorId: qr.claimedByContractor.id,
          qrUnitId: qr.id,
          startingBalance: contractorAfterQrReverse.availablePoints,
          now,
        });

        const finalBalance = revokedClaims.at(-1)?.balanceAfter ?? contractorAfterQrReverse.availablePoints;

        const audit = await tx.auditEvent.create({
          data: {
            actorRole: actor.role,
            ...(actor.userId ? { actorUserId: actor.userId } : {}),
            surface: "ADMIN_MOBILE",
            action: "QR_REVERSE",
            targetType: "QR_UNIT",
            targetId: qr.id,
            beforeJson: {
              status: qr.status,
              tokenStatus: activeToken.status,
              balanceBefore: qr.claimedByContractor.availablePoints,
            },
            afterJson: {
              status: "REVERSED",
              tokenStatus: "INVALIDATED",
              pointsDelta: -qr.points,
              balanceAfterQrReverse: contractorAfterQrReverse.availablePoints,
              balanceAfter: finalBalance,
              reason: returnReason,
            },
            metadata: {
              reason: returnReason,
              labelRemovedAndDiscarded: true,
              createsNegativeBalance: finalBalance < 0,
              invoiceNumber: qr.invoice.invoiceNumber,
              productName: qr.invoiceLine?.productName ?? qr.productSku,
              reverseLedgerEntryId: reverseLedger.id,
              revokedClaims: revokedClaims.map((claim) => ({
                rewardClaimId: claim.rewardClaimId,
                claimId: claim.claimId,
                rewardName: claim.rewardName,
                pointsDeducted: claim.pointsDeducted,
              })),
            },
            createdAt: now,
          },
        });

        const token = await findLatestTokenByQrUnit(tx, qr.id);
        const response = buildLookupResponse(token, now, []);
        return {
          ...response,
          operation: {
            type: "REVERSED",
            completedAt: now,
            reason: returnReason,
            auditEventId: audit.id,
            ledgerEntryId: reverseLedger.id,
            revokedClaims,
            balanceAfter: finalBalance,
          },
        };
      },
      { isolationLevel: "Serializable" },
    );
  }

  private async getClaimImpactCandidates(qr: LoadedQrUnit, _now: Date): Promise<readonly ChosenClaimRecord[]> {
    if (qr.status !== "SCANNED_CLAIMED" || !qr.claimedByContractor) {
      return [];
    }
    const projectedBalance = qr.claimedByContractor.availablePoints - qr.points;
    if (projectedBalance >= 0) {
      return [];
    }

    const claims = await this.prisma.rewardClaim.findMany({
      where: {
        contractorId: qr.claimedByContractor.id,
        status: "CHOSEN",
      },
      include: { rewardItem: true },
      orderBy: { chosenAt: "desc" },
    });

    return planChosenClaimRevocations(
      projectedBalance,
      claims.map((claim) => ({
        rewardClaimId: claim.id,
        claimId: claim.claimId,
        rewardItemId: claim.rewardItemId,
        rewardName: claim.rewardItem.name,
        pointsDeducted: claim.pointsDeducted,
        chosenAt: claim.chosenAt,
      })),
    ).claimsToRevoke;
  }
}

export function planChosenClaimRevocations(
  projectedBalanceAfterQrReverse: number,
  claimsNewestFirst: readonly ChosenClaimRecord[],
): {
  readonly claimsToRevoke: readonly ChosenClaimRecord[];
  readonly projectedBalanceAfterClaimRevocations: number;
} {
  const claimsToRevoke: ChosenClaimRecord[] = [];
  let runningBalance = projectedBalanceAfterQrReverse;

  for (const claim of claimsNewestFirst) {
    if (runningBalance >= 0) {
      break;
    }
    claimsToRevoke.push(claim);
    runningBalance += claim.pointsDeducted;
  }

  return {
    claimsToRevoke,
    projectedBalanceAfterClaimRevocations: runningBalance,
  };
}

function buildLookupResponse(
  token: LoadedQrToken,
  now: Date,
  claimImpactCandidates: readonly ChosenClaimRecord[],
): ReturnQrLookupResponse {
  const qr = token.qrUnit;
  const productSku = qr.productSku ?? qr.invoiceLine?.sku;
  const effectiveStatus = isActiveUnscannedQrStatus(qr.status) && qr.expiresAt && now > qr.expiresAt
    ? "EXPIRED"
    : qr.status;
  const tokenIsActive = token.status === QR_TOKEN_STATUS.ACTIVE;
  const contractor = qr.claimedByContractor;
  const action = getReturnAction({ effectiveStatus, tokenIsActive });
  const reverseImpact = action === "CAN_REVERSE" && contractor
    ? buildReverseImpact(qr, contractor, claimImpactCandidates)
    : undefined;

  return {
    qrUnitId: qr.id,
    status: effectiveStatus,
    tokenStatus: token.status,
    action,
    ...getReason({ effectiveStatus, tokenIsActive, action }),
    qr: {
      qrUnitId: qr.id,
      shortCode: qr.id.slice(-8).toUpperCase(),
      status: effectiveStatus,
      productName: qr.invoiceLine?.productName ?? qr.productSku ?? "Unknown product",
      invoiceNumber: qr.invoice.invoiceNumber,
      invoiceDate: qr.invoice.invoiceDate,
      points: qr.points,
      ...(productSku ? { productSku } : {}),
      ...(qr.invoiceLine?.category ? { category: qr.invoiceLine.category } : {}),
      ...(qr.printedAt ? { printedAt: qr.printedAt } : {}),
      ...(qr.expiresAt ? { expiresAt: qr.expiresAt } : {}),
      ...(qr.scannedAt ? { scannedAt: qr.scannedAt } : {}),
    },
    ...(contractor
      ? {
          contractor: {
            contractorId: contractor.id,
            contractorCode: contractor.code,
            name: contractor.user.displayName,
            mobileNumber: contractor.user.mobileNumber,
            currentTier: getTier(contractor.totalAccumulatedPoints),
            totalAccumulatedPoints: contractor.totalAccumulatedPoints,
            pointsAvailable: contractor.availablePoints,
          },
        }
      : {}),
    ...(reverseImpact ? { reverseImpact } : {}),
  };
}

function buildReverseImpact(
  qr: LoadedQrUnit,
  contractor: LoadedContractor,
  claimImpactCandidates: readonly ChosenClaimRecord[],
): NonNullable<ReturnQrLookupResponse["reverseImpact"]> {
  const projectedBalanceAfterQrReverse = contractor.availablePoints - qr.points;
  const planned = planChosenClaimRevocations(projectedBalanceAfterQrReverse, claimImpactCandidates);
  return {
    pointsToReverse: qr.points,
    currentBalance: contractor.availablePoints,
    projectedBalanceAfterQrReverse,
    projectedBalanceAfterClaimRevocations: planned.projectedBalanceAfterClaimRevocations,
    createsNegativeBalance: planned.projectedBalanceAfterClaimRevocations < 0,
    claimsToRevoke: planned.claimsToRevoke,
  };
}

function getReturnAction(input: {
  readonly effectiveStatus: string;
  readonly tokenIsActive: boolean;
}): ReturnQrAction {
  if (!input.tokenIsActive) {
    return "NONE";
  }
  if (isActiveUnscannedQrStatus(input.effectiveStatus)) {
    return "CAN_CANCEL";
  }
  if (input.effectiveStatus === "SCANNED_CLAIMED") {
    return "CAN_REVERSE";
  }
  return "NONE";
}

function getReason(input: {
  readonly effectiveStatus: string;
  readonly tokenIsActive: boolean;
  readonly action: ReturnQrAction;
}): { readonly reason: string; readonly reasonCode: string } {
  if (!input.tokenIsActive) {
    return {
      reason: "This QR token has already been discarded, replaced, cancelled, or reversed.",
      reasonCode: "TOKEN_INACTIVE",
    };
  }
  if (input.action === "CAN_CANCEL") {
    return {
      reason: "Unused QR is eligible for cancellation after the label is removed and discarded.",
      reasonCode: "ELIGIBLE_CANCEL",
    };
  }
  if (input.action === "CAN_REVERSE") {
    return {
      reason: "Scanned QR is eligible for points reversal after the label is removed and discarded.",
      reasonCode: "ELIGIBLE_REVERSE",
    };
  }

  switch (input.effectiveStatus) {
    case "EXPIRED":
      return { reason: "Expired QR cannot be cancelled or reversed in v1.", reasonCode: "QR_EXPIRED" };
    case "CANCELLED":
      return { reason: "QR has already been cancelled.", reasonCode: "QR_ALREADY_CANCELLED" };
    case "REVERSED":
      return { reason: "QR points have already been reversed.", reasonCode: "QR_ALREADY_REVERSED" };
    case "REPRINTED":
      return { reason: "Reprinted QR is not currently eligible for return action.", reasonCode: "QR_REPRINTED" };
    case "NOT_PRINTED":
      return { reason: "QR has not been printed yet.", reasonCode: "QR_NOT_PRINTED" };
    default:
      return { reason: "QR is not eligible for return action.", reasonCode: "QR_NOT_ACTIONABLE" };
  }
}

function isActiveUnscannedQrStatus(status: string): boolean {
  return status === "PRINTED_UNCLAIMED" || status === "REPRINTED";
}

async function revokeChosenClaimsUntilRecovered(input: {
  readonly tx: Prisma.TransactionClient;
  readonly actor: AuthenticatedActor;
  readonly contractorId: string;
  readonly qrUnitId: string;
  readonly startingBalance: number;
  readonly now: Date;
}): Promise<readonly (ReturnQrClaimImpact & { readonly balanceAfter: number })[]> {
  if (input.startingBalance >= 0) {
    return [];
  }

  const chosenClaims = await input.tx.rewardClaim.findMany({
    where: {
      contractorId: input.contractorId,
      status: "CHOSEN",
    },
    include: { rewardItem: true },
    orderBy: { chosenAt: "desc" },
  });
  const planned = planChosenClaimRevocations(
    input.startingBalance,
    chosenClaims.map((claim) => ({
      rewardClaimId: claim.id,
      claimId: claim.claimId,
      rewardItemId: claim.rewardItemId,
      rewardName: claim.rewardItem.name,
      pointsDeducted: claim.pointsDeducted,
      chosenAt: claim.chosenAt,
    })),
  );
  const revokedClaims: (ReturnQrClaimImpact & { readonly balanceAfter: number })[] = [];

  for (const claim of planned.claimsToRevoke) {
    const existing = chosenClaims.find((candidate) => candidate.id === claim.rewardClaimId);
    if (!existing) {
      continue;
    }

    await input.tx.rewardClaim.update({
      where: { id: existing.id },
      data: { status: "REVOKED_DUE_TO_RETURN" },
    });

    const contractor = await input.tx.contractor.update({
      where: { id: input.contractorId },
      data: {
        availablePoints: { increment: existing.pointsDeducted },
      },
      select: { availablePoints: true },
    });

    await input.tx.pointsLedgerEntry.create({
      data: {
        contractorId: input.contractorId,
        type: "REWARD_REVOKED_DUE_TO_RETURN",
        pointsDelta: existing.pointsDeducted,
        balanceAfter: contractor.availablePoints,
        sourceType: "REWARD_CLAIM",
        sourceId: existing.id,
        qrUnitId: input.qrUnitId,
        rewardClaimId: existing.id,
        idempotencyKey: `reward-revoke-due-to-return:${input.qrUnitId}:${existing.id}`,
        ...(input.actor.userId ? { createdByUserId: input.actor.userId } : {}),
        createdAt: input.now,
      },
    });

    await input.tx.auditEvent.create({
      data: {
        actorRole: input.actor.role,
        ...(input.actor.userId ? { actorUserId: input.actor.userId } : {}),
        surface: "ADMIN_MOBILE",
        action: "REWARD_REVOKED_DUE_TO_RETURN",
        targetType: "REWARD_CLAIM",
        targetId: existing.id,
        beforeJson: {
          status: existing.status,
          balanceBeforeRestore: contractor.availablePoints - existing.pointsDeducted,
        },
        afterJson: {
          status: "REVOKED_DUE_TO_RETURN",
          restoredPoints: existing.pointsDeducted,
          balanceAfter: contractor.availablePoints,
        },
        metadata: {
          qrUnitId: input.qrUnitId,
          reason: returnReason,
          claimId: existing.claimId,
          rewardName: existing.rewardItem.name,
        },
        createdAt: input.now,
      },
    });

    revokedClaims.push({
      rewardClaimId: existing.id,
      claimId: existing.claimId,
      rewardName: existing.rewardItem.name,
      pointsDeducted: existing.pointsDeducted,
      chosenAt: existing.chosenAt,
      balanceAfter: contractor.availablePoints,
    });
  }

  return revokedClaims;
}

const qrTokenInclude = {
  qrUnit: {
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
        },
      },
      invoiceLine: {
        select: {
          id: true,
          sku: true,
          productName: true,
          category: true,
        },
      },
      claimedByContractor: {
        include: {
          user: {
            select: {
              displayName: true,
              mobileNumber: true,
            },
          },
        },
      },
    },
  },
} as const;

const qrUnitMutationInclude = {
  invoice: {
    select: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
    },
  },
  invoiceLine: {
    select: {
      id: true,
      sku: true,
      productName: true,
      category: true,
    },
  },
  claimedByContractor: {
    include: {
      user: {
        select: {
          displayName: true,
          mobileNumber: true,
        },
      },
    },
  },
  tokens: true,
} as const;

async function findQrUnitForMutation(tx: Prisma.TransactionClient, qrUnitId: string) {
  const qr = await tx.qrUnit.findUnique({
    where: { id: qrUnitId },
    include: qrUnitMutationInclude,
  });
  if (!qr) {
    throw new NotFoundException("QR unit was not found.");
  }
  if (!qr.expiresAt) {
    throw new BadRequestException("QR unit has not been printed.");
  }
  return qr;
}

async function findLatestTokenByQrUnit(tx: Prisma.TransactionClient, qrUnitId: string): Promise<LoadedQrToken> {
  const token = await tx.qrToken.findFirst({
    where: { qrUnitId },
    orderBy: { issuedAt: "desc" },
    include: qrTokenInclude,
  });
  if (!token) {
    throw new NotFoundException("QR token was not found.");
  }
  return token;
}

function getActiveTokenOrThrow(qr: Awaited<ReturnType<typeof findQrUnitForMutation>>) {
  const token = qr.tokens.find((candidate) => candidate.status === "ACTIVE");
  if (!token) {
    throw new DomainError("QR_TOKEN_INVALID", "QR token is invalid or replaced.");
  }
  return token;
}

function toDomainQr(
  qr: Awaited<ReturnType<typeof findQrUnitForMutation>>,
  activeTokenHash: string,
): QrUnit {
  if (!qr.expiresAt) {
    throw new BadRequestException("QR unit has not been printed.");
  }
  return {
    id: qr.id,
    status: qr.status,
    expiresAt: qr.expiresAt,
    activeToken: { value: activeTokenHash, status: QR_TOKEN_STATUS.ACTIVE },
    tokenHistory: [],
    points: qr.points,
    ...(qr.claimedByContractorId ? { contractorId: qr.claimedByContractorId } : {}),
    ...(qr.siteId ? { siteId: qr.siteId } : {}),
  };
}

function requireToken(tokenValue: string): string {
  const trimmed = tokenValue.trim();
  if (!trimmed) {
    throw new BadRequestException("QR token is required.");
  }
  return trimmed;
}
