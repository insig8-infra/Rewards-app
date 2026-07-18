import { Injectable } from "@nestjs/common";
import {
  BUSY_RETURN_ALLOCATION_TYPE,
  DomainError,
  resolveItemCodeStatus,
  allocateBusyReturnLine,
  type BusyReturnAllocationType,
} from "@volt-rewards/domain";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import type {
  BusyImportRepository,
  BusyInvoiceImport,
  BusyInvoiceLineImport,
  BusyInvoiceParty,
  BusyReturnVoucherImport,
  ImportedBusyInvoice,
  ImportedBusyReturnVoucher,
} from "./busy-import.repository.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class PrismaBusyImportRepository implements BusyImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestInvoiceSyncAt(): Promise<Date | null> {
    const latestSync = await this.prisma.auditEvent.findFirst({
      where: {
        action: "BUSY_MOCK_IMPORT",
        targetType: "BUSY_INVOICE",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    return latestSync?.createdAt ?? null;
  }

  async upsertInvoiceWithQrPlaceholders(
    invoice: BusyInvoiceImport,
    importedAt: Date,
    actor?: AuthenticatedActor,
  ): Promise<ImportedBusyInvoice> {
    return this.prisma.$transaction(async (tx) => {
      const busyInvoice = await tx.busyInvoice.upsert({
        where: { externalInvoiceId: invoice.externalInvoiceId },
        create: {
          externalInvoiceId: invoice.externalInvoiceId,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          importedAt,
          rawSource: buildInvoiceRawSource(invoice),
          ...(invoice.customerRef ? { customerRef: invoice.customerRef } : {}),
          totalAmount: invoice.finalTotal,
        },
        update: {
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          rawSource: buildInvoiceRawSource(invoice),
          ...(invoice.customerRef ? { customerRef: invoice.customerRef } : {}),
          totalAmount: invoice.finalTotal,
        },
      });

      const maxUnitIndex = await tx.qrUnit.aggregate({
        where: { invoiceId: busyInvoice.id },
        _max: { unitIndex: true },
      });
      let nextInvoiceUnitIndex = (maxUnitIndex._max.unitIndex ?? 0) + 1;
      let qrUnitCount = 0;
      for (const [lineIndex, line] of invoice.lines.entries()) {
        const busyLine = await tx.busyInvoiceLine.upsert({
          where: {
            invoiceId_externalLineId: {
              invoiceId: busyInvoice.id,
              externalLineId: line.externalLineId,
            },
          },
          create: {
            invoiceId: busyInvoice.id,
            externalLineId: line.externalLineId,
            sku: line.sku,
            productName: line.productName,
            quantity: line.quantity,
            returnedQty: line.returnedQty,
            pointsPerUnit: line.pointsPerUnit,
            rawSource: buildLineRawSource(line, lineIndex),
            ...(line.category ? { category: line.category } : {}),
          },
          update: {
            sku: line.sku,
            productName: line.productName,
            quantity: line.quantity,
            returnedQty: line.returnedQty,
            pointsPerUnit: line.pointsPerUnit,
            rawSource: buildLineRawSource(line, lineIndex),
            ...(line.category ? { category: line.category } : {}),
          },
        });

        const existingItemCode = await tx.itemCode.findUnique({
          where: { tempItemCode: line.sku },
          select: {
            fixedPoints: true,
            percentOfPricePoints: true,
          },
        });
        if (existingItemCode) {
          await tx.itemCode.update({
            where: { tempItemCode: line.sku },
            data: {
              itemName: line.productName,
              productCategory: line.category ?? null,
              price: line.unitRate,
              status: resolveItemCodeStatus({
                busyActive: true,
                fixedPoints: existingItemCode.fixedPoints,
                percentOfPricePoints: existingItemCode.percentOfPricePoints
                  ? Number(existingItemCode.percentOfPricePoints)
                  : null,
              }),
              busyActive: true,
              lastBusySyncAt: importedAt,
              missingSince: null,
              sourcePriceField: "Price",
              rawSource: buildItemCodeRawSource(line),
            },
          });
        } else {
          await tx.itemCode.create({
            data: {
              tempItemCode: line.sku,
              itemName: line.productName,
              productCategory: line.category ?? null,
              price: line.unitRate,
              fixedPoints: line.pointsPerUnit > 0 ? line.pointsPerUnit : null,
              percentOfPricePoints: null,
              status: resolveItemCodeStatus({
                busyActive: true,
                fixedPoints: line.pointsPerUnit > 0 ? line.pointsPerUnit : null,
              }),
              busyActive: true,
              lastBusySyncAt: importedAt,
              sourcePriceField: "Price",
              rawSource: buildItemCodeRawSource(line),
            },
          });
        }

        const existingUnits = await tx.qrUnit.count({
          where: {
            invoiceId: busyInvoice.id,
            invoiceLineId: busyLine.id,
          },
        });

        const unitsToCreate = Math.max(0, line.quantity - existingUnits);
        if (unitsToCreate > 0) {
          await tx.qrUnit.createMany({
            data: Array.from({ length: unitsToCreate }, (_, offset) => ({
              invoiceId: busyInvoice.id,
              invoiceLineId: busyLine.id,
              unitIndex: nextInvoiceUnitIndex + offset,
              productSku: line.sku,
              points: line.pointsPerUnit,
              status: "NOT_PRINTED" as const,
            })),
          });
          nextInvoiceUnitIndex += unitsToCreate;
        }
      }

      qrUnitCount = await tx.qrUnit.count({
        where: { invoiceId: busyInvoice.id },
      });

      await tx.auditEvent.create({
        data: {
          ...(actor ? { actorRole: actor.role } : { actorRole: "SYSTEM" }),
          surface: actor ? "ADMIN_WEB" : "BACKEND_JOB",
          action: "BUSY_MOCK_IMPORT",
          targetType: "BUSY_INVOICE",
          targetId: busyInvoice.id,
          ...(actor?.userId ? { actorUserId: actor.userId } : {}),
          metadata: {
            externalInvoiceId: invoice.externalInvoiceId,
            lineCount: invoice.lines.length,
            qrUnitCount,
          },
          createdAt: importedAt,
        },
      });

      return {
        invoiceId: busyInvoice.id,
        externalInvoiceId: busyInvoice.externalInvoiceId,
        invoiceNumber: busyInvoice.invoiceNumber,
        lineCount: invoice.lines.length,
        qrUnitCount,
      };
    });
  }

  async upsertReturnVoucherWithAllocations(
    returnVoucher: BusyReturnVoucherImport,
    importedAt: Date,
    actor?: AuthenticatedActor,
  ): Promise<ImportedBusyReturnVoucher> {
    return this.prisma.$transaction(async (tx) => {
      const existingReturn = await tx.busyReturnVoucher.findUnique({
        where: { externalReturnId: returnVoucher.externalReturnId },
        include: {
          lines: {
            include: {
              allocations: true,
            },
          },
        },
      });

      if (existingReturn) {
        return {
          returnVoucherId: existingReturn.id,
          externalReturnId: existingReturn.externalReturnId,
          returnNumber: existingReturn.returnNumber,
          originalInvoiceId: existingReturn.originalInvoiceId,
          lineCount: existingReturn.lines.length,
          allocationCount: existingReturn.lines.reduce((total, line) => total + line.allocations.length, 0),
          reviewNeededCount: existingReturn.lines.reduce(
            (total, line) =>
              total +
              line.allocations.filter((allocation) => allocation.type === "SCANNED_REVIEW_NEEDED").length,
            0,
          ),
        };
      }

      const originalInvoice = await tx.busyInvoice.findUnique({
        where: { externalInvoiceId: returnVoucher.originalExternalInvoiceId },
      });

      if (!originalInvoice) {
        throw new DomainError(
          "BUSY_RETURN_ORIGINAL_INVOICE_NOT_FOUND",
          "Return voucher did not match an imported original sale invoice.",
        );
      }

      const allocationPlans: {
        readonly line: BusyReturnVoucherImport["lines"][number];
        readonly originalInvoiceLineId?: string;
        readonly allocations: readonly {
          readonly originalInvoiceLineId: string;
          readonly qrUnitId: string;
          readonly quantity: 1;
          readonly type: BusyReturnAllocationType;
        }[];
        readonly pooledByItemCode: boolean;
      }[] = [];
      const pendingReturnedByLine = new Map<string, number>();
      const reservedQrUnitIds = new Set<string>();

      for (const line of returnVoucher.lines) {
        const candidateLines = await tx.busyInvoiceLine.findMany({
          where: {
            invoiceId: originalInvoice.id,
            ...(line.originalExternalLineId ? { externalLineId: line.originalExternalLineId } : { sku: line.sku }),
          },
          include: {
            returnAllocations: { select: { quantity: true } },
            qrUnits: {
              orderBy: { unitIndex: "asc" },
              select: {
                id: true,
                status: true,
                returnAllocations: { select: { id: true } },
              },
            },
          },
        });

        const pooledByItemCode = !line.originalExternalLineId && candidateLines.length > 1;
        const allocation = allocateBusyReturnLine({
          returnedQuantity: line.quantity,
          pooledByItemCode,
          candidates: candidateLines.map((candidateLine) => ({
            originalInvoiceLineId: candidateLine.id,
            soldQuantity: candidateLine.quantity,
            alreadyReturnedQuantity:
              candidateLine.returnAllocations.reduce((total, item) => total + item.quantity, 0) +
              (pendingReturnedByLine.get(candidateLine.id) ?? 0),
            qrUnits: candidateLine.qrUnits
              .filter((qrUnit) => qrUnit.returnAllocations.length === 0)
              .filter((qrUnit) => !reservedQrUnitIds.has(qrUnit.id))
              .map((qrUnit) => ({
                qrUnitId: qrUnit.id,
                status: qrUnit.status,
              })),
          })),
        });

        for (const item of allocation.allocations) {
          pendingReturnedByLine.set(
            item.originalInvoiceLineId,
            (pendingReturnedByLine.get(item.originalInvoiceLineId) ?? 0) + item.quantity,
          );
          reservedQrUnitIds.add(item.qrUnitId);
        }

        allocationPlans.push({
          line,
          ...(line.originalExternalLineId && candidateLines.length === 1
            ? { originalInvoiceLineId: candidateLines[0]!.id }
            : {}),
          allocations: allocation.allocations,
          pooledByItemCode: allocation.pooledByItemCode,
        });
      }

      const createdReturn = await tx.busyReturnVoucher.create({
        data: {
          externalReturnId: returnVoucher.externalReturnId,
          returnNumber: returnVoucher.returnNumber,
          returnDate: returnVoucher.returnDate,
          originalInvoiceId: originalInvoice.id,
          rawSource: buildReturnRawSource(returnVoucher),
          importedAt,
        },
      });

      let allocationCount = 0;
      let reviewNeededCount = 0;
      for (const plan of allocationPlans) {
        const returnLine = await tx.busyReturnVoucherLine.create({
          data: {
            returnVoucherId: createdReturn.id,
            externalReturnLineId: plan.line.externalReturnLineId,
            ...(plan.originalInvoiceLineId ? { originalInvoiceLineId: plan.originalInvoiceLineId } : {}),
            sku: plan.line.sku,
            productName: plan.line.productName,
            ...(plan.line.category ? { category: plan.line.category } : {}),
            unit: plan.line.unit,
            quantity: plan.line.quantity,
            rawSource: buildReturnLineRawSource(plan.line),
          },
        });

        for (const allocation of plan.allocations) {
          await tx.busyReturnAllocation.create({
            data: {
              returnLineId: returnLine.id,
              originalInvoiceLineId: allocation.originalInvoiceLineId,
              qrUnitId: allocation.qrUnitId,
              quantity: allocation.quantity,
              type: allocation.type,
              metadata: {
                pooledByItemCode: plan.pooledByItemCode,
                originalExternalLineId: plan.line.originalExternalLineId ?? null,
              },
            },
          });
          allocationCount += 1;
          if (allocation.type === BUSY_RETURN_ALLOCATION_TYPE.SCANNED_REVIEW_NEEDED) {
            reviewNeededCount += 1;
          }
        }
      }

      await updateInvoiceReturnStatus(tx, originalInvoice.id);

      await tx.auditEvent.create({
        data: {
          ...(actor ? { actorRole: actor.role } : { actorRole: "SYSTEM" }),
          surface: actor ? "ADMIN_WEB" : "BACKEND_JOB",
          action: "BUSY_RETURN_IMPORT",
          targetType: "BUSY_RETURN_VOUCHER",
          targetId: createdReturn.id,
          ...(actor?.userId ? { actorUserId: actor.userId } : {}),
          metadata: {
            externalReturnId: returnVoucher.externalReturnId,
            originalExternalInvoiceId: returnVoucher.originalExternalInvoiceId,
            lineCount: returnVoucher.lines.length,
            allocationCount,
            reviewNeededCount,
          },
          createdAt: importedAt,
        },
      });

      return {
        returnVoucherId: createdReturn.id,
        externalReturnId: createdReturn.externalReturnId,
        returnNumber: createdReturn.returnNumber,
        originalInvoiceId: originalInvoice.id,
        lineCount: returnVoucher.lines.length,
        allocationCount,
        reviewNeededCount,
      };
    });
  }
}

async function updateInvoiceReturnStatus(
  tx: {
    busyInvoiceLine: {
      findMany: (args: {
        readonly where: { readonly invoiceId: string };
        readonly include: { readonly returnAllocations: { readonly select: { readonly quantity: true } } };
      }) => Promise<readonly { readonly quantity: number; readonly returnAllocations: readonly { readonly quantity: number }[] }[]>;
    };
    busyInvoice: { update: (args: { readonly where: { readonly id: string }; readonly data: { readonly status: "IMPORTED" | "PARTIALLY_RETURNED" | "RETURNED" } }) => Promise<unknown> };
  },
  invoiceId: string,
): Promise<void> {
  const lines = await tx.busyInvoiceLine.findMany({
    where: { invoiceId },
    include: { returnAllocations: { select: { quantity: true } } },
  });
  const soldQuantity = lines.reduce((total, line) => total + line.quantity, 0);
  const returnedQuantity = lines.reduce(
    (total, line) => total + line.returnAllocations.reduce((lineTotal, item) => lineTotal + item.quantity, 0),
    0,
  );

  await tx.busyInvoice.update({
    where: { id: invoiceId },
    data: {
      status: returnedQuantity === 0 ? "IMPORTED" : returnedQuantity >= soldQuantity ? "RETURNED" : "PARTIALLY_RETURNED",
    },
  });
}

function buildInvoiceRawSource(invoice: BusyInvoiceImport) {
  return {
    externalInvoiceId: invoice.externalInvoiceId,
    tmpVchCode: invoice.externalInvoiceId,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate.toISOString(),
    date: invoice.invoiceDate.toISOString(),
    seller: buildPartyRawSource(invoice.seller),
    customer: buildPartyRawSource(invoice.customer),
    PartyName: invoice.customer.name,
    customerRef: invoice.customerRef ?? null,
    placeOfSupply: invoice.placeOfSupply,
    paymentTerms: invoice.paymentTerms ?? null,
    paymentMode: invoice.paymentMode ?? null,
    salesPerson: invoice.salesPerson ?? null,
    taxableSubtotal: invoice.taxableSubtotal,
    discountTotal: invoice.discountTotal,
    freightTotal: invoice.freightTotal,
    cgstTotal: invoice.cgstTotal,
    sgstTotal: invoice.sgstTotal,
    igstTotal: invoice.igstTotal,
    gstTotal: invoice.gstTotal,
    totalAmount: invoice.totalAmount ?? invoice.finalTotal,
    roundOff: invoice.roundOff,
    finalTotal: invoice.finalTotal,
    amountInWords: invoice.amountInWords ?? null,
  };
}

function buildLineRawSource(line: BusyInvoiceLineImport, lineIndex: number) {
  return {
    externalLineId: line.externalLineId,
    SrNo: lineIndex + 1,
    sku: line.sku,
    tmpItemCode: line.sku,
    productName: line.productName,
    ItemName: line.productName,
    brand: line.brand ?? null,
    category: line.category ?? null,
    hsnCode: line.hsnCode ?? null,
    unit: line.unit,
    quantity: line.quantity,
    Qty: line.quantity,
    returnedQty: line.returnedQty,
    unitRate: line.unitRate,
    Price: line.unitRate,
    taxableValue: line.taxableValue,
    gstRatePercent: line.gstRatePercent,
    cgstAmount: line.cgstAmount,
    sgstAmount: line.sgstAmount,
    igstAmount: line.igstAmount,
    lineTotal: line.lineTotal,
    pointsPerUnit: line.pointsPerUnit,
  };
}

function buildItemCodeRawSource(line: BusyInvoiceLineImport) {
  return {
    tmpItemCode: line.sku,
    ItemName: line.productName,
    Price: line.unitRate,
    Qty: line.quantity,
    category: line.category ?? null,
    unit: line.unit,
    source: "BUSY_API_ADAPTER",
  };
}

function buildReturnRawSource(returnVoucher: BusyReturnVoucherImport) {
  return {
    externalReturnId: returnVoucher.externalReturnId,
    returnNumber: returnVoucher.returnNumber,
    returnDate: returnVoucher.returnDate.toISOString(),
    originalExternalInvoiceId: returnVoucher.originalExternalInvoiceId,
    voucherType: returnVoucher.voucherType,
    customerRef: returnVoucher.customerRef ?? null,
  };
}

function buildReturnLineRawSource(line: BusyReturnVoucherImport["lines"][number]) {
  return {
    externalReturnLineId: line.externalReturnLineId,
    originalExternalLineId: line.originalExternalLineId ?? null,
    sku: line.sku,
    productName: line.productName,
    category: line.category ?? null,
    unit: line.unit,
    quantity: line.quantity,
  };
}

function buildPartyRawSource(party: BusyInvoiceParty) {
  return {
    name: party.name,
    gstin: party.gstin ?? null,
    addressLine1: party.addressLine1,
    addressLine2: party.addressLine2 ?? null,
    city: party.city,
    state: party.state,
    pincode: party.pincode,
    phone: party.phone ?? null,
  };
}
