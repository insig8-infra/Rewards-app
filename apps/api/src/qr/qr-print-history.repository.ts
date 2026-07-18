import type { ActorRole } from "@volt-rewards/domain";

export const QR_PRINT_HISTORY_REPOSITORY = Symbol("QR_PRINT_HISTORY_REPOSITORY");

export interface QrPrintHistoryEntry {
  readonly auditEventId: string;
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly customerName: string;
  readonly printedAt: Date;
  readonly actorRole: ActorRole;
  readonly actorUserId?: string;
  readonly actorName?: string;
  readonly printedUnitCount: number;
  readonly lineCount: number;
  readonly productSummary: string;
}

export interface QrPrintHistoryRepository {
  listPrintHistory(): Promise<readonly QrPrintHistoryEntry[]>;
}
