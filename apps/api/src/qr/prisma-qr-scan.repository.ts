import { Injectable } from "@nestjs/common";
import { DomainError, QR_TOKEN_STATUS, type QrTokenStatus } from "@volt-rewards/domain";
import { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  CommitScanCartInput,
  CommitScanCartResult,
  ContractorPointSnapshot,
  QrScanRepository,
  QrScanReservationResult,
  QrTokenLookup,
  RecordScanAttemptInput,
  ReserveSuccessfulScanInput,
  ScanCartItemSummary,
  ScanCartSummary,
  ScanHistoryEntry,
  ScanHistoryQuery,
} from "./qr-scan.repository.js";

@Injectable()
export class PrismaQrScanRepository implements QrScanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findQrByTokenHash(tokenHash: string): Promise<QrTokenLookup | null> {
    const token = await this.prisma.qrToken.findUnique({
      where: { tokenHash },
      include: {
        qrUnit: true,
      },
    });

    if (!token || !token.qrUnit.expiresAt) {
      return null;
    }

    return {
      tokenHash,
      tokenStatus: token.status as QrTokenStatus,
      qr: {
        id: token.qrUnit.id,
        status: token.qrUnit.status,
        expiresAt: token.qrUnit.expiresAt,
        activeTokenHash: tokenHash,
        points: token.qrUnit.points,
        ...(token.qrUnit.claimedByContractorId ? { contractorId: token.qrUnit.claimedByContractorId } : {}),
        ...(token.qrUnit.siteId ? { siteId: token.qrUnit.siteId } : {}),
      },
    };
  }

  async contractorOwnsActiveSite(contractorId: string, siteId: string): Promise<boolean> {
    const site = await this.prisma.site.findFirst({
      where: {
        id: siteId,
        contractorId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    return Boolean(site);
  }

  async getContractorPoints(contractorId: string): Promise<ContractorPointSnapshot | null> {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id: contractorId },
      select: {
        id: true,
        availablePoints: true,
        totalAccumulatedPoints: true,
      },
    });

    if (!contractor) {
      return null;
    }

    return {
      contractorId: contractor.id,
      availablePoints: contractor.availablePoints,
      totalAccumulatedPoints: contractor.totalAccumulatedPoints,
    };
  }

  async recordScanAttempt(input: RecordScanAttemptInput): Promise<void> {
    const data: Prisma.ScanAttemptUncheckedCreateInput = {
      tokenHashSeen: input.tokenHash,
      actorRole: input.actorRole,
      result: input.result,
      createdAt: input.at,
      ...(input.qrId ? { qrUnitId: input.qrId } : {}),
      ...(input.contractorId ? { contractorId: input.contractorId } : {}),
      ...(input.siteId ? { siteId: input.siteId } : {}),
      ...(input.teamMemberMobile ? { teamMemberMobile: input.teamMemberMobile } : {}),
      ...(input.teamMemberSessionId ? { teamMemberSessionId: input.teamMemberSessionId } : {}),
      ...(input.deviceContext ? { deviceContext: input.deviceContext as Prisma.InputJsonValue } : {}),
      ...(input.failureReason ? { failureReason: input.failureReason } : {}),
      ...(typeof input.qrValuePoints === "number" ? { qrValuePoints: input.qrValuePoints } : {}),
      ...(typeof input.creditedPoints === "number" ? { creditedPoints: input.creditedPoints } : {}),
    };

    await this.prisma.scanAttempt.create({
      data,
    });
  }

  async getActiveScanCart(contractorId: string, siteId: string): Promise<ScanCartSummary | null> {
    const cart = await this.prisma.scanCart.findFirst({
      where: { contractorId, siteId, status: "ACTIVE" },
      include: scanCartInclude,
      orderBy: { lastActivityAt: "desc" },
    });

    return cart ? toCartSummary(cart) : null;
  }

  async reserveSuccessfulScan(input: ReserveSuccessfulScanInput): Promise<QrScanReservationResult> {
    return this.prisma.$transaction(async (tx) => {
      const existingCart = await tx.scanCart.findFirst({
        where: { contractorId: input.contractorId, siteId: input.siteId, status: "ACTIVE" },
        orderBy: { lastActivityAt: "desc" },
      });
      const cart =
        existingCart ??
        (await tx.scanCart.create({
          data: {
            contractorId: input.contractorId,
            siteId: input.siteId,
            actorRole: input.actorRole,
            ...(input.teamMemberMobile ? { teamMemberMobile: input.teamMemberMobile } : {}),
            ...(input.teamMemberSessionId ? { teamMemberSessionId: input.teamMemberSessionId } : {}),
            scanCapPoints: input.scanCapPoints,
            lastActivityAt: input.reservedAt,
          },
        }));

      const qr = await tx.qrUnit.findUnique({
        where: { id: input.qrId },
        select: { id: true, points: true, productSku: true },
      });

      if (!qr) {
        throw new DomainError("QR_TOKEN_INVALID", "QR token is invalid or replaced.");
      }

      const qrUpdate = await tx.qrUnit.updateMany({
        where: {
          id: input.qrId,
          status: { in: ["PRINTED_UNCLAIMED", "REPRINTED"] },
          tokens: {
            some: {
              tokenHash: input.tokenHash,
              status: QR_TOKEN_STATUS.ACTIVE,
            },
          },
        },
        data: {
          status: "RESERVED_IN_CART",
          claimedByContractorId: input.contractorId,
          siteId: input.siteId,
          reservedAt: input.reservedAt,
          reservedCartId: cart.id,
        },
      });

      if (qrUpdate.count !== 1) {
        throw new DomainError("QR_NOT_SCANNABLE", "QR was already claimed or no longer scannable.");
      }

      const scanAttemptData: Prisma.ScanAttemptUncheckedCreateInput = {
        qrUnitId: input.qrId,
        tokenHashSeen: input.tokenHash,
        actorRole: input.actorRole,
        contractorId: input.contractorId,
        siteId: input.siteId,
        ...(input.teamMemberMobile ? { teamMemberMobile: input.teamMemberMobile } : {}),
        ...(input.teamMemberSessionId ? { teamMemberSessionId: input.teamMemberSessionId } : {}),
        ...(input.deviceContext ? { deviceContext: input.deviceContext as Prisma.InputJsonValue } : {}),
        result: "RESERVED",
        qrValuePoints: qr.points,
        creditedPoints: 0,
        createdAt: input.reservedAt,
      };

      const scanAttempt = await tx.scanAttempt.create({ data: scanAttemptData });

      await tx.scanCartItem.create({
        data: {
          scanCartId: cart.id,
          qrUnitId: input.qrId,
          scanAttemptId: scanAttempt.id,
          qrValuePoints: qr.points,
          pointsToCredit: qr.points,
          status: "RESERVED",
          reservedAt: input.reservedAt,
        },
      });

      await tx.scanCart.update({
        where: { id: cart.id },
        data: {
          cartTotalPoints: { increment: qr.points },
          lastActivityAt: input.reservedAt,
        },
      });

      const refreshedCart = await tx.scanCart.findUniqueOrThrow({
        where: { id: cart.id },
        include: scanCartInclude,
      });

      return {
        qrId: input.qrId,
        contractorId: input.contractorId,
        siteId: input.siteId,
        qrValuePoints: qr.points,
        pointsCredited: 0,
        reservedAt: input.reservedAt,
        cart: toCartSummary(refreshedCart),
      };
    });
  }

  async getScanCart(contractorId: string, siteId: string): Promise<ScanCartSummary> {
    return (await this.getActiveScanCart(contractorId, siteId)) ?? emptyCartSummary(contractorId, siteId);
  }

  async commitScanCart(input: CommitScanCartInput): Promise<CommitScanCartResult> {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.scanCart.findFirst({
        where: { contractorId: input.contractorId, siteId: input.siteId, status: "ACTIVE" },
        include: scanCartInclude,
        orderBy: { lastActivityAt: "desc" },
      });
      const contractorBefore = await tx.contractor.findUniqueOrThrow({
        where: { id: input.contractorId },
        select: { availablePoints: true, totalAccumulatedPoints: true },
      });

      if (!cart) {
        return {
          contractorId: input.contractorId,
          siteId: input.siteId,
          pointsCredited: 0,
          balanceAfter: contractorBefore.availablePoints,
          totalAccumulatedPoints: contractorBefore.totalAccumulatedPoints,
          committedAt: input.committedAt,
          committedItems: [],
          cart: emptyCartSummary(input.contractorId, input.siteId),
        };
      }

      const reservedItems = cart.items.filter((item) => item.status === "RESERVED");
      const pointsCredited = reservedItems.reduce((total, item) => total + item.pointsToCredit, 0);
      const qrUnitIds = reservedItems.map((item) => item.qrUnitId);

      if (reservedItems.length > 0) {
        const qrUpdate = await tx.qrUnit.updateMany({
          where: { id: { in: qrUnitIds }, status: "RESERVED_IN_CART", reservedCartId: cart.id },
          data: { status: "SCANNED_CLAIMED", scannedAt: input.committedAt },
        });
        if (qrUpdate.count !== reservedItems.length) {
          throw new DomainError("SCAN_CART_ITEM_INVALIDATED", "One or more reserved QR items can no longer be credited.");
        }

        await tx.scanCartItem.updateMany({
          where: { id: { in: reservedItems.map((item) => item.id) } },
          data: { status: "COMMITTED", committedAt: input.committedAt },
        });

        for (const item of reservedItems) {
          await tx.scanAttempt.update({
            where: { id: item.scanAttemptId },
            data: { result: "SUCCESS", creditedPoints: item.pointsToCredit },
          });
        }
      }

      const contractor = await tx.contractor.update({
        where: { id: input.contractorId },
        data: {
          availablePoints: { increment: pointsCredited },
          totalAccumulatedPoints: { increment: pointsCredited },
        },
        select: {
          availablePoints: true,
          totalAccumulatedPoints: true,
        },
      });

      if (reservedItems.length > 0) {
        await tx.pointsLedgerEntry.createMany({
          data: reservedItems.map((item, index) => ({
            contractorId: input.contractorId,
            type: "SCAN_CREDIT",
            pointsDelta: item.pointsToCredit,
            balanceAfter:
              contractorBefore.availablePoints +
              reservedItems.slice(0, index + 1).reduce((total, entry) => total + entry.pointsToCredit, 0),
            sourceType: "QR_UNIT",
            sourceId: item.qrUnitId,
            qrUnitId: item.qrUnitId,
            idempotencyKey: `scan:${item.qrUnitId}`,
            createdAt: input.committedAt,
          })),
        });
      }

      await tx.scanCart.update({
        where: { id: cart.id },
        data: {
          status: "COMMITTED",
          cartTotalPoints: 0,
          lastActivityAt: input.committedAt,
          committedAt: input.committedAt,
        },
      });

      const committedItems = reservedItems.map((item) =>
        toCartItemSummary({ ...item, status: "COMMITTED", committedAt: input.committedAt }),
      );

      return {
        contractorId: input.contractorId,
        siteId: input.siteId,
        pointsCredited,
        balanceAfter: contractor.availablePoints,
        totalAccumulatedPoints: contractor.totalAccumulatedPoints,
        committedAt: input.committedAt,
        committedItems,
        cart: emptyCartSummary(input.contractorId, input.siteId),
      };
    });
  }

  async listScanHistory(input: ScanHistoryQuery): Promise<readonly ScanHistoryEntry[]> {
    const attempts = await this.prisma.scanAttempt.findMany({
      where: {
        contractorId: input.contractorId,
        ...(input.siteId ? { siteId: input.siteId } : {}),
        ...(input.result ? { result: input.result } : {}),
        ...(input.teamMemberMobile ? { teamMemberMobile: input.teamMemberMobile } : {}),
      },
      include: {
        qrUnit: {
          select: {
            id: true,
            productSku: true,
            points: true,
          },
        },
        site: {
          select: {
            clientName: true,
            flatOrApartmentNo: true,
            buildingName: true,
            area: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: input.limit,
    });

    return attempts.map((attempt) => ({
      scanAttemptId: attempt.id,
      actorRole: attempt.actorRole,
      result: attempt.result,
      createdAt: attempt.createdAt,
      ...(attempt.qrUnitId ? { qrUnitId: attempt.qrUnitId, qrCodeId: attempt.qrUnitId } : {}),
      ...(attempt.qrUnit?.productSku ? { productSku: attempt.qrUnit.productSku } : {}),
          ...(typeof attempt.qrValuePoints === "number" ? { qrValuePoints: attempt.qrValuePoints } : {}),
          ...(typeof attempt.creditedPoints === "number" ? { creditedPoints: attempt.creditedPoints } : {}),
      ...(attempt.teamMemberMobile ? { teamMemberMobile: attempt.teamMemberMobile } : {}),
      ...(attempt.teamMemberSessionId ? { teamMemberSessionId: attempt.teamMemberSessionId } : {}),
      ...(attempt.contractorId ? { contractorId: attempt.contractorId } : {}),
      ...(attempt.siteId ? { siteId: attempt.siteId } : {}),
      ...(attempt.site ? { siteLabel: formatSiteLabel(attempt.site) } : {}),
      ...(attempt.failureReason ? { failureReason: attempt.failureReason } : {}),
    }));
  }
}

const scanCartInclude = {
  items: {
    include: {
      qrUnit: {
        select: {
          id: true,
          productSku: true,
        },
      },
    },
    orderBy: { reservedAt: "asc" },
  },
} satisfies Prisma.ScanCartInclude;

type ScanCartWithItems = Prisma.ScanCartGetPayload<{ include: typeof scanCartInclude }>;
type ScanCartItemWithQr = ScanCartWithItems["items"][number];

function toCartSummary(cart: ScanCartWithItems): ScanCartSummary {
  return {
    cartId: cart.id,
    contractorId: cart.contractorId,
    siteId: cart.siteId,
    status: cart.status,
    cartTotalPoints: cart.cartTotalPoints,
    scanCapPoints: cart.scanCapPoints,
    lastActivityAt: cart.lastActivityAt,
    items: cart.items.map(toCartItemSummary),
  };
}

function toCartItemSummary(item: ScanCartItemWithQr): ScanCartItemSummary {
  return {
    cartItemId: item.id,
    qrUnitId: item.qrUnitId,
    scanAttemptId: item.scanAttemptId,
    ...(item.qrUnit.productSku ? { productSku: item.qrUnit.productSku } : {}),
    qrValuePoints: item.qrValuePoints,
    pointsToCredit: item.pointsToCredit,
    status: item.status,
    reservedAt: item.reservedAt,
    ...(item.committedAt ? { committedAt: item.committedAt } : {}),
    ...(item.invalidationReason ? { invalidationReason: item.invalidationReason } : {}),
  };
}

function emptyCartSummary(contractorId: string, siteId: string): ScanCartSummary {
  return {
    cartId: "",
    contractorId,
    siteId,
    status: "ACTIVE",
    cartTotalPoints: 0,
    scanCapPoints: 0,
    lastActivityAt: new Date(0),
    items: [],
  };
}

function formatSiteLabel(site: {
  readonly clientName: string;
  readonly flatOrApartmentNo: string | null;
  readonly buildingName: string | null;
  readonly area: string | null;
  readonly city: string | null;
}): string {
  return [site.clientName, site.flatOrApartmentNo, site.buildingName, site.area, site.city]
    .filter(Boolean)
    .join(", ");
}
