import { Injectable } from "@nestjs/common";
import { DomainError, resolveItemCodePrintPoints } from "@volt-rewards/domain";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  CommitQrPrintInput,
  PrintedQrUnit,
  QrPrintRepository,
  QrPrintResult,
  ReprintQrInput,
} from "./qr-print.repository.js";

@Injectable()
export class PrismaQrPrintRepository implements QrPrintRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getLineAvailabilities(invoiceId: string, invoiceLineIds: readonly string[]) {
    const lines = await this.prisma.busyInvoiceLine.findMany({
      where: {
        invoiceId,
        id: { in: [...invoiceLineIds] },
      },
      include: {
        qrUnits: {
          where: { status: "NOT_PRINTED" },
          select: { id: true },
        },
        returnAllocations: { select: { quantity: true } },
      },
    });

    return lines.map((line) => ({
      invoiceLineId: line.id,
      totalQuantity: line.quantity,
      returnedQuantity: line.returnAllocations.reduce((total, allocation) => total + allocation.quantity, 0),
      notPrintedQuantity: line.qrUnits.length,
    }));
  }

  async commitQrPrint(input: CommitQrPrintInput): Promise<QrPrintResult> {
    return this.prisma.$transaction(async (tx) => {
      const printedUnits: PrintedQrUnit[] = [];
      const qrUnitIdsToPrint: string[] = [];
      const qrPointBatches: Array<{ readonly qrUnitIds: readonly string[]; readonly points: number }> = [];
      const tokenRows: Array<{
        readonly qrUnitId: string;
        readonly tokenHash: string;
        readonly status: "ACTIVE";
        readonly issuedAt: Date;
      }> = [];

      for (const selection of input.selections) {
        const line = await tx.busyInvoiceLine.findUnique({
          where: { id: selection.invoiceLineId },
          select: { sku: true },
        });
        if (!line) {
          throw new DomainError("QR_PRINT_LINE_NOT_FOUND", "Invoice line is not available for QR printing.");
        }

        const itemCode = await tx.itemCode.findUnique({
          where: { tempItemCode: line.sku },
          select: {
            fixedPoints: true,
            percentOfPricePoints: true,
            price: true,
            status: true,
          },
        });
        if (!itemCode) {
          throw new DomainError("ITEM_CODE_NOT_FOUND_FOR_PRINT", "ItemCode must be synced before QR print.");
        }

        const resolvedPoints = resolveItemCodePrintPoints({
          status: itemCode.status,
          price: Number(itemCode.price),
          fixedPoints: itemCode.fixedPoints,
          percentOfPricePoints: itemCode.percentOfPricePoints ? Number(itemCode.percentOfPricePoints) : null,
        });
        const assignments = input.tokenAssignments.filter(
          (assignment) => assignment.invoiceLineId === selection.invoiceLineId,
        );

        const qrUnits = await tx.qrUnit.findMany({
          where: {
            invoiceId: input.invoiceId,
            invoiceLineId: selection.invoiceLineId,
            status: "NOT_PRINTED",
            returnAllocations: { none: {} },
          },
          orderBy: { unitIndex: "asc" },
          take: selection.quantity,
          select: {
            id: true,
            invoiceLineId: true,
            unitIndex: true,
          },
        });

        if (qrUnits.length !== selection.quantity || assignments.length !== selection.quantity) {
          throw new DomainError(
            "QR_PRINT_QUANTITY_EXCEEDS_AVAILABLE",
            "Print quantity cannot exceed non-returned, not-yet-printed units.",
          );
        }

        qrPointBatches.push({
          qrUnitIds: qrUnits.map((qrUnit) => qrUnit.id),
          points: resolvedPoints,
        });

        for (const [index, qrUnit] of qrUnits.entries()) {
          const assignment = assignments[index];
          if (!assignment) {
            throw new DomainError("QR_PRINT_TOKEN_ASSIGNMENT_MISSING", "QR token assignment was missing.");
          }

          qrUnitIdsToPrint.push(qrUnit.id);
          tokenRows.push({
            qrUnitId: qrUnit.id,
            tokenHash: assignment.tokenHash,
            status: "ACTIVE",
            issuedAt: input.printedAt,
          });

          printedUnits.push({
            qrUnitId: qrUnit.id,
            invoiceLineId: qrUnit.invoiceLineId ?? selection.invoiceLineId,
            unitIndex: qrUnit.unitIndex,
            tokenValue: assignment.tokenValue,
            points: resolvedPoints,
            expiresAt: input.expiresAt,
          });
        }
      }

      if (qrUnitIdsToPrint.length > 0) {
        let updatedCount = 0;
        for (const batch of qrPointBatches) {
          const updateResult = await tx.qrUnit.updateMany({
            where: {
              id: { in: [...batch.qrUnitIds] },
              status: "NOT_PRINTED",
            },
            data: {
              status: "PRINTED_UNCLAIMED",
              printedAt: input.printedAt,
              expiresAt: input.expiresAt,
              points: batch.points,
              ...(input.actorUserId ? { printedByUserId: input.actorUserId } : {}),
            },
          });
          updatedCount += updateResult.count;
        }

        if (updatedCount !== qrUnitIdsToPrint.length) {
          throw new DomainError(
            "QR_PRINT_QUANTITY_EXCEEDS_AVAILABLE",
            "Print quantity cannot exceed non-returned, not-yet-printed units.",
          );
        }

        await tx.qrToken.createMany({
          data: tokenRows,
        });
      }

      await tx.auditEvent.create({
        data: {
          actorRole: input.actorRole,
          surface: "ADMIN_WEB",
          action: "QR_PRINT",
          targetType: "BUSY_INVOICE",
          targetId: input.invoiceId,
          ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
          metadata: {
            printedUnitCount: printedUnits.length,
            lineCount: input.selections.length,
          },
          createdAt: input.printedAt,
        },
      });

      return {
        invoiceId: input.invoiceId,
        printedAt: input.printedAt,
        expiresAt: input.expiresAt,
        printedUnits,
      };
    });
  }

  async reprintQr(input: ReprintQrInput): Promise<PrintedQrUnit> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.qrUnit.findUnique({
        where: { id: input.qrUnitId },
        include: {
          tokens: {
            where: { status: "ACTIVE" },
            orderBy: { issuedAt: "desc" },
            take: 1,
          },
        },
      });

      if (!current) {
        throw new DomainError("QR_REPRINT_NOT_FOUND", "QR unit was not found.");
      }

      if (!isReprintEligibleStatus(current.status)) {
        throw new DomainError("QR_REPRINT_INVALID_STATUS", "Only unscanned printed QR can be reprinted.");
      }

      if (!current.expiresAt || input.reprintedAt > current.expiresAt) {
        throw new DomainError("QR_REPRINT_EXPIRED", "Expired QR cannot be reprinted in v1.");
      }

      const activeToken = current.tokens[0];
      if (!activeToken) {
        throw new DomainError("QR_REPRINT_TOKEN_MISSING", "QR unit has no active token to invalidate.");
      }

      await tx.qrToken.update({
        where: { id: activeToken.id },
        data: {
          status: "INVALIDATED",
          invalidatedAt: input.reprintedAt,
        },
      });

      await tx.qrToken.create({
        data: {
          qrUnitId: current.id,
          tokenHash: input.tokenHash,
          status: "ACTIVE",
          issuedAt: input.reprintedAt,
        },
      });

      await tx.qrUnit.update({
        where: { id: current.id },
        data: { status: "REPRINTED" },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: input.actorRole,
          surface: "ADMIN_WEB",
          action: "QR_REPRINT",
          targetType: "QR_UNIT",
          targetId: current.id,
          ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
          beforeJson: {
            status: current.status,
            activeTokenId: activeToken.id,
          },
          afterJson: {
            status: "REPRINTED",
            replacementIssuedAt: input.reprintedAt.toISOString(),
          },
          metadata: {
            invalidatedTokenId: activeToken.id,
          },
          createdAt: input.reprintedAt,
        },
      });

      return {
        qrUnitId: current.id,
        invoiceLineId: current.invoiceLineId ?? "",
        unitIndex: current.unitIndex,
        tokenValue: input.tokenValue,
        points: current.points,
        expiresAt: current.expiresAt,
      };
    });
  }
}

function isReprintEligibleStatus(status: string): boolean {
  return status === "PRINTED_UNCLAIMED" || status === "REPRINTED";
}
