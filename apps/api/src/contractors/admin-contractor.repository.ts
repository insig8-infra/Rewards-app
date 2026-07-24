import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import type { AdminContractorScannedItemAnalytics } from "./admin-contractor-analytics.js";

export const ADMIN_CONTRACTOR_REPOSITORY = Symbol("ADMIN_CONTRACTOR_REPOSITORY");

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
  readonly successfulScanCount: number;
  readonly scannedBusinessInr: string;
  readonly rewardClaimCount: number;
  readonly fulfilledRewardCount: number;
  readonly fulfilledRewardValueInr: number;
  readonly siteSummary: string;
  readonly citySummary: string;
  readonly createdAt: Date;
  readonly deactivatedAt?: Date;
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
  readonly successfulScanCount: number;
  readonly qrValuePoints: number;
  readonly creditedPoints: number;
  readonly scannedBusinessInr: string;
  readonly productSummary: string;
  readonly scannedItems: readonly AdminContractorScannedItemAnalytics[];
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

export interface AdminContractorPatchInput {
  readonly name?: string;
  readonly mobileNumber?: string;
  readonly photoUrl?: string | null;
  readonly belongsToNote?: string | null;
}

export interface AdminMobileRegistration {
  readonly userId: string;
  readonly role: string;
  readonly contractor?: AdminContractorSummary;
}

export interface AdminContractorRepository {
  listContractors(): Promise<readonly AdminContractorSummary[]>;
  getContractorDetail(contractorId: string): Promise<AdminContractorDetail | null>;
  findMobileRegistration(mobileNumber: string): Promise<AdminMobileRegistration | null>;
  createContractor(
    input: AdminContractorWriteInput,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminContractorDetail>;
  updateContractor(
    contractorId: string,
    input: AdminContractorPatchInput,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminContractorDetail>;
  deactivateContractor(
    contractorId: string,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminContractorDetail>;
  reactivateContractor(
    contractorId: string,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminContractorDetail>;
}
