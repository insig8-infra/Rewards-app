import {
  BUSY_RETURN_ALLOCATION_TYPE,
  DomainError,
  QR_STATUS,
  QR_TOKEN_STATUS,
  allocateBusyReturnLine,
  resolveItemCodePrintPoints,
  resolveItemCodeStatus,
  type QrStatus,
  type QrTokenStatus,
} from "@volt-rewards/domain";
import type {
  BusyImportRepository,
  BusyInvoiceImport,
  BusyReturnVoucherImport,
  ImportedBusyInvoice,
  ImportedBusyReturnVoucher,
} from "../busy/busy-import.repository.js";
import type {
  CommitQrPrintInput,
  PrintedQrUnit,
  QrPrintRepository,
  QrPrintResult,
  ReprintQrInput,
} from "../qr/qr-print.repository.js";
import type {
  CommitScanCartInput,
  CommitScanCartResult,
  ContractorPointSnapshot,
  QrScanReservationResult,
  QrScanRepository,
  QrTokenLookup,
  RecordScanAttemptInput,
  ReserveSuccessfulScanInput,
  ScanCartItemSummary,
  ScanCartSummary,
  ScanHistoryEntry,
  ScanHistoryQuery,
} from "../qr/qr-scan.repository.js";

interface SeedSite {
  readonly id: string;
  readonly contractorId: string;
  readonly active?: boolean;
}

interface StoredInvoice {
  readonly id: string;
  readonly externalInvoiceId: string;
  invoiceNumber: string;
}

interface StoredLine {
  readonly id: string;
  readonly invoiceId: string;
  readonly externalLineId: string;
  sku: string;
  productName: string;
  category?: string;
  quantity: number;
  returnedQty: number;
  pointsPerUnit: number;
  unitRate: string;
}

interface StoredItemCode {
  tempItemCode: string;
  itemName: string;
  productCategory?: string;
  price: number;
  fixedPoints: number | null;
  percentOfPricePoints: number | null;
  status: "IN_USE" | "NOT_IN_USE" | "NOT_IN_BUSY";
  busyActive: boolean;
}

interface StoredReturnVoucher {
  readonly id: string;
  readonly externalReturnId: string;
  readonly returnNumber: string;
  readonly originalInvoiceId: string;
}

interface StoredReturnAllocation {
  readonly id: string;
  readonly returnVoucherId: string;
  readonly returnLineId: string;
  readonly originalInvoiceLineId: string;
  readonly qrUnitId: string;
  readonly quantity: 1;
  readonly type: string;
}

interface StoredQrUnit {
  readonly id: string;
  readonly invoiceId: string;
  readonly invoiceLineId: string;
  readonly unitIndex: number;
  readonly productSku: string;
  points: number;
  status: QrStatus;
  expiresAt?: Date;
  tokenHash?: string;
  tokenStatus?: QrTokenStatus;
  contractorId?: string;
  siteId?: string;
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

export interface InMemoryPlatformSeed {
  readonly contractors?: readonly ContractorPointSnapshot[];
  readonly sites?: readonly SeedSite[];
}

export class InMemoryPlatformRepository implements BusyImportRepository, QrPrintRepository, QrScanRepository {
  readonly attempts: StoredScanAttempt[] = [];
  private readonly invoices = new Map<string, StoredInvoice>();
  private readonly invoiceIdByExternalId = new Map<string, string>();
  private readonly lines = new Map<string, StoredLine>();
  private readonly lineIdByExternalLineId = new Map<string, string>();
  private readonly itemCodes = new Map<string, StoredItemCode>();
  private readonly returnVouchers = new Map<string, StoredReturnVoucher>();
  private readonly returnVoucherIdByExternalId = new Map<string, string>();
  private readonly returnAllocations = new Map<string, StoredReturnAllocation>();
  private readonly qrs = new Map<string, StoredQrUnit>();
  private readonly qrIdByTokenHash = new Map<string, string>();
  private readonly contractors = new Map<string, ContractorPointSnapshot>();
  private readonly sites = new Map<string, SeedSite>();
  private readonly scanCarts = new Map<string, StoredScanCart>();
  private readonly scanCartItems = new Map<string, StoredScanCartItem>();
  private latestInvoiceSyncAt: Date | null = null;

  constructor(seed: InMemoryPlatformSeed = {}) {
    for (const contractor of seed.contractors ?? []) {
      this.contractors.set(contractor.contractorId, contractor);
    }
    for (const site of seed.sites ?? []) {
      this.sites.set(site.id, site);
    }
  }

  getLineId(externalLineId: string): string {
    const lineId = this.lineIdByExternalLineId.get(externalLineId);
    if (!lineId) {
      throw new Error(`Missing imported line ${externalLineId}`);
    }
    return lineId;
  }

  private upsertItemCodeFromBusyLine(line: BusyInvoiceImport["lines"][number]): void {
    const existing = this.itemCodes.get(line.sku);
    if (existing) {
      existing.itemName = line.productName;
      if (line.category) {
        existing.productCategory = line.category;
      } else {
        delete existing.productCategory;
      }
      existing.price = Number(line.unitRate);
      existing.busyActive = true;
      existing.status = resolveItemCodeStatus({
        busyActive: true,
        fixedPoints: existing.fixedPoints,
        percentOfPricePoints: existing.percentOfPricePoints,
      });
      return;
    }

    const fixedPoints = line.pointsPerUnit > 0 ? line.pointsPerUnit : null;
    this.itemCodes.set(line.sku, {
      tempItemCode: line.sku,
      itemName: line.productName,
      ...(line.category ? { productCategory: line.category } : {}),
      price: Number(line.unitRate),
      fixedPoints,
      percentOfPricePoints: null,
      status: resolveItemCodeStatus({
        busyActive: true,
        fixedPoints,
      }),
      busyActive: true,
    });
  }

  async getLatestInvoiceSyncAt(): Promise<Date | null> {
    return this.latestInvoiceSyncAt;
  }

  async upsertInvoiceWithQrPlaceholders(invoice: BusyInvoiceImport, importedAt: Date): Promise<ImportedBusyInvoice> {
    this.latestInvoiceSyncAt = importedAt;
    let invoiceRecord = this.getInvoiceByExternalId(invoice.externalInvoiceId);
    if (!invoiceRecord) {
      invoiceRecord = {
        id: `invoice_${this.invoices.size + 1}`,
        externalInvoiceId: invoice.externalInvoiceId,
        invoiceNumber: invoice.invoiceNumber,
      };
      this.invoices.set(invoiceRecord.id, invoiceRecord);
      this.invoiceIdByExternalId.set(invoice.externalInvoiceId, invoiceRecord.id);
    } else {
      invoiceRecord.invoiceNumber = invoice.invoiceNumber;
    }

    for (const line of invoice.lines) {
      let lineRecord = this.getLineByExternalLineId(line.externalLineId);
      if (!lineRecord) {
        lineRecord = {
          id: `line_${this.lines.size + 1}`,
          invoiceId: invoiceRecord.id,
          externalLineId: line.externalLineId,
          sku: line.sku,
          productName: line.productName,
          quantity: line.quantity,
          returnedQty: line.returnedQty,
          pointsPerUnit: line.pointsPerUnit,
          unitRate: line.unitRate,
          ...(line.category ? { category: line.category } : {}),
        };
        this.lines.set(lineRecord.id, lineRecord);
        this.lineIdByExternalLineId.set(line.externalLineId, lineRecord.id);
      } else {
        lineRecord.sku = line.sku;
        lineRecord.productName = line.productName;
        lineRecord.quantity = line.quantity;
        lineRecord.returnedQty = line.returnedQty;
        lineRecord.pointsPerUnit = line.pointsPerUnit;
        lineRecord.unitRate = line.unitRate;
        if (line.category) {
          lineRecord.category = line.category;
        }
      }

      this.upsertItemCodeFromBusyLine(line);

      const existingUnits = this.getQrUnitsForLine(lineRecord.id).length;
      const unitsToCreate = Math.max(0, line.quantity - existingUnits);
      for (let offset = 0; offset < unitsToCreate; offset += 1) {
        const unitIndex = this.getNextInvoiceUnitIndex(invoiceRecord.id);
        const qrUnit: StoredQrUnit = {
          id: `qr_${this.qrs.size + 1}`,
          invoiceId: invoiceRecord.id,
          invoiceLineId: lineRecord.id,
          unitIndex,
          productSku: line.sku,
          points: line.pointsPerUnit,
          status: QR_STATUS.NOT_PRINTED,
        };
        this.qrs.set(qrUnit.id, qrUnit);
      }
    }

    return {
      invoiceId: invoiceRecord.id,
      externalInvoiceId: invoiceRecord.externalInvoiceId,
      invoiceNumber: invoiceRecord.invoiceNumber,
      lineCount: invoice.lines.length,
      qrUnitCount: this.getQrUnitsForInvoice(invoiceRecord.id).length,
    };
  }

  async upsertReturnVoucherWithAllocations(returnVoucher: BusyReturnVoucherImport): Promise<ImportedBusyReturnVoucher> {
    const existingReturnId = this.returnVoucherIdByExternalId.get(returnVoucher.externalReturnId);
    const existingReturn = existingReturnId ? this.returnVouchers.get(existingReturnId) : undefined;
    if (existingReturn) {
      const allocations = this.getReturnAllocationsForVoucher(existingReturn.id);
      return {
        returnVoucherId: existingReturn.id,
        externalReturnId: existingReturn.externalReturnId,
        returnNumber: existingReturn.returnNumber,
        originalInvoiceId: existingReturn.originalInvoiceId,
        lineCount: new Set(allocations.map((allocation) => allocation.returnLineId)).size,
        allocationCount: allocations.length,
        reviewNeededCount: allocations.filter(
          (allocation) => allocation.type === BUSY_RETURN_ALLOCATION_TYPE.SCANNED_REVIEW_NEEDED,
        ).length,
      };
    }

    const invoiceRecord = this.getInvoiceByExternalId(returnVoucher.originalExternalInvoiceId);
    if (!invoiceRecord) {
      throw new DomainError(
        "BUSY_RETURN_ORIGINAL_INVOICE_NOT_FOUND",
        "Return voucher did not match an imported original sale invoice.",
      );
    }

    const returnRecord: StoredReturnVoucher = {
      id: `return_${this.returnVouchers.size + 1}`,
      externalReturnId: returnVoucher.externalReturnId,
      returnNumber: returnVoucher.returnNumber,
      originalInvoiceId: invoiceRecord.id,
    };

    const pendingReturnedByLine = new Map<string, number>();
    const reservedQrUnitIds = new Set<string>();
    const plannedAllocations: StoredReturnAllocation[] = [];

    for (const [lineIndex, returnLine] of returnVoucher.lines.entries()) {
      const candidateLines = [...this.lines.values()].filter((line) => {
        if (line.invoiceId !== invoiceRecord.id) {
          return false;
        }
        return returnLine.originalExternalLineId
          ? line.externalLineId === returnLine.originalExternalLineId
          : line.sku === returnLine.sku;
      });

      const allocation = allocateBusyReturnLine({
        returnedQuantity: returnLine.quantity,
        pooledByItemCode: !returnLine.originalExternalLineId && candidateLines.length > 1,
        candidates: candidateLines.map((line) => ({
          originalInvoiceLineId: line.id,
          soldQuantity: line.quantity,
          alreadyReturnedQuantity:
            this.getReturnAllocationsForLine(line.id).length + (pendingReturnedByLine.get(line.id) ?? 0),
          qrUnits: this.getQrUnitsForLine(line.id)
            .filter((qr) => !this.isQrReturnAllocated(qr.id))
            .filter((qr) => !reservedQrUnitIds.has(qr.id))
            .sort((left, right) => left.unitIndex - right.unitIndex)
            .map((qr) => ({ qrUnitId: qr.id, status: qr.status })),
        })),
      });

      for (const item of allocation.allocations) {
        const stored: StoredReturnAllocation = {
          id: `return_allocation_${plannedAllocations.length + this.returnAllocations.size + 1}`,
          returnVoucherId: returnRecord.id,
          returnLineId: `return_line_${this.returnAllocations.size + lineIndex + 1}`,
          originalInvoiceLineId: item.originalInvoiceLineId,
          qrUnitId: item.qrUnitId,
          quantity: item.quantity,
          type: item.type,
        };
        plannedAllocations.push(stored);
        pendingReturnedByLine.set(
          item.originalInvoiceLineId,
          (pendingReturnedByLine.get(item.originalInvoiceLineId) ?? 0) + item.quantity,
        );
        reservedQrUnitIds.add(item.qrUnitId);
      }
    }

    this.returnVouchers.set(returnRecord.id, returnRecord);
    this.returnVoucherIdByExternalId.set(returnRecord.externalReturnId, returnRecord.id);
    for (const allocation of plannedAllocations) {
      this.returnAllocations.set(allocation.id, allocation);
    }

    return {
      returnVoucherId: returnRecord.id,
      externalReturnId: returnRecord.externalReturnId,
      returnNumber: returnRecord.returnNumber,
      originalInvoiceId: invoiceRecord.id,
      lineCount: returnVoucher.lines.length,
      allocationCount: plannedAllocations.length,
      reviewNeededCount: plannedAllocations.filter(
        (allocation) => allocation.type === BUSY_RETURN_ALLOCATION_TYPE.SCANNED_REVIEW_NEEDED,
      ).length,
    };
  }

  async getLineAvailabilities(invoiceId: string, invoiceLineIds: readonly string[]) {
    return invoiceLineIds.flatMap((invoiceLineId) => {
      const line = this.lines.get(invoiceLineId);
      if (!line || line.invoiceId !== invoiceId) {
        return [];
      }

      return [
        {
          invoiceLineId,
          totalQuantity: line.quantity,
          returnedQuantity: this.getReturnAllocationsForLine(invoiceLineId).length,
          notPrintedQuantity: this.getQrUnitsForLine(invoiceLineId).filter(
            (qr) => qr.status === QR_STATUS.NOT_PRINTED,
          ).length,
        },
      ];
    });
  }

  async commitQrPrint(input: CommitQrPrintInput): Promise<QrPrintResult> {
    const printedUnits: PrintedQrUnit[] = [];

    for (const selection of input.selections) {
      const line = this.lines.get(selection.invoiceLineId);
      if (!line) {
        throw new DomainError("QR_PRINT_LINE_NOT_FOUND", "Invoice line is not available for QR printing.");
      }
      const itemCode = this.itemCodes.get(line.sku);
      if (!itemCode) {
        throw new DomainError("ITEM_CODE_NOT_FOUND_FOR_PRINT", "ItemCode must be synced before QR print.");
      }
      const resolvedPoints = resolveItemCodePrintPoints({
        status: itemCode.status,
        price: itemCode.price,
        fixedPoints: itemCode.fixedPoints,
        percentOfPricePoints: itemCode.percentOfPricePoints,
      });
      const assignments = input.tokenAssignments.filter(
        (assignment) => assignment.invoiceLineId === selection.invoiceLineId,
      );
      const qrs = this.getQrUnitsForLine(selection.invoiceLineId)
        .filter((qr) => qr.invoiceId === input.invoiceId && qr.status === QR_STATUS.NOT_PRINTED)
        .filter((qr) => !this.isQrReturnAllocated(qr.id))
        .sort((left, right) => left.unitIndex - right.unitIndex)
        .slice(0, selection.quantity);

      if (qrs.length !== selection.quantity || assignments.length !== selection.quantity) {
        throw new Error("QR print commit received an invalid quantity.");
      }

      for (const [index, qr] of qrs.entries()) {
        const assignment = assignments[index];
        if (!assignment) {
          throw new Error("Missing QR token assignment.");
        }

        qr.status = QR_STATUS.PRINTED_UNCLAIMED;
        qr.expiresAt = input.expiresAt;
        qr.tokenHash = assignment.tokenHash;
        qr.tokenStatus = QR_TOKEN_STATUS.ACTIVE;
        qr.points = resolvedPoints;
        this.qrIdByTokenHash.set(assignment.tokenHash, qr.id);

        printedUnits.push({
          qrUnitId: qr.id,
          invoiceLineId: qr.invoiceLineId,
          unitIndex: qr.unitIndex,
          tokenValue: assignment.tokenValue,
          points: resolvedPoints,
          expiresAt: input.expiresAt,
        });
      }
    }

    return {
      invoiceId: input.invoiceId,
      printedAt: input.printedAt,
      expiresAt: input.expiresAt,
      printedUnits,
    };
  }

  async reprintQr(input: ReprintQrInput): Promise<PrintedQrUnit> {
    const qr = this.qrs.get(input.qrUnitId);
    if (!qr) {
      throw new DomainError("QR_REPRINT_NOT_FOUND", "QR unit was not found.");
    }
    if (!isActiveUnscannedQrStatus(qr.status)) {
      throw new DomainError("QR_REPRINT_INVALID_STATUS", "Only unscanned printed QR can be reprinted.");
    }
    if (!qr.expiresAt || input.reprintedAt > qr.expiresAt) {
      throw new DomainError("QR_REPRINT_EXPIRED", "Expired QR cannot be reprinted in v1.");
    }
    if (!qr.tokenHash || qr.tokenStatus !== QR_TOKEN_STATUS.ACTIVE) {
      throw new DomainError("QR_REPRINT_TOKEN_MISSING", "QR unit has no active token to invalidate.");
    }

    this.qrIdByTokenHash.delete(qr.tokenHash);
    qr.tokenHash = input.tokenHash;
    qr.tokenStatus = QR_TOKEN_STATUS.ACTIVE;
    qr.status = QR_STATUS.REPRINTED;
    this.qrIdByTokenHash.set(input.tokenHash, qr.id);

    return {
      qrUnitId: qr.id,
      invoiceLineId: qr.invoiceLineId,
      unitIndex: qr.unitIndex,
      tokenValue: input.tokenValue,
      points: qr.points,
      expiresAt: qr.expiresAt,
    };
  }

  setItemCodeRewardRule(
    tempItemCode: string,
    rule: { readonly fixedPoints?: number | null; readonly percentOfPricePoints?: number | null },
  ): void {
    const itemCode = this.itemCodes.get(tempItemCode);
    if (!itemCode) {
      throw new Error(`Missing ItemCode ${tempItemCode}`);
    }

    itemCode.fixedPoints = rule.fixedPoints ?? null;
    itemCode.percentOfPricePoints = rule.percentOfPricePoints ?? null;
    itemCode.status = resolveItemCodeStatus({
      busyActive: itemCode.busyActive,
      fixedPoints: itemCode.fixedPoints,
      percentOfPricePoints: itemCode.percentOfPricePoints,
    });
  }

  async findQrByTokenHash(tokenHash: string): Promise<QrTokenLookup | null> {
    const qrId = this.qrIdByTokenHash.get(tokenHash);
    const qr = qrId ? this.qrs.get(qrId) : undefined;
    if (!qr?.expiresAt || !qr.tokenHash) {
      return null;
    }

    return {
      tokenHash,
      tokenStatus: qr.tokenStatus ?? QR_TOKEN_STATUS.ACTIVE,
      qr: {
        id: qr.id,
        status: qr.status,
        expiresAt: qr.expiresAt,
        activeTokenHash: qr.tokenHash,
        points: qr.points,
        ...(qr.contractorId ? { contractorId: qr.contractorId } : {}),
        ...(qr.siteId ? { siteId: qr.siteId } : {}),
      },
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
    const cart = [...this.scanCarts.values()].find(
      (candidate) =>
        candidate.contractorId === contractorId && candidate.siteId === siteId && candidate.status === "ACTIVE",
    );
    return cart ? this.toScanCartSummary(cart) : null;
  }

  async recordScanAttempt(input: RecordScanAttemptInput): Promise<void> {
    this.attempts.push({ ...input, id: `attempt_${this.attempts.length + 1}` });
  }

  async reserveSuccessfulScan(input: ReserveSuccessfulScanInput): Promise<QrScanReservationResult> {
    const qr = this.qrs.get(input.qrId);
    if (!qr || !isActiveUnscannedQrStatus(qr.status) || qr.tokenHash !== input.tokenHash) {
      throw new Error("QR was not eligible for scan reservation.");
    }

    const cart = this.findOrCreateScanCart(input);

    qr.status = QR_STATUS.RESERVED_IN_CART;
    qr.contractorId = input.contractorId;
    qr.siteId = input.siteId;
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

    const item: StoredScanCartItem = {
      id: `scan_cart_item_${this.scanCartItems.size + 1}`,
      scanCartId: cart.id,
      qrUnitId: input.qrId,
      scanAttemptId: attempt.id,
      qrValuePoints: qr.points,
      pointsToCredit: qr.points,
      status: "RESERVED",
      reservedAt: input.reservedAt,
    };
    this.scanCartItems.set(item.id, item);
    cart.cartTotalPoints += qr.points;
    cart.lastActivityAt = input.reservedAt;

    return {
      qrId: input.qrId,
      contractorId: input.contractorId,
      siteId: input.siteId,
      qrValuePoints: qr.points,
      pointsCredited: 0,
      reservedAt: input.reservedAt,
      cart: this.toScanCartSummary(cart),
    };
  }

  async getScanCart(contractorId: string, siteId: string): Promise<ScanCartSummary> {
    return (await this.getActiveScanCart(contractorId, siteId)) ?? emptyScanCartSummary(contractorId, siteId);
  }

  async commitScanCart(input: CommitScanCartInput): Promise<CommitScanCartResult> {
    const cart = [...this.scanCarts.values()].find(
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
        cart: emptyScanCartSummary(input.contractorId, input.siteId),
      };
    }

    const items = [...this.scanCartItems.values()].filter(
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
      const qr = this.qrs.get(item.qrUnitId);
      if (qr) {
        qr.status = QR_STATUS.SCANNED_CLAIMED;
      }
      const committedItem = { ...item, status: "COMMITTED" as const, committedAt: input.committedAt };
      this.scanCartItems.set(item.id, committedItem);
      committedItems.push(this.toScanCartItemSummary(committedItem));
      const attemptIndex = this.attempts.findIndex((attempt) => attempt.id === item.scanAttemptId);
      const attempt = this.attempts[attemptIndex];
      if (attempt) {
        this.attempts[attemptIndex] = { ...attempt, result: "SUCCESS", creditedPoints: item.pointsToCredit };
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
      cart: emptyScanCartSummary(input.contractorId, input.siteId),
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
        const qr = attempt.qrId ? this.qrs.get(attempt.qrId) : undefined;

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

  private findOrCreateScanCart(input: ReserveSuccessfulScanInput): StoredScanCart {
    const existing = [...this.scanCarts.values()].find(
      (cart) => cart.contractorId === input.contractorId && cart.siteId === input.siteId && cart.status === "ACTIVE",
    );
    if (existing) {
      return existing;
    }
    const cart: StoredScanCart = {
      id: `scan_cart_${this.scanCarts.size + 1}`,
      contractorId: input.contractorId,
      siteId: input.siteId,
      status: "ACTIVE",
      cartTotalPoints: 0,
      scanCapPoints: input.scanCapPoints,
      lastActivityAt: input.reservedAt,
    };
    this.scanCarts.set(cart.id, cart);
    return cart;
  }

  private toScanCartSummary(cart: StoredScanCart): ScanCartSummary {
    return {
      cartId: cart.id,
      contractorId: cart.contractorId,
      siteId: cart.siteId,
      status: cart.status,
      cartTotalPoints: cart.cartTotalPoints,
      scanCapPoints: cart.scanCapPoints,
      lastActivityAt: cart.lastActivityAt,
      items: [...this.scanCartItems.values()]
        .filter((item) => item.scanCartId === cart.id)
        .map((item) => this.toScanCartItemSummary(item)),
    };
  }

  private toScanCartItemSummary(item: StoredScanCartItem): ScanCartItemSummary {
    const qr = this.qrs.get(item.qrUnitId);
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

  private getInvoiceByExternalId(externalInvoiceId: string): StoredInvoice | undefined {
    const invoiceId = this.invoiceIdByExternalId.get(externalInvoiceId);
    return invoiceId ? this.invoices.get(invoiceId) : undefined;
  }

  private getLineByExternalLineId(externalLineId: string): StoredLine | undefined {
    const lineId = this.lineIdByExternalLineId.get(externalLineId);
    return lineId ? this.lines.get(lineId) : undefined;
  }

  private getQrUnitsForInvoice(invoiceId: string): StoredQrUnit[] {
    return [...this.qrs.values()].filter((qr) => qr.invoiceId === invoiceId);
  }

  private getQrUnitsForLine(invoiceLineId: string): StoredQrUnit[] {
    return [...this.qrs.values()].filter((qr) => qr.invoiceLineId === invoiceLineId);
  }

  private getReturnAllocationsForVoucher(returnVoucherId: string): StoredReturnAllocation[] {
    return [...this.returnAllocations.values()].filter((allocation) => allocation.returnVoucherId === returnVoucherId);
  }

  private getReturnAllocationsForLine(invoiceLineId: string): StoredReturnAllocation[] {
    return [...this.returnAllocations.values()].filter(
      (allocation) => allocation.originalInvoiceLineId === invoiceLineId,
    );
  }

  private isQrReturnAllocated(qrUnitId: string): boolean {
    return [...this.returnAllocations.values()].some((allocation) => allocation.qrUnitId === qrUnitId);
  }

  private getNextInvoiceUnitIndex(invoiceId: string): number {
    const unitIndexes = this.getQrUnitsForInvoice(invoiceId).map((qr) => qr.unitIndex);
    return Math.max(0, ...unitIndexes) + 1;
  }
}

function isActiveUnscannedQrStatus(status: QrStatus): boolean {
  return status === QR_STATUS.PRINTED_UNCLAIMED || status === QR_STATUS.REPRINTED;
}

function emptyScanCartSummary(contractorId: string, siteId: string): ScanCartSummary {
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
