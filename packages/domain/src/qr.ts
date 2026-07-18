import {
  ACTOR_ROLE,
  DomainError,
  QR_STATUS,
  QR_TOKEN_STATUS,
  type ActorRole,
  type LedgerEntry,
  type QrToken,
  type QrUnit,
} from "./types.js";

export interface ScanInput {
  readonly actorRole: ActorRole;
  readonly tokenValue: string;
  readonly contractorId: string;
  readonly siteId: string;
  readonly siteBelongsToContractor: boolean;
  readonly currentBalance?: number;
  readonly now: Date;
}

export interface ScanResult {
  readonly qr: QrUnit;
  readonly ledgerEntry: LedgerEntry;
}

export interface ReserveScanResult {
  readonly qr: QrUnit;
}

export function scanQr(qr: QrUnit, input: ScanInput): ScanResult {
  const reserved = reserveQr(qr, input);
  return commitReservedQr(reserved.qr, {
    contractorId: input.contractorId,
    siteId: input.siteId,
    currentBalance: input.currentBalance ?? 0,
  });
}

export function reserveQr(qr: QrUnit, input: ScanInput): ReserveScanResult {
  if (input.actorRole !== ACTOR_ROLE.CONTRACTOR && input.actorRole !== ACTOR_ROLE.TEAM_MEMBER) {
    throw new DomainError("QR_SCAN_FORBIDDEN_ACTOR", "Only Contractor or Team Member can scan QR.");
  }

  if (qr.activeToken.value !== input.tokenValue || qr.activeToken.status !== QR_TOKEN_STATUS.ACTIVE) {
    throw new DomainError("QR_TOKEN_INVALID", "QR token is invalid or replaced.");
  }

  if (!isActiveUnscannedQrStatus(qr.status)) {
    throw new DomainError("QR_NOT_SCANNABLE", `QR in status ${qr.status} cannot be scanned.`);
  }

  if (input.now > qr.expiresAt) {
    throw new DomainError("QR_EXPIRED", "Expired QR cannot be scanned.");
  }

  if (!input.siteBelongsToContractor) {
    throw new DomainError("QR_SITE_FORBIDDEN", "Selected site does not belong to contractor.");
  }

  const updatedQr: QrUnit = {
    ...qr,
    status: QR_STATUS.RESERVED_IN_CART,
    contractorId: input.contractorId,
    siteId: input.siteId,
  };

  return {
    qr: updatedQr,
  };
}

export function commitReservedQr(
  qr: QrUnit,
  input: {
    readonly contractorId: string;
    readonly siteId: string;
    readonly currentBalance: number;
  },
): ScanResult {
  if (qr.status !== QR_STATUS.RESERVED_IN_CART) {
    throw new DomainError("QR_COMMIT_INVALID_STATUS", "Only reserved cart QR can be added to account.");
  }

  if (qr.contractorId !== input.contractorId || qr.siteId !== input.siteId) {
    throw new DomainError("QR_COMMIT_FORBIDDEN_CART", "Reserved QR does not belong to this contractor site cart.");
  }

  return {
    qr: { ...qr, status: QR_STATUS.SCANNED_CLAIMED },
    ledgerEntry: {
      type: "scan_credit",
      contractorId: input.contractorId,
      pointsDelta: qr.points,
      balanceAfter: input.currentBalance + qr.points,
      sourceId: qr.id,
    },
  };
}

export function cancelQr(
  qr: QrUnit,
  input: { readonly actorRole: ActorRole; readonly labelRemovedAndDiscarded: boolean; readonly now: Date },
): QrUnit {
  assertOwnerOrStaff(input.actorRole, "QR_CANCEL_FORBIDDEN_ACTOR");
  assertLabelRemoved(input.labelRemovedAndDiscarded);

  if (!isActiveUnscannedQrStatus(qr.status)) {
    throw new DomainError("QR_CANCEL_INVALID_STATUS", "Only unscanned printed QR can be cancelled.");
  }

  if (input.now > qr.expiresAt) {
    throw new DomainError("QR_CANCEL_EXPIRED", "Expired QR cannot be cancelled in v1.");
  }

  return { ...qr, status: QR_STATUS.CANCELLED };
}

export function reverseQr(
  qr: QrUnit,
  input: {
    readonly actorRole: ActorRole;
    readonly labelRemovedAndDiscarded: boolean;
    readonly currentBalance: number;
  },
): { readonly qr: QrUnit; readonly ledgerEntry: LedgerEntry; readonly createsNegativeBalance: boolean } {
  assertOwnerOrStaff(input.actorRole, "QR_REVERSE_FORBIDDEN_ACTOR");
  assertLabelRemoved(input.labelRemovedAndDiscarded);

  if (qr.status !== QR_STATUS.SCANNED_CLAIMED || !qr.contractorId) {
    throw new DomainError("QR_REVERSE_INVALID_STATUS", "Only scanned/claimed QR can be reversed.");
  }

  const balanceAfter = input.currentBalance - qr.points;

  return {
    qr: { ...qr, status: QR_STATUS.REVERSED },
    ledgerEntry: {
      type: "qr_reverse",
      contractorId: qr.contractorId,
      pointsDelta: -qr.points,
      balanceAfter,
      sourceId: qr.id,
    },
    createsNegativeBalance: balanceAfter < 0,
  };
}

export function reprintQr(
  qr: QrUnit,
  input: { readonly actorRole: ActorRole; readonly replacementToken: string; readonly now: Date },
): QrUnit {
  assertOwnerOrStaff(input.actorRole, "QR_REPRINT_FORBIDDEN_ACTOR");

  if (!isActiveUnscannedQrStatus(qr.status)) {
    throw new DomainError("QR_REPRINT_INVALID_STATUS", "Only unscanned printed QR can be reprinted.");
  }

  if (input.now > qr.expiresAt) {
    throw new DomainError("QR_REPRINT_EXPIRED", "Expired QR cannot be reprinted in v1.");
  }

  const invalidatedToken: QrToken = { ...qr.activeToken, status: QR_TOKEN_STATUS.INVALIDATED };
  const activeToken: QrToken = { value: input.replacementToken, status: QR_TOKEN_STATUS.ACTIVE };

  return {
    ...qr,
    status: QR_STATUS.REPRINTED,
    activeToken,
    tokenHistory: [...qr.tokenHistory, invalidatedToken],
  };
}

function isActiveUnscannedQrStatus(status: QrUnit["status"]): boolean {
  return status === QR_STATUS.PRINTED_UNCLAIMED || status === QR_STATUS.REPRINTED;
}

function assertOwnerOrStaff(actorRole: ActorRole, code: string): void {
  if (actorRole !== ACTOR_ROLE.OWNER && actorRole !== ACTOR_ROLE.STAFF) {
    throw new DomainError(code, "Only OWNER or STAFF can perform this QR operation.");
  }
}

function assertLabelRemoved(labelRemovedAndDiscarded: boolean): void {
  if (!labelRemovedAndDiscarded) {
    throw new DomainError(
      "QR_LABEL_CONFIRMATION_REQUIRED",
      "QR label removed and discarded confirmation is required.",
    );
  }
}
