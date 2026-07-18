import { Injectable } from "@nestjs/common";
import {
  getPrintableQuantity,
  resolveItemCodePrintPoints,
  type ActorRole,
  type ItemCodeStatus,
} from "@volt-rewards/domain";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  AdminWebInvoiceDetail,
  AdminWebInvoiceLine,
  AdminWebInvoiceParty,
  AdminWebInvoiceReturnHistory,
  AdminWebInvoiceReadRepository,
  AdminWebInvoiceSummary,
} from "./admin-web-invoice-read.repository.js";

type JsonRecord = Record<string, unknown>;

@Injectable()
export class PrismaAdminWebInvoiceReadRepository implements AdminWebInvoiceReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listInvoices(): Promise<readonly AdminWebInvoiceSummary[]> {
    const invoices = await this.prisma.busyInvoice.findMany({
      orderBy: { importedAt: "desc" },
      include: {
        lines: {
          orderBy: { externalLineId: "asc" },
          include: {
            qrUnits: {
              orderBy: { unitIndex: "asc" },
              select: {
                id: true,
                unitIndex: true,
                status: true,
                points: true,
                printedAt: true,
                scannedAt: true,
                expiresAt: true,
              },
            },
            returnAllocations: { select: { quantity: true } },
          },
        },
        qrUnits: { select: { status: true } },
        returnVouchers: {
          select: {
            id: true,
            lines: {
              select: {
                allocations: { select: { quantity: true, type: true } },
              },
            },
          },
        },
      },
    });

    return invoices.map((invoice) => {
      const raw = asRecord(invoice.rawSource);
      return buildSummary({
        invoiceId: invoice.id,
        externalInvoiceId: invoice.externalInvoiceId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        importedAt: invoice.importedAt,
        status: invoice.status,
        raw,
        lines: invoice.lines.map((line) => ({
          productName: line.productName,
          category: line.category ?? readString(asRecord(line.rawSource), "category", ""),
          quantity: line.quantity,
          qrStatuses: line.qrUnits.map((qr) => qr.status),
          returnedQuantity: line.returnAllocations.reduce((total, allocation) => total + allocation.quantity, 0),
        })),
        qrStatuses: invoice.qrUnits.map((qr) => qr.status),
        returnVoucherCount: invoice.returnVouchers.length,
        reviewNeededCount: invoice.returnVouchers.reduce(
          (total, voucher) =>
            total +
            voucher.lines.reduce(
              (lineTotal, line) =>
                lineTotal +
                line.allocations
                  .filter((allocation) => allocation.type === "SCANNED_REVIEW_NEEDED")
                  .reduce((allocationTotal, allocation) => allocationTotal + allocation.quantity, 0),
              0,
            ),
          0,
        ),
      });
    });
  }

  async getInvoiceDetail(invoiceId: string): Promise<AdminWebInvoiceDetail | null> {
    const invoice = await this.prisma.busyInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        lines: {
          orderBy: { externalLineId: "asc" },
          include: {
            qrUnits: {
              orderBy: { unitIndex: "asc" },
              select: {
                id: true,
                unitIndex: true,
                status: true,
                points: true,
                printedAt: true,
                scannedAt: true,
                expiresAt: true,
              },
            },
            returnAllocations: { select: { quantity: true } },
          },
        },
        qrUnits: { select: { status: true } },
        returnVouchers: {
          orderBy: { returnDate: "desc" },
          include: {
            lines: {
              orderBy: { externalReturnLineId: "asc" },
              include: {
                allocations: { select: { quantity: true, type: true } },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return null;
    }

    const printEvents = await this.prisma.auditEvent.findMany({
      where: {
        action: "QR_PRINT",
        targetType: "BUSY_INVOICE",
        targetId: invoice.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        actorUser: { select: { displayName: true } },
      },
    });

    const raw = asRecord(invoice.rawSource);
    const summary = buildSummary({
      invoiceId: invoice.id,
      externalInvoiceId: invoice.externalInvoiceId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      importedAt: invoice.importedAt,
      status: invoice.status,
      raw,
      lines: invoice.lines.map((line) => ({
        productName: line.productName,
        category: line.category ?? readString(asRecord(line.rawSource), "category", ""),
        quantity: line.quantity,
        qrStatuses: line.qrUnits.map((qr) => qr.status),
        returnedQuantity: line.returnAllocations.reduce((total, allocation) => total + allocation.quantity, 0),
      })),
      qrStatuses: invoice.qrUnits.map((qr) => qr.status),
      returnVoucherCount: invoice.returnVouchers.length,
      reviewNeededCount: invoice.returnVouchers.reduce(
        (total, voucher) =>
          total +
          voucher.lines.reduce(
            (lineTotal, line) =>
              lineTotal +
              line.allocations
                .filter((allocation) => allocation.type === "SCANNED_REVIEW_NEEDED")
                .reduce((allocationTotal, allocation) => allocationTotal + allocation.quantity, 0),
            0,
          ),
        0,
      ),
    });

    const paymentTerms = readString(raw, "paymentTerms", "");
    const paymentMode = readString(raw, "paymentMode", "");
    const salesPerson = readString(raw, "salesPerson", "");
    const amountInWords = readString(raw, "amountInWords", "");
    const itemCodes = await this.prisma.itemCode.findMany({
      where: { tempItemCode: { in: invoice.lines.map((line) => line.sku) } },
      select: {
        tempItemCode: true,
        fixedPoints: true,
        percentOfPricePoints: true,
        price: true,
        status: true,
      },
    });
    const itemCodeBySku = new Map(itemCodes.map((itemCode) => [itemCode.tempItemCode, itemCode]));

    return {
      ...summary,
      seller: readParty(asRecord(raw.seller), "Volt Electricals"),
      customer: readParty(asRecord(raw.customer), invoice.customerRef ?? "Customer"),
      placeOfSupply: readString(raw, "placeOfSupply", ""),
      ...(paymentTerms ? { paymentTerms } : {}),
      ...(paymentMode ? { paymentMode } : {}),
      ...(salesPerson ? { salesPerson } : {}),
      taxableSubtotal: readString(raw, "taxableSubtotal", "0.00"),
      discountTotal: readString(raw, "discountTotal", "0.00"),
      freightTotal: readString(raw, "freightTotal", "0.00"),
      cgstTotal: readString(raw, "cgstTotal", "0.00"),
      sgstTotal: readString(raw, "sgstTotal", "0.00"),
      igstTotal: readString(raw, "igstTotal", "0.00"),
      totalAmount: readString(raw, "totalAmount", summary.finalTotal),
      roundOff: readString(raw, "roundOff", "0.00"),
      ...(amountInWords ? { amountInWords } : {}),
      lines: invoice.lines.map((line): AdminWebInvoiceLine => {
        const lineRaw = asRecord(line.rawSource);
        const notPrintedQuantity = line.qrUnits.filter((qr) => qr.status === "NOT_PRINTED").length;
        const printedQuantity = line.qrUnits.length - notPrintedQuantity;
        const scannedQuantity = line.qrUnits.filter((qr) => qr.status === "SCANNED_CLAIMED").length;
        const cancelledQuantity = line.qrUnits.filter((qr) => qr.status === "CANCELLED").length;
        const reversedQuantity = line.qrUnits.filter((qr) => qr.status === "REVERSED").length;
        const returnedQty = line.returnAllocations.reduce((total, allocation) => total + allocation.quantity, 0);
        const printableQuantity = getPrintableQuantity({
          invoiceLineId: line.id,
          totalQuantity: line.quantity,
          returnedQuantity: returnedQty,
          notPrintedQuantity,
        });

        const brand = readString(lineRaw, "brand", "");
        const category = readString(lineRaw, "category", line.category ?? "");
        const hsnCode = readString(lineRaw, "hsnCode", "");
        const itemCode = itemCodeBySku.get(line.sku);

        return {
          invoiceLineId: line.id,
          externalLineId: line.externalLineId,
          sku: line.sku,
          productName: line.productName,
          ...(brand ? { brand } : {}),
          ...(category ? { category } : {}),
          ...(hsnCode ? { hsnCode } : {}),
          unit: readString(lineRaw, "unit", "Pcs"),
          quantity: line.quantity,
          returnedQty,
          notPrintedQuantity,
          printedQuantity,
          scannedQuantity,
          cancelledQuantity,
          reversedQuantity,
          printableQuantity,
          pointsPerUnit: itemCode
            ? getItemCodePointPreview({
                status: itemCode.status,
                price: Number(itemCode.price),
                fixedPoints: itemCode.fixedPoints,
                percentOfPricePoints: itemCode.percentOfPricePoints
                  ? Number(itemCode.percentOfPricePoints)
                  : null,
                fallbackPoints: line.pointsPerUnit,
              })
            : line.pointsPerUnit,
          unitRate: readString(lineRaw, "unitRate", "0.00"),
          taxableValue: readString(lineRaw, "taxableValue", "0.00"),
          gstRatePercent: readString(lineRaw, "gstRatePercent", "0.00"),
          cgstAmount: readString(lineRaw, "cgstAmount", "0.00"),
          sgstAmount: readString(lineRaw, "sgstAmount", "0.00"),
          igstAmount: readString(lineRaw, "igstAmount", "0.00"),
          lineTotal: readString(lineRaw, "lineTotal", "0.00"),
          qrUnits: line.qrUnits.map((qr) => ({
            qrUnitId: qr.id,
            unitIndex: qr.unitIndex,
            status: qr.status,
            points: qr.points,
            ...(qr.printedAt ? { printedAt: qr.printedAt } : {}),
            ...(qr.scannedAt ? { scannedAt: qr.scannedAt } : {}),
            ...(qr.expiresAt ? { expiresAt: qr.expiresAt } : {}),
          })),
        };
      }),
      returnHistory: invoice.returnVouchers.map((returnVoucher): AdminWebInvoiceReturnHistory => ({
        returnVoucherId: returnVoucher.id,
        externalReturnId: returnVoucher.externalReturnId,
        returnNumber: returnVoucher.returnNumber,
        returnDate: returnVoucher.returnDate,
        status: returnVoucher.status,
        lines: returnVoucher.lines.map((line) => ({
          returnLineId: line.id,
          externalReturnLineId: line.externalReturnLineId,
          sku: line.sku,
          productName: line.productName,
          unit: line.unit,
          quantity: line.quantity,
          allocationCount: line.allocations.reduce((total, allocation) => total + allocation.quantity, 0),
          reviewNeededCount: line.allocations
            .filter((allocation) => allocation.type === "SCANNED_REVIEW_NEEDED")
            .reduce((total, allocation) => total + allocation.quantity, 0),
        })),
      })),
      printHistory: printEvents.map((event) => {
        const metadata = asRecord(event.metadata);
        return {
          auditEventId: event.id,
          printedAt: event.createdAt,
          actorRole: event.actorRole as ActorRole,
          ...(event.actorUserId ? { actorUserId: event.actorUserId } : {}),
          ...(event.actorUser?.displayName ? { actorName: event.actorUser.displayName } : {}),
          printedUnitCount: readNumber(metadata, "printedUnitCount"),
          lineCount: readNumber(metadata, "lineCount"),
        };
      }),
    };
  }
}

function buildSummary(input: {
  readonly invoiceId: string;
  readonly externalInvoiceId: string;
  readonly invoiceNumber: string;
  readonly invoiceDate: Date;
  readonly importedAt: Date;
  readonly status: string;
  readonly raw: JsonRecord;
  readonly lines: readonly {
    readonly productName: string;
    readonly category: string;
    readonly quantity: number;
    readonly qrStatuses: readonly string[];
    readonly returnedQuantity: number;
  }[];
  readonly qrStatuses: readonly string[];
  readonly returnVoucherCount: number;
  readonly reviewNeededCount: number;
}): AdminWebInvoiceSummary {
  const customer = asRecord(input.raw.customer);
  const notPrintedUnitCount = input.qrStatuses.filter((status) => status === "NOT_PRINTED").length;
  const scannedUnitCount = input.qrStatuses.filter((status) => status === "SCANNED_CLAIMED").length;
  const cancelledUnitCount = input.qrStatuses.filter((status) => status === "CANCELLED").length;
  const reversedUnitCount = input.qrStatuses.filter((status) => status === "REVERSED").length;
  const printedUnitCount = input.qrStatuses.length - notPrintedUnitCount;
  const returnedUnitCount = input.lines.reduce((total, line) => total + line.returnedQuantity, 0);
  const printableUnitCount = input.lines.reduce((total, line) => {
    const notPrintedQuantity = line.qrStatuses.filter((status) => status === "NOT_PRINTED").length;
    return (
      total +
      getPrintableQuantity({
        invoiceLineId: input.invoiceId,
        totalQuantity: line.quantity,
        returnedQuantity: line.returnedQuantity,
        notPrintedQuantity,
      })
    );
  }, 0);
  const customerGstin = readString(customer, "gstin", "");

  return {
    invoiceId: input.invoiceId,
    externalInvoiceId: input.externalInvoiceId,
    invoiceNumber: input.invoiceNumber,
    invoiceDate: input.invoiceDate,
    importedAt: input.importedAt,
    customerName: readString(customer, "name", readString(input.raw, "customerRef", "Customer")),
    ...(customerGstin ? { customerGstin } : {}),
    gstTotal: readString(input.raw, "gstTotal", "0.00"),
    finalTotal: readString(input.raw, "finalTotal", "0.00"),
    lineCount: input.lines.length,
    qrUnitCount: input.qrStatuses.length,
    printableUnitCount,
    printedUnitCount,
    notPrintedUnitCount,
    scannedUnitCount,
    cancelledUnitCount,
    reversedUnitCount,
    returnedUnitCount,
    returnVoucherCount: input.returnVoucherCount,
    reviewNeededCount: input.reviewNeededCount,
    productSummary: summarize(input.lines.map((line) => line.productName), "No products"),
    categorySummary: summarize(input.lines.map((line) => line.category).filter(Boolean), "No category"),
    status: input.status,
  };
}

function readParty(raw: JsonRecord, fallbackName: string): AdminWebInvoiceParty {
  const gstin = readString(raw, "gstin", "");
  const addressLine2 = readString(raw, "addressLine2", "");
  const phone = readString(raw, "phone", "");

  return {
    name: readString(raw, "name", fallbackName),
    ...(gstin ? { gstin } : {}),
    addressLine1: readString(raw, "addressLine1", ""),
    ...(addressLine2 ? { addressLine2 } : {}),
    city: readString(raw, "city", ""),
    state: readString(raw, "state", ""),
    pincode: readString(raw, "pincode", ""),
    ...(phone ? { phone } : {}),
  };
}

function asRecord(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return {};
}

function readString(raw: JsonRecord, key: string, fallback: string): string {
  const value = raw[key];
  return typeof value === "string" ? value : fallback;
}

function readNumber(raw: JsonRecord, key: string): number {
  const value = raw[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getItemCodePointPreview(input: {
  readonly status: string;
  readonly price: number;
  readonly fixedPoints: number | null;
  readonly percentOfPricePoints: number | null;
  readonly fallbackPoints: number;
}): number {
  try {
    return resolveItemCodePrintPoints({
      status: input.status as ItemCodeStatus,
      price: input.price,
      fixedPoints: input.fixedPoints,
      percentOfPricePoints: input.percentOfPricePoints,
    });
  } catch {
    return input.fallbackPoints;
  }
}

function summarize(values: readonly string[], fallback: string): string {
  const uniqueValues = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (uniqueValues.length === 0) {
    return fallback;
  }
  if (uniqueValues.length <= 2) {
    return uniqueValues.join(", ");
  }
  return `${uniqueValues.slice(0, 2).join(", ")} +${uniqueValues.length - 2}`;
}
