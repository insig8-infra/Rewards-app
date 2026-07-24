import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ACTOR_ROLE, DomainError, assertValidOtp } from "@volt-rewards/domain";
import { Prisma } from "../generated/prisma/client.js";
import { PointsLedgerType, type PointsLedgerType as PointsLedgerTypeValue } from "../generated/prisma/enums.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { resolveMediaUrlForRead, uploadRewardImageToStorage } from "../storage/media-storage.js";

export type RewardTier = "Silver" | "Gold" | "Platinum" | "Diamond";

export interface RewardCatalogTile {
  readonly rewardId: string;
  readonly name: string;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly images?: readonly string[];
  readonly pointsRequired: number;
  readonly tierRequired?: string;
  readonly status: "ELIGIBLE" | "LOCKED" | "CHOSEN" | "FULFILLED";
  readonly pointsGap: number;
  readonly tierGap?: string;
  readonly claimId?: string;
  readonly claimStatus?: string;
  readonly displayValue: string;
}

export interface RewardCatalogResponse {
  readonly contractorId: string;
  readonly currentTier: RewardTier;
  readonly totalAccumulatedPoints: number;
  readonly pointsAvailable: number;
  readonly items: readonly RewardCatalogTile[];
}

export interface RewardClaimResponse {
  readonly rewardClaimId: string;
  readonly claimId: string;
  readonly contractorId: string;
  readonly rewardId: string;
  readonly rewardName: string;
  readonly status: string;
  readonly pointsDeducted: number;
  readonly chosenAt: Date;
  readonly cancelledAt?: Date;
  readonly fulfilledAt?: Date;
  readonly otpVerifiedAt?: Date;
}

export interface RewardMutationResponse {
  readonly claim: RewardClaimResponse;
  readonly balance: {
    readonly currentTier: RewardTier;
    readonly totalAccumulatedPoints: number;
    readonly pointsAvailable: number;
  };
  readonly ledgerEntry: BalanceBookEntry;
}

export interface BalanceBookEntry {
  readonly ledgerEntryId: string;
  readonly type: string;
  readonly pointsDelta: number;
  readonly balanceAfter: number;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly rewardClaimId?: string;
  readonly claimId?: string;
  readonly rewardName?: string;
  readonly qrUnitId?: string;
  readonly createdAt: Date;
  readonly negativeBalance: boolean;
}

export interface BalanceBookResponse {
  readonly contractorId: string;
  readonly entries: readonly BalanceBookEntry[];
}

export interface AdminRewardClaimLookup {
  readonly claim: RewardClaimResponse;
  readonly contractor: {
    readonly contractorId: string;
    readonly contractorCode: string;
    readonly name: string;
    readonly mobileNumber: string;
    readonly currentTier: RewardTier;
    readonly totalAccumulatedPoints: number;
    readonly pointsAvailable: number;
  };
  readonly canSendOtp: boolean;
  readonly canFulfill: boolean;
}

export type AdminRewardClaimHistoryEntry = AdminRewardClaimLookup;

export type AdminRewardCatalogStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface AdminRewardCatalogImage {
  readonly imageId: string;
  readonly imageUrl: string;
  readonly storagePath?: string;
  readonly altText?: string;
  readonly sortOrder: number;
}

export interface AdminRewardCatalogItem {
  readonly rewardId: string;
  readonly code: string;
  readonly name: string;
  readonly quickDescription: string;
  readonly cashValueInr: number;
  readonly pointsRequired: number;
  readonly totalQuantity: number;
  readonly reservedQuantity: number;
  readonly deliveredQuantity: number;
  readonly availableQuantity: number;
  readonly status: AdminRewardCatalogStatus;
  readonly imageUrl?: string;
  readonly images: readonly AdminRewardCatalogImage[];
  readonly readinessIssues: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface RewardCatalogWriteInput {
  readonly code?: string;
  readonly name?: string;
  readonly quickDescription?: string;
  readonly cashValueInr?: number;
  readonly pointsRequired?: number;
  readonly totalQuantity?: number;
  readonly status?: AdminRewardCatalogStatus;
}

export interface RewardCatalogImageInput {
  readonly fileName?: string;
  readonly contentType?: string;
  readonly dataUrl?: string;
  readonly altText?: string;
}

type AdminRewardSurface = "ADMIN_WEB" | "ADMIN_MOBILE";

export interface RewardCatalogCsvPreviewRow {
  readonly rowNumber: number;
  readonly code: string;
  readonly name: string;
  readonly quickDescription: string;
  readonly cashValueInr: number;
  readonly pointsRequired: number;
  readonly totalQuantity: number;
  readonly requestedStatus: AdminRewardCatalogStatus;
  readonly operation: "CREATE" | "UPDATE";
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface RewardCatalogCsvPreview {
  readonly rows: readonly RewardCatalogCsvPreviewRow[];
  readonly validRowCount: number;
  readonly errorCount: number;
}

export interface RewardCatalogCsvCommitResult {
  readonly created: number;
  readonly updated: number;
  readonly draftedForMissingImages: number;
  readonly items: readonly AdminRewardCatalogItem[];
}

export interface RewardFulfillmentOtpResponse {
  readonly challengeId: string;
  readonly claimId: string;
  readonly expiresAt: Date;
  readonly delivery: {
    readonly channel: "MOCK_SMS_TO_CONTRACTOR";
    readonly status: "MOCK_RETURNED_FOR_LOCAL_DEV";
    readonly mockOtp: string;
  };
}

const tierRules: readonly { readonly name: RewardTier; readonly minTotalPoints: number }[] = [
  { name: "Silver", minTotalPoints: 0 },
  { name: "Gold", minTotalPoints: 1_000 },
  { name: "Platinum", minTotalPoints: 5_000 },
  { name: "Diamond", minTotalPoints: 15_000 },
];

const tierRank = new Map<RewardTier, number>(tierRules.map((tier, index) => [tier.name, index]));
const otpValidityMs = 10 * 60 * 1000;
const staleMockClaimId = "CLM-STALE01";
const staleClaimMessage = "Claim Request No longer available. History recorded.";
const rewardCatalogAdminInclude = {
  images: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
  rewardClaims: { select: { status: true } },
};

type RewardCatalogAdminRecord = Prisma.RewardCatalogItemGetPayload<{ include: typeof rewardCatalogAdminInclude }>;
type RewardCatalogCurrentRecord = Pick<
  RewardCatalogAdminRecord,
  "code" | "name" | "description" | "cashValueInr" | "pointsRequired" | "totalQuantity" | "status" | "images" | "rewardClaims"
>;

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog(actor: AuthenticatedActor): Promise<RewardCatalogResponse> {
    const contractorId = requireContractorScope(actor);
    const [contractor, items, claims] = await Promise.all([
      this.getContractorOrThrow(contractorId),
      this.prisma.rewardCatalogItem.findMany({
        include: rewardCatalogAdminInclude,
        orderBy: [{ pointsRequired: "asc" }, { name: "asc" }],
      }),
      this.prisma.rewardClaim.findMany({
        where: { contractorId },
        include: { rewardItem: true },
        orderBy: { chosenAt: "desc" },
      }),
    ]);

    return buildCatalogResponse(contractor, items, claims);
  }

  async getRewardDetail(actor: AuthenticatedActor, rewardId: string): Promise<RewardCatalogTile> {
    const catalog = await this.getCatalog(actor);
    const item = catalog.items.find((candidate) => candidate.rewardId === rewardId);
    if (!item) {
      throw new NotFoundException("Reward was not found.");
    }
    return item;
  }

  async redeemReward(actor: AuthenticatedActor, rewardId: string, now = new Date()): Promise<RewardMutationResponse> {
    const contractorId = requireContractorScope(actor);
    const claimCode = this.generateClaimId();

    return this.prisma.$transaction(
      async (tx) => {
        const contractor = await tx.contractor.findUnique({
          where: { id: contractorId },
          include: { user: true },
        });
        if (!contractor || contractor.status !== "ACTIVE") {
          throw new NotFoundException("Contractor was not found.");
        }

        const reward = await tx.rewardCatalogItem.findFirst({
          where: { id: rewardId, status: "ACTIVE" },
          include: rewardCatalogAdminInclude,
        });
        if (!reward) {
          throw new NotFoundException("Reward was not found.");
        }
        if (reward.images.length === 0) {
          throw new BadRequestException("Reward is not available yet.");
        }
        const stock = getCatalogStock(reward);
        if (stock.availableQuantity <= 0) {
          throw new BadRequestException("Reward is sold out.");
        }

        const activeClaim = await tx.rewardClaim.findFirst({
          where: {
            contractorId,
            rewardItemId: reward.id,
            status: "CHOSEN",
          },
          select: { claimId: true },
        });
        if (activeClaim) {
          throw new BadRequestException(`Reward is already chosen under Claim ID ${activeClaim.claimId}.`);
        }

        assertRewardEligibility(contractor, reward);

        const claim = await tx.rewardClaim.create({
          data: {
            claimId: claimCode,
            contractorId,
            rewardItemId: reward.id,
            pointsDeducted: reward.pointsRequired,
            status: "CHOSEN",
            chosenAt: now,
          },
          include: { rewardItem: true },
        });

        const updatedContractor = await tx.contractor.update({
          where: { id: contractorId },
          data: {
            availablePoints: { decrement: reward.pointsRequired },
            tier: getTier(contractor.totalAccumulatedPoints),
          },
          include: { user: true },
        });
        if (updatedContractor.availablePoints < 0) {
          throw new BadRequestException("Contractor does not have enough points.");
        }

        const ledgerEntry = await tx.pointsLedgerEntry.create({
          data: {
            contractorId,
            type: "REWARD_REDEEM",
            pointsDelta: -reward.pointsRequired,
            balanceAfter: updatedContractor.availablePoints,
            sourceType: "REWARD_CLAIM",
            sourceId: claim.id,
            rewardClaimId: claim.id,
            idempotencyKey: `reward-redeem:${claim.id}`,
            ...(actor.userId ? { createdByUserId: actor.userId } : {}),
            createdAt: now,
          },
          include: { rewardClaim: { include: { rewardItem: true } } },
        });

        await tx.auditEvent.create({
          data: {
            actorRole: actor.role,
            ...(actor.userId ? { actorUserId: actor.userId } : {}),
            surface: "END_USER_APP",
            action: "REWARD_REDEEMED",
            targetType: "REWARD_CLAIM",
            targetId: claim.id,
            afterJson: {
              claimId: claim.claimId,
              rewardItemId: reward.id,
              pointsDeducted: reward.pointsRequired,
              balanceAfter: updatedContractor.availablePoints,
            },
            createdAt: now,
          },
        });

        return {
          claim: mapClaim(claim),
          balance: mapBalance(updatedContractor),
          ledgerEntry: mapBalanceBookEntry(ledgerEntry),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async cancelClaim(actor: AuthenticatedActor, claimId: string, now = new Date()): Promise<RewardMutationResponse> {
    const contractorId = requireContractorScope(actor);

    return this.prisma.$transaction(
      async (tx) => {
        const claim = await tx.rewardClaim.findUnique({
          where: { claimId },
          include: { rewardItem: true },
        });
        if (!claim || claim.contractorId !== contractorId) {
          throw new NotFoundException("Reward claim was not found for this contractor.");
        }
        if (claim.status !== "CHOSEN") {
          throw new BadRequestException("Only chosen rewards can be cancelled before collection.");
        }

        const currentContractor = await tx.contractor.findUniqueOrThrow({
          where: { id: contractorId },
          include: { user: true },
        });
        const updatedClaim = await tx.rewardClaim.update({
          where: { id: claim.id },
          data: {
            status: "CANCELLED_BY_CONTRACTOR",
            cancelledAt: now,
          },
          include: { rewardItem: true },
        });
        const updatedContractor = await tx.contractor.update({
          where: { id: contractorId },
          data: {
            availablePoints: { increment: claim.pointsDeducted },
            tier: getTier(currentContractor.totalAccumulatedPoints),
          },
          include: { user: true },
        });

        const ledgerEntry = await tx.pointsLedgerEntry.create({
          data: {
            contractorId,
            type: "REWARD_CANCEL_RESTORE",
            pointsDelta: claim.pointsDeducted,
            balanceAfter: updatedContractor.availablePoints,
            sourceType: "REWARD_CLAIM",
            sourceId: claim.id,
            rewardClaimId: claim.id,
            idempotencyKey: `reward-cancel:${claim.id}`,
            ...(actor.userId ? { createdByUserId: actor.userId } : {}),
            createdAt: now,
          },
          include: { rewardClaim: { include: { rewardItem: true } } },
        });

        await tx.auditEvent.create({
          data: {
            actorRole: actor.role,
            ...(actor.userId ? { actorUserId: actor.userId } : {}),
            surface: "END_USER_APP",
            action: "REWARD_CANCELLED_BY_CONTRACTOR",
            targetType: "REWARD_CLAIM",
            targetId: claim.id,
            beforeJson: { status: claim.status, balanceBefore: currentContractor.availablePoints },
            afterJson: {
              status: updatedClaim.status,
              restoredPoints: claim.pointsDeducted,
              balanceAfter: updatedContractor.availablePoints,
            },
            createdAt: now,
          },
        });

        return {
          claim: mapClaim(updatedClaim),
          balance: mapBalance(updatedContractor),
          ledgerEntry: mapBalanceBookEntry(ledgerEntry),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async getBalanceBook(
    actor: AuthenticatedActor,
    filters: {
      readonly type?: string;
      readonly from?: string;
      readonly to?: string;
      readonly limit?: string;
    } = {},
  ): Promise<BalanceBookResponse> {
    const contractorId = requireContractorScope(actor);
    const limit = clampLimit(filters.limit);
    const type = normalizeLedgerType(filters.type);
    const from = parseOptionalDate(filters.from, "from");
    const to = parseOptionalDate(filters.to, "to");

    const entries = await this.prisma.pointsLedgerEntry.findMany({
      where: {
        contractorId,
        ...(type ? { type } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      include: {
        rewardClaim: {
          include: {
            rewardItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return {
      contractorId,
      entries: entries.map(mapBalanceBookEntry),
    };
  }

  async listAdminCatalog(_actor: AuthenticatedActor): Promise<readonly AdminRewardCatalogItem[]> {
    const items = await this.prisma.rewardCatalogItem.findMany({
      include: rewardCatalogAdminInclude,
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    });

    return items.map(mapAdminCatalogItem);
  }

  async createCatalogItem(
    actor: AuthenticatedActor,
    input: RewardCatalogWriteInput,
    now = new Date(),
  ): Promise<AdminRewardCatalogItem> {
    const code = input.code ?? await generateRewardCatalogCode(this.prisma, input.name ?? "");
    const normalized = normalizeCatalogWriteInput({ ...input, code }, { requireAll: true });
    await assertCodeAvailable(this.prisma, normalized.code);
    if (normalized.status === "ACTIVE") {
      throw new BadRequestException("Upload at least one reward image before activating this reward.");
    }

    const item = await this.prisma.rewardCatalogItem.create({
      data: {
        code: normalized.code,
        name: normalized.name,
        description: normalized.quickDescription,
        cashValueInr: normalized.cashValueInr,
        pointsRequired: normalized.pointsRequired,
        totalQuantity: normalized.totalQuantity,
        tierRequired: null,
        status: normalized.status,
        createdAt: now,
      },
      include: rewardCatalogAdminInclude,
    });

    await this.auditCatalogChange(actor, "REWARD_CATALOG_CREATED", item.id, undefined, {
      code: item.code,
      name: item.name,
      status: item.status,
    }, now);

    return mapAdminCatalogItem(item);
  }

  async updateCatalogItem(
    actor: AuthenticatedActor,
    rewardId: string,
    input: RewardCatalogWriteInput,
    now = new Date(),
  ): Promise<AdminRewardCatalogItem> {
    const current = await this.getCatalogItemForAdminOrThrow(rewardId);
    const normalized = normalizeCatalogWriteInput(input, { requireAll: false, current });
    if (normalized.code !== current.code) {
      await assertCodeAvailable(this.prisma, normalized.code, rewardId);
    }

    const stock = getCatalogStock(current);
    if (normalized.totalQuantity < stock.committedQuantity) {
      throw new BadRequestException("Quantity cannot be lower than reserved plus delivered rewards.");
    }
    if (normalized.status === "ACTIVE" && current.images.length === 0) {
      throw new BadRequestException("Upload at least one reward image before activating this reward.");
    }

    const updated = await this.prisma.rewardCatalogItem.update({
      where: { id: rewardId },
      data: {
        code: normalized.code,
        name: normalized.name,
        description: normalized.quickDescription,
        cashValueInr: normalized.cashValueInr,
        pointsRequired: normalized.pointsRequired,
        totalQuantity: normalized.totalQuantity,
        tierRequired: null,
        status: normalized.status,
      },
      include: rewardCatalogAdminInclude,
    });

    await this.auditCatalogChange(actor, "REWARD_CATALOG_UPDATED", updated.id, {
      code: current.code,
      name: current.name,
      status: current.status,
      totalQuantity: current.totalQuantity,
    }, {
      code: updated.code,
      name: updated.name,
      status: updated.status,
      totalQuantity: updated.totalQuantity,
    }, now);

    return mapAdminCatalogItem(updated);
  }

  async addCatalogImage(
    actor: AuthenticatedActor,
    rewardId: string,
    input: RewardCatalogImageInput,
    now = new Date(),
  ): Promise<AdminRewardCatalogItem> {
    const current = await this.getCatalogItemForAdminOrThrow(rewardId);
    const parsed = parseRewardImageInput(input, current.name);
    const uploaded = await uploadRewardImageToStorage({
      rewardId,
      fileName: parsed.fileName,
      contentType: parsed.contentType,
      dataBase64: parsed.dataBase64,
    }).catch((error: unknown) => {
      throw new BadRequestException(error instanceof Error ? error.message : "Reward image upload failed.");
    });

    const nextSortOrder = current.images.reduce((max, image) => Math.max(max, image.sortOrder), -1) + 1;
    await this.prisma.rewardCatalogImage.create({
      data: {
        rewardItemId: rewardId,
        imageUrl: uploaded.imageUrl,
        storagePath: uploaded.storagePath,
        altText: parsed.altText,
        sortOrder: nextSortOrder,
        createdAt: now,
      },
    });
    const updated = await this.prisma.rewardCatalogItem.update({
      where: { id: rewardId },
      data: {
        imageUrl: current.imageUrl ?? uploaded.imageUrl,
      },
      include: rewardCatalogAdminInclude,
    });

    await this.auditCatalogChange(actor, "REWARD_CATALOG_IMAGE_ADDED", rewardId, undefined, {
      code: updated.code,
      imageUrl: uploaded.imageUrl,
      storagePath: uploaded.storagePath,
    }, now);

    return mapAdminCatalogItem(updated);
  }

  async deactivateCatalogItem(actor: AuthenticatedActor, rewardId: string, now = new Date()): Promise<AdminRewardCatalogItem> {
    const current = await this.getCatalogItemForAdminOrThrow(rewardId);
    const updated = await this.prisma.rewardCatalogItem.update({
      where: { id: rewardId },
      data: { status: "INACTIVE" },
      include: rewardCatalogAdminInclude,
    });

    await this.auditCatalogChange(actor, "REWARD_CATALOG_DEACTIVATED", rewardId, { status: current.status }, { status: "INACTIVE" }, now);
    return mapAdminCatalogItem(updated);
  }

  async reactivateCatalogItem(actor: AuthenticatedActor, rewardId: string, now = new Date()): Promise<AdminRewardCatalogItem> {
    const current = await this.getCatalogItemForAdminOrThrow(rewardId);
    const stock = getCatalogStock(current);
    if (current.images.length === 0) {
      throw new BadRequestException("Upload at least one reward image before activating this reward.");
    }
    if (stock.availableQuantity <= 0) {
      throw new BadRequestException("Increase quantity before reactivating a sold-out reward.");
    }
    const updated = await this.prisma.rewardCatalogItem.update({
      where: { id: rewardId },
      data: { status: "ACTIVE" },
      include: rewardCatalogAdminInclude,
    });

    await this.auditCatalogChange(actor, "REWARD_CATALOG_REACTIVATED", rewardId, { status: current.status }, { status: "ACTIVE" }, now);
    return mapAdminCatalogItem(updated);
  }

  async previewCatalogCsv(_actor: AuthenticatedActor, input: { readonly csv?: string }): Promise<RewardCatalogCsvPreview> {
    const rows = parseCatalogCsv(input.csv ?? "");
    const existingCodes = new Set(
      (
        await this.prisma.rewardCatalogItem.findMany({
          select: { code: true },
        })
      ).map((item) => item.code.toLowerCase()),
    );
    const seenCodes = new Set<string>();
    const previewRows = rows.map((row) => buildCsvPreviewRow(row, existingCodes, seenCodes));
    return {
      rows: previewRows,
      validRowCount: previewRows.filter((row) => row.errors.length === 0).length,
      errorCount: previewRows.reduce((sum, row) => sum + row.errors.length, 0),
    };
  }

  async commitCatalogCsv(
    actor: AuthenticatedActor,
    input: { readonly csv?: string },
    now = new Date(),
  ): Promise<RewardCatalogCsvCommitResult> {
    const preview = await this.previewCatalogCsv(actor, input);
    const invalidRows = preview.rows.filter((row) => row.errors.length > 0);
    if (invalidRows.length > 0) {
      throw new BadRequestException("Fix CSV validation errors before committing.");
    }

    let created = 0;
    let updated = 0;
    let draftedForMissingImages = 0;
    const touchedIds: string[] = [];

    for (const row of preview.rows) {
      const existing = await this.prisma.rewardCatalogItem.findUnique({
        where: { code: row.code },
        include: rewardCatalogAdminInclude,
      });
      const imageCount = existing?.images.length ?? 0;
      const status = row.requestedStatus === "ACTIVE" && imageCount === 0 ? "DRAFT" : row.requestedStatus;
      if (status === "DRAFT" && row.requestedStatus === "ACTIVE") {
        draftedForMissingImages += 1;
      }

      if (existing) {
        const stock = getCatalogStock(existing);
        if (row.totalQuantity < stock.committedQuantity) {
          throw new BadRequestException(`${row.code}: quantity cannot be lower than reserved plus delivered rewards.`);
        }
        const item = await this.prisma.rewardCatalogItem.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            description: row.quickDescription,
            cashValueInr: row.cashValueInr,
            pointsRequired: row.pointsRequired,
            totalQuantity: row.totalQuantity,
            tierRequired: null,
            status,
          },
        });
        touchedIds.push(item.id);
        updated += 1;
      } else {
        const item = await this.prisma.rewardCatalogItem.create({
          data: {
            code: row.code,
            name: row.name,
            description: row.quickDescription,
            cashValueInr: row.cashValueInr,
            pointsRequired: row.pointsRequired,
            totalQuantity: row.totalQuantity,
            tierRequired: null,
            status,
            createdAt: now,
          },
        });
        touchedIds.push(item.id);
        created += 1;
      }
    }

    await this.auditCatalogChange(actor, "REWARD_CATALOG_CSV_COMMITTED", "reward-catalog", undefined, {
      created,
      updated,
      draftedForMissingImages,
    }, now);

    const items = await this.prisma.rewardCatalogItem.findMany({
      where: { id: { in: touchedIds } },
      include: rewardCatalogAdminInclude,
      orderBy: { name: "asc" },
    });

    return {
      created,
      updated,
      draftedForMissingImages,
      items: items.map(mapAdminCatalogItem),
    };
  }

  async lookupClaim(_actor: AuthenticatedActor, claimId: string): Promise<AdminRewardClaimLookup> {
    const claim = await this.prisma.rewardClaim.findUnique({
      where: { claimId },
      include: {
        rewardItem: true,
        contractor: {
          include: { user: true },
        },
      },
    });
    if (!claim) {
      throw new NotFoundException("Reward claim was not found.");
    }

    return mapAdminLookup(claim);
  }

  async listAdminClaims(_actor: AuthenticatedActor): Promise<readonly AdminRewardClaimLookup[]> {
    const claims = await this.prisma.rewardClaim.findMany({
      where: {
        status: "CHOSEN",
        claimId: { not: staleMockClaimId },
      },
      include: {
        rewardItem: true,
        contractor: {
          include: { user: true },
        },
      },
      orderBy: [{ chosenAt: "desc" }],
      take: 100,
    });

    return claims.map(mapAdminLookup);
  }

  async listAdminClaimHistory(_actor: AuthenticatedActor): Promise<readonly AdminRewardClaimHistoryEntry[]> {
    const claims = await this.prisma.rewardClaim.findMany({
      include: {
        rewardItem: true,
        contractor: {
          include: { user: true },
        },
      },
      orderBy: [{ chosenAt: "desc" }],
      take: 200,
    });

    return claims.map(mapAdminLookup);
  }

  async sendFulfillmentOtp(
    actor: AuthenticatedActor,
    claimId: string,
    now = new Date(),
    surface: AdminRewardSurface = "ADMIN_WEB",
  ): Promise<RewardFulfillmentOtpResponse> {
    const claim = await this.prisma.rewardClaim.findUnique({
      where: { claimId },
      include: {
        contractor: {
          include: { user: true },
        },
      },
    });
    if (!claim) {
      throw new NotFoundException("Reward claim was not found.");
    }
    if (claim.status !== "CHOSEN") {
      throw new BadRequestException(getUnavailableClaimMessage(claim.status));
    }
    if (claim.claimId === staleMockClaimId) {
      await this.markMockClaimUnavailable(actor, claim, now);
      throw new BadRequestException(staleClaimMessage);
    }

    const otp = this.generateOtp();
    assertOtpOrBadRequest(otp);
    const expiresAt = new Date(now.getTime() + otpValidityMs);
    const challenge = await this.prisma.otpChallenge.create({
      data: {
        contractorId: claim.contractorId,
        contractorMobileNumber: claim.contractor.user.mobileNumber,
        otpHash: hashOtp(otp),
        expiresAt,
        deviceContext: {
          purpose: "REWARD_FULFILLMENT",
          claimId: claim.claimId,
        },
        createdAt: now,
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        actorRole: actor.role,
        ...(actor.userId ? { actorUserId: actor.userId } : {}),
        surface,
        action: "REWARD_FULFILLMENT_OTP_SENT",
        targetType: "REWARD_CLAIM",
        targetId: claim.id,
        metadata: {
          claimId: claim.claimId,
          contractorId: claim.contractorId,
          deliveryStatus: "MOCK_RETURNED_FOR_LOCAL_DEV",
        },
        createdAt: now,
      },
    });

    return {
      challengeId: challenge.id,
      claimId: claim.claimId,
      expiresAt,
      delivery: {
        channel: "MOCK_SMS_TO_CONTRACTOR",
        status: "MOCK_RETURNED_FOR_LOCAL_DEV",
        mockOtp: otp,
      },
    };
  }

  async fulfillClaim(
    actor: AuthenticatedActor,
    claimId: string,
    input: { readonly challengeId?: string; readonly otp?: string },
    now = new Date(),
    surface: AdminRewardSurface = "ADMIN_WEB",
  ): Promise<AdminRewardClaimLookup> {
    if (!actor.userId) {
      throw new UnauthorizedException("Admin actor user id is required.");
    }
    if (!input.challengeId || !input.otp) {
      throw new BadRequestException("OTP challenge id and code are required.");
    }
    const actorUserId = actor.userId;
    const challengeId = input.challengeId;
    const otp = input.otp;
    assertOtpOrBadRequest(otp);

    return this.prisma.$transaction(
      async (tx) => {
        const claim = await tx.rewardClaim.findUnique({
          where: { claimId },
          include: {
            rewardItem: true,
            contractor: { include: { user: true } },
          },
        });
        if (!claim) {
          throw new NotFoundException("Reward claim was not found.");
        }
        if (claim.status !== "CHOSEN") {
          throw new BadRequestException(getUnavailableClaimMessage(claim.status));
        }

        const challenge = await tx.otpChallenge.findUnique({
          where: { id: challengeId },
        });
        if (
          !challenge ||
          challenge.contractorId !== claim.contractorId ||
          challenge.status !== "PENDING" ||
          challenge.expiresAt <= now ||
          !isRewardFulfillmentChallenge(challenge.deviceContext, claim.claimId)
        ) {
          throw new UnauthorizedException("OTP challenge is invalid or expired.");
        }
        if (!verifyHash(otp, challenge.otpHash)) {
          throw new UnauthorizedException("OTP is invalid.");
        }

        await tx.otpChallenge.update({
          where: { id: challenge.id },
          data: {
            status: "VERIFIED",
            verifiedAt: now,
          },
        });

        const updatedClaim = await tx.rewardClaim.update({
          where: { id: claim.id },
          data: {
            status: "FULFILLED",
            fulfilledAt: now,
            fulfilledByOwnerId: actorUserId,
            otpVerifiedAt: now,
          },
          include: {
            rewardItem: true,
            contractor: { include: { user: true } },
          },
        });

        await tx.pointsLedgerEntry.create({
          data: {
            contractorId: claim.contractorId,
            type: "REWARD_FULFILLED",
            pointsDelta: 0,
            balanceAfter: claim.contractor.availablePoints,
            sourceType: "REWARD_CLAIM",
            sourceId: claim.id,
            rewardClaimId: claim.id,
            idempotencyKey: `reward-fulfill:${claim.id}`,
            createdByUserId: actorUserId,
            createdAt: now,
          },
        });

        await tx.auditEvent.create({
          data: {
            actorRole: actor.role,
            actorUserId,
            surface,
            action: "REWARD_FULFILLED",
            targetType: "REWARD_CLAIM",
            targetId: claim.id,
            beforeJson: { status: claim.status },
            afterJson: {
              status: updatedClaim.status,
              claimId: updatedClaim.claimId,
              fulfilledAt: now.toISOString(),
            },
            createdAt: now,
          },
        });

        return mapAdminLookup(updatedClaim);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  protected generateClaimId(): string {
    return `CLM-${randomBytes(3).toString("hex").toUpperCase()}`;
  }

  protected generateOtp(): string {
    return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  }

  private async getContractorOrThrow(contractorId: string) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id: contractorId },
      include: { user: true },
    });
    if (!contractor || contractor.status !== "ACTIVE") {
      throw new NotFoundException("Contractor was not found.");
    }
    return contractor;
  }

  private async getCatalogItemForAdminOrThrow(rewardId: string) {
    const item = await this.prisma.rewardCatalogItem.findUnique({
      where: { id: rewardId },
      include: rewardCatalogAdminInclude,
    });
    if (!item) {
      throw new NotFoundException("Reward was not found.");
    }
    return item;
  }

  private async auditCatalogChange(
    actor: AuthenticatedActor,
    action: string,
    targetId: string,
    beforeJson: Prisma.InputJsonValue | undefined,
    afterJson: Prisma.InputJsonValue,
    now: Date,
  ): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        actorRole: actor.role,
        ...(actor.userId ? { actorUserId: actor.userId } : {}),
        surface: "ADMIN_WEB",
        action,
        targetType: "REWARD_CATALOG",
        targetId,
        ...(beforeJson ? { beforeJson } : {}),
        afterJson,
        createdAt: now,
      },
    });
  }

  private async markMockClaimUnavailable(
    actor: AuthenticatedActor,
    claim: {
      readonly id: string;
      readonly claimId: string;
      readonly contractorId: string;
      readonly pointsDeducted: number;
      readonly status: string;
    },
    now: Date,
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const currentClaim = await tx.rewardClaim.findUnique({
          where: { id: claim.id },
        });
        if (!currentClaim || currentClaim.status !== "CHOSEN") {
          return;
        }

        const contractor = await tx.contractor.findUniqueOrThrow({
          where: { id: claim.contractorId },
        });
        await tx.rewardClaim.update({
          where: { id: claim.id },
          data: {
            status: "CANCELLED_BY_CONTRACTOR",
            cancelledAt: now,
          },
        });
        const updatedContractor = await tx.contractor.update({
          where: { id: claim.contractorId },
          data: {
            availablePoints: { increment: claim.pointsDeducted },
            tier: getTier(contractor.totalAccumulatedPoints),
          },
        });
        await tx.pointsLedgerEntry.upsert({
          where: { idempotencyKey: `reward-mock-stale-cancel:${claim.id}` },
          create: {
            contractorId: claim.contractorId,
            type: "REWARD_CANCEL_RESTORE",
            pointsDelta: claim.pointsDeducted,
            balanceAfter: updatedContractor.availablePoints,
            sourceType: "REWARD_CLAIM",
            sourceId: claim.id,
            rewardClaimId: claim.id,
            idempotencyKey: `reward-mock-stale-cancel:${claim.id}`,
            createdAt: now,
          },
          update: {
            balanceAfter: updatedContractor.availablePoints,
          },
        });
        await tx.auditEvent.create({
          data: {
            actorRole: ACTOR_ROLE.CONTRACTOR,
            surface: "END_USER_APP",
            action: "REWARD_CANCELLED_BY_CONTRACTOR",
            targetType: "REWARD_CLAIM",
            targetId: claim.id,
            beforeJson: {
              status: claim.status,
              adminAttemptedActorRole: actor.role,
              ...(actor.userId ? { adminAttemptedUserId: actor.userId } : {}),
            },
            afterJson: {
              status: "CANCELLED_BY_CONTRACTOR",
              claimId: claim.claimId,
              restoredPoints: claim.pointsDeducted,
              balanceAfter: updatedContractor.availablePoints,
              staleMockScenario: true,
            },
            createdAt: now,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}

export function getTier(totalAccumulatedPoints: number): RewardTier {
  return [...tierRules]
    .reverse()
    .find((tier) => totalAccumulatedPoints >= tier.minTotalPoints)?.name ?? "Silver";
}

function buildCatalogResponse(
  contractor: Awaited<ReturnType<RewardsService["getContractorOrThrow"]>>,
  items: readonly RewardCatalogAdminRecord[],
  claims: readonly {
    readonly id: string;
    readonly claimId: string;
    readonly rewardItemId: string;
    readonly status: string;
    readonly pointsDeducted: number;
    readonly chosenAt: Date;
    readonly cancelledAt: Date | null;
    readonly fulfilledAt: Date | null;
    readonly otpVerifiedAt: Date | null;
    readonly rewardItem: { readonly name: string };
  }[],
): RewardCatalogResponse {
  const latestClaimByReward = new Map<string, (typeof claims)[number]>();
  for (const claim of claims) {
    if (!latestClaimByReward.has(claim.rewardItemId)) {
      latestClaimByReward.set(claim.rewardItemId, claim);
    }
  }

  return {
    contractorId: contractor.id,
    currentTier: getTier(contractor.totalAccumulatedPoints),
    totalAccumulatedPoints: contractor.totalAccumulatedPoints,
    pointsAvailable: contractor.availablePoints,
    items: items
      .filter((item) => shouldShowInContractorCatalog(item, latestClaimByReward.get(item.id)))
      .map((item) => buildCatalogTile(contractor, item, latestClaimByReward.get(item.id))),
  };
}

function buildCatalogTile(
  contractor: { readonly availablePoints: number; readonly totalAccumulatedPoints: number },
  item: RewardCatalogAdminRecord,
  latestClaim?: {
    readonly claimId: string;
    readonly status: string;
  },
): RewardCatalogTile {
  const currentTier = getTier(contractor.totalAccumulatedPoints);
  const tierGap = getTierGap(currentTier, item.tierRequired);
  const pointsGap = Math.max(0, item.pointsRequired - contractor.availablePoints);
  const claimStatus = latestClaim?.status;
  const showClaimState = claimStatus === "CHOSEN" || claimStatus === "FULFILLED";
  const images = item.images
    .map((image) => resolveMediaUrlForRead(image.imageUrl))
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl));
  const fallbackImage = resolveMediaUrlForRead(item.imageUrl);
  const primaryImage = images[0] ?? fallbackImage;
  const status = claimStatus === "CHOSEN" || claimStatus === "FULFILLED"
    ? claimStatus
    : pointsGap === 0 && !tierGap
      ? "ELIGIBLE"
      : "LOCKED";

  return {
    rewardId: item.id,
    name: item.name,
    pointsRequired: item.pointsRequired,
    status,
    pointsGap,
    displayValue: `${item.pointsRequired.toLocaleString("en-IN")} points`,
    ...(item.description ? { description: item.description } : {}),
    ...(primaryImage ? { imageUrl: primaryImage } : {}),
    ...(images.length > 0 ? { images } : {}),
    ...(item.tierRequired ? { tierRequired: item.tierRequired } : {}),
    ...(tierGap ? { tierGap } : {}),
    ...(showClaimState && latestClaim?.claimId ? { claimId: latestClaim.claimId } : {}),
    ...(showClaimState ? { claimStatus } : {}),
  };
}

function shouldShowInContractorCatalog(
  item: RewardCatalogAdminRecord,
  latestClaim?: { readonly status: string },
): boolean {
  if (latestClaim?.status === "CHOSEN" || latestClaim?.status === "FULFILLED") {
    return true;
  }
  const stock = getCatalogStock(item);
  return item.status === "ACTIVE" && item.images.length > 0 && stock.availableQuantity > 0;
}

function assertRewardEligibility(
  contractor: { readonly availablePoints: number; readonly totalAccumulatedPoints: number },
  reward: { readonly pointsRequired: number; readonly tierRequired: string | null },
): void {
  if (contractor.availablePoints < reward.pointsRequired) {
    throw new BadRequestException("Contractor does not have enough points.");
  }

  const tierGap = getTierGap(getTier(contractor.totalAccumulatedPoints), reward.tierRequired);
  if (tierGap) {
    throw new BadRequestException(`Reward unlocks at ${tierGap} tier.`);
  }
}

function getTierGap(currentTier: RewardTier, requiredTier?: string | null): string | undefined {
  if (!requiredTier) {
    return undefined;
  }
  const requiredRank = tierRank.get(toRewardTier(requiredTier));
  const currentRank = tierRank.get(currentTier);
  if (requiredRank === undefined || currentRank === undefined || currentRank < requiredRank) {
    return requiredTier;
  }
  return undefined;
}

function toRewardTier(value: string): RewardTier {
  const normalized = value.trim().toLowerCase();
  const match = tierRules.find((tier) => tier.name.toLowerCase() === normalized);
  return match?.name ?? "Diamond";
}

function getUnavailableClaimMessage(status: string): string {
  if (status === "CANCELLED_BY_CONTRACTOR" || status === "REVOKED_DUE_TO_RETURN") {
    return staleClaimMessage;
  }
  if (status === "FULFILLED") {
    return "Reward is already Delivered.";
  }
  return "Only Claim Raised reward requests can be fulfilled.";
}

function mapBalance(contractor: {
  readonly totalAccumulatedPoints: number;
  readonly availablePoints: number;
}): RewardMutationResponse["balance"] {
  return {
    currentTier: getTier(contractor.totalAccumulatedPoints),
    totalAccumulatedPoints: contractor.totalAccumulatedPoints,
    pointsAvailable: contractor.availablePoints,
  };
}

function mapClaim(claim: {
  readonly id: string;
  readonly claimId: string;
  readonly contractorId: string;
  readonly rewardItemId: string;
  readonly rewardItem: { readonly name: string };
  readonly status: string;
  readonly pointsDeducted: number;
  readonly chosenAt: Date;
  readonly cancelledAt: Date | null;
  readonly fulfilledAt: Date | null;
  readonly otpVerifiedAt: Date | null;
}): RewardClaimResponse {
  return {
    rewardClaimId: claim.id,
    claimId: claim.claimId,
    contractorId: claim.contractorId,
    rewardId: claim.rewardItemId,
    rewardName: claim.rewardItem.name,
    status: claim.status,
    pointsDeducted: claim.pointsDeducted,
    chosenAt: claim.chosenAt,
    ...(claim.cancelledAt ? { cancelledAt: claim.cancelledAt } : {}),
    ...(claim.fulfilledAt ? { fulfilledAt: claim.fulfilledAt } : {}),
    ...(claim.otpVerifiedAt ? { otpVerifiedAt: claim.otpVerifiedAt } : {}),
  };
}

function mapBalanceBookEntry(entry: {
  readonly id: string;
  readonly type: string;
  readonly pointsDelta: number;
  readonly balanceAfter: number;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly rewardClaimId: string | null;
  readonly qrUnitId: string | null;
  readonly createdAt: Date;
  readonly rewardClaim?: {
    readonly claimId: string;
    readonly rewardItem: { readonly name: string };
  } | null;
}): BalanceBookEntry {
  return {
    ledgerEntryId: entry.id,
    type: entry.type,
    pointsDelta: entry.pointsDelta,
    balanceAfter: entry.balanceAfter,
    sourceType: entry.sourceType,
    sourceId: entry.sourceId,
    createdAt: entry.createdAt,
    negativeBalance: entry.balanceAfter < 0,
    ...(entry.rewardClaimId ? { rewardClaimId: entry.rewardClaimId } : {}),
    ...(entry.rewardClaim?.claimId ? { claimId: entry.rewardClaim.claimId } : {}),
    ...(entry.rewardClaim?.rewardItem.name ? { rewardName: entry.rewardClaim.rewardItem.name } : {}),
    ...(entry.qrUnitId ? { qrUnitId: entry.qrUnitId } : {}),
  };
}

function mapAdminLookup(claim: {
  readonly id: string;
  readonly claimId: string;
  readonly contractorId: string;
  readonly rewardItemId: string;
  readonly rewardItem: { readonly name: string };
  readonly status: string;
  readonly pointsDeducted: number;
  readonly chosenAt: Date;
  readonly cancelledAt: Date | null;
  readonly fulfilledAt: Date | null;
  readonly otpVerifiedAt: Date | null;
  readonly contractor: {
    readonly id: string;
    readonly code: string;
    readonly totalAccumulatedPoints: number;
    readonly availablePoints: number;
    readonly user: {
      readonly displayName: string;
      readonly mobileNumber: string;
    };
  };
}): AdminRewardClaimLookup {
  return {
    claim: mapClaim(claim),
    contractor: {
      contractorId: claim.contractor.id,
      contractorCode: claim.contractor.code,
      name: claim.contractor.user.displayName,
      mobileNumber: claim.contractor.user.mobileNumber,
      currentTier: getTier(claim.contractor.totalAccumulatedPoints),
      totalAccumulatedPoints: claim.contractor.totalAccumulatedPoints,
      pointsAvailable: claim.contractor.availablePoints,
    },
    canSendOtp: claim.status === "CHOSEN",
    canFulfill: claim.status === "CHOSEN",
  };
}

function mapAdminCatalogItem(item: RewardCatalogAdminRecord): AdminRewardCatalogItem {
  const stock = getCatalogStock(item);
  const images = item.images.map((image) => ({
    imageId: image.id,
    imageUrl: resolveMediaUrlForRead(image.imageUrl) ?? image.imageUrl,
    ...(image.storagePath ? { storagePath: image.storagePath } : {}),
    ...(image.altText ? { altText: image.altText } : {}),
    sortOrder: image.sortOrder,
  }));
  const primaryImage = images[0]?.imageUrl ?? resolveMediaUrlForRead(item.imageUrl);
  const readinessIssues = getCatalogReadinessIssues(item, stock);

  return {
    rewardId: item.id,
    code: item.code,
    name: item.name,
    quickDescription: item.description ?? "",
    cashValueInr: item.cashValueInr,
    pointsRequired: item.pointsRequired,
    totalQuantity: item.totalQuantity,
    reservedQuantity: stock.reservedQuantity,
    deliveredQuantity: stock.deliveredQuantity,
    availableQuantity: stock.availableQuantity,
    status: item.status,
    images,
    readinessIssues,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    ...(primaryImage ? { imageUrl: primaryImage } : {}),
  };
}

function getCatalogStock(item: RewardCatalogCurrentRecord): {
  readonly reservedQuantity: number;
  readonly deliveredQuantity: number;
  readonly committedQuantity: number;
  readonly availableQuantity: number;
} {
  const reservedQuantity = item.rewardClaims.filter((claim) => claim.status === "CHOSEN").length;
  const deliveredQuantity = item.rewardClaims.filter((claim) => claim.status === "FULFILLED").length;
  const committedQuantity = reservedQuantity + deliveredQuantity;
  return {
    reservedQuantity,
    deliveredQuantity,
    committedQuantity,
    availableQuantity: Math.max(0, item.totalQuantity - committedQuantity),
  };
}

function getCatalogReadinessIssues(
  item: RewardCatalogCurrentRecord,
  stock = getCatalogStock(item),
): readonly string[] {
  const issues: string[] = [];
  if (item.images.length === 0) {
    issues.push("At least one image is required before publish.");
  }
  if (item.totalQuantity <= 0) {
    issues.push("Quantity must be greater than zero.");
  }
  if (stock.availableQuantity <= 0) {
    issues.push("Sold out.");
  }
  if (item.pointsRequired <= 0) {
    issues.push("Reward points must be greater than zero.");
  }
  if (item.cashValueInr <= 0) {
    issues.push("Internal INR value must be greater than zero.");
  }
  return issues;
}

function normalizeCatalogWriteInput(
  input: RewardCatalogWriteInput,
  options: { readonly requireAll: boolean; readonly current?: RewardCatalogCurrentRecord },
): {
  readonly code: string;
  readonly name: string;
  readonly quickDescription: string;
  readonly cashValueInr: number;
  readonly pointsRequired: number;
  readonly totalQuantity: number;
  readonly status: AdminRewardCatalogStatus;
} {
  const current = options.current;
  const code = normalizeCatalogCode(input.code ?? current?.code ?? "");
  const name = normalizeRequiredText(input.name ?? current?.name ?? "", "Reward name");
  const quickDescription = normalizeRequiredText(
    input.quickDescription ?? current?.description ?? "",
    "Quick description",
  );
  const cashValueInr = normalizePositiveInteger(input.cashValueInr ?? current?.cashValueInr, "Reward value in INR");
  const pointsRequired = normalizePositiveInteger(input.pointsRequired ?? current?.pointsRequired, "Reward points");
  const totalQuantity = normalizePositiveInteger(input.totalQuantity ?? current?.totalQuantity, "Quantity");
  const status = normalizeCatalogStatus(input.status ?? current?.status ?? "DRAFT");

  if (options.requireAll && (!input.name || !input.quickDescription)) {
    throw new BadRequestException("Reward name and quick description are required.");
  }

  return {
    code,
    name,
    quickDescription,
    cashValueInr,
    pointsRequired,
    totalQuantity,
    status,
  };
}

async function generateRewardCatalogCode(prisma: PrismaService, name: string): Promise<string> {
  const slug = normalizeRequiredText(name, "Reward name")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "REWARD";

  for (let attempt = 1; attempt <= 999; attempt += 1) {
    const code = `RW-${slug}-${String(attempt).padStart(3, "0")}`;
    const existing = await prisma.rewardCatalogItem.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) {
      return code;
    }
  }

  throw new BadRequestException("Could not generate a unique reward code. Try a more specific reward name.");
}

async function assertCodeAvailable(prisma: PrismaService, code: string, excludeRewardId?: string): Promise<void> {
  const existing = await prisma.rewardCatalogItem.findUnique({
    where: { code },
    select: { id: true },
  });
  if (existing && existing.id !== excludeRewardId) {
    throw new BadRequestException("Reward code already exists.");
  }
}

function parseRewardImageInput(
  input: RewardCatalogImageInput,
  rewardName: string,
): {
  readonly fileName: string;
  readonly contentType: string;
  readonly dataBase64: string;
  readonly altText: string;
} {
  const dataUrl = input.dataUrl?.trim();
  const match = dataUrl?.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new BadRequestException("Upload a PNG, JPG, or JPEG image.");
  }
  const contentType = match[1] ?? "";
  const dataBase64 = match[2] ?? "";
  return {
    fileName: input.fileName?.trim() || `${rewardName}.png`,
    contentType,
    dataBase64,
    altText: input.altText?.trim() || rewardName,
  };
}

function parseCatalogCsv(csv: string): readonly { readonly rowNumber: number; readonly cells: readonly string[] }[] {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new BadRequestException("CSV must include a header and at least one reward row.");
  }

  const headers = parseCsvLine(lines[0] ?? "").map((header) => header.trim());
  const requiredHeaders = ["rewardCode", "rewardName", "quickDescription", "rewardValueInr", "pointsRequired", "quantity", "status"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new BadRequestException(`CSV missing required columns: ${missingHeaders.join(", ")}.`);
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const byHeader = headers.map((header, headerIndex) => `${header}=${values[headerIndex] ?? ""}`);
    return { rowNumber: index + 2, cells: byHeader };
  });
}

function buildCsvPreviewRow(
  row: { readonly rowNumber: number; readonly cells: readonly string[] },
  existingCodes: ReadonlySet<string>,
  seenCodes: Set<string>,
): RewardCatalogCsvPreviewRow {
  const values = Object.fromEntries(row.cells.map((cell) => {
    const separatorIndex = cell.indexOf("=");
    return [cell.slice(0, separatorIndex), cell.slice(separatorIndex + 1)];
  }));
  const errors: string[] = [];
  const warnings: string[] = [];
  const code = normalizeCsvCode(values.rewardCode, errors);
  const codeKey = code.toLowerCase();
  if (seenCodes.has(codeKey)) {
    errors.push("Duplicate rewardCode in CSV.");
  }
  seenCodes.add(codeKey);
  const name = normalizeCsvText(values.rewardName, "rewardName", errors);
  const quickDescription = normalizeCsvText(values.quickDescription, "quickDescription", errors);
  const cashValueInr = normalizeCsvInteger(values.rewardValueInr, "rewardValueInr", errors);
  const pointsRequired = normalizeCsvInteger(values.pointsRequired, "pointsRequired", errors);
  const totalQuantity = normalizeCsvInteger(values.quantity, "quantity", errors);
  const requestedStatus = normalizeCsvStatus(values.status, errors);
  if (requestedStatus === "ACTIVE") {
    warnings.push("Rows committed as ACTIVE still require at least one image; image-less rows are saved as draft.");
  }

  return {
    rowNumber: row.rowNumber,
    code,
    name,
    quickDescription,
    cashValueInr,
    pointsRequired,
    totalQuantity,
    requestedStatus,
    operation: existingCodes.has(codeKey) ? "UPDATE" : "CREATE",
    errors,
    warnings,
  };
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeCatalogCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{1,39}$/.test(normalized)) {
    throw new BadRequestException("Reward code must be 2-40 characters using letters, numbers, dot, dash, or underscore.");
  }
  return normalized;
}

function normalizeRequiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length < 2) {
    throw new BadRequestException(`${label} is required.`);
  }
  return normalized;
}

function normalizePositiveInteger(value: number | undefined, label: string): number {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new BadRequestException(`${label} must be a positive whole number.`);
  }
  return normalized;
}

function normalizeCatalogStatus(value: string): AdminRewardCatalogStatus {
  const normalized = value.trim().toUpperCase();
  if (normalized !== "DRAFT" && normalized !== "ACTIVE" && normalized !== "INACTIVE") {
    throw new BadRequestException("Reward status must be DRAFT, ACTIVE, or INACTIVE.");
  }
  return normalized;
}

function normalizeCsvCode(value: string | undefined, errors: string[]): string {
  try {
    return normalizeCatalogCode(value ?? "");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Invalid rewardCode.");
    return (value ?? "").trim().toUpperCase();
  }
}

function normalizeCsvText(value: string | undefined, field: string, errors: string[]): string {
  const normalized = (value ?? "").trim();
  if (normalized.length < 2) {
    errors.push(`${field} is required.`);
  }
  return normalized;
}

function normalizeCsvInteger(value: string | undefined, field: string, errors: string[]): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    errors.push(`${field} must be a positive whole number.`);
    return 0;
  }
  return parsed;
}

function normalizeCsvStatus(value: string | undefined, errors: string[]): AdminRewardCatalogStatus {
  try {
    return normalizeCatalogStatus(value || "DRAFT");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Invalid status.");
    return "DRAFT";
  }
}

function requireContractorScope(actor: AuthenticatedActor): string {
  if (actor.role !== ACTOR_ROLE.CONTRACTOR || !actor.contractorId) {
    throw new UnauthorizedException("Contractor reward scope is required.");
  }
  return actor.contractorId;
}

function clampLimit(limit?: string): number {
  const parsed = Number(limit ?? 50);
  if (!Number.isFinite(parsed)) {
    return 50;
  }
  return Math.min(100, Math.max(1, Math.trunc(parsed)));
}

function normalizeLedgerType(type?: string): PointsLedgerTypeValue | undefined {
  if (!type) {
    return undefined;
  }
  const normalized = type.trim().toUpperCase();
  if (!Object.values(PointsLedgerType).includes(normalized as PointsLedgerTypeValue)) {
    throw new BadRequestException("Unsupported balance book type filter.");
  }
  return normalized as PointsLedgerTypeValue;
}

function parseOptionalDate(value: string | undefined, field: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`Invalid ${field} date.`);
  }
  return parsed;
}

function assertOtpOrBadRequest(value: string): void {
  try {
    assertValidOtp(value);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({ message: error.message, code: error.code });
    }
    throw error;
  }
}

function hashOtp(otp: string): string {
  return hashSecret("reward-fulfillment-otp", otp);
}

function hashSecret(kind: string, value: string): string {
  return `sha256:${kind}:${createHash("sha256").update(`volt-rewards:${kind}:${value}`).digest("hex")}`;
}

function verifyHash(value: string, expectedHash: string): boolean {
  const [, kind] = expectedHash.split(":");
  if (!kind) {
    return false;
  }
  const actualHash = hashSecret(kind, value);
  const expected = Buffer.from(expectedHash);
  const actual = Buffer.from(actualHash);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function isRewardFulfillmentChallenge(deviceContext: Prisma.JsonValue, claimId: string): boolean {
  if (!deviceContext || typeof deviceContext !== "object" || Array.isArray(deviceContext)) {
    return false;
  }
  return deviceContext.purpose === "REWARD_FULFILLMENT" && deviceContext.claimId === claimId;
}
