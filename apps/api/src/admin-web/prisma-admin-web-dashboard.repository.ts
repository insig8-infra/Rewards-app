import { Injectable } from "@nestjs/common";
import { ACTOR_ROLE, type ActorRole } from "@volt-rewards/domain";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  AdminWebDashboard,
  AdminWebDashboardActivity,
  AdminWebDashboardAttentionItem,
  AdminWebDashboardPrintTrend,
  AdminWebDashboardRepository,
  AdminWebDashboardShortcut,
  AdminWebDashboardStatusMix,
  AdminWebDashboardTopContractor,
} from "./admin-web-dashboard.repository.js";

@Injectable()
export class PrismaAdminWebDashboardRepository implements AdminWebDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(actorRole: ActorRole): Promise<AdminWebDashboard> {
    const [
      contractors,
      staff,
      invoices,
      rewardClaims,
      pendingRewardClaims,
      recentReturns,
      invoicesReadyToPrint,
      qrGroups,
      activityEvents,
      readyInvoices,
      pendingClaims,
      returnVouchers,
      recentPrints,
      topContractors,
      itemCodesNeedingAttention,
    ] = await Promise.all([
      this.prisma.contractor.count({
        where: { status: "ACTIVE" },
      }),
      this.prisma.staffProfile.count({
        where: { deactivatedAt: null },
      }),
      this.prisma.busyInvoice.count(),
      this.prisma.rewardClaim.count(),
      this.prisma.rewardClaim.count({
        where: { status: "CHOSEN" },
      }),
      this.prisma.busyReturnVoucher.count(),
      this.prisma.busyInvoice.count({
        where: {
          status: { not: "CANCELLED" },
          qrUnits: { some: { status: "NOT_PRINTED" } },
        },
      }),
      this.prisma.qrUnit.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.auditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          actorUser: {
            select: {
              displayName: true,
            },
          },
        },
      }),
      this.prisma.busyInvoice.findMany({
        where: {
          status: { not: "CANCELLED" },
          qrUnits: { some: { status: "NOT_PRINTED" } },
        },
        orderBy: { importedAt: "desc" },
        take: 4,
        select: {
          id: true,
          invoiceNumber: true,
          customerRef: true,
          importedAt: true,
          qrUnits: {
            where: { status: "NOT_PRINTED" },
            select: {
              id: true,
              points: true,
            },
          },
        },
      }),
      this.prisma.rewardClaim.findMany({
        where: { status: "CHOSEN" },
        orderBy: { chosenAt: "desc" },
        take: 4,
        include: {
          contractor: {
            include: {
              user: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          rewardItem: {
            select: {
              name: true,
              pointsRequired: true,
            },
          },
        },
      }),
      this.prisma.busyReturnVoucher.findMany({
        orderBy: { returnDate: "desc" },
        take: 3,
        include: {
          originalInvoice: {
            select: {
              invoiceNumber: true,
            },
          },
          lines: {
            select: {
              quantity: true,
              productName: true,
            },
          },
        },
      }),
      this.prisma.qrUnit.findMany({
        where: { printedAt: { not: null } },
        orderBy: { printedAt: "desc" },
        take: 200,
        select: {
          printedAt: true,
        },
      }),
      this.prisma.contractor.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ availablePoints: "desc" }, { totalAccumulatedPoints: "desc" }],
        take: 5,
        include: {
          user: {
            select: {
              displayName: true,
            },
          },
          _count: {
            select: {
              scanAttempts: true,
            },
          },
        },
      }),
      this.prisma.itemCode.findMany({
        where: { status: { in: ["NOT_IN_USE", "NOT_IN_BUSY"] } },
        orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
        take: 4,
        select: {
          id: true,
          tempItemCode: true,
          itemName: true,
          status: true,
        },
      }),
    ]);

    const qrCountByStatus = new Map(qrGroups.map((group) => [group.status, group._count._all]));
    const recentActivity: AdminWebDashboardActivity[] = activityEvents.map((event) => ({
      auditEventId: event.id,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      ...optionalString("targetLabel", getAuditTargetLabel(event)),
      actorRole: event.actorRole as ActorRole,
      ...optionalString("actorName", event.actorUser?.displayName),
      createdAt: event.createdAt,
    }));
    const qrStatusMix = buildQrStatusMix(qrCountByStatus);

    return {
      actorRole,
      roleLabel: actorRole === ACTOR_ROLE.OWNER ? "Owner dashboard" : "Staff dashboard",
      allowedSections: getAllowedSections(actorRole),
      metrics: {
        contractors,
        staff,
        invoices,
        invoicesReadyToPrint,
        qrTotal: sumQrCounts(qrCountByStatus),
        qrNotPrinted: qrCountByStatus.get("NOT_PRINTED") ?? 0,
        qrPrinted: getActivePrintedCount(qrCountByStatus),
        qrScanned: qrCountByStatus.get("SCANNED_CLAIMED") ?? 0,
        qrCancelled: qrCountByStatus.get("CANCELLED") ?? 0,
        qrReversed: qrCountByStatus.get("REVERSED") ?? 0,
        rewardClaims,
        pendingRewardClaims,
        recentReturns,
      },
      attentionQueue: buildAttentionQueue({
        actorRole,
        pendingClaims,
        qrCancelled: qrCountByStatus.get("CANCELLED") ?? 0,
        qrReversed: qrCountByStatus.get("REVERSED") ?? 0,
        readyInvoices,
        returnVouchers,
        itemCodesNeedingAttention,
      }),
      shortcuts: buildShortcuts(actorRole),
      qrStatusMix,
      printTrend: buildPrintTrend(recentPrints.map((unit) => unit.printedAt).filter(isDate)),
      topContractors: topContractors.map<AdminWebDashboardTopContractor>((contractor) => ({
        contractorId: contractor.id,
        contractorCode: contractor.code,
        name: contractor.user.displayName,
        ...optionalString("tier", contractor.tier),
        availablePoints: contractor.availablePoints,
        totalAccumulatedPoints: contractor.totalAccumulatedPoints,
        scanCount: contractor._count.scanAttempts,
      })),
      recentActivity,
    };
  }
}

function sumQrCounts(qrCountByStatus: ReadonlyMap<string, number>): number {
  return [...qrCountByStatus.values()].reduce((total, count) => total + count, 0);
}

function getActivePrintedCount(qrCountByStatus: ReadonlyMap<string, number>): number {
  return (qrCountByStatus.get("PRINTED_UNCLAIMED") ?? 0) + (qrCountByStatus.get("REPRINTED") ?? 0);
}

function getAllowedSections(actorRole: ActorRole): readonly string[] {
  if (actorRole === ACTOR_ROLE.OWNER) {
    return [
      "dashboard",
      "qr-print",
      "invoices",
      "print-history",
      "contractors",
      "staff",
      "rewards",
      "reports",
      "promotions",
      "item-codes",
    ];
  }

  if (actorRole === ACTOR_ROLE.STAFF) {
    return ["dashboard", "qr-print", "invoices", "print-history", "contractors", "reports", "profile", "item-codes"];
  }

  return [];
}

function buildAttentionQueue(input: {
  readonly actorRole: ActorRole;
  readonly readyInvoices: ReadonlyArray<{
    readonly id: string;
    readonly invoiceNumber: string;
    readonly customerRef: string | null;
    readonly qrUnits: ReadonlyArray<{ readonly points: number }>;
  }>;
  readonly pendingClaims: ReadonlyArray<{
    readonly id: string;
    readonly claimId: string;
    readonly pointsDeducted: number;
    readonly contractor: { readonly user: { readonly displayName: string } };
    readonly rewardItem: { readonly name: string; readonly pointsRequired: number };
  }>;
  readonly returnVouchers: ReadonlyArray<{
    readonly id: string;
    readonly returnNumber: string;
    readonly originalInvoice: { readonly invoiceNumber: string };
    readonly lines: ReadonlyArray<{ readonly quantity: number; readonly productName: string }>;
  }>;
  readonly itemCodesNeedingAttention: ReadonlyArray<{
    readonly id: string;
    readonly tempItemCode: string;
    readonly itemName: string;
    readonly status: string;
  }>;
  readonly qrCancelled: number;
  readonly qrReversed: number;
}): readonly AdminWebDashboardAttentionItem[] {
  const invoiceItems = input.readyInvoices.map<AdminWebDashboardAttentionItem>((invoice) => {
    const unitCount = invoice.qrUnits.length;
    const pointCount = invoice.qrUnits.reduce((total, unit) => total + unit.points, 0);
    return {
      id: `invoice:${invoice.id}`,
      type: "INVOICE_READY",
      title: `${invoice.invoiceNumber} ready for QR print`,
      description: invoice.customerRef ? `${invoice.customerRef} · ${unitCount} printable units` : `${unitCount} printable units`,
      value: `${pointCount} pts`,
      href: `/?invoiceId=${encodeURIComponent(invoice.id)}`,
      tone: "info",
    };
  });

  const rewardItems =
    input.actorRole === ACTOR_ROLE.OWNER
      ? input.pendingClaims.map<AdminWebDashboardAttentionItem>((claim) => ({
          id: `reward:${claim.id}`,
          type: "PENDING_REWARD",
          title: `${claim.claimId} pending fulfillment`,
          description: `${claim.contractor.user.displayName} · ${claim.rewardItem.name}`,
          value: `${claim.pointsDeducted} pts`,
          href: "/rewards",
          tone: "warn",
        }))
      : [];

  const returnItems = input.returnVouchers.map<AdminWebDashboardAttentionItem>((voucher) => {
    const quantity = voucher.lines.reduce((total, line) => total + line.quantity, 0);
    const firstProduct = voucher.lines[0]?.productName ?? "Returned items";
    return {
      id: `return:${voucher.id}`,
      type: "RETURN",
      title: `${voucher.returnNumber} linked to ${voucher.originalInvoice.invoiceNumber}`,
      description: `${firstProduct}${voucher.lines.length > 1 ? ` +${voucher.lines.length - 1} more` : ""}`,
      value: `${quantity} units`,
      href: "/invoices",
      tone: "warn",
    };
  });

  const exceptionItems: AdminWebDashboardAttentionItem[] =
    input.qrCancelled + input.qrReversed > 0
      ? [
          {
            id: "qr-exceptions",
            type: "QR_EXCEPTION",
            title: "QR exceptions need periodic review",
            description: `${input.qrCancelled} Cancelled · ${input.qrReversed} Reversed_AND_Cancelled`,
            value: `${input.qrCancelled + input.qrReversed} QR`,
            href: "/reports",
            tone: "critical",
          },
        ]
      : [];

  const itemCodeItems = input.itemCodesNeedingAttention.map<AdminWebDashboardAttentionItem>((itemCode) => ({
    id: `item-code:${itemCode.id}`,
    type: "ITEM_CODE_RULE",
    title:
      itemCode.status === "NOT_IN_BUSY"
        ? `${itemCode.tempItemCode} missing from BUSY`
        : `${itemCode.tempItemCode} needs reward rule`,
    description: itemCode.itemName,
    value: itemCode.status === "NOT_IN_BUSY" ? "Not in BUSY" : "Not In Use",
    href: "/item-codes",
    tone: itemCode.status === "NOT_IN_BUSY" ? "critical" : "warn",
  }));

  return [...itemCodeItems, ...invoiceItems, ...rewardItems, ...returnItems, ...exceptionItems].slice(0, 8);
}

function buildShortcuts(actorRole: ActorRole): readonly AdminWebDashboardShortcut[] {
  const common: AdminWebDashboardShortcut[] = [
    {
      label: "Print QR",
      description: "Open the printable invoice queue",
      href: "/",
      icon: "printer",
      ownerOnly: false,
    },
    {
      label: "Invoice Ledger",
      description: "Review sales, returns, and print context",
      href: "/invoices",
      icon: "receipt",
      ownerOnly: false,
    },
    {
      label: "Print History",
      description: "Trace printed QR runs",
      href: "/print-history",
      icon: "history",
      ownerOnly: false,
    },
    {
      label: "Contractors",
      description: "Open contractor directory",
      href: "/contractors",
      icon: "users",
      ownerOnly: false,
    },
    {
      label: "Reports",
      description: "Open operational reports",
      href: "/reports",
      icon: "report",
      ownerOnly: false,
    },
    {
      label: "ItemCodes",
      description: "Review BUSY item codes and reward rules",
      href: "/item-codes",
      icon: "tag",
      ownerOnly: false,
    },
  ];

  if (actorRole !== ACTOR_ROLE.OWNER) {
    return common;
  }

  return [
    ...common,
    {
      label: "Staff Management",
      description: "Create, reset, and deactivate staff",
      href: "/staff",
      icon: "staff",
      ownerOnly: true,
    },
    {
      label: "Rewards",
      description: "Fulfill pending reward claims",
      href: "/rewards",
      icon: "gift",
      ownerOnly: true,
    },
    {
      label: "Promotions",
      description: "Manage campaign surfaces",
      href: "/promotions",
      icon: "megaphone",
      ownerOnly: true,
    },
  ];
}

function buildQrStatusMix(qrCountByStatus: ReadonlyMap<string, number>): readonly AdminWebDashboardStatusMix[] {
  return [
    { status: "NOT_PRINTED", label: "Not_Printed", count: qrCountByStatus.get("NOT_PRINTED") ?? 0 },
    { status: "PRINTED_UNCLAIMED", label: "Printed", count: qrCountByStatus.get("PRINTED_UNCLAIMED") ?? 0 },
    { status: "REPRINTED", label: "Reprinted", count: qrCountByStatus.get("REPRINTED") ?? 0 },
    { status: "SCANNED_CLAIMED", label: "Claimed", count: qrCountByStatus.get("SCANNED_CLAIMED") ?? 0 },
    { status: "CANCELLED", label: "Cancelled", count: qrCountByStatus.get("CANCELLED") ?? 0 },
    { status: "REVERSED", label: "Reversed_AND_Cancelled", count: qrCountByStatus.get("REVERSED") ?? 0 },
  ];
}

function buildPrintTrend(printedDates: readonly Date[]): readonly AdminWebDashboardPrintTrend[] {
  const today = new Date();
  const buckets = new Map<string, number>();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - offset);
    buckets.set(toDateKey(date), 0);
  }

  for (const printedAt of printedDates) {
    const key = toDateKey(printedAt);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([date, printedUnits]) => ({
    date,
    label: formatTrendLabel(date),
    printedUnits,
  }));
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTrendLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function getAuditTargetLabel(event: {
  readonly targetType: string;
  readonly targetId: string;
  readonly metadata: unknown;
  readonly afterJson: unknown;
}): string | undefined {
  const afterJson = asRecord(event.afterJson);
  const metadata = asRecord(event.metadata);

  return firstString(
    afterJson?.name,
    afterJson?.contractorCode,
    afterJson?.staffId,
    afterJson?.claimId,
    metadata?.externalInvoiceId,
    metadata?.externalReturnId,
    metadata?.originalExternalInvoiceId,
    event.targetType === "USER" ? "Admin user" : undefined,
  );
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function firstString(...values: readonly unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function optionalString<Key extends string>(key: Key, value: string | null | undefined): { readonly [K in Key]: string } | Record<string, never> {
  return value ? { [key]: value } as { readonly [K in Key]: string } : {};
}

function isDate(value: Date | null): value is Date {
  return value instanceof Date;
}
