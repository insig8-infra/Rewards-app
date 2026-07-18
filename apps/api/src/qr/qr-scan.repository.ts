import type {
  ActorRole,
  QrStatus,
  QrTokenStatus,
} from "@volt-rewards/domain";

export const QR_SCAN_REPOSITORY = Symbol("QR_SCAN_REPOSITORY");

export type PersistedScanResult =
  | "RESERVED"
  | "SUCCESS"
  | "ALREADY_CLAIMED"
  | "EXPIRED"
  | "INVALID"
  | "REPLACED"
  | "CART_CAP_REACHED"
  | "PERMISSION_DENIED";

export type PersistedScanCartStatus = "ACTIVE" | "COMMITTED" | "INVALIDATED";
export type PersistedScanCartItemStatus = "RESERVED" | "COMMITTED" | "REMOVED_BY_USER" | "INVALIDATED";

export interface QrTokenLookup {
  readonly tokenHash: string;
  readonly tokenStatus: QrTokenStatus;
  readonly qr: PersistedQrUnit;
}

export interface PersistedQrUnit {
  readonly id: string;
  readonly status: QrStatus;
  readonly expiresAt: Date;
  readonly activeTokenHash: string;
  readonly points: number;
  readonly productSku?: string;
  readonly contractorId?: string;
  readonly siteId?: string;
}

export interface ContractorPointSnapshot {
  readonly contractorId: string;
  readonly availablePoints: number;
  readonly totalAccumulatedPoints: number;
}

export interface ScanCartItemSummary {
  readonly cartItemId: string;
  readonly qrUnitId: string;
  readonly scanAttemptId: string;
  readonly productSku?: string;
  readonly qrValuePoints: number;
  readonly pointsToCredit: number;
  readonly status: PersistedScanCartItemStatus;
  readonly reservedAt: Date;
  readonly committedAt?: Date;
  readonly invalidationReason?: string;
}

export interface ScanCartSummary {
  readonly cartId: string;
  readonly contractorId: string;
  readonly siteId: string;
  readonly status: PersistedScanCartStatus;
  readonly cartTotalPoints: number;
  readonly scanCapPoints: number;
  readonly lastActivityAt: Date;
  readonly items: readonly ScanCartItemSummary[];
}

export interface RecordScanAttemptInput {
  readonly qrId?: string;
  readonly tokenHash: string;
  readonly actorRole: ActorRole;
  readonly contractorId?: string;
  readonly siteId?: string;
  readonly teamMemberMobile?: string;
  readonly teamMemberSessionId?: string;
  readonly deviceContext?: Record<string, unknown>;
  readonly result: PersistedScanResult;
  readonly failureReason?: string;
  readonly qrValuePoints?: number;
  readonly creditedPoints?: number;
  readonly at: Date;
}

export interface ReserveSuccessfulScanInput {
  readonly qrId: string;
  readonly tokenHash: string;
  readonly actorRole: ActorRole;
  readonly contractorId: string;
  readonly siteId: string;
  readonly teamMemberMobile?: string;
  readonly teamMemberSessionId?: string;
  readonly deviceContext?: Record<string, unknown>;
  readonly reservedAt: Date;
  readonly scanCapPoints: number;
}

export interface QrScanReservationResult {
  readonly qrId: string;
  readonly contractorId: string;
  readonly siteId: string;
  readonly qrValuePoints: number;
  readonly pointsCredited: 0;
  readonly reservedAt: Date;
  readonly cart: ScanCartSummary;
}

export interface CommitScanCartInput {
  readonly actorRole: ActorRole;
  readonly contractorId: string;
  readonly siteId: string;
  readonly teamMemberMobile?: string;
  readonly teamMemberSessionId?: string;
  readonly committedAt: Date;
}

export interface CommitScanCartResult {
  readonly contractorId: string;
  readonly siteId: string;
  readonly pointsCredited: number;
  readonly balanceAfter: number;
  readonly totalAccumulatedPoints: number;
  readonly committedAt: Date;
  readonly committedItems: readonly ScanCartItemSummary[];
  readonly cart: ScanCartSummary;
}

export interface ScanHistoryQuery {
  readonly contractorId: string;
  readonly siteId?: string;
  readonly result?: PersistedScanResult;
  readonly teamMemberMobile?: string;
  readonly limit: number;
}

export interface ScanHistoryEntry {
  readonly scanAttemptId: string;
  readonly qrUnitId?: string;
  readonly qrCodeId?: string;
  readonly productSku?: string;
  readonly qrValuePoints?: number;
  readonly creditedPoints?: number;
  readonly actorRole: ActorRole;
  readonly teamMemberMobile?: string;
  readonly teamMemberSessionId?: string;
  readonly contractorId?: string;
  readonly siteId?: string;
  readonly siteLabel?: string;
  readonly result: PersistedScanResult;
  readonly failureReason?: string;
  readonly createdAt: Date;
}

export interface QrScanRepository {
  findQrByTokenHash(tokenHash: string): Promise<QrTokenLookup | null>;
  contractorOwnsActiveSite(contractorId: string, siteId: string): Promise<boolean>;
  getContractorPoints(contractorId: string): Promise<ContractorPointSnapshot | null>;
  getActiveScanCart(contractorId: string, siteId: string): Promise<ScanCartSummary | null>;
  recordScanAttempt(input: RecordScanAttemptInput): Promise<void>;
  reserveSuccessfulScan(input: ReserveSuccessfulScanInput): Promise<QrScanReservationResult>;
  getScanCart(contractorId: string, siteId: string): Promise<ScanCartSummary>;
  commitScanCart(input: CommitScanCartInput): Promise<CommitScanCartResult>;
  listScanHistory(input: ScanHistoryQuery): Promise<readonly ScanHistoryEntry[]>;
}
