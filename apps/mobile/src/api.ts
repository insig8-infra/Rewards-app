declare const process: { env?: Record<string, string | undefined> };

import { normalizeNetworkError } from "./offline";

const defaultApiBaseUrl = "http://127.0.0.1:3000/api";

export const apiBaseUrl = process.env?.EXPO_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl;

export interface PublicContractor {
  readonly contractorId: string;
  readonly userId: string;
  readonly contractorCode: string;
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly tier?: string;
  readonly totalAccumulatedPoints: number;
  readonly availablePoints: number;
}

export interface AuthSession {
  readonly token: string;
  readonly expiresAt: string;
  readonly requiresMpinSetup?: boolean;
  readonly actor: {
    readonly role: "CONTRACTOR" | "TEAM_MEMBER";
    readonly contractorId: string;
    readonly userId?: string;
    readonly teamMemberMobile?: string;
  };
}

export interface ContractorAuthResponse {
  readonly status: "AUTHENTICATED" | "MPIN_SETUP_REQUIRED";
  readonly contractor: PublicContractor;
  readonly session: AuthSession;
}

export interface ContractorProfileUpdateResponse {
  readonly contractor: PublicContractor;
}

export interface TeamMemberOtpResponse {
  readonly status: "OTP_SENT" | "NOT_REGISTERED";
  readonly message: string;
  readonly challengeId?: string;
  readonly expiresAt?: string;
  readonly delivery?: {
    readonly channel: "MOCK_SMS_TO_CONTRACTOR";
    readonly status: "MOCK_RETURNED_FOR_LOCAL_DEV";
    readonly mockOtp: string;
  };
}

export interface TeamMemberAuthResponse {
  readonly status: "AUTHENTICATED";
  readonly contractor: PublicContractor;
  readonly session: AuthSession;
}

export interface SiteSummary {
  readonly siteId: string;
  readonly contractorId: string;
  readonly clientName: string;
  readonly flatOrApartmentNo?: string;
  readonly buildingName?: string;
  readonly area?: string;
  readonly city?: string;
  readonly status: "ACTIVE" | "ARCHIVED";
  readonly scanCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SiteInput {
  readonly clientName: string;
  readonly flatOrApartmentNo?: string;
  readonly buildingName?: string;
  readonly area?: string;
  readonly city?: string;
}

export interface ScanCartItemSummary {
  readonly cartItemId: string;
  readonly qrUnitId: string;
  readonly scanAttemptId: string;
  readonly productSku?: string;
  readonly qrValuePoints: number;
  readonly pointsToCredit: number;
  readonly status: "RESERVED" | "COMMITTED" | "REMOVED_BY_USER" | "INVALIDATED";
  readonly reservedAt: string;
  readonly committedAt?: string;
  readonly invalidationReason?: string;
}

export interface ScanCartSummary {
  readonly cartId: string;
  readonly contractorId: string;
  readonly siteId: string;
  readonly status: "ACTIVE" | "COMMITTED" | "INVALIDATED";
  readonly cartTotalPoints: number;
  readonly scanCapPoints: number;
  readonly lastActivityAt: string;
  readonly items: readonly ScanCartItemSummary[];
}

export interface ScanReservationResult {
  readonly qrId: string;
  readonly contractorId: string;
  readonly siteId: string;
  readonly qrValuePoints: number;
  readonly pointsCredited: 0;
  readonly reservedAt: string;
  readonly cart: ScanCartSummary;
}

export interface CommitScanCartResult {
  readonly contractorId: string;
  readonly siteId: string;
  readonly pointsCredited: number;
  readonly balanceAfter: number;
  readonly totalAccumulatedPoints: number;
  readonly committedAt: string;
  readonly committedItems: readonly ScanCartItemSummary[];
  readonly cart: ScanCartSummary;
}

export interface ScanHistoryEntry {
  readonly scanAttemptId: string;
  readonly qrUnitId?: string;
  readonly qrCodeId?: string;
  readonly productSku?: string;
  readonly qrValuePoints?: number;
  readonly creditedPoints?: number;
  readonly actorRole: "CONTRACTOR" | "TEAM_MEMBER";
  readonly teamMemberMobile?: string;
  readonly teamMemberSessionId?: string;
  readonly contractorId?: string;
  readonly siteId?: string;
  readonly siteLabel?: string;
  readonly result:
    | "SUCCESS"
    | "RESERVED"
    | "ALREADY_CLAIMED"
    | "EXPIRED"
    | "INVALID"
    | "REPLACED"
    | "PERMISSION_DENIED"
    | "CART_CAP_REACHED";
  readonly failureReason?: string;
  readonly createdAt: string;
}

export interface RewardCatalogTile {
  readonly rewardId: string;
  readonly name: string;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly pointsRequired: number;
  readonly tierRequired?: string;
  readonly status: "ELIGIBLE" | "LOCKED" | "CHOSEN" | "FULFILLED";
  readonly pointsGap: number;
  readonly tierGap?: string;
  readonly claimId?: string;
  readonly claimStatus?: string;
  readonly displayValue: string;
}

export interface RewardCatalogResponse {
  readonly contractorId: string;
  readonly currentTier: string;
  readonly totalAccumulatedPoints: number;
  readonly pointsAvailable: number;
  readonly items: readonly RewardCatalogTile[];
}

export interface RewardClaimResponse {
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

export interface BalanceBookEntry {
  readonly ledgerEntryId: string;
  readonly type: string;
  readonly pointsDelta: number;
  readonly balanceAfter: number;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly rewardClaimId?: string;
  readonly claimId?: string;
  readonly rewardName?: string;
  readonly qrUnitId?: string;
  readonly createdAt: string;
  readonly negativeBalance: boolean;
}

export interface BalanceBookResponse {
  readonly contractorId: string;
  readonly entries: readonly BalanceBookEntry[];
}

export type PromotionFontStyle = "regular" | "bold" | "italic" | "boldItalic";
export type PromotionFontFamily =
  | "noto-sans-devanagari"
  | "noto-serif-devanagari"
  | "hind"
  | "mukta"
  | "inter"
  | "system";

export interface PromotionBanner {
  readonly promotionId: string;
  readonly title: string;
  readonly body: string;
  readonly assetUrl?: string;
  readonly assetAltText?: string;
  readonly overlayText?: string;
  readonly backgroundColor: string;
  readonly overlayTextColor: string;
  readonly overlayFontSize: number;
  readonly overlayFontFamily: PromotionFontFamily;
  readonly overlayFontStyle: PromotionFontStyle;
  readonly marqueeEnabled: boolean;
  readonly targetPersona: "ALL";
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RewardMutationResponse {
  readonly claim: RewardClaimResponse;
  readonly balance: {
    readonly currentTier: string;
    readonly totalAccumulatedPoints: number;
    readonly pointsAvailable: number;
  };
  readonly ledgerEntry: BalanceBookEntry;
}

export interface ApiError extends Error {
  readonly status?: number;
}

export async function loginContractor(mobileNumber: string, mpin: string): Promise<ContractorAuthResponse> {
  return postJson("/auth/contractor/login", { mobileNumber, mpin });
}

export async function setContractorMpin(
  setupSessionToken: string,
  newMpin: string,
  confirmMpin: string,
): Promise<ContractorAuthResponse> {
  return postJson("/auth/contractor/set-mpin", { setupSessionToken, newMpin, confirmMpin });
}

export async function changeContractorMpin(
  sessionToken: string,
  oldMpin: string,
  newMpin: string,
  confirmMpin: string,
): Promise<ContractorAuthResponse> {
  return postJson("/auth/contractor/change-mpin", { sessionToken, oldMpin, newMpin, confirmMpin });
}

export async function updateContractorProfilePhoto(
  sessionToken: string,
  photoUrl: string | null,
): Promise<ContractorProfileUpdateResponse> {
  return postJson("/auth/contractor/profile-photo", { sessionToken, photoUrl });
}

export async function forgotContractorMpin(mobileNumber: string): Promise<{ readonly message: string }> {
  return postJson("/auth/contractor/forgot-mpin", { mobileNumber });
}

export async function requestTeamMemberOtp(input: {
  readonly contractorMobileNumber: string;
  readonly teamMemberMobile: string;
}): Promise<TeamMemberOtpResponse> {
  return postJson("/auth/team-member/request-otp", {
    ...input,
    deviceContext: { surface: "volt-rewards-mobile" },
  });
}

export async function verifyTeamMemberOtp(input: {
  readonly challengeId: string;
  readonly otp: string;
  readonly teamMemberMobile: string;
}): Promise<TeamMemberAuthResponse> {
  return postJson("/auth/team-member/verify-otp", input);
}

export async function listContractorSites(token: string): Promise<readonly SiteSummary[]> {
  return getJson("/contractor/sites", token);
}

export async function listTeamMemberSites(token: string): Promise<readonly SiteSummary[]> {
  return getJson("/team-member/sites", token);
}

export async function createSite(token: string, input: SiteInput): Promise<SiteSummary> {
  return postJson("/contractor/sites", input, token);
}

export async function updateSite(token: string, siteId: string, input: SiteInput): Promise<SiteSummary> {
  return patchJson(`/contractor/sites/${encodeURIComponent(siteId)}`, input, token);
}

export async function archiveSite(token: string, siteId: string): Promise<SiteSummary> {
  return postJson(`/contractor/sites/${encodeURIComponent(siteId)}/archive`, {}, token);
}

export async function scanQr(input: {
  readonly token: string;
  readonly siteId: string;
  readonly sessionToken: string;
  readonly teamMemberSessionId?: string;
}): Promise<ScanReservationResult> {
  return postJson(
    "/scan/qr",
    {
      token: input.token,
      siteId: input.siteId,
      ...(input.teamMemberSessionId ? { teamMemberSessionId: input.teamMemberSessionId } : {}),
      deviceContext: { surface: "volt-rewards-mobile" },
    },
    input.sessionToken,
  );
}

export async function getScanCart(
  token: string,
  filters: { readonly siteId: string },
): Promise<ScanCartSummary> {
  const params = toQueryString({ siteId: filters.siteId });
  return getJson(`/scan/cart${params}`, token);
}

export async function commitScanCart(input: {
  readonly token: string;
  readonly siteId: string;
  readonly teamMemberSessionId?: string;
}): Promise<CommitScanCartResult> {
  return postJson(
    "/scan/cart/commit",
    {
      siteId: input.siteId,
      ...(input.teamMemberSessionId ? { teamMemberSessionId: input.teamMemberSessionId } : {}),
    },
    input.token,
  );
}

export async function listScanHistory(
  token: string,
  filters: { readonly siteId?: string; readonly result?: string; readonly limit?: number } = {},
): Promise<readonly ScanHistoryEntry[]> {
  const params = toQueryString({
    siteId: filters.siteId,
    result: filters.result,
    limit: String(filters.limit ?? 50),
  });
  return getJson(`/scan/history${params}`, token);
}

export async function getRewardCatalog(token: string): Promise<RewardCatalogResponse> {
  return getJson("/rewards/catalog", token);
}

export async function getBalanceBook(
  token: string,
  filters: { readonly type?: string; readonly limit?: number } = {},
): Promise<BalanceBookResponse> {
  const params = toQueryString({
    type: filters.type,
    limit: String(filters.limit ?? 50),
  });
  return getJson(`/rewards/balance-book${params}`, token);
}

export async function redeemReward(token: string, rewardId: string): Promise<RewardMutationResponse> {
  return postJson(`/rewards/${encodeURIComponent(rewardId)}/redeem`, {}, token);
}

export async function cancelRewardClaim(token: string, claimId: string): Promise<RewardMutationResponse> {
  return postJson(`/rewards/claims/${encodeURIComponent(claimId)}/cancel`, {}, token);
}

export async function listActivePromotions(token: string): Promise<readonly PromotionBanner[]> {
  return getJson("/promotions/active", token);
}

async function getJson<T>(path: string, token?: string): Promise<T> {
  return requestJson<T>("GET", path, undefined, token);
}

async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  return requestJson<T>("POST", path, body, token);
}

async function patchJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  return requestJson<T>("PATCH", path, body, token);
}

async function requestJson<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    throw normalizeNetworkError(error);
  }

  const payload = await readJson(response);
  if (!response.ok) {
    const message = typeof payload?.message === "string" ? payload.message : `Request failed with ${response.status}`;
    const error = new Error(message) as ApiError;
    Object.defineProperty(error, "status", { value: response.status, enumerable: true });
    throw error;
  }
  return payload as T;
}

async function readJson(response: Response): Promise<Record<string, unknown> | undefined> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function toQueryString(input: Record<string, string | undefined>): string {
  const params = Object.entries(input)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return params ? `?${params}` : "";
}
