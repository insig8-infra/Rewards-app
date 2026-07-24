export const QR_STATUS = {
  NOT_PRINTED: "NOT_PRINTED",
  PRINTED_UNCLAIMED: "PRINTED_UNCLAIMED",
  RESERVED_IN_CART: "RESERVED_IN_CART",
  SCANNED_CLAIMED: "SCANNED_CLAIMED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  REPRINTED: "REPRINTED",
  REVERSED: "REVERSED",
} as const;

export type QrStatus = (typeof QR_STATUS)[keyof typeof QR_STATUS];

export const QR_TOKEN_STATUS = {
  ACTIVE: "ACTIVE",
  INVALIDATED: "INVALIDATED",
} as const;

export type QrTokenStatus = (typeof QR_TOKEN_STATUS)[keyof typeof QR_TOKEN_STATUS];

export const ACTOR_ROLE = {
  CONTRACTOR: "CONTRACTOR",
  TEAM_MEMBER: "TEAM_MEMBER",
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  SYSTEM: "SYSTEM",
} as const;

export type ActorRole = (typeof ACTOR_ROLE)[keyof typeof ACTOR_ROLE];

export const REWARD_CLAIM_STATUS = {
  CHOSEN: "CHOSEN",
  CANCELLED_BY_CONTRACTOR: "CANCELLED_BY_CONTRACTOR",
  REVOKED_DUE_TO_RETURN: "REVOKED_DUE_TO_RETURN",
  FULFILLED: "FULFILLED",
} as const;

export type RewardClaimStatus =
  (typeof REWARD_CLAIM_STATUS)[keyof typeof REWARD_CLAIM_STATUS];

export interface QrToken {
  readonly value: string;
  readonly status: QrTokenStatus;
}

export interface QrUnit {
  readonly id: string;
  readonly status: QrStatus;
  readonly expiresAt: Date;
  readonly activeToken: QrToken;
  readonly tokenHistory: readonly QrToken[];
  readonly points: number;
  readonly contractorId?: string;
  readonly siteId?: string;
}

export interface ContractorPoints {
  readonly contractorId: string;
  readonly availablePoints: number;
  readonly totalAccumulatedPoints: number;
  readonly tier?: string;
}

export interface RewardCatalogItem {
  readonly id: string;
  readonly name: string;
  readonly pointsRequired: number;
  readonly tierRequired?: string;
}

export interface RewardClaim {
  readonly id: string;
  readonly claimId: string;
  readonly contractorId: string;
  readonly rewardItemId: string;
  readonly pointsDeducted: number;
  readonly status: RewardClaimStatus;
}

export interface LedgerEntry {
  readonly type:
    | "scan_credit"
    | "qr_reverse"
    | "reward_redeem"
    | "reward_cancel_restore"
    | "reward_fulfilled"
    | "reward_revoked_due_to_return";
  readonly contractorId: string;
  readonly pointsDelta: number;
  readonly balanceAfter: number;
  readonly sourceId: string;
}

export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "DomainError";
  }
}
