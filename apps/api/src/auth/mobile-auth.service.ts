import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import {
  ACTOR_ROLE,
  DomainError,
  assertMatchingMpin,
  assertValidMpin,
  assertValidOtp,
  assertValidStaffPin,
  normalizeAuthMobileNumber,
} from "@volt-rewards/domain";
import type { AuthenticatedActor } from "./authenticated-actor.js";
import {
  MOBILE_AUTH_REPOSITORY,
  type AdminAuthProfile,
  type AuthSessionRecord,
  type ContractorAuthProfile,
  type MobileAuthRepository,
} from "./mobile-auth.repository.js";

export interface ContractorSessionPayload {
  readonly token: string;
  readonly expiresAt: Date;
  readonly requiresMpinSetup: boolean;
  readonly actor: {
    readonly role: "CONTRACTOR";
    readonly contractorId: string;
    readonly userId: string;
  };
}

export interface ContractorAuthResult {
  readonly status: "AUTHENTICATED" | "MPIN_SETUP_REQUIRED";
  readonly contractor: PublicContractorAuthProfile;
  readonly session: ContractorSessionPayload;
}

export interface ContractorProfileUpdateResult {
  readonly contractor: PublicContractorAuthProfile;
}

export interface ContractorResetMpinResult {
  readonly contractor: PublicContractorAuthProfile;
  readonly temporaryMpin: string;
  readonly expiresAt: Date;
  readonly delivery: {
    readonly channel: "MOCK_SMS";
    readonly status: "MOCK_RETURNED_TO_OWNER_ONCE";
  };
}

export interface PublicContractorAuthProfile {
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

export interface TeamMemberOtpRequestResult {
  readonly status: "OTP_SENT" | "NOT_REGISTERED";
  readonly message: string;
  readonly challengeId?: string;
  readonly expiresAt?: Date;
  readonly delivery?: {
    readonly channel: "MOCK_SMS_TO_CONTRACTOR";
    readonly status: "MOCK_RETURNED_FOR_LOCAL_DEV";
    readonly mockOtp: string;
  };
}

export interface TeamMemberAuthResult {
  readonly status: "AUTHENTICATED";
  readonly contractor: PublicContractorAuthProfile;
  readonly session: {
    readonly token: string;
    readonly expiresAt: Date;
    readonly actor: {
      readonly role: "TEAM_MEMBER";
      readonly contractorId: string;
      readonly teamMemberMobile: string;
    };
  };
}

export interface AdminSessionPayload {
  readonly token: string;
  readonly expiresAt: Date;
  readonly actor: {
    readonly role: "OWNER" | "STAFF";
    readonly userId: string;
  };
}

export interface AdminAuthResult {
  readonly status: "AUTHENTICATED";
  readonly admin: PublicAdminAuthProfile;
  readonly session: AdminSessionPayload;
}

export interface PublicAdminAuthProfile {
  readonly userId: string;
  readonly role: "OWNER" | "STAFF";
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly staffId?: string;
}

const temporaryMpinValidityMs = 5 * 24 * 60 * 60 * 1000;
const mpinSetupSessionValidityMs = 15 * 60 * 1000;
const contractorSessionValidityMs = 30 * 24 * 60 * 60 * 1000;
const adminSessionValidityMs = 4 * 24 * 60 * 60 * 1000;
const otpValidityMs = 10 * 60 * 1000;

@Injectable()
export class MobileAuthService {
  constructor(
    @Inject(MOBILE_AUTH_REPOSITORY)
    private readonly repository: MobileAuthRepository,
  ) {}

  async resetContractorMpin(
    contractorId: string,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<ContractorResetMpinResult> {
    const current = await this.getActiveContractorOrThrow(contractorId);
    const temporaryMpin = this.generateMpin();
    assertMpinOrBadRequest(temporaryMpin);
    const expiresAt = new Date(now.getTime() + temporaryMpinValidityMs);
    const contractor = await this.repository.setTemporaryMpin(
      current.contractorId,
      hashMpin(temporaryMpin),
      expiresAt,
      actor,
      now,
    );

    return {
      contractor: toPublicContractor(contractor),
      temporaryMpin,
      expiresAt,
      delivery: {
        channel: "MOCK_SMS",
        status: "MOCK_RETURNED_TO_OWNER_ONCE",
      },
    };
  }

  async loginContractor(
    input: { readonly mobileNumber: string; readonly mpin: string },
    now = new Date(),
  ): Promise<ContractorAuthResult> {
    const mobileNumber = normalizeMobileOrBadRequest(input.mobileNumber);
    assertMpinOrBadRequest(input.mpin);
    const contractor = await this.repository.findContractorByMobile(mobileNumber);
    if (!contractor || contractor.status !== "ACTIVE") {
      throw invalidContractorLogin();
    }

    if (contractor.temporaryMpinHash && verifyHash(input.mpin, contractor.temporaryMpinHash)) {
      if (!contractor.temporaryMpinExpiresAt || contractor.temporaryMpinExpiresAt <= now) {
        throw new UnauthorizedException("Temporary MPIN has expired. Contact retailer/admin for reset.");
      }

      const session = await this.createContractorSession(contractor, {
        requiresMpinSetup: true,
        expiresAt: new Date(now.getTime() + mpinSetupSessionValidityMs),
        now,
      });

      return {
        status: "MPIN_SETUP_REQUIRED",
        contractor: toPublicContractor(contractor),
        session,
      };
    }

    if (!contractor.mpinHash || !verifyHash(input.mpin, contractor.mpinHash)) {
      throw invalidContractorLogin();
    }

    const session = await this.createContractorSession(contractor, {
      requiresMpinSetup: false,
      expiresAt: new Date(now.getTime() + contractorSessionValidityMs),
      now,
    });

    return {
      status: "AUTHENTICATED",
      contractor: toPublicContractor(contractor),
      session,
    };
  }

  async setContractorMpin(
    input: { readonly setupSessionToken: string; readonly newMpin: string; readonly confirmMpin: string },
    now = new Date(),
  ): Promise<ContractorAuthResult> {
    assertMatchingMpinOrBadRequest(input.newMpin, input.confirmMpin);
    const setupSession = await this.repository.findMpinSetupSessionByTokenHash(hashToken(input.setupSessionToken), now);
    if (!setupSession?.actor.contractorId) {
      throw new UnauthorizedException("MPIN setup session is invalid or expired.");
    }

    const contractor = await this.repository.setContractorMpin(
      setupSession.actor.contractorId,
      hashMpin(input.newMpin),
      now,
    );
    await this.repository.revokeContractorSessions(contractor.contractorId, now);
    const session = await this.createContractorSession(contractor, {
      requiresMpinSetup: false,
      expiresAt: new Date(now.getTime() + contractorSessionValidityMs),
      now,
    });
    await this.repository.recordAuditEvent({
      actorRole: ACTOR_ROLE.CONTRACTOR,
      action: "CONTRACTOR_MPIN_SET",
      targetType: "CONTRACTOR",
      targetId: contractor.contractorId,
      now,
    });

    return {
      status: "AUTHENTICATED",
      contractor: toPublicContractor(contractor),
      session,
    };
  }

  async changeContractorMpin(
    input: {
      readonly sessionToken: string;
      readonly oldMpin: string;
      readonly newMpin: string;
      readonly confirmMpin: string;
    },
    now = new Date(),
  ): Promise<ContractorAuthResult> {
    assertMpinOrBadRequest(input.oldMpin);
    assertMatchingMpinOrBadRequest(input.newMpin, input.confirmMpin);
    const session = await this.repository.findActiveSessionByTokenHash(hashToken(input.sessionToken), now);
    if (!session?.actor.contractorId) {
      throw new UnauthorizedException("Contractor session is invalid or expired.");
    }

    const current = await this.getActiveContractorOrThrow(session.actor.contractorId);
    if (!current.mpinHash || !verifyHash(input.oldMpin, current.mpinHash)) {
      throw new UnauthorizedException("Old MPIN is invalid.");
    }

    const contractor = await this.repository.setContractorMpin(current.contractorId, hashMpin(input.newMpin), now);
    await this.repository.revokeContractorSessions(contractor.contractorId, now);
    const newSession = await this.createContractorSession(contractor, {
      requiresMpinSetup: false,
      expiresAt: new Date(now.getTime() + contractorSessionValidityMs),
      now,
    });
    await this.repository.recordAuditEvent({
      actorRole: ACTOR_ROLE.CONTRACTOR,
      action: "CONTRACTOR_MPIN_CHANGED",
      targetType: "CONTRACTOR",
      targetId: contractor.contractorId,
      now,
    });

    return {
      status: "AUTHENTICATED",
      contractor: toPublicContractor(contractor),
      session: newSession,
    };
  }

  async updateContractorPhoto(
    input: {
      readonly sessionToken: string;
      readonly photoUrl?: string | null;
    },
    now = new Date(),
  ): Promise<ContractorProfileUpdateResult> {
    const session = await this.repository.findActiveSessionByTokenHash(hashToken(input.sessionToken), now);
    if (!session?.actor.contractorId) {
      throw new UnauthorizedException("Contractor session is invalid or expired.");
    }

    const current = await this.getActiveContractorOrThrow(session.actor.contractorId);
    const photoUrl = normalizeContractorPhotoOrBadRequest(input.photoUrl);
    const contractor = await this.repository.updateContractorPhoto(current.contractorId, photoUrl, now);
    await this.repository.recordAuditEvent({
      actorRole: ACTOR_ROLE.CONTRACTOR,
      actorUserId: current.userId,
      action: photoUrl ? "CONTRACTOR_PROFILE_PHOTO_UPDATED" : "CONTRACTOR_PROFILE_PHOTO_REMOVED",
      targetType: "CONTRACTOR",
      targetId: current.contractorId,
      now,
    });

    return {
      contractor: toPublicContractor(contractor),
    };
  }

  forgotContractorMpin(_input: { readonly mobileNumber: string }): { readonly message: string } {
    return {
      message: "Please contact retailer/admin to reset your MPIN.",
    };
  }

  async loginAdmin(
    input: {
      readonly role: "OWNER" | "STAFF";
      readonly mobileNumber: string;
      readonly pin: string;
      readonly surface?: "ADMIN_MOBILE" | "ADMIN_WEB";
    },
    now = new Date(),
  ): Promise<AdminAuthResult> {
    const mobileNumber = normalizeMobileOrBadRequest(input.mobileNumber);
    assertAdminPinOrBadRequest(input.pin);
    const admin = await this.repository.findAdminByMobileAndRole(mobileNumber, input.role);
    if (!admin || admin.status !== "ACTIVE" || !admin.pinHash || !verifyAdminPin(input.pin, admin.pinHash)) {
      throw invalidAdminLogin();
    }

    const session = await this.createAdminSession(admin, {
      expiresAt: new Date(now.getTime() + adminSessionValidityMs),
      now,
    });
    const surface = input.surface === "ADMIN_WEB" ? "ADMIN_WEB" : "ADMIN_MOBILE";
    await this.repository.recordAuditEvent({
      actorRole: admin.role,
      actorUserId: admin.userId,
      action: surface === "ADMIN_WEB" ? "ADMIN_WEB_LOGIN" : "ADMIN_MOBILE_LOGIN",
      targetType: "USER",
      targetId: admin.userId,
      metadata: {
        surface,
        mobileNumber: admin.mobileNumber,
      },
      now,
    });

    return {
      status: "AUTHENTICATED",
      admin: toPublicAdmin(admin),
      session,
    };
  }

  async requestTeamMemberOtp(
    input: {
      readonly contractorMobileNumber: string;
      readonly teamMemberMobile?: string;
      readonly deviceContext?: Record<string, unknown>;
    },
    now = new Date(),
  ): Promise<TeamMemberOtpRequestResult> {
    const contractorMobileNumber = normalizeMobileOrBadRequest(input.contractorMobileNumber);
    const teamMemberMobile = input.teamMemberMobile
      ? normalizeMobileOrBadRequest(input.teamMemberMobile)
      : undefined;
    const contractor = await this.repository.findContractorByMobile(contractorMobileNumber);
    if (!contractor || contractor.status !== "ACTIVE") {
      return {
        status: "NOT_REGISTERED",
        message: "Contractor could not be verified. Contact retailer for onboarding.",
      };
    }

    const otp = this.generateOtp();
    assertOtpOrBadRequest(otp);
    const expiresAt = new Date(now.getTime() + otpValidityMs);
    const challenge = await this.repository.createOtpChallenge({
      contractorId: contractor.contractorId,
      contractorMobileNumber,
      ...(teamMemberMobile ? { teamMemberMobile } : {}),
      otpHash: hashOtp(otp),
      expiresAt,
      ...(input.deviceContext ? { deviceContext: input.deviceContext } : {}),
      now,
    });
    await this.repository.recordAuditEvent({
      actorRole: ACTOR_ROLE.TEAM_MEMBER,
      action: "TEAM_MEMBER_OTP_REQUESTED",
      targetType: "CONTRACTOR",
      targetId: contractor.contractorId,
      metadata: {
        contractorMobileNumber,
        teamMemberMobile: teamMemberMobile ?? null,
        deliveryStatus: "MOCK_RETURNED_FOR_LOCAL_DEV",
      },
      now,
    });

    return {
      status: "OTP_SENT",
      message: "OTP sent to contractor if eligible.",
      challengeId: challenge.challengeId,
      expiresAt,
      delivery: {
        channel: "MOCK_SMS_TO_CONTRACTOR",
        status: "MOCK_RETURNED_FOR_LOCAL_DEV",
        mockOtp: otp,
      },
    };
  }

  async verifyTeamMemberOtp(
    input: { readonly challengeId: string; readonly otp: string; readonly teamMemberMobile?: string },
    now = new Date(),
  ): Promise<TeamMemberAuthResult> {
    assertOtpOrBadRequest(input.otp);
    const challenge = await this.repository.getOtpChallenge(input.challengeId);
    if (!challenge || challenge.status !== "PENDING" || challenge.expiresAt <= now) {
      throw new UnauthorizedException("OTP challenge is invalid or expired.");
    }
    if (!verifyHash(input.otp, challenge.otpHash)) {
      throw new UnauthorizedException("OTP is invalid.");
    }

    const contractor = await this.getActiveContractorOrThrow(challenge.contractorId);
    const teamMemberMobile = input.teamMemberMobile
      ? normalizeMobileOrBadRequest(input.teamMemberMobile)
      : challenge.teamMemberMobile;
    if (!teamMemberMobile) {
      throw new BadRequestException("Team Member mobile number is required.");
    }
    await this.repository.markOtpChallengeVerified(challenge.challengeId, now);

    const sessionToken = generateSessionToken();
    const expiresAt = endOfLocalDay(now);
    await this.repository.createSession({
      tokenHash: hashToken(sessionToken),
      actorRole: ACTOR_ROLE.TEAM_MEMBER,
      contractorId: contractor.contractorId,
      teamMemberMobile,
      requiresMpinSetup: false,
      expiresAt,
      now,
    });
    await this.repository.recordAuditEvent({
      actorRole: ACTOR_ROLE.TEAM_MEMBER,
      action: "TEAM_MEMBER_OTP_VERIFIED",
      targetType: "CONTRACTOR",
      targetId: contractor.contractorId,
      metadata: {
        teamMemberMobile,
        challengeId: challenge.challengeId,
      },
      now,
    });

    return {
      status: "AUTHENTICATED",
      contractor: toPublicContractor(contractor),
      session: {
        token: sessionToken,
        expiresAt,
        actor: {
          role: ACTOR_ROLE.TEAM_MEMBER,
          contractorId: contractor.contractorId,
          teamMemberMobile,
        },
      },
    };
  }

  async resolveBearerActor(token: string, now = new Date()): Promise<AuthSessionRecord | null> {
    return this.repository.findActiveSessionByTokenHash(hashToken(token), now);
  }

  protected generateMpin(): string {
    return String(randomInt(0, 10_000)).padStart(4, "0");
  }

  protected generateOtp(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, "0");
  }

  private async getActiveContractorOrThrow(contractorId: string): Promise<ContractorAuthProfile> {
    const contractor = await this.repository.getContractorById(contractorId);
    if (!contractor || contractor.status !== "ACTIVE") {
      throw new NotFoundException("Contractor was not found.");
    }
    return contractor;
  }

  private async createContractorSession(
    contractor: ContractorAuthProfile,
    options: { readonly requiresMpinSetup: boolean; readonly expiresAt: Date; readonly now: Date },
  ): Promise<ContractorSessionPayload> {
    const sessionToken = generateSessionToken();
    await this.repository.createSession({
      tokenHash: hashToken(sessionToken),
      actorRole: ACTOR_ROLE.CONTRACTOR,
      userId: contractor.userId,
      contractorId: contractor.contractorId,
      requiresMpinSetup: options.requiresMpinSetup,
      expiresAt: options.expiresAt,
      now: options.now,
    });

    return {
      token: sessionToken,
      expiresAt: options.expiresAt,
      requiresMpinSetup: options.requiresMpinSetup,
      actor: {
        role: ACTOR_ROLE.CONTRACTOR,
        userId: contractor.userId,
        contractorId: contractor.contractorId,
      },
    };
  }

  private async createAdminSession(
    admin: AdminAuthProfile,
    options: { readonly expiresAt: Date; readonly now: Date },
  ): Promise<AdminSessionPayload> {
    const sessionToken = generateSessionToken();
    await this.repository.createSession({
      tokenHash: hashToken(sessionToken),
      actorRole: admin.role,
      userId: admin.userId,
      requiresMpinSetup: false,
      expiresAt: options.expiresAt,
      now: options.now,
    });

    return {
      token: sessionToken,
      expiresAt: options.expiresAt,
      actor: {
        role: admin.role,
        userId: admin.userId,
      },
    };
  }
}

function normalizeMobileOrBadRequest(value: string): string {
  try {
    return normalizeAuthMobileNumber(value);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({ message: error.message, code: error.code });
    }
    throw error;
  }
}

function assertMpinOrBadRequest(value: string): void {
  try {
    assertValidMpin(value);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({ message: error.message, code: error.code });
    }
    throw error;
  }
}

function assertMatchingMpinOrBadRequest(newMpin: string, confirmMpin: string): void {
  try {
    assertMatchingMpin(newMpin, confirmMpin);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({ message: error.message, code: error.code });
    }
    throw error;
  }
}

function assertOtpOrBadRequest(value: string): void {
  try {
    assertValidOtp(value);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({ message: error.message, code: error.code });
    }
    throw error;
  }
}

function assertAdminPinOrBadRequest(value: string): void {
  try {
    assertValidStaffPin(value);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({ message: error.message, code: error.code });
    }
    throw error;
  }
}

function normalizeContractorPhotoOrBadRequest(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const match = /^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/u.exec(trimmed);
  if (!match) {
    throw new BadRequestException("Profile photo must be a PNG or JPEG image selected from the device.");
  }
  const bytes = Buffer.byteLength(match[2] ?? "", "base64");
  if (bytes > 2_000_000) {
    throw new BadRequestException("Profile photo must be under 2 MB.");
  }
  return trimmed;
}

function invalidContractorLogin(): UnauthorizedException {
  return new UnauthorizedException("Contractor was not found or MPIN is invalid. Contact retailer/admin if not registered.");
}

function invalidAdminLogin(): UnauthorizedException {
  return new UnauthorizedException("Admin user was not found or PIN is invalid.");
}

function toPublicAdmin(admin: AdminAuthProfile): PublicAdminAuthProfile {
  return {
    userId: admin.userId,
    role: admin.role,
    name: admin.name,
    mobileNumber: admin.mobileNumber,
    ...(admin.photoUrl ? { photoUrl: admin.photoUrl } : {}),
    ...(admin.staffId ? { staffId: admin.staffId } : {}),
  };
}

function toPublicContractor(contractor: ContractorAuthProfile): PublicContractorAuthProfile {
  return {
    contractorId: contractor.contractorId,
    userId: contractor.userId,
    contractorCode: contractor.contractorCode,
    name: contractor.name,
    mobileNumber: contractor.mobileNumber,
    totalAccumulatedPoints: contractor.totalAccumulatedPoints,
    availablePoints: contractor.availablePoints,
    ...(contractor.photoUrl ? { photoUrl: contractor.photoUrl } : {}),
    ...(contractor.tier ? { tier: contractor.tier } : {}),
  };
}

function hashMpin(mpin: string): string {
  return hashSecret("contractor-mpin", mpin);
}

function hashOtp(otp: string): string {
  return hashSecret("team-member-otp", otp);
}

export function hashAdminPin(pin: string): string {
  return hashSecret("admin-pin", pin);
}

export function hashToken(token: string): string {
  return hashSecret("auth-session-token", token);
}

function hashSecret(kind: string, value: string): string {
  return `sha256:${kind}:${createHash("sha256").update(`volt-rewards:${kind}:${value}`).digest("hex")}`;
}

function verifyHash(value: string, expectedHash: string): boolean {
  const [, kind] = expectedHash.split(":");
  if (!kind) {
    return false;
  }
  const actualHash = hashSecret(kind, value);
  const expected = Buffer.from(expectedHash);
  const actual = Buffer.from(actualHash);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function verifyAdminPin(pin: string, expectedHash: string): boolean {
  return verifyHash(pin, expectedHash) || expectedHash === legacyStaffPinHash(pin);
}

function legacyStaffPinHash(pin: string): string {
  return `sha256:${createHash("sha256").update(`volt-rewards-staff-pin:${pin}`).digest("hex")}`;
}

function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

function endOfLocalDay(now: Date): Date {
  const expiresAt = new Date(now);
  expiresAt.setHours(23, 59, 59, 999);
  return expiresAt;
}
