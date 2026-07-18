import { Inject, Injectable } from "@nestjs/common";
import {
  ACTOR_ROLE,
  DomainError,
  QR_TOKEN_STATUS,
  reserveQr,
  type ActorRole,
  type QrUnit,
} from "@volt-rewards/domain";
import { hashQrToken } from "./qr-token.js";
import {
  QR_SCAN_REPOSITORY,
  type PersistedQrUnit,
  type PersistedScanResult,
  type CommitScanCartResult,
  type QrScanReservationResult,
  type QrScanRepository,
  type ScanCartSummary,
  type ScanHistoryEntry,
} from "./qr-scan.repository.js";

export interface ScanQrCommand {
  readonly tokenValue: string;
  readonly actorRole: ActorRole;
  readonly contractorId: string;
  readonly siteId: string;
  readonly teamMemberMobile?: string;
  readonly teamMemberSessionId?: string;
  readonly deviceContext?: Record<string, unknown>;
  readonly now: Date;
}

export interface ListScanHistoryCommand {
  readonly actorRole: ActorRole;
  readonly contractorId: string;
  readonly siteId?: string;
  readonly result?: PersistedScanResult;
  readonly teamMemberMobile?: string;
  readonly limit?: number;
}

export interface ScanCartCommand {
  readonly actorRole: ActorRole;
  readonly contractorId: string;
  readonly siteId: string;
  readonly teamMemberMobile?: string;
  readonly teamMemberSessionId?: string;
  readonly now: Date;
}

const NO_SCAN_CART_CAP_POINTS = 0;

@Injectable()
export class QrScanService {
  constructor(
    @Inject(QR_SCAN_REPOSITORY)
    private readonly repository: QrScanRepository,
  ) {}

  async scanQr(command: ScanQrCommand): Promise<QrScanReservationResult> {
    const tokenHash = hashQrToken(command.tokenValue);
    const lookup = await this.repository.findQrByTokenHash(tokenHash);
    const attemptContext = toAttemptContext(command);

    if (!lookup) {
      await this.repository.recordScanAttempt({
        tokenHash,
        actorRole: command.actorRole,
        ...attemptContext,
        result: "INVALID",
        failureReason: "QR token was not found.",
        at: command.now,
      });
      throw new DomainError("QR_TOKEN_INVALID", "QR token is invalid or replaced.");
    }

    if (lookup.tokenStatus !== QR_TOKEN_STATUS.ACTIVE) {
      await this.repository.recordScanAttempt({
        qrId: lookup.qr.id,
        tokenHash,
        actorRole: command.actorRole,
        ...attemptContext,
        result: "REPLACED",
        failureReason: "QR token was invalidated by a reprint.",
        at: command.now,
      });
      throw new DomainError("QR_TOKEN_INVALID", "QR token is invalid or replaced.");
    }

    const contractorPoints = await this.repository.getContractorPoints(command.contractorId);
    if (!contractorPoints) {
      await this.repository.recordScanAttempt({
        qrId: lookup.qr.id,
        tokenHash,
        actorRole: command.actorRole,
        ...attemptContext,
        result: "PERMISSION_DENIED",
        failureReason: "Contractor was not found.",
        at: command.now,
      });
      throw new DomainError("CONTRACTOR_NOT_FOUND", "Contractor was not found.");
    }

    const siteBelongsToContractor = await this.repository.contractorOwnsActiveSite(
      command.contractorId,
      command.siteId,
    );

    try {
      reserveQr(toDomainQr(lookup.qr), {
        actorRole: command.actorRole,
        tokenValue: tokenHash,
        contractorId: command.contractorId,
        siteId: command.siteId,
        siteBelongsToContractor,
        now: command.now,
      });

      return await this.repository.reserveSuccessfulScan({
        qrId: lookup.qr.id,
        tokenHash,
        actorRole: command.actorRole,
        contractorId: command.contractorId,
        siteId: command.siteId,
        ...(command.teamMemberMobile ? { teamMemberMobile: command.teamMemberMobile } : {}),
        ...(command.teamMemberSessionId ? { teamMemberSessionId: command.teamMemberSessionId } : {}),
        ...(command.deviceContext ? { deviceContext: command.deviceContext } : {}),
        reservedAt: command.now,
        scanCapPoints: NO_SCAN_CART_CAP_POINTS,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        await this.repository.recordScanAttempt({
          qrId: lookup.qr.id,
          tokenHash,
          actorRole: command.actorRole,
          contractorId: command.contractorId,
          ...(command.teamMemberMobile ? { teamMemberMobile: command.teamMemberMobile } : {}),
          ...(command.teamMemberSessionId ? { teamMemberSessionId: command.teamMemberSessionId } : {}),
          ...(command.deviceContext ? { deviceContext: command.deviceContext } : {}),
          ...(siteBelongsToContractor ? { siteId: command.siteId } : {}),
          result: mapDomainErrorToScanResult(error),
          failureReason: error.code,
          qrValuePoints: lookup.qr.points,
          creditedPoints: 0,
          at: command.now,
        });
      }
      throw error;
    }
  }

  getScanCart(command: ScanCartCommand): Promise<ScanCartSummary> {
    return this.repository.getScanCart(command.contractorId, command.siteId);
  }

  commitScanCart(command: ScanCartCommand): Promise<CommitScanCartResult> {
    return this.repository.commitScanCart({
      actorRole: command.actorRole,
      contractorId: command.contractorId,
      siteId: command.siteId,
      ...(command.teamMemberMobile ? { teamMemberMobile: command.teamMemberMobile } : {}),
      ...(command.teamMemberSessionId ? { teamMemberSessionId: command.teamMemberSessionId } : {}),
      committedAt: command.now,
    });
  }

  listScanHistory(command: ListScanHistoryCommand): Promise<readonly ScanHistoryEntry[]> {
    return this.repository.listScanHistory({
      contractorId: command.contractorId,
      ...(command.siteId ? { siteId: command.siteId } : {}),
      ...(command.result ? { result: command.result } : {}),
      ...(command.actorRole === ACTOR_ROLE.TEAM_MEMBER && command.teamMemberMobile
        ? { teamMemberMobile: command.teamMemberMobile }
        : {}),
      limit: clampLimit(command.limit ?? 50),
    });
  }
}

function toAttemptContext(command: ScanQrCommand): Pick<
  Parameters<QrScanRepository["recordScanAttempt"]>[0],
  "contractorId" | "siteId" | "teamMemberMobile" | "teamMemberSessionId" | "deviceContext"
> {
  return {
    contractorId: command.contractorId,
    siteId: command.siteId,
    ...(command.teamMemberMobile ? { teamMemberMobile: command.teamMemberMobile } : {}),
    ...(command.teamMemberSessionId ? { teamMemberSessionId: command.teamMemberSessionId } : {}),
    ...(command.deviceContext ? { deviceContext: command.deviceContext } : {}),
  };
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return 50;
  }
  return Math.min(100, Math.max(1, Math.trunc(limit)));
}

function toDomainQr(qr: PersistedQrUnit): QrUnit {
  return {
    id: qr.id,
    status: qr.status,
    expiresAt: qr.expiresAt,
    activeToken: { value: qr.activeTokenHash, status: QR_TOKEN_STATUS.ACTIVE },
    tokenHistory: [],
    points: qr.points,
    ...(qr.contractorId ? { contractorId: qr.contractorId } : {}),
    ...(qr.siteId ? { siteId: qr.siteId } : {}),
  };
}

function mapDomainErrorToScanResult(error: DomainError): PersistedScanResult {
  switch (error.code) {
    case "QR_EXPIRED":
      return "EXPIRED";
    case "QR_SCAN_FORBIDDEN_ACTOR":
    case "QR_SITE_FORBIDDEN":
      return "PERMISSION_DENIED";
    case "QR_NOT_SCANNABLE":
      return "ALREADY_CLAIMED";
    case "QR_TOKEN_INVALID":
      return "INVALID";
    case "SCAN_CART_CAP_REACHED":
      return "CART_CAP_REACHED";
    default:
      return "INVALID";
  }
}
