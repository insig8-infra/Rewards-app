import type { ActorRole } from "@volt-rewards/domain";
import type { AuthenticatedActor } from "./authenticated-actor.js";

export const MOBILE_AUTH_REPOSITORY = Symbol("MOBILE_AUTH_REPOSITORY");

export interface ContractorAuthProfile {
  readonly contractorId: string;
  readonly userId: string;
  readonly contractorCode: string;
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly status: "ACTIVE" | "DEACTIVATED";
  readonly temporaryMpinHash?: string;
  readonly temporaryMpinExpiresAt?: Date;
  readonly mpinHash?: string;
  readonly mpinSetAt?: Date;
  readonly tier?: string;
  readonly totalAccumulatedPoints: number;
  readonly availablePoints: number;
}

export interface AdminAuthProfile {
  readonly userId: string;
  readonly role: "OWNER" | "STAFF";
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly status: "ACTIVE" | "DEACTIVATED";
  readonly pinHash?: string;
  readonly staffId?: string;
}

export interface AuthSessionRecord {
  readonly sessionId: string;
  readonly actor: AuthenticatedActor;
  readonly expiresAt: Date;
  readonly requiresMpinSetup: boolean;
}

export interface OtpChallengeRecord {
  readonly challengeId: string;
  readonly contractorId: string;
  readonly contractorMobileNumber: string;
  readonly teamMemberMobile?: string;
  readonly otpHash: string;
  readonly status: "PENDING" | "VERIFIED" | "EXPIRED";
  readonly expiresAt: Date;
}

export interface CreateSessionInput {
  readonly tokenHash: string;
  readonly actorRole: ActorRole;
  readonly userId?: string;
  readonly contractorId?: string;
  readonly teamMemberMobile?: string;
  readonly requiresMpinSetup: boolean;
  readonly expiresAt: Date;
  readonly now: Date;
}

export interface MobileAuthRepository {
  findAdminByMobileAndRole(mobileNumber: string, role: "OWNER" | "STAFF"): Promise<AdminAuthProfile | null>;
  findContractorByMobile(mobileNumber: string): Promise<ContractorAuthProfile | null>;
  getContractorById(contractorId: string): Promise<ContractorAuthProfile | null>;
  setTemporaryMpin(
    contractorId: string,
    temporaryMpinHash: string,
    expiresAt: Date,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<ContractorAuthProfile>;
  setContractorMpin(contractorId: string, mpinHash: string, now: Date): Promise<ContractorAuthProfile>;
  updateContractorPhoto(contractorId: string, photoUrl: string | null, now: Date): Promise<ContractorAuthProfile>;
  revokeContractorSessions(contractorId: string, now: Date): Promise<void>;
  createSession(input: CreateSessionInput): Promise<AuthSessionRecord>;
  findActiveSessionByTokenHash(tokenHash: string, now: Date): Promise<AuthSessionRecord | null>;
  findMpinSetupSessionByTokenHash(tokenHash: string, now: Date): Promise<AuthSessionRecord | null>;
  createOtpChallenge(input: {
    readonly contractorId: string;
    readonly contractorMobileNumber: string;
    readonly teamMemberMobile?: string;
    readonly otpHash: string;
    readonly expiresAt: Date;
    readonly deviceContext?: Record<string, unknown>;
    readonly now: Date;
  }): Promise<OtpChallengeRecord>;
  getOtpChallenge(challengeId: string): Promise<OtpChallengeRecord | null>;
  markOtpChallengeVerified(challengeId: string, now: Date): Promise<void>;
  recordAuditEvent(input: {
    readonly actorRole: ActorRole;
    readonly actorUserId?: string;
    readonly action: string;
    readonly targetType: string;
    readonly targetId: string;
    readonly metadata?: Record<string, unknown>;
    readonly now: Date;
  }): Promise<void>;
}
