import type { ActorRole } from "@volt-rewards/domain";

export const ADMIN_WEB_DASHBOARD_REPOSITORY = Symbol("ADMIN_WEB_DASHBOARD_REPOSITORY");

export interface AdminWebDashboardMetric {
  readonly label: string;
  readonly value: number;
}

export interface AdminWebDashboardActivity {
  readonly auditEventId: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly targetLabel?: string;
  readonly actorRole: ActorRole;
  readonly actorName?: string;
  readonly createdAt: Date;
}

export type AdminWebDashboardAttentionTone = "info" | "warn" | "critical" | "success";

export interface AdminWebDashboardAttentionItem {
  readonly id: string;
  readonly type: "INVOICE_READY" | "PENDING_REWARD" | "RETURN" | "QR_EXCEPTION" | "ITEM_CODE_RULE";
  readonly title: string;
  readonly description: string;
  readonly value: string;
  readonly href?: string;
  readonly tone: AdminWebDashboardAttentionTone;
}

export interface AdminWebDashboardShortcut {
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly icon: string;
  readonly ownerOnly: boolean;
}

export interface AdminWebDashboardStatusMix {
  readonly status: string;
  readonly label: string;
  readonly count: number;
}

export interface AdminWebDashboardPrintTrend {
  readonly date: string;
  readonly label: string;
  readonly printedUnits: number;
}

export interface AdminWebDashboardTopContractor {
  readonly contractorId: string;
  readonly contractorCode: string;
  readonly name: string;
  readonly tier?: string;
  readonly availablePoints: number;
  readonly totalAccumulatedPoints: number;
  readonly scanCount: number;
}

export interface AdminWebDashboard {
  readonly actorRole: ActorRole;
  readonly roleLabel: string;
  readonly allowedSections: readonly string[];
  readonly metrics: {
    readonly contractors: number;
    readonly staff: number;
    readonly invoices: number;
    readonly invoicesReadyToPrint: number;
    readonly qrTotal: number;
    readonly qrNotPrinted: number;
    readonly qrPrinted: number;
    readonly qrScanned: number;
    readonly qrCancelled: number;
    readonly qrReversed: number;
    readonly rewardClaims: number;
    readonly pendingRewardClaims: number;
    readonly recentReturns: number;
  };
  readonly attentionQueue: readonly AdminWebDashboardAttentionItem[];
  readonly shortcuts: readonly AdminWebDashboardShortcut[];
  readonly qrStatusMix: readonly AdminWebDashboardStatusMix[];
  readonly printTrend: readonly AdminWebDashboardPrintTrend[];
  readonly topContractors: readonly AdminWebDashboardTopContractor[];
  readonly recentActivity: readonly AdminWebDashboardActivity[];
}

export interface AdminWebDashboardRepository {
  getDashboard(actorRole: ActorRole): Promise<AdminWebDashboard>;
}
