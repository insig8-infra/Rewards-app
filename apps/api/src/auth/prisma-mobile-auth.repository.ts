import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";
import type { Contractor, User } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { AuthenticatedActor } from "./authenticated-actor.js";
import type {
  AdminAuthProfile,
  AuthSessionRecord,
  ContractorAuthProfile,
  CreateSessionInput,
  MobileAuthRepository,
  OtpChallengeRecord,
} from "./mobile-auth.repository.js";

type ContractorWithUser = Contractor & {
  readonly user: User;
};

type StaffUserWithProfile = User & {
  readonly staffProfile: { readonly id: string; readonly pinHash: string } | null;
};

@Injectable()
export class PrismaMobileAuthRepository implements MobileAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAdminByMobileAndRole(mobileNumber: string, role: "OWNER" | "STAFF"): Promise<AdminAuthProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { mobileNumber },
      include: {
        staffProfile: {
          select: {
            id: true,
            pinHash: true,
          },
        },
      },
    });

    if (!user || user.role !== role) {
      return null;
    }

    return mapAdmin(user);
  }

  async findContractorByMobile(mobileNumber: string): Promise<ContractorAuthProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { mobileNumber },
      include: { contractorProfile: { include: { user: true } } },
    });

    return user?.contractorProfile ? mapContractor(user.contractorProfile) : null;
  }

  async getContractorById(contractorId: string): Promise<ContractorAuthProfile | null> {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id: contractorId },
      include: { user: true },
    });

    return contractor ? mapContractor(contractor) : null;
  }

  async setTemporaryMpin(
    contractorId: string,
    temporaryMpinHash: string,
    expiresAt: Date,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<ContractorAuthProfile> {
    const updatedId = await this.prisma.$transaction(async (tx) => {
      const current = await tx.contractor.findUniqueOrThrow({
        where: { id: contractorId },
        include: { user: true },
      });

      await tx.contractor.update({
        where: { id: contractorId },
        data: {
          temporaryMpinHash,
          temporaryMpinExpiresAt: expiresAt,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "ADMIN_WEB",
          action: "CONTRACTOR_MPIN_RESET",
          targetType: "CONTRACTOR",
          targetId: contractorId,
          metadata: {
            mobileNumber: current.user.mobileNumber,
            temporaryMpinExpiresAt: expiresAt.toISOString(),
            deliveryStatus: "MOCK_RETURNED_TO_OWNER_ONCE",
          },
          createdAt: now,
        },
      });

      return contractorId;
    });

    return this.getExistingContractor(updatedId);
  }

  async setContractorMpin(contractorId: string, mpinHash: string, now: Date): Promise<ContractorAuthProfile> {
    const updated = await this.prisma.contractor.update({
      where: { id: contractorId },
      data: {
        mpinHash,
        mpinSetAt: now,
        temporaryMpinHash: null,
        temporaryMpinExpiresAt: null,
      },
      include: { user: true },
    });

    return mapContractor(updated);
  }

  async updateContractorPhoto(contractorId: string, photoUrl: string | null, now: Date): Promise<ContractorAuthProfile> {
    const current = await this.prisma.contractor.findUniqueOrThrow({
      where: { id: contractorId },
      select: { userId: true },
    });
    const updated = await this.prisma.user.update({
      where: { id: current.userId },
      data: {
        photoUrl,
        updatedAt: now,
      },
      include: { contractorProfile: { include: { user: true } } },
    });

    if (!updated.contractorProfile) {
      throw new Error("Updated contractor photo could not be loaded.");
    }

    return mapContractor(updated.contractorProfile);
  }

  async revokeContractorSessions(contractorId: string, now: Date): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        contractorId,
        status: "ACTIVE",
      },
      data: {
        status: "REVOKED",
        revokedAt: now,
      },
    });
  }

  async createSession(input: CreateSessionInput): Promise<AuthSessionRecord> {
    const session = await this.prisma.authSession.create({
      data: {
        tokenHash: input.tokenHash,
        actorRole: input.actorRole,
        requiresMpinSetup: input.requiresMpinSetup,
        expiresAt: input.expiresAt,
        createdAt: input.now,
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.contractorId ? { contractorId: input.contractorId } : {}),
        ...(input.teamMemberMobile ? { teamMemberMobile: input.teamMemberMobile } : {}),
      },
    });

    return mapSession(session);
  }

  async findActiveSessionByTokenHash(tokenHash: string, now: Date): Promise<AuthSessionRecord | null> {
    const session = await this.prisma.authSession.findFirst({
      where: {
        tokenHash,
        status: "ACTIVE",
        requiresMpinSetup: false,
        expiresAt: { gt: now },
      },
    });

    if (!session) {
      return null;
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { lastUsedAt: now },
    });

    return mapSession(session);
  }

  async findMpinSetupSessionByTokenHash(tokenHash: string, now: Date): Promise<AuthSessionRecord | null> {
    const session = await this.prisma.authSession.findFirst({
      where: {
        tokenHash,
        status: "ACTIVE",
        requiresMpinSetup: true,
        actorRole: "CONTRACTOR",
        contractorId: { not: null },
        expiresAt: { gt: now },
      },
    });

    return session ? mapSession(session) : null;
  }

  async createOtpChallenge(input: {
    readonly contractorId: string;
    readonly contractorMobileNumber: string;
    readonly teamMemberMobile?: string;
    readonly otpHash: string;
    readonly expiresAt: Date;
    readonly deviceContext?: Record<string, unknown>;
    readonly now: Date;
  }): Promise<OtpChallengeRecord> {
    const challenge = await this.prisma.otpChallenge.create({
      data: {
        contractorId: input.contractorId,
        contractorMobileNumber: input.contractorMobileNumber,
        otpHash: input.otpHash,
        expiresAt: input.expiresAt,
        createdAt: input.now,
        ...(input.teamMemberMobile ? { teamMemberMobile: input.teamMemberMobile } : {}),
        ...(input.deviceContext ? { deviceContext: input.deviceContext as Prisma.InputJsonValue } : {}),
      },
    });

    return mapOtpChallenge(challenge);
  }

  async getOtpChallenge(challengeId: string): Promise<OtpChallengeRecord | null> {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });

    return challenge ? mapOtpChallenge(challenge) : null;
  }

  async markOtpChallengeVerified(challengeId: string, now: Date): Promise<void> {
    await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: {
        status: "VERIFIED",
        verifiedAt: now,
      },
    });
  }

  async recordAuditEvent(input: {
    readonly actorRole: AuthenticatedActor["role"];
    readonly actorUserId?: string;
    readonly action: string;
    readonly targetType: string;
    readonly targetId: string;
    readonly metadata?: Record<string, unknown>;
    readonly now: Date;
  }): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        actorRole: input.actorRole,
        ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
        surface: "END_USER_APP",
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
        createdAt: input.now,
      },
    });
  }

  private async getExistingContractor(contractorId: string): Promise<ContractorAuthProfile> {
    const contractor = await this.getContractorById(contractorId);
    if (!contractor) {
      throw new Error("Contractor could not be loaded.");
    }
    return contractor;
  }
}

function mapAdmin(user: StaffUserWithProfile): AdminAuthProfile {
  const staffPinHash = user.role === "STAFF" ? user.staffProfile?.pinHash : undefined;
  const pinHash = staffPinHash ?? user.pinHash ?? undefined;

  return {
    userId: user.id,
    role: user.role as "OWNER" | "STAFF",
    name: user.displayName,
    mobileNumber: user.mobileNumber,
    status: user.status,
    ...(user.photoUrl ? { photoUrl: user.photoUrl } : {}),
    ...(pinHash ? { pinHash } : {}),
    ...(user.staffProfile?.id ? { staffId: user.staffProfile.id } : {}),
  };
}

function mapContractor(contractor: ContractorWithUser): ContractorAuthProfile {
  return {
    contractorId: contractor.id,
    userId: contractor.userId,
    contractorCode: contractor.code,
    name: contractor.user.displayName,
    mobileNumber: contractor.user.mobileNumber,
    status: contractor.status,
    totalAccumulatedPoints: contractor.totalAccumulatedPoints,
    availablePoints: contractor.availablePoints,
    ...(contractor.user.photoUrl ? { photoUrl: contractor.user.photoUrl } : {}),
    ...(contractor.temporaryMpinHash ? { temporaryMpinHash: contractor.temporaryMpinHash } : {}),
    ...(contractor.temporaryMpinExpiresAt ? { temporaryMpinExpiresAt: contractor.temporaryMpinExpiresAt } : {}),
    ...(contractor.mpinHash ? { mpinHash: contractor.mpinHash } : {}),
    ...(contractor.mpinSetAt ? { mpinSetAt: contractor.mpinSetAt } : {}),
    ...(contractor.tier ? { tier: contractor.tier } : {}),
  };
}

function mapSession(session: {
  readonly id: string;
  readonly actorRole: AuthSessionRecord["actor"]["role"];
  readonly userId: string | null;
  readonly contractorId: string | null;
  readonly teamMemberMobile: string | null;
  readonly expiresAt: Date;
  readonly requiresMpinSetup: boolean;
}): AuthSessionRecord {
  return {
    sessionId: session.id,
    actor: {
      role: session.actorRole,
      ...(session.userId ? { userId: session.userId } : {}),
      ...(session.contractorId ? { contractorId: session.contractorId } : {}),
      ...(session.teamMemberMobile ? { teamMemberMobile: session.teamMemberMobile } : {}),
    },
    expiresAt: session.expiresAt,
    requiresMpinSetup: session.requiresMpinSetup,
  };
}

function mapOtpChallenge(challenge: {
  readonly id: string;
  readonly contractorId: string;
  readonly contractorMobileNumber: string;
  readonly teamMemberMobile: string | null;
  readonly otpHash: string;
  readonly status: OtpChallengeRecord["status"];
  readonly expiresAt: Date;
}): OtpChallengeRecord {
  return {
    challengeId: challenge.id,
    contractorId: challenge.contractorId,
    contractorMobileNumber: challenge.contractorMobileNumber,
    otpHash: challenge.otpHash,
    status: challenge.status,
    expiresAt: challenge.expiresAt,
    ...(challenge.teamMemberMobile ? { teamMemberMobile: challenge.teamMemberMobile } : {}),
  };
}
