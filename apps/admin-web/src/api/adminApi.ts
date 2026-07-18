export type DevActorRole = "OWNER" | "STAFF";

export interface DevActor {
  readonly role: DevActorRole;
  readonly userId: string;
}

export interface MockInvoiceSummary {
  readonly externalInvoiceId: string;
  readonly invoiceNumber: string;
  readonly invoiceDate?: string;
  readonly customerName?: string;
  readonly gstTotal?: string;
  readonly finalTotal?: string;
  readonly lineCount?: number;
}

export interface ImportedInvoice {
  readonly invoiceId: string;
  readonly externalInvoiceId: string;
  readonly invoiceNumber: string;
  readonly lineCount: number;
  readonly qrUnitCount: number;
}

export interface BusySyncStatus {
  readonly latestSyncAt: string | null;
  readonly sourceInvoiceCount: number;
}

export interface BusyMockSyncResult extends BusySyncStatus {
  readonly latestSyncAt: string;
  readonly syncedInvoiceCount: number;
  readonly importedInvoices: readonly ImportedInvoice[];
}

export interface AdminInvoiceSummary {
  readonly invoiceId: string;
  readonly externalInvoiceId: string;
  readonly invoiceNumber: string;
  readonly invoiceDate: string;
  readonly importedAt: string;
  readonly customerName: string;
  readonly customerGstin?: string;
  readonly gstTotal: string;
  readonly finalTotal: string;
  readonly lineCount: number;
  readonly qrUnitCount: number;
  readonly printableUnitCount: number;
  readonly printedUnitCount: number;
  readonly notPrintedUnitCount: number;
  readonly scannedUnitCount: number;
  readonly cancelledUnitCount: number;
  readonly reversedUnitCount: number;
  readonly returnedUnitCount: number;
  readonly returnVoucherCount: number;
  readonly reviewNeededCount: number;
  readonly productSummary: string;
  readonly categorySummary: string;
  readonly status: string;
}

export interface AdminInvoiceLine {
  readonly invoiceLineId: string;
  readonly externalLineId: string;
  readonly sku: string;
  readonly productName: string;
  readonly brand?: string;
  readonly category?: string;
  readonly hsnCode?: string;
  readonly unit: string;
  readonly quantity: number;
  readonly returnedQty: number;
  readonly notPrintedQuantity: number;
  readonly printedQuantity: number;
  readonly scannedQuantity: number;
  readonly cancelledQuantity: number;
  readonly reversedQuantity: number;
  readonly printableQuantity: number;
  readonly pointsPerUnit: number;
  readonly unitRate: string;
  readonly taxableValue: string;
  readonly gstRatePercent: string;
  readonly cgstAmount: string;
  readonly sgstAmount: string;
  readonly igstAmount: string;
  readonly lineTotal: string;
  readonly qrUnits: readonly AdminInvoiceQrUnit[];
}

export interface AdminInvoiceQrUnit {
  readonly qrUnitId: string;
  readonly unitIndex: number;
  readonly status: string;
  readonly points: number;
  readonly printedAt?: string;
  readonly scannedAt?: string;
  readonly expiresAt?: string;
}

export interface AdminInvoiceReturnLine {
  readonly returnLineId: string;
  readonly externalReturnLineId: string;
  readonly sku: string;
  readonly productName: string;
  readonly unit: string;
  readonly quantity: number;
  readonly allocationCount: number;
  readonly reviewNeededCount: number;
}

export interface AdminInvoiceReturnHistory {
  readonly returnVoucherId: string;
  readonly externalReturnId: string;
  readonly returnNumber: string;
  readonly returnDate: string;
  readonly status: string;
  readonly lines: readonly AdminInvoiceReturnLine[];
}

export interface AdminInvoicePrintHistory {
  readonly auditEventId: string;
  readonly printedAt: string;
  readonly actorRole: DevActorRole;
  readonly actorUserId?: string;
  readonly actorName?: string;
  readonly printedUnitCount: number;
  readonly lineCount: number;
}

export interface AdminInvoiceDetail extends AdminInvoiceSummary {
  readonly seller: {
    readonly name: string;
    readonly gstin?: string;
  };
  readonly customer: {
    readonly name: string;
    readonly gstin?: string;
  };
  readonly placeOfSupply: string;
  readonly paymentTerms?: string;
  readonly paymentMode?: string;
  readonly salesPerson?: string;
  readonly taxableSubtotal: string;
  readonly discountTotal: string;
  readonly freightTotal: string;
  readonly cgstTotal: string;
  readonly sgstTotal: string;
  readonly igstTotal: string;
  readonly totalAmount: string;
  readonly roundOff: string;
  readonly amountInWords?: string;
  readonly lines: readonly AdminInvoiceLine[];
  readonly returnHistory: readonly AdminInvoiceReturnHistory[];
  readonly printHistory: readonly AdminInvoicePrintHistory[];
}

export interface PrintLineSelection {
  readonly invoiceLineId: string;
  readonly quantity: number;
}

export interface PrintedQrUnit {
  readonly qrUnitId: string;
  readonly invoiceLineId: string;
  readonly unitIndex: number;
  readonly tokenValue: string;
  readonly points: number;
  readonly expiresAt: string;
}

export interface PrintResult {
  readonly invoiceId: string;
  readonly printedAt: string;
  readonly expiresAt: string;
  readonly printedUnits: readonly PrintedQrUnit[];
}

export interface PrintHistoryEntry {
  readonly auditEventId: string;
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly customerName: string;
  readonly printedAt: string;
  readonly actorRole: DevActorRole;
  readonly actorUserId?: string;
  readonly actorName?: string;
  readonly printedUnitCount: number;
  readonly lineCount: number;
  readonly productSummary: string;
}

export interface AdminDashboardActivity {
  readonly auditEventId: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly targetLabel?: string;
  readonly actorRole: DevActorRole;
  readonly actorName?: string;
  readonly createdAt: string;
}

export interface AdminDashboardAttentionItem {
  readonly id: string;
  readonly type: "INVOICE_READY" | "PENDING_REWARD" | "RETURN" | "QR_EXCEPTION" | "ITEM_CODE_RULE";
  readonly title: string;
  readonly description: string;
  readonly value: string;
  readonly href?: string;
  readonly tone: "info" | "warn" | "critical" | "success";
}

export interface AdminDashboardShortcut {
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly icon: string;
  readonly ownerOnly: boolean;
}

export interface AdminDashboardStatusMix {
  readonly status: string;
  readonly label: string;
  readonly count: number;
}

export interface AdminDashboardPrintTrend {
  readonly date: string;
  readonly label: string;
  readonly printedUnits: number;
}

export interface AdminDashboardTopContractor {
  readonly contractorId: string;
  readonly contractorCode: string;
  readonly name: string;
  readonly tier?: string;
  readonly availablePoints: number;
  readonly totalAccumulatedPoints: number;
  readonly scanCount: number;
}

export interface AdminDashboard {
  readonly actorRole: DevActorRole;
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
  readonly attentionQueue: readonly AdminDashboardAttentionItem[];
  readonly shortcuts: readonly AdminDashboardShortcut[];
  readonly qrStatusMix: readonly AdminDashboardStatusMix[];
  readonly printTrend: readonly AdminDashboardPrintTrend[];
  readonly topContractors: readonly AdminDashboardTopContractor[];
  readonly recentActivity: readonly AdminDashboardActivity[];
}

export interface AdminContractorSummary {
  readonly contractorId: string;
  readonly userId: string;
  readonly contractorCode: string;
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly belongsToNote?: string;
  readonly status: "ACTIVE" | "DEACTIVATED";
  readonly tier?: string;
  readonly totalAccumulatedPoints: number;
  readonly availablePoints: number;
  readonly siteCount: number;
  readonly scanCount: number;
  readonly rewardClaimCount: number;
  readonly siteSummary: string;
  readonly citySummary: string;
  readonly createdAt: string;
  readonly deactivatedAt?: string;
}

export interface AdminContractorSite {
  readonly siteId: string;
  readonly clientName: string;
  readonly flatOrApartmentNo?: string;
  readonly buildingName?: string;
  readonly area?: string;
  readonly city?: string;
  readonly status: "ACTIVE" | "ARCHIVED";
  readonly scanCount: number;
  readonly qrValuePoints: number;
  readonly creditedPoints: number;
  readonly productSummary: string;
}

export interface AdminContractorDetail extends AdminContractorSummary {
  readonly sites: readonly AdminContractorSite[];
}

export interface AdminContractorWriteInput {
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly belongsToNote?: string;
}

export interface AdminContractorPhotoInput {
  readonly photoUrl?: string | null;
  readonly belongsToNote?: string | null;
}

export interface AdminContractorMpinResetResult {
  readonly contractorId: string;
  readonly temporaryMpin: string;
  readonly expiresAt: string;
}

export interface AdminStaffSummary {
  readonly staffId: string;
  readonly userId: string;
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly status: "ACTIVE" | "DEACTIVATED";
  readonly createdAt: string;
  readonly deactivatedAt?: string;
  readonly lastOpenedAt?: string;
  readonly createdByOwnerId?: string;
}

export interface AdminStaffWriteInput {
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
}

export interface AdminStaffPhotoInput {
  readonly photoUrl: string | null;
}

export interface AdminStaffMutationResult {
  readonly staff: AdminStaffSummary;
  readonly temporaryPin: string;
}

export type AdminItemCodeStatus = "IN_USE" | "NOT_IN_USE" | "NOT_IN_BUSY";
export type AdminItemCodeRewardRuleType = "FIXED" | "PERCENT_OF_PRICE" | "NONE";

export interface AdminItemCode {
  readonly itemCodeId: string;
  readonly tempItemCode: string;
  readonly itemName: string;
  readonly productCategory?: string;
  readonly price: string;
  readonly fixedPoints?: number;
  readonly percentOfPricePoints?: string;
  readonly percentOfPriceCalculatedPoints?: number;
  readonly finalPoints?: number;
  readonly rewardRuleType: AdminItemCodeRewardRuleType;
  readonly ruleSummary: string;
  readonly status: AdminItemCodeStatus;
  readonly statusLabel: string;
  readonly busyActive: boolean;
  readonly sourcePriceField: string;
  readonly lastBusySyncAt?: string;
  readonly missingSince?: string;
  readonly updatedAt: string;
}

export interface AdminItemCodeFilters {
  readonly q?: string;
  readonly status?: AdminItemCodeStatus | "ALL";
}

export interface AdminItemCodeRewardRuleInput {
  readonly fixedPoints?: number | null;
  readonly percentOfPricePoints?: number | null;
  readonly now?: string;
}

export interface AdminItemCodeRefreshResult {
  readonly sourceCount: number;
  readonly createdCount: number;
  readonly updatedCount: number;
  readonly missingCount: number;
  readonly attentionCount: number;
  readonly latestSyncAt: string;
  readonly itemsNeedingAttention: readonly AdminItemCode[];
}

export interface AdminRewardClaim {
  readonly rewardClaimId: string;
  readonly claimId: string;
  readonly contractorId: string;
  readonly rewardId: string;
  readonly rewardName: string;
  readonly status: string;
  readonly pointsDeducted: number;
  readonly chosenAt: string;
  readonly cancelledAt?: string;
  readonly fulfilledAt?: string;
  readonly otpVerifiedAt?: string;
}

export interface AdminRewardClaimLookup {
  readonly claim: AdminRewardClaim;
  readonly contractor: {
    readonly contractorId: string;
    readonly contractorCode: string;
    readonly name: string;
    readonly mobileNumber: string;
    readonly currentTier: string;
    readonly totalAccumulatedPoints: number;
    readonly pointsAvailable: number;
  };
  readonly canSendOtp: boolean;
  readonly canFulfill: boolean;
}

export type AdminRewardClaimHistoryEntry = AdminRewardClaimLookup;

export interface AdminRewardOtpResult {
  readonly challengeId: string;
  readonly claimId: string;
  readonly expiresAt: string;
  readonly delivery: {
    readonly channel: "MOCK_SMS_TO_CONTRACTOR";
    readonly status: "MOCK_RETURNED_FOR_LOCAL_DEV";
    readonly mockOtp: string;
  };
}

export type AdminRewardCatalogStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface AdminRewardCatalogImage {
  readonly imageId: string;
  readonly imageUrl: string;
  readonly storagePath?: string;
  readonly altText?: string;
  readonly sortOrder: number;
}

export interface AdminRewardCatalogItem {
  readonly rewardId: string;
  readonly code: string;
  readonly name: string;
  readonly quickDescription: string;
  readonly cashValueInr: number;
  readonly pointsRequired: number;
  readonly totalQuantity: number;
  readonly reservedQuantity: number;
  readonly deliveredQuantity: number;
  readonly availableQuantity: number;
  readonly status: AdminRewardCatalogStatus;
  readonly imageUrl?: string;
  readonly images: readonly AdminRewardCatalogImage[];
  readonly readinessIssues: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminRewardCatalogWriteInput {
  readonly code?: string;
  readonly name?: string;
  readonly quickDescription?: string;
  readonly cashValueInr?: number;
  readonly pointsRequired?: number;
  readonly totalQuantity?: number;
  readonly status?: AdminRewardCatalogStatus;
}

export interface AdminRewardCatalogImageInput {
  readonly fileName?: string;
  readonly contentType?: string;
  readonly dataUrl?: string;
  readonly altText?: string;
}

export interface AdminRewardCatalogCsvPreviewRow {
  readonly rowNumber: number;
  readonly code: string;
  readonly name: string;
  readonly quickDescription: string;
  readonly cashValueInr: number;
  readonly pointsRequired: number;
  readonly totalQuantity: number;
  readonly requestedStatus: AdminRewardCatalogStatus;
  readonly operation: "CREATE" | "UPDATE";
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface AdminRewardCatalogCsvPreview {
  readonly rows: readonly AdminRewardCatalogCsvPreviewRow[];
  readonly validRowCount: number;
  readonly errorCount: number;
}

export interface AdminRewardCatalogCsvCommitResult {
  readonly created: number;
  readonly updated: number;
  readonly draftedForMissingImages: number;
  readonly items: readonly AdminRewardCatalogItem[];
}

export type AdminPromotionStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type AdminPromotionFontStyle = "regular" | "bold" | "italic" | "boldItalic";
export type AdminPromotionFontFamily =
  | "noto-sans-devanagari"
  | "noto-serif-devanagari"
  | "hind"
  | "mukta"
  | "inter"
  | "system";

export interface AdminPromotion {
  readonly promotionId: string;
  readonly title: string;
  readonly body: string;
  readonly assetUrl?: string;
  readonly assetAltText?: string;
  readonly overlayText?: string;
  readonly overlayTextColor: string;
  readonly overlayFontSize: number;
  readonly overlayFontFamily: AdminPromotionFontFamily;
  readonly overlayFontStyle: AdminPromotionFontStyle;
  readonly marqueeEnabled: boolean;
  readonly targetPersona: "ALL";
  readonly status: AdminPromotionStatus;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly archivedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminPromotionAssetInput {
  readonly fileName?: string;
  readonly contentType?: string;
  readonly dataUrl?: string;
  readonly altText?: string;
}

export interface AdminPromotionWriteInput {
  readonly title?: string;
  readonly body?: string;
  readonly assetUrl?: string | null;
  readonly assetAltText?: string | null;
  readonly assetUpload?: AdminPromotionAssetInput;
  readonly overlayText?: string | null;
  readonly overlayTextColor?: string;
  readonly overlayFontSize?: number;
  readonly overlayFontFamily?: AdminPromotionFontFamily;
  readonly overlayFontStyle?: AdminPromotionFontStyle;
  readonly marqueeEnabled?: boolean;
  readonly endsAt?: string | null;
  readonly status?: "DRAFT" | "ACTIVE";
  readonly targetPersona?: "ALL";
}

export type AdminReportId =
  | "qr-print"
  | "scan-history"
  | "contractor-leaderboard"
  | "qr-status"
  | "reward-claims"
  | "returns-reversals";

export type AdminReportRangePreset = "today" | "this-week" | "last-week" | "this-month" | "last-3-months" | "custom";
export type AdminReportExportFormat = "PDF" | "EXCEL";
export type AdminReportCell = string | number | boolean | null;

export interface AdminReportFilters {
  readonly rangePreset?: AdminReportRangePreset;
  readonly from?: string;
  readonly to?: string;
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
  readonly page?: number;
  readonly pageSize?: number;
}

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
  readonly from: string;
  readonly to: string;
  readonly timezone: "Asia/Kolkata";
}

export interface AdminReportResponse {
  readonly reportId: AdminReportId;
  readonly title: string;
  readonly resolvedRange: AdminReportResolvedRange;
  readonly summary: readonly AdminReportSummaryItem[];
  readonly columns: readonly AdminReportColumn[];
  readonly rows: readonly Record<string, AdminReportCell>[];
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
  readonly charts?: readonly AdminReportsLandingChart[];
  readonly generatedAt: string;
}

export interface AdminReportDownload {
  readonly blob: Blob;
  readonly fileName: string;
  readonly contentType: string;
}

export interface AdminApiClientOptions {
  readonly apiBaseUrl?: string;
  readonly actor?: DevActor;
  readonly fetcher?: typeof fetch;
}

export function createAdminApiClient(options: AdminApiClientOptions = {}) {
  const apiBaseUrl = (
    options.apiBaseUrl ??
    (options.actor ? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3000/api" : process.env.NEXT_PUBLIC_ADMIN_PROXY_BASE_URL ?? "/api/admin/backend")
  ).replace(/\/$/, "");
  const fetcher = options.fetcher ?? fetch;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetcher(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        ...(options.actor ? actorHeaders(options.actor) : {}),
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}: ${await response.text()}`);
    }

    return (await response.json()) as T;
  }

  async function download(path: string, init: RequestInit = {}): Promise<AdminReportDownload> {
    const response = await fetcher(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        ...(options.actor ? actorHeaders(options.actor) : {}),
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}: ${await response.text()}`);
    }

    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition") ?? "";
    return {
      blob: await response.blob(),
      fileName: parseFileName(contentDisposition) ?? "report-download",
      contentType,
    };
  }

  return {
    getDashboard: () => request<AdminDashboard>("/admin-web/dashboard"),

    listContractors: () => request<readonly AdminContractorSummary[]>("/admin-web/contractors"),

    getContractorDetail: (contractorId: string) =>
      request<AdminContractorDetail>(`/admin-web/contractors/${contractorId}`),

    registerContractor: (input: AdminContractorWriteInput) =>
      request<AdminContractorDetail>("/admin-web/contractors", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    updateContractorPhoto: (contractorId: string, input: AdminContractorPhotoInput) =>
      request<AdminContractorDetail>(`/admin-web/contractors/${contractorId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),

    deactivateContractor: (contractorId: string) =>
      request<AdminContractorDetail>(`/admin-web/contractors/${contractorId}/deactivate`, {
        method: "POST",
      }),

    reactivateContractor: (contractorId: string) =>
      request<AdminContractorDetail>(`/admin-web/contractors/${contractorId}/reactivate`, {
        method: "POST",
      }),

    resetContractorMpin: (contractorId: string) =>
      request<AdminContractorMpinResetResult>(`/admin-web/contractors/${contractorId}/reset-mpin`, {
        method: "POST",
      }),

    listStaff: () => request<readonly AdminStaffSummary[]>("/admin-web/staff"),

    getStaffDetail: (staffId: string) => request<AdminStaffSummary>(`/admin-web/staff/${staffId}`),

    getMyStaffProfile: () => request<AdminStaffSummary>("/admin-web/staff/me"),

    createStaff: (input: AdminStaffWriteInput) =>
      request<AdminStaffMutationResult>("/admin-web/staff", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    updateStaffPhoto: (staffId: string, input: AdminStaffPhotoInput) =>
      request<AdminStaffSummary>(`/admin-web/staff/${staffId}/photo`, {
        method: "POST",
        body: JSON.stringify(input),
      }),

    updateMyStaffPhoto: (input: AdminStaffPhotoInput) =>
      request<AdminStaffSummary>("/admin-web/staff/me/photo", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    resetStaffPin: (staffId: string) =>
      request<AdminStaffMutationResult>(`/admin-web/staff/${staffId}/reset-pin`, {
        method: "POST",
      }),

    deactivateStaff: (staffId: string) =>
      request<AdminStaffSummary>(`/admin-web/staff/${staffId}/deactivate`, {
        method: "POST",
      }),

    reactivateStaff: (staffId: string) =>
      request<AdminStaffSummary>(`/admin-web/staff/${staffId}/reactivate`, {
        method: "POST",
      }),

    listItemCodes: (filters: AdminItemCodeFilters = {}) =>
      request<readonly AdminItemCode[]>(`/admin-web/item-codes${toQuery(filters)}`),

    refreshItemCodes: (now: string) =>
      request<AdminItemCodeRefreshResult>("/admin-web/item-codes/refresh", {
        method: "POST",
        body: JSON.stringify({ now }),
      }),

    updateItemCodeRewardRule: (itemCodeId: string, input: AdminItemCodeRewardRuleInput) =>
      request<AdminItemCode>(`/admin-web/item-codes/${encodeURIComponent(itemCodeId)}/reward-rule`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),

    listMockInvoices: () => request<readonly MockInvoiceSummary[]>("/admin-web/busy/mock-invoices"),

    getBusySyncStatus: () => request<BusySyncStatus>("/admin-web/busy/sync-status"),

    syncMockInvoices: (now: string) =>
      request<BusyMockSyncResult>("/admin-web/busy/mock-sync", {
        method: "POST",
        body: JSON.stringify({ now }),
      }),

    listImportedInvoices: () => request<readonly AdminInvoiceSummary[]>("/admin-web/invoices"),

    getInvoiceDetail: (invoiceId: string) => request<AdminInvoiceDetail>(`/admin-web/invoices/${invoiceId}`),

    importMockInvoice: (externalInvoiceId: string, now: string) =>
      request<ImportedInvoice>("/admin-web/busy/mock-import", {
        method: "POST",
        body: JSON.stringify({ externalInvoiceId, now }),
      }),

    getPrintHistory: () => request<readonly PrintHistoryEntry[]>("/admin-web/qr/print-history"),

    printQr: (invoiceId: string, lines: readonly PrintLineSelection[], now: string) =>
      request<PrintResult>("/admin-web/qr/print", {
        method: "POST",
        body: JSON.stringify({ invoiceId, lines, now }),
      }),

    reprintQr: (qrUnitId: string, now: string) =>
      request<PrintedQrUnit>(`/admin-web/qr/${qrUnitId}/reprint`, {
        method: "POST",
        body: JSON.stringify({ now }),
      }),

    listRewardClaims: () => request<readonly AdminRewardClaimLookup[]>("/admin-web/rewards/claims"),

    listRewardClaimHistory: () => request<readonly AdminRewardClaimHistoryEntry[]>("/admin-web/rewards/claims/history"),

    listRewardCatalog: () => request<readonly AdminRewardCatalogItem[]>("/admin-web/rewards/catalog"),

    createRewardCatalogItem: (input: AdminRewardCatalogWriteInput) =>
      request<AdminRewardCatalogItem>("/admin-web/rewards/catalog", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    updateRewardCatalogItem: (rewardId: string, input: AdminRewardCatalogWriteInput) =>
      request<AdminRewardCatalogItem>(`/admin-web/rewards/catalog/${encodeURIComponent(rewardId)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),

    addRewardCatalogImage: (rewardId: string, input: AdminRewardCatalogImageInput) =>
      request<AdminRewardCatalogItem>(`/admin-web/rewards/catalog/${encodeURIComponent(rewardId)}/images`, {
        method: "POST",
        body: JSON.stringify(input),
      }),

    deactivateRewardCatalogItem: (rewardId: string) =>
      request<AdminRewardCatalogItem>(`/admin-web/rewards/catalog/${encodeURIComponent(rewardId)}/deactivate`, {
        method: "POST",
      }),

    reactivateRewardCatalogItem: (rewardId: string) =>
      request<AdminRewardCatalogItem>(`/admin-web/rewards/catalog/${encodeURIComponent(rewardId)}/reactivate`, {
        method: "POST",
      }),

    previewRewardCatalogCsv: (csv: string) =>
      request<AdminRewardCatalogCsvPreview>("/admin-web/rewards/catalog/csv/preview", {
        method: "POST",
        body: JSON.stringify({ csv }),
      }),

    commitRewardCatalogCsv: (csv: string) =>
      request<AdminRewardCatalogCsvCommitResult>("/admin-web/rewards/catalog/csv/commit", {
        method: "POST",
        body: JSON.stringify({ csv }),
      }),

    listPromotions: () => request<readonly AdminPromotion[]>("/admin-web/promotions"),

    createPromotion: (input: AdminPromotionWriteInput) =>
      request<AdminPromotion>("/admin-web/promotions", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    updatePromotion: (promotionId: string, input: AdminPromotionWriteInput) =>
      request<AdminPromotion>(`/admin-web/promotions/${encodeURIComponent(promotionId)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),

    activatePromotion: (promotionId: string) =>
      request<AdminPromotion>(`/admin-web/promotions/${encodeURIComponent(promotionId)}/activate`, {
        method: "POST",
      }),

    deactivatePromotion: (promotionId: string) =>
      request<AdminPromotion>(`/admin-web/promotions/${encodeURIComponent(promotionId)}/deactivate`, {
        method: "POST",
      }),

    lookupRewardClaim: (claimId: string) =>
      request<AdminRewardClaimLookup>("/admin-web/rewards/claims/lookup", {
        method: "POST",
        body: JSON.stringify({ claimId }),
      }),

    sendRewardFulfillmentOtp: (claimId: string) =>
      request<AdminRewardOtpResult>(`/admin-web/rewards/claims/${encodeURIComponent(claimId)}/send-otp`, {
        method: "POST",
      }),

    fulfillRewardClaim: (claimId: string, input: { readonly challengeId: string; readonly otp: string }) =>
      request<AdminRewardClaimLookup>(`/admin-web/rewards/claims/${encodeURIComponent(claimId)}/fulfill`, {
        method: "POST",
        body: JSON.stringify(input),
      }),

    getReportsLanding: (filters: AdminReportFilters = {}) =>
      request<AdminReportsLanding>(`/admin-web/reports/landing${toQuery(filters)}`),

    getReport: (reportId: AdminReportId, filters: AdminReportFilters = {}) =>
      request<AdminReportResponse>(`/admin-web/reports/${encodeURIComponent(reportId)}${toQuery(filters)}`),

    exportReport: (reportId: AdminReportId, format: AdminReportExportFormat, filters: AdminReportFilters = {}) =>
      download(`/admin-web/reports/${encodeURIComponent(reportId)}/export`, {
        method: "POST",
        body: JSON.stringify({ format, filters }),
      }),
  };
}

export function actorHeaders(actor: DevActor): Record<string, string> {
  return {
    "x-actor-role": actor.role,
    "x-actor-user-id": actor.userId,
  };
}

function toQuery(filters: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function parseFileName(contentDisposition: string): string | null {
  const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return match?.[1] ?? null;
}
