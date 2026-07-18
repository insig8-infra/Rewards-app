import { QR_STATUS, QR_TOKEN_STATUS, type QrStatus, type QrTokenStatus } from "@volt-rewards/domain";
import type {
  CommitScanCartInput,
  CommitScanCartResult,
  ContractorPointSnapshot,
  PersistedQrUnit,
  QrScanRepository,
  QrScanReservationResult,
  QrTokenLookup,
  RecordScanAttemptInput,
  ReserveSuccessfulScanInput,
  ScanCartItemSummary,
  ScanCartSummary,
  ScanHistoryEntry,
  ScanHistoryQuery,
} from "./qr-scan.repository.js";

interface SeedQr extends PersistedQrUnit {
  readonly tokenStatus?: QrTokenStatus;
}

interface SeedSite {
  readonly id: string;
  readonly contractorId: string;
  readonly active?: boolean;
}

interface StoredScanAttempt extends RecordScanAttemptInput {
  readonly id: string;
}

interface StoredScanCart {
  id: string;
  contractorId: string;
  siteId: string;
  status: "ACTIVE" | "COMMITTED" | "INVALIDATED";
  cartTotalPoints: number;
  scanCapPoints: number;
  lastActivityAt: Date;
}

interface StoredScanCartItem {
  id: string;
  scanCartId: string;
  qrUnitId: string;
  scanAttemptId: string;
  qrValuePoints: number;
  pointsToCredit: number;
  status: "RESERVED" | "COMMITTED" | "REMOVED_BY_USER" | "INVALIDATED";
  reservedAt: Date;
  committedAt?: Date;
  invalidationReason?: string;
}

export interface InMemoryQrScanRepositorySeed {
  readonly qrs: readonly SeedQr[];
  readonly contractors: readonly ContractorPointSnapshot[];
  readonly sites: readonly SeedSite[];
}

export class InMemoryQrScanRepository implements QrScanRepository {
  readonly attempts: StoredScanAttempt[] = [];
  private readonly qrs = new Map<string, SeedQr>();
  private readonly contractors = new Map<string, ContractorPointSnapshot>();
  private readonly sites = new Map<string, SeedSite>();
  private readonly carts = new Map<string, StoredScanCart>();
  private readonly cartItems = new Map<string, StoredScanCartItem>();

  constructor(seed: InMemoryQrScanRepositorySeed) {
    for (const qr of seed.qrs) {
      this.qrs.set(qr.activeTokenHash, qr);
    }
    for (const contractor of seed.contractors) {
      this.contractors.set(contractor.contractorId, contractor);
    }
    for (const site of seed.sites) {
      this.sites.set(site.id, site);
    }
  }

  async findQrByTokenHash(tokenHash: string): Promise<QrTokenLookup | null> {
    const qr = this.qrs.get(tokenHash);
    if (!qr) {
      return null;
    }

    return {
      tokenHash,
      tokenStatus: qr.tokenStatus ?? QR_TOKEN_STATUS.ACTIVE,
      qr,
    };
  }

  async contractorOwnsActiveSite(contractorId: string, siteId: string): Promise<boolean> {
    const site = this.sites.get(siteId);
    return site?.contractorId === contractorId && site.active !== false;
  }

  async getContractorPoints(contractorId: string): Promise<ContractorPointSnapshot | null> {
    return this.contractors.get(contractorId) ?? null;
  }

  async getActiveScanCart(contractorId: string, siteId: string): Promise<ScanCartSummary | null> {
    const cart = [...this.carts.values()].find(
      (candidate) =>
        candidate.contractorId === contractorId && candidate.siteId === siteId && candidate.status === "ACTIVE",
    );
    return cart ? this.toCartSummary(cart) : null;
  }

  async recordScanAttempt(input: RecordScanAttemptInput): Promise<void> {
    this.attempts.push({ ...input, id: `attempt_${this.attempts.length + 1}` });
  }

  async reserveSuccessfulScan(input: ReserveSuccessfulScanInput): Promise<QrScanReservationResult> {
    const qr = this.qrs.get(input.tokenHash);

    if (!qr || !isActiveUnscannedQrStatus(qr.status)) {
      throw new Error("QR was not eligible for scan reservation.");
    }

    const cart = this.findOrCreateActiveCart(input);

    const updatedQr = {
      ...qr,
      status: QR_STATUS.RESERVED_IN_CART as QrStatus,
      contractorId: input.contractorId,
      siteId: input.siteId,
    };

    this.qrs.set(input.tokenHash, updatedQr);
    const attempt: StoredScanAttempt = {
      id: `attempt_${this.attempts.length + 1}`,
      qrId: input.qrId,
      tokenHash: input.tokenHash,
      actorRole: input.actorRole,
      contractorId: input.contractorId,
      siteId: input.siteId,
      ...(input.teamMemberMobile ? { teamMemberMobile: input.teamMemberMobile } : {}),
      ...(input.teamMemberSessionId ? { teamMemberSessionId: input.teamMemberSessionId } : {}),
      ...(input.deviceContext ? { deviceContext: input.deviceContext } : {}),
      result: "RESERVED",
      qrValuePoints: qr.points,
      creditedPoints: 0,
      at: input.reservedAt,
    };
    this.attempts.push(attempt);

    const cartItem: StoredScanCartItem = {
      id: `cart_item_${this.cartItems.size + 1}`,
      scanCartId: cart.id,
      qrUnitId: input.qrId,
      scanAttemptId: attempt.id,
      qrValuePoints: qr.points,
      pointsToCredit: qr.points,
      status: "RESERVED",
      reservedAt: input.reservedAt,
    };
    this.cartItems.set(cartItem.id, cartItem);
    cart.cartTotalPoints += qr.points;
    cart.lastActivityAt = input.reservedAt;

    return {
      qrId: input.qrId,
      contractorId: input.contractorId,
      siteId: input.siteId,
      qrValuePoints: qr.points,
      pointsCredited: 0,
      reservedAt: input.reservedAt,
      cart: this.toCartSummary(cart),
    };
  }

  async getScanCart(contractorId: string, siteId: string): Promise<ScanCartSummary> {
    const cart = await this.getActiveScanCart(contractorId, siteId);
    return cart ?? emptyCartSummary(contractorId, siteId);
  }

  async commitScanCart(input: CommitScanCartInput): Promise<CommitScanCartResult> {
    const cart = [...this.carts.values()].find(
      (candidate) =>
        candidate.contractorId === input.contractorId && candidate.siteId === input.siteId && candidate.status === "ACTIVE",
    );
    const contractor = this.contractors.get(input.contractorId);
    if (!contractor) {
      throw new Error("Contractor was not available for scan cart commit.");
    }
    if (!cart) {
      return {
        contractorId: input.contractorId,
        siteId: input.siteId,
        pointsCredited: 0,
        balanceAfter: contractor.availablePoints,
        totalAccumulatedPoints: contractor.totalAccumulatedPoints,
        committedAt: input.committedAt,
        committedItems: [],
        cart: emptyCartSummary(input.contractorId, input.siteId),
      };
    }

    const items = [...this.cartItems.values()].filter(
      (item) => item.scanCartId === cart.id && item.status === "RESERVED",
    );
    const pointsCredited = items.reduce((total, item) => total + item.pointsToCredit, 0);
    const balanceAfter = contractor.availablePoints + pointsCredited;
    const totalAccumulatedPoints = contractor.totalAccumulatedPoints + pointsCredited;

    this.contractors.set(input.contractorId, {
      ...contractor,
      availablePoints: balanceAfter,
      totalAccumulatedPoints,
    });

    const committedItems: ScanCartItemSummary[] = [];
    for (const item of items) {
      const qr = [...this.qrs.values()].find((candidate) => candidate.id === item.qrUnitId);
      if (qr) {
        const updatedQr = { ...qr, status: QR_STATUS.SCANNED_CLAIMED as QrStatus };
        this.qrs.set(qr.activeTokenHash, updatedQr);
      }
      const committedItem = { ...item, status: "COMMITTED" as const, committedAt: input.committedAt };
      this.cartItems.set(item.id, committedItem);
      committedItems.push(this.toCartItemSummary(committedItem));
      const attemptIndex = this.attempts.findIndex((attempt) => attempt.id === item.scanAttemptId);
      if (attemptIndex >= 0) {
        const attempt = this.attempts[attemptIndex];
        if (attempt) {
          this.attempts[attemptIndex] = { ...attempt, result: "SUCCESS", creditedPoints: item.pointsToCredit };
        }
      }
    }

    cart.status = "COMMITTED";
    cart.cartTotalPoints = 0;
    cart.lastActivityAt = input.committedAt;

    return {
      contractorId: input.contractorId,
      siteId: input.siteId,
      pointsCredited,
      balanceAfter,
      totalAccumulatedPoints,
      committedAt: input.committedAt,
      committedItems,
      cart: this.toCartSummary(cart),
    };
  }

  async listScanHistory(input: ScanHistoryQuery): Promise<readonly ScanHistoryEntry[]> {
    return this.attempts
      .filter((attempt) => attempt.contractorId === input.contractorId)
      .filter((attempt) => (input.siteId ? attempt.siteId === input.siteId : true))
      .filter((attempt) => (input.result ? attempt.result === input.result : true))
      .filter((attempt) => (input.teamMemberMobile ? attempt.teamMemberMobile === input.teamMemberMobile : true))
      .slice(-input.limit)
      .reverse()
      .map((attempt, index) => {
        const qr = attempt.qrId
          ? [...this.qrs.values()].find((candidate) => candidate.id === attempt.qrId)
          : undefined;

        return {
          scanAttemptId: attempt.id,
          actorRole: attempt.actorRole,
          result: attempt.result,
          createdAt: attempt.at,
          ...(attempt.qrId ? { qrUnitId: attempt.qrId, qrCodeId: attempt.qrId } : {}),
          ...(qr?.productSku ? { productSku: qr.productSku } : {}),
          ...(typeof attempt.qrValuePoints === "number" ? { qrValuePoints: attempt.qrValuePoints } : {}),
          ...(typeof attempt.creditedPoints === "number" ? { creditedPoints: attempt.creditedPoints } : {}),
          ...(attempt.teamMemberMobile ? { teamMemberMobile: attempt.teamMemberMobile } : {}),
          ...(attempt.teamMemberSessionId ? { teamMemberSessionId: attempt.teamMemberSessionId } : {}),
          ...(attempt.contractorId ? { contractorId: attempt.contractorId } : {}),
          ...(attempt.siteId ? { siteId: attempt.siteId } : {}),
          ...(attempt.failureReason ? { failureReason: attempt.failureReason } : {}),
        };
      });
  }

  private findOrCreateActiveCart(input: ReserveSuccessfulScanInput): StoredScanCart {
    const existing = [...this.carts.values()].find(
      (cart) => cart.contractorId === input.contractorId && cart.siteId === input.siteId && cart.status === "ACTIVE",
    );
    if (existing) {
      return existing;
    }
    const cart: StoredScanCart = {
      id: `cart_${this.carts.size + 1}`,
      contractorId: input.contractorId,
      siteId: input.siteId,
      status: "ACTIVE",
      cartTotalPoints: 0,
      scanCapPoints: input.scanCapPoints,
      lastActivityAt: input.reservedAt,
    };
    this.carts.set(cart.id, cart);
    return cart;
  }

  private toCartSummary(cart: StoredScanCart): ScanCartSummary {
    return {
      cartId: cart.id,
      contractorId: cart.contractorId,
      siteId: cart.siteId,
      status: cart.status,
      cartTotalPoints: cart.cartTotalPoints,
      scanCapPoints: cart.scanCapPoints,
      lastActivityAt: cart.lastActivityAt,
      items: [...this.cartItems.values()]
        .filter((item) => item.scanCartId === cart.id)
        .map((item) => this.toCartItemSummary(item)),
    };
  }

  private toCartItemSummary(item: StoredScanCartItem): ScanCartItemSummary {
    const qr = [...this.qrs.values()].find((candidate) => candidate.id === item.qrUnitId);
    return {
      cartItemId: item.id,
      qrUnitId: item.qrUnitId,
      scanAttemptId: item.scanAttemptId,
      ...(qr?.productSku ? { productSku: qr.productSku } : {}),
      qrValuePoints: item.qrValuePoints,
      pointsToCredit: item.pointsToCredit,
      status: item.status,
      reservedAt: item.reservedAt,
      ...(item.committedAt ? { committedAt: item.committedAt } : {}),
      ...(item.invalidationReason ? { invalidationReason: item.invalidationReason } : {}),
    };
  }
}

function isActiveUnscannedQrStatus(status: QrStatus): boolean {
  return status === QR_STATUS.PRINTED_UNCLAIMED || status === QR_STATUS.REPRINTED;
}

function emptyCartSummary(contractorId: string, siteId: string): ScanCartSummary {
  return {
    cartId: "",
    contractorId,
    siteId,
    status: "ACTIVE",
    cartTotalPoints: 0,
    scanCapPoints: 0,
    lastActivityAt: new Date(0),
    items: [],
  };
}
