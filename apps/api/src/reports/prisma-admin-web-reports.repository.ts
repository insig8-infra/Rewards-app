import { Injectable } from "@nestjs/common";
import type { RewardClaimStatus } from "../generated/prisma/enums.js";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  formatDateOnly,
  formatDateTime,
  inDateRange,
  makeReportResponse,
  qrStatusLabel,
  resolveReportRange,
  rewardStatusLabel,
} from "./report-helpers.js";
import type { AdminWebReportsRepository } from "./admin-web-reports.repository.js";
import type {
  AdminReportCell,
  AdminReportColumn,
  AdminReportExportAuditInput,
  AdminReportFilters,
  AdminReportId,
  AdminReportResponse,
  AdminReportSummaryItem,
  AdminReportsLanding,
} from "./reports.types.js";

type ReportRow = Record<string, AdminReportCell>;

@Injectable()
export class PrismaAdminWebReportsRepository implements AdminWebReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getLanding(_filters: AdminReportFilters): Promise<AdminReportsLanding> {
    const range = platformRange();
    const [
      qrGroups,
      pointsIssued,
      pointsReversed,
      rewardGroups,
      topContractor,
      productLines,
      returnAttentionCount,
      activeContractors,
    ] = await Promise.all([
      this.prisma.qrUnit.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.pointsLedgerEntry.aggregate({
        where: { type: "SCAN_CREDIT" },
        _sum: { pointsDelta: true },
      }),
      this.prisma.pointsLedgerEntry.aggregate({
        where: { type: { in: ["QR_REVERSE", "REWARD_REVOKED_DUE_TO_RETURN"] } },
        _sum: { pointsDelta: true },
      }),
      this.prisma.rewardClaim.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.contractor.findFirst({
        orderBy: [{ totalAccumulatedPoints: "desc" }, { availablePoints: "desc" }],
        include: { user: { select: { displayName: true } } },
      }),
      this.prisma.busyInvoiceLine.findMany({
        include: {
          qrUnits: {
            where: { scannedAt: { not: null } },
            select: { id: true },
          },
        },
      }),
      this.prisma.busyReturnAllocation.count({
        where: { type: { in: ["SCANNED_REVIEW_NEEDED", "SCANNED_REVERSED"] } },
      }),
      this.prisma.contractor.count({ where: { status: "ACTIVE" } }),
    ]);

    const qrCountByStatus = new Map(qrGroups.map((group) => [group.status, group._count._all]));
    const rewardCountByStatus = new Map(rewardGroups.map((group) => [group.status, group._count._all]));
    const productSegments = productLines
      .map((line) => ({
        label: line.productName,
        value: line.qrUnits.length,
        meta: line.category ?? "No category",
      }))
      .filter((line) => line.value > 0)
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
    const topProductLine = productSegments[0];
    const activeRewardClaims = rewardCountByStatus.get("CHOSEN") ?? 0;
    const deliveredRewards = rewardCountByStatus.get("FULFILLED") ?? 0;
    const cancelledRewards =
      (rewardCountByStatus.get("CANCELLED_BY_CONTRACTOR") ?? 0) +
      (rewardCountByStatus.get("REVOKED_DUE_TO_RETURN") ?? 0);
    const pointsIssuedTotal = pointsIssued._sum.pointsDelta ?? 0;
    const pointsReversedTotal = Math.abs(pointsReversed._sum.pointsDelta ?? 0);

    return {
      resolvedRange: range,
      generatedAt: new Date(),
      cards: [
        card("qrReady", "QR ready to print", qrCountByStatus.get("NOT_PRINTED") ?? 0, "/reports?report=qr-status"),
        card("qrPrinted", "Active printed QR", activePrintedCount(qrCountByStatus), "/reports?report=qr-print"),
        card("qrClaimed", "QR claimed", qrCountByStatus.get("SCANNED_CLAIMED") ?? 0, "/reports?report=scan-history"),
        card("activeClaims", "Claim requests", activeRewardClaims, "/reports?report=reward-claims", activeRewardClaims > 0 ? "warn" : "success"),
        card("returnAttention", "Return attention", returnAttentionCount, "/reports?report=returns-reversals", returnAttentionCount > 0 ? "critical" : "success"),
        card("pointsIssued", "Lifetime points issued", pointsIssuedTotal, "/reports?report=contractor-leaderboard"),
        card("activeContractors", "Active contractors", activeContractors, "/reports?report=contractor-leaderboard"),
        card(
          "topContractor",
          "Top contractor",
          topContractor?.user.displayName ?? "No contractor",
          "/reports?report=contractor-leaderboard",
          "success",
          topContractor ? `${topContractor.totalAccumulatedPoints} lifetime points` : undefined,
        ),
        card(
          "topProduct",
          "Top product/category",
          topProductLine?.label ?? "No scans",
          "/reports?report=scan-history",
          "info",
          topProductLine ? `${topProductLine.meta} · ${topProductLine.value} claims` : undefined,
        ),
      ],
      charts: [
        {
          key: "qr-lifecycle",
          title: "QR lifecycle mix",
          description: "Every QR unit grouped by the approved product status labels.",
          segments: [
            segment("Not_Printed", qrCountByStatus.get("NOT_PRINTED") ?? 0, "info"),
            segment("Printed", qrCountByStatus.get("PRINTED_UNCLAIMED") ?? 0, "info"),
            segment("Reprinted", qrCountByStatus.get("REPRINTED") ?? 0, "warn"),
            segment("Claimed", qrCountByStatus.get("SCANNED_CLAIMED") ?? 0, "success"),
            segment("Cancelled", qrCountByStatus.get("CANCELLED") ?? 0, "critical"),
            segment("Reversed_AND_Cancelled", qrCountByStatus.get("REVERSED") ?? 0, "critical"),
          ],
        },
        {
          key: "reward-funnel",
          title: "Reward fulfillment funnel",
          description: "Claim requests that still need action versus delivered or cancelled history.",
          segments: [
            segment("Claim Raised", activeRewardClaims, activeRewardClaims > 0 ? "warn" : "success"),
            segment("Delivered", deliveredRewards, "success"),
            segment("Claim Cancelled", cancelledRewards, "info"),
          ],
        },
        {
          key: "points-movement",
          title: "Points movement",
          description: "Lifetime points issued by scans compared with points reversed by returns.",
          segments: [
            segment("Issued", pointsIssuedTotal, "success"),
            segment("Reversed", pointsReversedTotal, pointsReversedTotal > 0 ? "warn" : "info"),
          ],
        },
        {
          key: "top-products",
          title: "Top claimed products",
          description: "Products generating the most successful QR claims.",
          segments: productSegments.map((product) => segment(product.label, product.value, "info", product.meta)),
        },
      ],
      reportShortcuts: reportShortcuts,
    };
  }

  async getReport(reportId: AdminReportId, filters: AdminReportFilters): Promise<AdminReportResponse> {
    switch (reportId) {
      case "qr-print":
        return this.getQrPrintReport(filters);
      case "scan-history":
        return this.getScanHistoryReport(filters);
      case "contractor-leaderboard":
        return this.getContractorLeaderboard(filters);
      case "qr-status":
        return this.getQrStatusReport(filters);
      case "reward-claims":
        return this.getRewardClaimsReport(filters);
      case "returns-reversals":
        return this.getReturnsReversalsReport(filters);
    }
  }

  async recordExport(input: AdminReportExportAuditInput): Promise<void> {
    const actorUserId = input.actor.userId ? await this.findExistingUserId(input.actor.userId) : undefined;
    await this.prisma.auditEvent.create({
      data: {
        actorRole: input.actor.role,
        ...(actorUserId ? { actorUserId } : {}),
        surface: "ADMIN_WEB",
        action: "REPORT_EXPORTED",
        targetType: "REPORT",
        targetId: input.report.reportId,
        metadata: {
          format: input.format,
          reportTitle: input.report.title,
          resolvedRange: {
            label: input.report.resolvedRange.label,
            from: input.report.resolvedRange.from.toISOString(),
            to: input.report.resolvedRange.to.toISOString(),
            timezone: input.report.resolvedRange.timezone,
          },
          rowCount: input.report.totalRows,
        },
      },
    });
  }

  private async findExistingUserId(userId: string): Promise<string | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return user?.id;
  }

  private async getQrPrintReport(filters: AdminReportFilters): Promise<AdminReportResponse> {
    const range = resolveReportRange(filters);
    const qrStatus = filters.qrStatus ? mapQrFilter(filters.qrStatus) : undefined;
    const units = await this.prisma.qrUnit.findMany({
      where: {
        printedAt: { gte: range.from, lt: range.to },
        ...(qrStatus ? { status: qrStatus } : {}),
        ...(filters.invoiceNumber ? { invoice: { invoiceNumber: { contains: filters.invoiceNumber } } } : {}),
        ...(filters.productCategory ? { invoiceLine: { is: { category: filters.productCategory } } } : {}),
      },
      include: {
        invoice: true,
        invoiceLine: true,
        printedByUser: { select: { displayName: true } },
      },
      orderBy: { printedAt: "desc" },
    });

    const rows = units.map((unit): ReportRow => ({
      invoiceNumber: unit.invoice.invoiceNumber,
      invoiceDate: formatDateOnly(unit.invoice.invoiceDate),
      printDateTime: formatDateTime(unit.printedAt),
      printRunId: `${unit.invoice.id}:${formatDateOnly(unit.printedAt)}`,
      productName: unit.invoiceLine?.productName ?? "Unknown product",
      productCode: unit.invoiceLine?.sku ?? unit.productSku ?? "",
      category: unit.invoiceLine?.category ?? "",
      quantityPrinted: 1,
      qrStatus: qrStatusLabel(unit.status),
      pointsPerUnit: unit.points,
      printedBy: unit.printedByUser?.displayName ?? "System",
      busySyncReference: unit.invoice.externalInvoiceId,
    }));

    return makeReportResponse({
      reportId: "qr-print",
      title: "QR Print Analytics",
      range,
      summary: [
        sum("Printed QR units", rows.length),
        sum("Invoices", uniqueCount(rows.map((row) => row.invoiceNumber ?? ""))),
        sum("Points in printed QR", sumNumber(rows, "pointsPerUnit")),
      ],
      columns: qrPrintColumns,
      rows,
      filters,
    });
  }

  private async getScanHistoryReport(filters: AdminReportFilters): Promise<AdminReportResponse> {
    const range = resolveReportRange(filters);
    const scanResult = filters.qrStatus ? mapScanResultFilter(filters.qrStatus) : undefined;
    const attempts = await this.prisma.scanAttempt.findMany({
      where: {
        createdAt: { gte: range.from, lt: range.to },
        ...(filters.contractorId ? { contractorId: filters.contractorId } : {}),
        ...(filters.siteId ? { siteId: filters.siteId } : {}),
        ...(scanResult ? { result: scanResult } : {}),
        ...(filters.productCategory
          ? { qrUnit: { is: { invoiceLine: { is: { category: filters.productCategory } } } } }
          : {}),
      },
      include: {
        contractor: { include: { user: { select: { displayName: true, mobileNumber: true } } } },
        teamMember: { select: { mobileNumber: true, displayName: true } },
        site: true,
        qrUnit: { include: { invoice: true, invoiceLine: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = attempts.map((attempt): ReportRow => ({
      scanDateTime: formatDateTime(attempt.createdAt),
      outcome: attempt.result,
      contractorName: attempt.contractor?.user.displayName ?? "",
      contractorMobile: attempt.contractor?.user.mobileNumber ?? "",
      contractorCode: attempt.contractor?.code ?? "",
      site: attempt.site?.clientName ?? "",
      scannerPersona: attempt.actorRole,
      teamMemberMobile: attempt.teamMemberMobile ?? attempt.teamMember?.mobileNumber ?? "",
      invoiceNumber: attempt.qrUnit?.invoice.invoiceNumber ?? "",
      productName: attempt.qrUnit?.invoiceLine?.productName ?? "",
      category: attempt.qrUnit?.invoiceLine?.category ?? "",
      qrShortCode: attempt.qrUnit?.id.slice(-8) ?? "",
      pointsCreditedOrRejected: attempt.result === "SUCCESS" ? attempt.qrUnit?.points ?? 0 : 0,
      failureReason: scanFailureLabel(attempt.result, attempt.failureReason, attempt.qrUnit?.status),
    }));

    return makeReportResponse({
      reportId: "scan-history",
      title: "Scan History Analytics",
      range,
      summary: [
        sum("Scan attempts", rows.length),
        sum("Successful scans", rows.filter((row) => row.outcome === "SUCCESS").length),
        sum("Rejected attempts", rows.filter((row) => row.outcome !== "SUCCESS").length),
      ],
      columns: scanHistoryColumns,
      rows,
      filters,
    });
  }

  private async getContractorLeaderboard(filters: AdminReportFilters): Promise<AdminReportResponse> {
    const range = resolveReportRange(filters);
    const contractors = await this.prisma.contractor.findMany({
      include: {
        user: { select: { displayName: true, mobileNumber: true } },
        sites: true,
        scanAttempts: { where: { createdAt: { gte: range.from, lt: range.to } } },
        rewardClaims: { where: { chosenAt: { gte: range.from, lt: range.to } } },
      },
    });

    const rows = contractors
      .map((contractor) => {
        const successfulScanCount = contractor.scanAttempts.filter((attempt) => attempt.result === "SUCCESS").length;
        const deliveredRewards = contractor.rewardClaims.filter((claim) => claim.status === "FULFILLED").length;
        const pointsUsed = contractor.rewardClaims.reduce((total, claim) => total + claim.pointsDeducted, 0);
        const lastScan = contractor.scanAttempts.map((attempt) => attempt.createdAt).sort((left, right) => right.getTime() - left.getTime())[0];
        return {
          contractorId: contractor.id,
          rank: 0,
          contractorName: contractor.user.displayName,
          contractorMobile: contractor.user.mobileNumber,
          contractorCode: contractor.code,
          tier: contractor.tier ?? "",
          totalAccumulatedPoints: contractor.totalAccumulatedPoints,
          pointsAvailable: contractor.availablePoints,
          pointsUsed,
          scanCount: contractor.scanAttempts.length,
          successfulScanCount,
          rewardClaimsRaised: contractor.rewardClaims.length,
          rewardsDelivered: deliveredRewards,
          lastScanDateTime: formatDateTime(lastScan),
          area: contractor.belongsToNote?.trim() || summarize(contractor.sites.map((site) => site.area ?? site.clientName)),
        };
      })
      .sort((left, right) => right.totalAccumulatedPoints - left.totalAccumulatedPoints)
      .map((row, index): ReportRow => ({ ...row, rank: index + 1 }));

    return makeReportResponse({
      reportId: "contractor-leaderboard",
      title: "Contractor Leaderboard",
      range,
      summary: [
        sum("Contractors", rows.length),
        sum("Successful scans", sumNumber(rows, "successfulScanCount")),
        sum("Points used", sumNumber(rows, "pointsUsed")),
        sum("Reward claims", sumNumber(rows, "rewardClaimsRaised")),
      ],
      columns: contractorLeaderboardColumns,
      rows,
      filters,
    });
  }

  private async getQrStatusReport(filters: AdminReportFilters): Promise<AdminReportResponse> {
    const range = resolveReportRange(filters);
    const lines = await this.prisma.busyInvoiceLine.findMany({
      where: {
        ...(filters.productCategory ? { category: filters.productCategory } : {}),
        ...(filters.invoiceNumber ? { invoice: { invoiceNumber: { contains: filters.invoiceNumber } } } : {}),
      },
      include: {
        invoice: true,
        qrUnits: true,
        returnAllocations: true,
      },
    });

    const rows = lines
      .filter((line) => inDateRange(line.invoice.invoiceDate, range) || line.qrUnits.some((unit) => inDateRange(unit.updatedAt, range)))
      .map((line): ReportRow => {
        const statusCounts = countBy(line.qrUnits.map((unit) => unit.status));
        return {
          invoiceNumber: line.invoice.invoiceNumber,
          productName: line.productName,
          productCode: line.sku,
          category: line.category ?? "",
          totalUnits: line.quantity,
          notPrinted: statusCounts.get("NOT_PRINTED") ?? 0,
          printed: statusCounts.get("PRINTED_UNCLAIMED") ?? 0,
          reprinted: statusCounts.get("REPRINTED") ?? 0,
          claimed: statusCounts.get("SCANNED_CLAIMED") ?? 0,
          cancelled: statusCounts.get("CANCELLED") ?? 0,
          reversedAndCancelled: statusCounts.get("REVERSED") ?? 0,
          returnedReviewNeeded: line.returnAllocations.filter((allocation) => allocation.type === "SCANNED_REVIEW_NEEDED").length,
        };
      });

    return makeReportResponse({
      reportId: "qr-status",
      title: "QR Status Report",
      range,
      summary: [
        sum("QR units", sumNumber(rows, "totalUnits")),
        sum("Claimed", sumNumber(rows, "claimed")),
        sum("Cancelled/Reversed", sumNumber(rows, "cancelled") + sumNumber(rows, "reversedAndCancelled")),
      ],
      columns: qrStatusColumns,
      rows,
      filters,
    });
  }

  private async getRewardClaimsReport(filters: AdminReportFilters): Promise<AdminReportResponse> {
    const range = resolveReportRange(filters);
    const rewardStatuses = filters.rewardStatus ? mapRewardStatusFilter(filters.rewardStatus) : undefined;
    const claims = await this.prisma.rewardClaim.findMany({
      where: {
        chosenAt: { gte: range.from, lt: range.to },
        ...(rewardStatuses ? { status: { in: rewardStatuses } } : {}),
        ...(filters.contractorId ? { contractorId: filters.contractorId } : {}),
        ...(filters.rewardName ? { rewardItem: { name: { contains: filters.rewardName } } } : {}),
      },
      include: {
        contractor: { include: { user: { select: { displayName: true, mobileNumber: true } } } },
        rewardItem: { select: { name: true } },
        fulfilledByOwner: { select: { displayName: true } },
      },
      orderBy: { chosenAt: "desc" },
    });

    const rows = claims.map((claim): ReportRow => ({
      claimId: claim.claimId,
      contractorName: claim.contractor.user.displayName,
      contractorPhone: claim.contractor.user.mobileNumber,
      rewardName: claim.rewardItem.name,
      pointsRsSpent: claim.pointsDeducted,
      claimRaisedDateTime: formatDateTime(claim.chosenAt),
      currentStatus: rewardStatusLabel(claim.status),
      otpSentDateTime: formatDateTime(claim.otpVerifiedAt),
      deliveredDateTime: formatDateTime(claim.fulfilledAt),
      cancelledRevokedDateTime: formatDateTime(claim.cancelledAt),
      fulfilledByOwner: claim.fulfilledByOwner?.displayName ?? "",
    }));

    return makeReportResponse({
      reportId: "reward-claims",
      title: "Reward Claims Report",
      range,
      summary: [
        sum("Claims", rows.length),
        sum("Claim Raised", rows.filter((row) => row.currentStatus === "Claim Raised").length),
        sum("Delivered", rows.filter((row) => row.currentStatus === "Delivered").length),
      ],
      columns: rewardClaimsColumns,
      rows,
      filters,
    });
  }

  private async getReturnsReversalsReport(filters: AdminReportFilters): Promise<AdminReportResponse> {
    const range = resolveReportRange(filters);
    const returnStatus = filters.returnStatus ? mapReturnStatusFilter(filters.returnStatus) : undefined;
    const allocations = await this.prisma.busyReturnAllocation.findMany({
      where: {
        createdAt: { gte: range.from, lt: range.to },
        ...(returnStatus ? { type: returnStatus } : {}),
        ...(filters.productCategory ? { originalInvoiceLine: { is: { category: filters.productCategory } } } : {}),
      },
      include: {
        returnLine: { include: { returnVoucher: { include: { originalInvoice: true } } } },
        originalInvoiceLine: true,
        qrUnit: { include: { claimedByContractor: { include: { user: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = allocations.map((allocation): ReportRow => ({
      returnVoucherNumber: allocation.returnLine.returnVoucher.returnNumber,
      returnDateTime: formatDateTime(allocation.returnLine.returnVoucher.returnDate),
      originalInvoiceNumber: allocation.returnLine.returnVoucher.originalInvoice.invoiceNumber,
      productName: allocation.originalInvoiceLine?.productName ?? allocation.returnLine.productName,
      productCode: allocation.originalInvoiceLine?.sku ?? allocation.returnLine.sku,
      category: allocation.originalInvoiceLine?.category ?? allocation.returnLine.category ?? "",
      returnedQuantity: allocation.quantity,
      allocationStatus: allocation.type,
      qrShortCode: allocation.qrUnit?.id.slice(-8) ?? "",
      contractorName: allocation.qrUnit?.claimedByContractor?.user.displayName ?? "",
      pointsReversed: allocation.type === "SCANNED_REVERSED" ? allocation.qrUnit?.points ?? 0 : 0,
      claimRevocationImpact: allocation.type === "SCANNED_REVERSED" ? "Review Balance Book" : "",
      actionActor: "BUSY Sync",
      actionDateTime: formatDateTime(allocation.createdAt),
    }));

    return makeReportResponse({
      reportId: "returns-reversals",
      title: "Returns/Reversals Report",
      range,
      summary: [
        sum("Return allocations", rows.length),
        sum("Returned units", sumNumber(rows, "returnedQuantity")),
        sum("Points reversed", sumNumber(rows, "pointsReversed")),
      ],
      columns: returnsReversalsColumns,
      rows,
      filters,
    });
  }

}

const reportShortcuts = [
  shortcut("qr-print", "QR Print Analytics", "Printed QR units by invoice, product, actor, and status."),
  shortcut("scan-history", "Scan History Analytics", "All scan attempts, outcomes, sites, contractors, and failure reasons."),
  shortcut("contractor-leaderboard", "Contractor Leaderboard", "Top contractors by points, scans, and reward activity."),
  shortcut("qr-status", "QR Status Report", "Not_Printed, Printed, Reprinted, Claimed, Cancelled, and Reversed_AND_Cancelled counts."),
  shortcut("reward-claims", "Reward Claims Report", "Claim IDs, contractors, rewards, status, and delivery history."),
  shortcut("returns-reversals", "Returns/Reversals Report", "BUSY return allocation and reversal impact."),
] as const;

const qrPrintColumns = columns([
  ["invoiceNumber", "Invoice No."],
  ["invoiceDate", "Invoice Date"],
  ["printDateTime", "Print Date/Time"],
  ["printRunId", "Print Run"],
  ["productName", "Product"],
  ["productCode", "SKU"],
  ["category", "Category"],
  ["quantityPrinted", "Qty Printed", "right"],
  ["qrStatus", "QR Status"],
  ["pointsPerUnit", "Points/Unit", "right"],
  ["printedBy", "Printed By"],
  ["busySyncReference", "BUSY Ref"],
]);

const scanHistoryColumns = columns([
  ["scanDateTime", "Scan Date/Time"],
  ["outcome", "Outcome"],
  ["contractorName", "Contractor"],
  ["contractorMobile", "Phone"],
  ["contractorCode", "Code"],
  ["site", "Site"],
  ["scannerPersona", "Scanner"],
  ["teamMemberMobile", "Team Member"],
  ["invoiceNumber", "Invoice"],
  ["productName", "Product"],
  ["category", "Category"],
  ["qrShortCode", "QR"],
  ["pointsCreditedOrRejected", "Points", "right"],
  ["failureReason", "Failure Reason"],
]);

const contractorLeaderboardColumns = columns([
  ["rank", "Rank", "right"],
  ["contractorName", "Contractor"],
  ["contractorMobile", "Phone"],
  ["contractorCode", "Code"],
  ["tier", "Tier"],
  ["totalAccumulatedPoints", "Lifetime Points", "right"],
  ["pointsAvailable", "Current Balance", "right"],
  ["pointsUsed", "Points Used", "right"],
  ["scanCount", "Scans", "right"],
  ["successfulScanCount", "Successful", "right"],
  ["rewardClaimsRaised", "Claims", "right"],
  ["rewardsDelivered", "Delivered", "right"],
  ["lastScanDateTime", "Last Scan"],
  ["area", "Area"],
]);

const qrStatusColumns = columns([
  ["invoiceNumber", "Invoice"],
  ["productName", "Product"],
  ["productCode", "SKU"],
  ["category", "Category"],
  ["totalUnits", "Total", "right"],
  ["notPrinted", "Not_Printed", "right"],
  ["printed", "Printed", "right"],
  ["reprinted", "Reprinted", "right"],
  ["claimed", "Claimed", "right"],
  ["cancelled", "Cancelled", "right"],
  ["reversedAndCancelled", "Reversed_AND_Cancelled", "right"],
  ["returnedReviewNeeded", "Review Needed", "right"],
]);

const rewardClaimsColumns = columns([
  ["claimId", "Claim ID"],
  ["contractorName", "Contractor"],
  ["contractorPhone", "Phone"],
  ["rewardName", "Reward"],
  ["pointsRsSpent", "Points/Rs", "right"],
  ["claimRaisedDateTime", "Claim Raised"],
  ["currentStatus", "Status"],
  ["otpSentDateTime", "OTP Verified"],
  ["deliveredDateTime", "Delivered"],
  ["cancelledRevokedDateTime", "Cancelled/Revoked"],
  ["fulfilledByOwner", "Fulfilled By"],
]);

const returnsReversalsColumns = columns([
  ["returnVoucherNumber", "Return Voucher"],
  ["returnDateTime", "Return Date/Time"],
  ["originalInvoiceNumber", "Original Invoice"],
  ["productName", "Product"],
  ["productCode", "SKU"],
  ["category", "Category"],
  ["returnedQuantity", "Returned Qty", "right"],
  ["allocationStatus", "Allocation Status"],
  ["qrShortCode", "QR"],
  ["contractorName", "Contractor"],
  ["pointsReversed", "Points Reversed", "right"],
  ["claimRevocationImpact", "Claim Impact"],
  ["actionActor", "Actor"],
  ["actionDateTime", "Action Date/Time"],
]);

function columns(input: readonly (readonly [string, string, AdminReportColumn["align"]?])[]): readonly AdminReportColumn[] {
  return input.map(([key, label, align]) => ({ key, label, ...(align ? { align } : {}) }));
}

function shortcut(reportId: AdminReportId, title: string, description: string) {
  return { reportId, title, description };
}

function card(
  key: string,
  label: string,
  value: string | number,
  href: string,
  tone: "info" | "warn" | "critical" | "success" = "info",
  meta?: string,
) {
  return { key, label, value, href, tone, ...(meta ? { meta } : {}) };
}

function segment(
  label: string,
  value: number,
  tone: "info" | "warn" | "critical" | "success" = "info",
  meta?: string,
) {
  return { label, value, tone, ...(meta ? { meta } : {}) };
}

function platformRange() {
  return {
    label: "Platform-wide",
    from: new Date(0),
    to: new Date(),
    timezone: "Asia/Kolkata" as const,
  };
}

function sum(label: string, value: string | number): AdminReportSummaryItem {
  return { label, value };
}

function sumNumber(rows: readonly ReportRow[], key: string): number {
  return rows.reduce((total, row) => total + (typeof row[key] === "number" ? row[key] : 0), 0);
}

function uniqueCount(values: readonly AdminReportCell[]): number {
  return new Set(values.map((value) => String(value ?? ""))).size;
}

function countBy(values: readonly string[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function activePrintedCount(counts: ReadonlyMap<string, number>): number {
  return (counts.get("PRINTED_UNCLAIMED") ?? 0) + (counts.get("REPRINTED") ?? 0);
}

function summarize(values: readonly string[]): string {
  const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return "";
  }
  if (unique.length <= 2) {
    return unique.join(", ");
  }
  return `${unique.slice(0, 2).join(", ")} +${unique.length - 2}`;
}

function humanizeCode(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function mapQrFilter(value: string) {
  switch (value) {
    case "Not_Printed":
    case "NOT_PRINTED":
      return "NOT_PRINTED" as const;
    case "Printed":
    case "PRINTED_UNCLAIMED":
      return "PRINTED_UNCLAIMED" as const;
    case "Reprinted":
    case "REPRINTED":
      return "REPRINTED" as const;
    case "Claimed":
    case "SCANNED_CLAIMED":
      return "SCANNED_CLAIMED" as const;
    case "Cancelled":
    case "CANCELLED":
      return "CANCELLED" as const;
    case "Reversed_AND_Cancelled":
    case "REVERSED":
      return "REVERSED" as const;
    default:
      return undefined;
  }
}

function mapScanResultFilter(value: string) {
  switch (value) {
    case "SUCCESS":
    case "Claimed":
    case "Success":
      return "SUCCESS" as const;
    case "ALREADY_CLAIMED":
    case "Already Claimed":
      return "ALREADY_CLAIMED" as const;
    case "EXPIRED":
    case "Expired":
      return "EXPIRED" as const;
    case "INVALID":
    case "Invalid":
      return "INVALID" as const;
    case "REPLACED":
    case "Replaced":
      return "REPLACED" as const;
    case "PERMISSION_DENIED":
    case "Permission Denied":
      return "PERMISSION_DENIED" as const;
    default:
      return undefined;
  }
}

function scanFailureLabel(result: string, failureReason: string | null | undefined, qrStatus: string | null | undefined): string {
  if (result === "SUCCESS") {
    return "";
  }
  if (result === "ALREADY_CLAIMED") {
    return "Already Claimed";
  }
  if (failureReason === "QR_NOT_SCANNABLE") {
    if (qrStatus === "SCANNED_CLAIMED") {
      return "Claimed";
    }
    if (qrStatus === "CANCELLED" || qrStatus === "REVERSED" || qrStatus === "REPRINTED") {
      return "Cancelled";
    }
    return qrStatus ? qrStatusLabel(qrStatus) : "Cancelled";
  }
  switch (failureReason ?? result) {
    case "QR_TOKEN_INVALID":
    case "REPLACED":
      return "Cancelled";
    case "QR_EXPIRED":
    case "EXPIRED":
      return "Expired";
    case "PERMISSION_DENIED":
      return "Permission Denied";
    case "INVALID":
      return "Invalid QR";
    default:
      return failureReason ? humanizeCode(failureReason) : humanizeCode(result);
  }
}

function mapRewardStatusFilter(value: string): RewardClaimStatus[] | undefined {
  switch (value) {
    case "Claim Raised":
    case "CHOSEN":
      return ["CHOSEN"];
    case "Delivered":
    case "FULFILLED":
      return ["FULFILLED"];
    case "Claim Cancelled":
    case "CANCELLED_BY_CONTRACTOR":
    case "REVOKED_DUE_TO_RETURN":
      return ["CANCELLED_BY_CONTRACTOR", "REVOKED_DUE_TO_RETURN"];
    default:
      return undefined;
  }
}

function mapReturnStatusFilter(value: string) {
  switch (value) {
    case "NOT_PRINTED_UNAVAILABLE":
    case "PRINTED_CANCEL_ELIGIBLE":
    case "SCANNED_REVIEW_NEEDED":
    case "SCANNED_REVERSED":
      return value;
    default:
      return undefined;
  }
}
