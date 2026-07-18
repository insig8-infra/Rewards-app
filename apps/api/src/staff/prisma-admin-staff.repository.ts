import { Injectable } from "@nestjs/common";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import type { StaffProfile, User } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  AdminMobileRegistration,
  AdminStaffRepository,
  AdminStaffSummary,
  AdminStaffWriteInput,
} from "./admin-staff.repository.js";

type StaffWithUser = StaffProfile & {
  readonly user: User;
};

@Injectable()
export class PrismaAdminStaffRepository implements AdminStaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listStaff(): Promise<readonly AdminStaffSummary[]> {
    const staff = await this.prisma.staffProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return staff.map(mapStaffSummary);
  }

  async getStaff(staffId: string): Promise<AdminStaffSummary | null> {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    return staff ? mapStaffSummary(staff) : null;
  }

  async getStaffByUserId(userId: string): Promise<AdminStaffSummary | null> {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    return staff ? mapStaffSummary(staff) : null;
  }

  async findMobileRegistration(mobileNumber: string): Promise<AdminMobileRegistration | null> {
    const user = await this.prisma.user.findUnique({
      where: { mobileNumber },
      include: {
        staffProfile: {
          include: { user: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      role: user.role,
      ...(user.staffProfile ? { staff: mapStaffSummary(user.staffProfile) } : {}),
    };
  }

  async createStaff(
    input: AdminStaffWriteInput,
    pinHash: string,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminStaffSummary> {
    const staffId = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          role: "STAFF",
          mobileNumber: input.mobileNumber,
          displayName: input.name,
          ...(input.photoUrl ? { photoUrl: input.photoUrl } : {}),
          pinHash,
          staffProfile: {
            create: {
              pinHash,
              ...(actor.userId ? { createdByOwnerId: actor.userId } : {}),
            },
          },
        },
        include: { staffProfile: true },
      });

      if (!user.staffProfile) {
        throw new Error("Created staff profile could not be loaded.");
      }

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "ADMIN_WEB",
          action: "STAFF_CREATED",
          targetType: "STAFF",
          targetId: user.staffProfile.id,
          afterJson: {
            staffId: user.staffProfile.id,
            userId: user.id,
            mobileNumber: input.mobileNumber,
            name: input.name,
            photoUrl: input.photoUrl ?? null,
            status: "ACTIVE",
          },
          metadata: {
            pinDeliveryStatus: "MOCK_RETURNED_TO_OWNER_ONCE",
          },
          createdAt: now,
        },
      });

      return user.staffProfile.id;
    });

    return this.getExistingStaff(staffId, "Created staff could not be loaded.");
  }

  async updateStaffPhoto(
    staffId: string,
    photoUrl: string | null,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminStaffSummary> {
    const updatedStaffId = await this.prisma.$transaction(async (tx) => {
      const current = await tx.staffProfile.findUniqueOrThrow({
        where: { id: staffId },
        include: { user: true },
      });

      await tx.user.update({
        where: { id: current.userId },
        data: { photoUrl },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "ADMIN_WEB",
          action: "STAFF_PHOTO_UPDATED",
          targetType: "STAFF",
          targetId: staffId,
          beforeJson: {
            userId: current.userId,
            photoUrl: current.user.photoUrl ?? null,
          },
          afterJson: {
            userId: current.userId,
            photoUrl,
          },
          createdAt: now,
        },
      });

      return staffId;
    });

    return this.getExistingStaff(updatedStaffId, "Updated staff could not be loaded.");
  }

  async resetStaffPin(
    staffId: string,
    pinHash: string,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminStaffSummary> {
    const updatedStaffId = await this.prisma.$transaction(async (tx) => {
      const current = await tx.staffProfile.findUniqueOrThrow({
        where: { id: staffId },
        include: { user: true },
      });

      await tx.user.update({
        where: { id: current.userId },
        data: { pinHash },
      });
      await tx.staffProfile.update({
        where: { id: staffId },
        data: { pinHash },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "ADMIN_WEB",
          action: "STAFF_PIN_RESET",
          targetType: "STAFF",
          targetId: staffId,
          beforeJson: {
            userId: current.userId,
            mobileNumber: current.user.mobileNumber,
            status: current.user.status,
          },
          afterJson: {
            userId: current.userId,
            mobileNumber: current.user.mobileNumber,
            status: current.user.status,
          },
          metadata: {
            pinDeliveryStatus: "MOCK_RETURNED_TO_OWNER_ONCE",
          },
          createdAt: now,
        },
      });

      return staffId;
    });

    return this.getExistingStaff(updatedStaffId, "Updated staff could not be loaded.");
  }

  async deactivateStaff(staffId: string, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary> {
    const updatedStaffId = await this.prisma.$transaction(async (tx) => {
      const current = await tx.staffProfile.findUniqueOrThrow({
        where: { id: staffId },
        include: { user: true },
      });

      await tx.user.update({
        where: { id: current.userId },
        data: { status: "DEACTIVATED" },
      });
      await tx.staffProfile.update({
        where: { id: staffId },
        data: { deactivatedAt: now },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "ADMIN_WEB",
          action: "STAFF_DEACTIVATED",
          targetType: "STAFF",
          targetId: staffId,
          beforeJson: {
            status: current.user.status,
            deactivatedAt: current.deactivatedAt?.toISOString() ?? null,
          },
          afterJson: {
            status: "DEACTIVATED",
            deactivatedAt: now.toISOString(),
          },
          createdAt: now,
        },
      });

      return staffId;
    });

    return this.getExistingStaff(updatedStaffId, "Deactivated staff could not be loaded.");
  }

  async reactivateStaff(staffId: string, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary> {
    const updatedStaffId = await this.prisma.$transaction(async (tx) => {
      const current = await tx.staffProfile.findUniqueOrThrow({
        where: { id: staffId },
        include: { user: true },
      });

      await tx.user.update({
        where: { id: current.userId },
        data: { status: "ACTIVE" },
      });
      await tx.staffProfile.update({
        where: { id: staffId },
        data: { deactivatedAt: null },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "ADMIN_WEB",
          action: "STAFF_REACTIVATED",
          targetType: "STAFF",
          targetId: staffId,
          beforeJson: {
            status: current.user.status,
            deactivatedAt: current.deactivatedAt?.toISOString() ?? null,
          },
          afterJson: {
            status: "ACTIVE",
            deactivatedAt: null,
          },
          createdAt: now,
        },
      });

      return staffId;
    });

    return this.getExistingStaff(updatedStaffId, "Reactivated staff could not be loaded.");
  }

  private async getExistingStaff(staffId: string, errorMessage: string): Promise<AdminStaffSummary> {
    const staff = await this.getStaff(staffId);
    if (!staff) {
      throw new Error(errorMessage);
    }
    return staff;
  }
}

function mapStaffSummary(staff: StaffWithUser): AdminStaffSummary {
  return {
    staffId: staff.id,
    userId: staff.userId,
    name: staff.user.displayName,
    mobileNumber: staff.user.mobileNumber,
    ...(staff.user.photoUrl ? { photoUrl: staff.user.photoUrl } : {}),
    status: staff.user.status,
    createdAt: staff.createdAt,
    ...(staff.deactivatedAt ? { deactivatedAt: staff.deactivatedAt } : {}),
    ...(staff.lastOpenedAt ? { lastOpenedAt: staff.lastOpenedAt } : {}),
    ...(staff.createdByOwnerId ? { createdByOwnerId: staff.createdByOwnerId } : {}),
  };
}
