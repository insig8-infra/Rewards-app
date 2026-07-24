import { normalizeNetworkError } from "./offline";

export const apiBaseUrl = process.env?.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3000/api";

export type AdminRole = "OWNER" | "ADMIN" | "STAFF";

export interface AdminProfile {
  readonly userId: string;
  readonly role: AdminRole;
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly staffId?: string;
}

export interface AdminSession {
  readonly token: string;
  readonly expiresAt: string;
  readonly actor: {
    readonly role: AdminRole;
    readonly userId: string;
  };
}

export interface AdminLoginResponse {
  readonly status: "AUTHENTICATED";
  readonly admin: AdminProfile;
  readonly session: AdminSession;
}

export interface AdminDashboard {
  readonly actorRole: AdminRole;
  readonly roleLabel: string;
  readonly allowedSections: readonly string[];
  readonly metrics: {
    readonly contractors: number;
    readonly staff: number;
    readonly invoices: number;
    readonly qrTotal: number;
    readonly qrNotPrinted: number;
    readonly qrPrinted: number;
    readonly qrScanned: number;
    readonly qrCancelled: number;
    readonly qrReversed: number;
    readonly rewardClaims: number;
  };
  readonly recentActivity: readonly {
    readonly auditEventId: string;
    readonly action: string;
    readonly actorRole: AdminRole | "CONTRACTOR" | "TEAM_MEMBER" | "SYSTEM";
    readonly targetType: string;
    readonly targetId: string;
    readonly createdAt: string;
  }[];
}

export interface ContractorSummary {
  readonly contractorId: string;
  readonly userId: string;
  readonly contractorCode: string;
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly status: "ACTIVE" | "DEACTIVATED";
  readonly tier?: string;
  readonly totalAccumulatedPoints: number;
  readonly availablePoints: number;
  readonly siteCount: number;
  readonly scanCount: number;
  readonly rewardClaimCount: number;
  readonly createdAt: string;
  readonly deactivatedAt?: string;
}

export interface ContractorDetail extends ContractorSummary {
  readonly sites: readonly {
    readonly siteId: string;
    readonly clientName: string;
    readonly flatOrApartmentNo?: string;
    readonly buildingName?: string;
    readonly area?: string;
    readonly city?: string;
    readonly status: "ACTIVE" | "ARCHIVED";
    readonly scanCount: number;
  }[];
}

export interface ContractorWriteInput {
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
}

export interface ContractorResetMpinResponse {
  readonly contractor: {
    readonly contractorId: string;
    readonly userId: string;
    readonly contractorCode: string;
    readonly name: string;
    readonly mobileNumber: string;
    readonly photoUrl?: string;
    readonly tier?: string;
    readonly totalAccumulatedPoints: number;
    readonly availablePoints: number;
  };
  readonly temporaryMpin: string;
  readonly expiresAt: string;
  readonly delivery: {
    readonly channel: "MOCK_SMS";
    readonly status: "MOCK_RETURNED_TO_OWNER_ONCE";
  };
}

export interface StaffSummary {
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

export interface StaffWriteInput {
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
}

export interface StaffMutationResponse {
  readonly staff: StaffSummary;
  readonly temporaryPin: string;
}

export type AdminReportId =
  | "qr-print"
  | "scan-history"
  | "contractor-leaderboard"
  | "qr-status"
  | "reward-claims"
  | "returns-reversals";

export interface AdminReportsLanding {
  readonly resolvedRange: {
    readonly label: string;
    readonly from: string;
    readonly to: string;
    readonly timezone: "Asia/Kolkata";
  };
  readonly cards: readonly {
    readonly key: string;
    readonly label: string;
    readonly value: string | number;
    readonly meta?: string;
    readonly href?: string;
    readonly tone?: "info" | "warn" | "critical" | "success";
  }[];
  readonly reportShortcuts: readonly {
    readonly reportId: AdminReportId;
    readonly title: string;
    readonly description: string;
    readonly metric?: string;
  }[];
  readonly charts: readonly {
    readonly key: string;
    readonly title: string;
    readonly description: string;
    readonly segments: readonly {
      readonly label: string;
      readonly value: number;
      readonly meta?: string;
      readonly tone?: "info" | "warn" | "critical" | "success";
    }[];
  }[];
  readonly generatedAt: string;
}

export type AdminReportCell = string | number | boolean | null;

export interface AdminReportResponse {
  readonly reportId: AdminReportId;
  readonly title: string;
  readonly resolvedRange: AdminReportsLanding["resolvedRange"];
  readonly summary: readonly {
    readonly label: string;
    readonly value: string | number;
    readonly meta?: string;
  }[];
  readonly columns: readonly {
    readonly key: string;
    readonly label: string;
    readonly align?: "left" | "right" | "center";
  }[];
  readonly rows: readonly Record<string, AdminReportCell>[];
  readonly totalRows: number;
  readonly page: number;
  readonly pageSize: number;
}

export type AdminReportExportFormat = "CSV" | "PDF";

export interface AdminReportDownload {
  readonly fileName: string;
  readonly contentType: string;
  readonly byteLength: number;
}

export interface ReturnQrClaimImpact {
  readonly rewardClaimId: string;
  readonly claimId: string;
  readonly rewardName: string;
  readonly pointsDeducted: number;
  readonly chosenAt: string;
}

export interface ReturnQrLookupResponse {
  readonly qrUnitId: string;
  readonly status: string;
  readonly tokenStatus: string;
  readonly action: "CAN_CANCEL" | "CAN_REVERSE" | "NONE";
  readonly reason: string;
  readonly reasonCode: string;
  readonly qr: {
    readonly qrUnitId: string;
    readonly shortCode: string;
    readonly status: string;
    readonly productName: string;
    readonly productSku?: string;
    readonly category?: string;
    readonly invoiceNumber: string;
    readonly invoiceDate: string;
    readonly points: number;
    readonly printedAt?: string;
    readonly expiresAt?: string;
    readonly scannedAt?: string;
  };
  readonly contractor?: {
    readonly contractorId: string;
    readonly contractorCode: string;
    readonly name: string;
    readonly mobileNumber: string;
    readonly currentTier: string;
    readonly totalAccumulatedPoints: number;
    readonly pointsAvailable: number;
  };
  readonly reverseImpact?: {
    readonly pointsToReverse: number;
    readonly currentBalance: number;
    readonly projectedBalanceAfterQrReverse: number;
    readonly projectedBalanceAfterClaimRevocations: number;
    readonly createsNegativeBalance: boolean;
    readonly claimsToRevoke: readonly ReturnQrClaimImpact[];
  };
}

export interface ReturnQrMutationResponse extends ReturnQrLookupResponse {
  readonly operation: {
    readonly type: "LOOKUP" | "CANCELLED" | "REVERSED";
    readonly completedAt: string;
    readonly reason: string;
    readonly auditEventId: string;
    readonly ledgerEntryId?: string;
    readonly revokedClaims: readonly ReturnQrClaimImpact[];
    readonly balanceAfter?: number;
  };
}

export type RewardCatalogStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface RewardCatalogImage {
  readonly imageId: string;
  readonly imageUrl: string;
  readonly storagePath?: string;
  readonly altText?: string;
  readonly sortOrder: number;
}

export interface RewardCatalogItem {
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
  readonly status: RewardCatalogStatus;
  readonly imageUrl?: string;
  readonly images: readonly RewardCatalogImage[];
  readonly readinessIssues: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RewardCatalogWriteInput {
  readonly code?: string;
  readonly name?: string;
  readonly quickDescription?: string;
  readonly cashValueInr?: number;
  readonly pointsRequired?: number;
  readonly totalQuantity?: number;
  readonly status?: RewardCatalogStatus;
}

export interface RewardCatalogImageInput {
  readonly fileName?: string;
  readonly contentType?: string;
  readonly dataUrl?: string;
  readonly altText?: string;
}

export interface AdminRewardClaim {
  readonly rewardClaimId: string;
  readonly claimId: string;
  readonly contractorId: string;
  readonly rewardId: string;
  readonly rewardName: string;
  readonly status: "CHOSEN" | "FULFILLED" | "CANCELLED_BY_CONTRACTOR" | "REVOKED_DUE_TO_RETURN";
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

export interface RewardFulfillmentOtpResponse {
  readonly challengeId: string;
  readonly claimId: string;
  readonly expiresAt: string;
  readonly delivery: {
    readonly channel: "MOCK_SMS_TO_CONTRACTOR";
    readonly status: "MOCK_RETURNED_FOR_LOCAL_DEV";
    readonly mockOtp?: string;
  };
}

export async function loginAdmin(input: {
  readonly role: AdminRole;
  readonly mobileNumber: string;
  readonly pin: string;
}): Promise<AdminLoginResponse> {
  return request<AdminLoginResponse>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getDashboard(token: string): Promise<AdminDashboard> {
  return request<AdminDashboard>("/admin-mobile/dashboard", {
    headers: bearerHeaders(token),
  });
}

export async function listContractors(token: string): Promise<readonly ContractorSummary[]> {
  return request<readonly ContractorSummary[]>("/admin-mobile/contractors", {
    headers: bearerHeaders(token),
  });
}

export async function getContractorDetail(token: string, contractorId: string): Promise<ContractorDetail> {
  return request<ContractorDetail>(`/admin-mobile/contractors/${contractorId}`, {
    headers: bearerHeaders(token),
  });
}

export async function createContractor(token: string, input: ContractorWriteInput): Promise<ContractorDetail> {
  return request<ContractorDetail>("/admin-mobile/contractors", {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function updateContractorPhoto(
  token: string,
  contractorId: string,
  input: { readonly photoUrl: string | null },
): Promise<ContractorDetail> {
  return request<ContractorDetail>(`/admin-mobile/contractors/${contractorId}`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function deactivateContractor(token: string, contractorId: string): Promise<ContractorDetail> {
  return request<ContractorDetail>(`/admin-mobile/contractors/${contractorId}/deactivate`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
}

export async function reactivateContractor(token: string, contractorId: string): Promise<ContractorDetail> {
  return request<ContractorDetail>(`/admin-mobile/contractors/${contractorId}/reactivate`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
}

export async function resetContractorMpin(
  token: string,
  contractorId: string,
): Promise<ContractorResetMpinResponse> {
  return request<ContractorResetMpinResponse>(`/admin-mobile/contractors/${contractorId}/reset-mpin`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
}

export async function listStaff(token: string): Promise<readonly StaffSummary[]> {
  return request<readonly StaffSummary[]>("/admin-mobile/staff", {
    headers: bearerHeaders(token),
  });
}

export async function createStaff(token: string, input: StaffWriteInput): Promise<StaffMutationResponse> {
  return request<StaffMutationResponse>("/admin-mobile/staff", {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function updateStaffPhoto(
  token: string,
  staffId: string,
  input: { readonly photoUrl: string | null },
): Promise<StaffSummary> {
  return request<StaffSummary>(`/admin-mobile/staff/${staffId}/photo`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function resetStaffPin(token: string, staffId: string): Promise<StaffMutationResponse> {
  return request<StaffMutationResponse>(`/admin-mobile/staff/${staffId}/reset-pin`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
}

export async function deactivateStaff(token: string, staffId: string): Promise<StaffSummary> {
  return request<StaffSummary>(`/admin-mobile/staff/${staffId}/deactivate`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
}

export async function reactivateStaff(token: string, staffId: string): Promise<StaffSummary> {
  return request<StaffSummary>(`/admin-mobile/staff/${staffId}/reactivate`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
}

export async function getReportsLanding(token: string): Promise<AdminReportsLanding> {
  return request<AdminReportsLanding>("/admin-mobile/reports/landing", {
    headers: bearerHeaders(token),
  });
}

export async function getReport(token: string, reportId: AdminReportId): Promise<AdminReportResponse> {
  return request<AdminReportResponse>(`/admin-mobile/reports/${reportId}?pageSize=6`, {
    headers: bearerHeaders(token),
  });
}

export async function downloadReport(
  token: string,
  reportId: AdminReportId,
  format: AdminReportExportFormat,
): Promise<AdminReportDownload> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/admin-mobile/reports/${encodeURIComponent(reportId)}/export`, {
      method: "POST",
      headers: {
        ...bearerHeaders(token),
        "content-type": "application/json",
      },
      body: JSON.stringify({ format }),
    });
  } catch (error) {
    throw normalizeNetworkError(error);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    const error = new Error(extractErrorMessage(payload, response.status)) as ApiError;
    Object.defineProperty(error, "status", { value: response.status });
    throw error;
  }

  const contentType = response.headers.get("content-type") ?? (format === "PDF" ? "application/pdf" : "text/csv");
  const fileName = parseDownloadFileName(response.headers.get("content-disposition")) ?? `${reportId}.${format.toLowerCase()}`;
  const bytes = await response.arrayBuffer();
  triggerBrowserDownload(fileName, contentType, bytes);
  return {
    fileName,
    contentType,
    byteLength: bytes.byteLength,
  };
}

export async function lookupReturnQr(token: string, qrToken: string): Promise<ReturnQrLookupResponse> {
  return request<ReturnQrLookupResponse>("/admin-mobile/return-qr/lookup", {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify({ token: qrToken }),
  });
}

export async function cancelReturnQr(
  token: string,
  qrUnitId: string,
  input: { readonly labelRemovedAndDiscarded: boolean },
): Promise<ReturnQrMutationResponse> {
  return request<ReturnQrMutationResponse>(`/admin-mobile/return-qr/${qrUnitId}/cancel`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function reverseReturnQr(
  token: string,
  qrUnitId: string,
  input: { readonly labelRemovedAndDiscarded: boolean },
): Promise<ReturnQrMutationResponse> {
  return request<ReturnQrMutationResponse>(`/admin-mobile/return-qr/${qrUnitId}/reverse`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function listRewardCatalog(token: string): Promise<readonly RewardCatalogItem[]> {
  return request<readonly RewardCatalogItem[]>("/admin-mobile/rewards/catalog", {
    headers: bearerHeaders(token),
  });
}

export async function listRewardClaims(token: string): Promise<readonly AdminRewardClaimLookup[]> {
  return request<readonly AdminRewardClaimLookup[]>("/admin-mobile/rewards/claims", {
    headers: bearerHeaders(token),
  });
}

export async function listRewardClaimHistory(token: string): Promise<readonly AdminRewardClaimHistoryEntry[]> {
  return request<readonly AdminRewardClaimHistoryEntry[]>("/admin-mobile/rewards/claims/history", {
    headers: bearerHeaders(token),
  });
}

export async function lookupRewardClaim(token: string, claimId: string): Promise<AdminRewardClaimLookup> {
  return request<AdminRewardClaimLookup>("/admin-mobile/rewards/claims/lookup", {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify({ claimId }),
  });
}

export async function sendRewardFulfillmentOtp(
  token: string,
  claimId: string,
): Promise<RewardFulfillmentOtpResponse> {
  return request<RewardFulfillmentOtpResponse>(`/admin-mobile/rewards/claims/${encodeURIComponent(claimId)}/send-otp`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
}

export async function fulfillRewardClaim(
  token: string,
  claimId: string,
  input: { readonly challengeId: string; readonly otp: string },
): Promise<AdminRewardClaimLookup> {
  return request<AdminRewardClaimLookup>(`/admin-mobile/rewards/claims/${encodeURIComponent(claimId)}/fulfill`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function createRewardCatalogItem(token: string, input: RewardCatalogWriteInput): Promise<RewardCatalogItem> {
  return request<RewardCatalogItem>("/admin-mobile/rewards/catalog", {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function updateRewardCatalogItem(
  token: string,
  rewardId: string,
  input: RewardCatalogWriteInput,
): Promise<RewardCatalogItem> {
  return request<RewardCatalogItem>(`/admin-mobile/rewards/catalog/${encodeURIComponent(rewardId)}`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function addRewardCatalogImage(
  token: string,
  rewardId: string,
  input: RewardCatalogImageInput,
): Promise<RewardCatalogItem> {
  return request<RewardCatalogItem>(`/admin-mobile/rewards/catalog/${encodeURIComponent(rewardId)}/images`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function deactivateRewardCatalogItem(token: string, rewardId: string): Promise<RewardCatalogItem> {
  return request<RewardCatalogItem>(`/admin-mobile/rewards/catalog/${encodeURIComponent(rewardId)}/deactivate`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
}

export async function reactivateRewardCatalogItem(token: string, rewardId: string): Promise<RewardCatalogItem> {
  return request<RewardCatalogItem>(`/admin-mobile/rewards/catalog/${encodeURIComponent(rewardId)}/reactivate`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
}

export interface ApiError extends Error {
  readonly status?: number;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    throw normalizeNetworkError(error);
  }
  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = new Error(extractErrorMessage(payload, response.status)) as ApiError;
    Object.defineProperty(error, "status", { value: response.status });
    throw error;
  }

  return payload as T;
}

function bearerHeaders(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
  };
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { readonly message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
    if (message && typeof message === "object" && "message" in message) {
      const nested = (message as { readonly message?: unknown }).message;
      if (typeof nested === "string") {
        return nested;
      }
    }
  }

  return `Request failed with status ${status}.`;
}

function parseDownloadFileName(contentDisposition: string | null): string | undefined {
  const match = contentDisposition?.match(/filename="([^"]+)"/i);
  return match?.[1];
}

function triggerBrowserDownload(fileName: string, contentType: string, bytes: ArrayBuffer): void {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof URL === "undefined") {
    return;
  }

  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
