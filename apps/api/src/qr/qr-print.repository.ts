import type {
  ActorRole,
  QrPrintLineAvailability,
  QrPrintLineRequest,
} from "@volt-rewards/domain";

export const QR_PRINT_REPOSITORY = Symbol("QR_PRINT_REPOSITORY");

export interface QrPrintTokenAssignment {
  readonly invoiceLineId: string;
  readonly tokenValue: string;
  readonly tokenHash: string;
}

export interface CommitQrPrintInput {
  readonly invoiceId: string;
  readonly actorRole: ActorRole;
  readonly actorUserId?: string;
  readonly printedAt: Date;
  readonly expiresAt: Date;
  readonly selections: readonly QrPrintLineRequest[];
  readonly tokenAssignments: readonly QrPrintTokenAssignment[];
}

export interface ReprintQrInput {
  readonly qrUnitId: string;
  readonly actorRole: ActorRole;
  readonly actorUserId?: string;
  readonly reprintedAt: Date;
  readonly tokenValue: string;
  readonly tokenHash: string;
}

export interface PrintedQrUnit {
  readonly qrUnitId: string;
  readonly invoiceLineId: string;
  readonly unitIndex: number;
  readonly tokenValue: string;
  readonly points: number;
  readonly expiresAt: Date;
}

export interface QrPrintResult {
  readonly invoiceId: string;
  readonly printedAt: Date;
  readonly expiresAt: Date;
  readonly printedUnits: readonly PrintedQrUnit[];
}

export interface QrPrintRepository {
  getLineAvailabilities(invoiceId: string, invoiceLineIds: readonly string[]): Promise<readonly QrPrintLineAvailability[]>;
  commitQrPrint(input: CommitQrPrintInput): Promise<QrPrintResult>;
  reprintQr(input: ReprintQrInput): Promise<PrintedQrUnit>;
}
