import type { ActorRole } from "@volt-rewards/domain";

export const ADMIN_REPORT_IDS = [
  "qr-print",
  "scan-history",
  "contractor-leaderboard",
  "qr-status",
  "reward-claims",
  "returns-reversals",
] as const;

export type AdminReportId = (typeof ADMIN_REPORT_IDS)[number];

export type AdminReportRangePreset =
  | "today"
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-3-months"
  | "custom";

export type AdminReportExportFormat = "PDF" | "EXCEL";

export type AdminReportCell = string | number | boolean | null;

export interface AdminReportColumn {
  readonly key: string;
  readonly label: string;
  readonly align?: "left" | "right" | "center";
}

export interface AdminReportSummaryItem {
  readonly label: string;
  readonly value: string | number;
  readonly meta?: string;
}

export interface AdminReportResolvedRange {
  readonly label: string;
  readonly from: Date;
  readonly to: Date;
  readonly timezone: "Asia/Kolkata";
}

export interface AdminReportFilters {
  readonly rangePreset: AdminReportRangePreset;
  readonly from?: Date;
  readonly to?: Date;
  readonly qrStatus?: string;
  readonly rewardStatus?: string;
  readonly returnStatus?: string;
  readonly contractorId?: string;
  readonly siteId?: string;
  readonly productCategory?: string;
  readonly invoiceNumber?: string;
  readonly rewardName?: string;
  readonly actorUserId?: string;
  readonly search?: string;
  readonly sort?: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminReportRequest {
  readonly reportId: AdminReportId;
  readonly actorRole: ActorRole;
  readonly filters: AdminReportFilters;
}

export interface AdminReportResponse<Row extends Record<string, AdminReportCell> = Record<string, AdminReportCell>> {
  readonly reportId: AdminReportId;
  readonly title: string;
  readonly resolvedRange: AdminReportResolvedRange;
  readonly summary: readonly AdminReportSummaryItem[];
  readonly columns: readonly AdminReportColumn[];
  readonly rows: readonly Row[];
  readonly totalRows: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminReportsLandingCard {
  readonly key: string;
  readonly label: string;
  readonly value: string | number;
  readonly meta?: string;
  readonly href?: string;
  readonly tone?: "info" | "warn" | "critical" | "success";
}

export interface AdminReportsLandingShortcut {
  readonly reportId: AdminReportId;
  readonly title: string;
  readonly description: string;
  readonly metric?: string;
}

export interface AdminReportsLandingChartSegment {
  readonly label: string;
  readonly value: number;
  readonly meta?: string;
  readonly tone?: "info" | "warn" | "critical" | "success";
}

export interface AdminReportsLandingChart {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly segments: readonly AdminReportsLandingChartSegment[];
}

export interface AdminReportsLanding {
  readonly resolvedRange: AdminReportResolvedRange;
  readonly cards: readonly AdminReportsLandingCard[];
  readonly reportShortcuts: readonly AdminReportsLandingShortcut[];
  readonly charts: readonly AdminReportsLandingChart[];
  readonly generatedAt: Date;
}

export interface AdminReportExportFile {
  readonly fileName: string;
  readonly contentType: string;
  readonly buffer: Buffer;
}

export interface AdminReportExportInput {
  readonly reportId: AdminReportId;
  readonly format: AdminReportExportFormat;
  readonly filters: AdminReportFilters;
  readonly actor: {
    readonly role: ActorRole;
    readonly userId?: string;
  };
}

export interface AdminReportExportAuditInput {
  readonly report: AdminReportResponse;
  readonly format: AdminReportExportFormat;
  readonly actor: {
    readonly role: ActorRole;
    readonly userId?: string;
  };
}
