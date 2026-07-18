import { Injectable } from "@nestjs/common";
import type { ActorRole } from "@volt-rewards/domain";
import { PrismaService } from "../prisma/prisma.service.js";
import type { QrPrintHistoryEntry, QrPrintHistoryRepository } from "./qr-print-history.repository.js";

@Injectable()
export class PrismaQrPrintHistoryRepository implements QrPrintHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPrintHistory(): Promise<readonly QrPrintHistoryEntry[]> {
    const events = await this.prisma.auditEvent.findMany({
      where: {
        action: "QR_PRINT",
        targetType: "BUSY_INVOICE",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const invoiceIds = [...new Set(events.map((event) => event.targetId))];
    const invoices = await this.prisma.busyInvoice.findMany({
      where: { id: { in: invoiceIds } },
      select: {
        id: true,
        invoiceNumber: true,
        customerRef: true,
        rawSource: true,
        lines: { select: { productName: true } },
      },
    });
    const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
    const actorUserIds = [...new Set(events.map((event) => event.actorUserId).filter((userId): userId is string => Boolean(userId)))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: actorUserIds } },
      select: { id: true, displayName: true },
    });
    const actorNameById = new Map(users.map((user) => [user.id, user.displayName]));

    return events.map((event) => {
      const metadata = asRecord(event.metadata);
      const invoice = invoiceById.get(event.targetId);
      const actorName = event.actorUserId ? actorNameById.get(event.actorUserId) : undefined;
      return {
        auditEventId: event.id,
        invoiceId: event.targetId,
        invoiceNumber: invoice?.invoiceNumber ?? event.targetId,
        customerName: invoice ? readCustomerName(invoice.rawSource, invoice.customerRef ?? "Customer") : "Customer",
        printedAt: event.createdAt,
        actorRole: event.actorRole as ActorRole,
        ...(event.actorUserId ? { actorUserId: event.actorUserId } : {}),
        ...(actorName ? { actorName } : {}),
        printedUnitCount: readNumber(metadata, "printedUnitCount"),
        lineCount: readNumber(metadata, "lineCount"),
        productSummary: summarize(invoice?.lines.map((line) => line.productName) ?? [], "No products"),
      };
    });
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readNumber(raw: Record<string, unknown>, key: string): number {
  const value = raw[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readCustomerName(rawSource: unknown, fallback: string): string {
  const raw = asRecord(rawSource);
  const customer = asRecord(raw.customer);
  const name = customer.name;
  return typeof name === "string" && name.trim() ? name : fallback;
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
