import { Injectable } from "@nestjs/common";
import { formatContractorCode } from "@volt-rewards/domain";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import type { Contractor, Site, User } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  AdminContractorDetail,
  AdminContractorPatchInput,
  AdminContractorRepository,
  AdminContractorSite,
  AdminContractorSummary,
  AdminContractorWriteInput,
  AdminMobileRegistration,
} from "./admin-contractor.repository.js";

type ContractorWithUserAndCounts = Contractor & {
  readonly user: User;
  readonly sites: readonly ContractorSummarySite[];
  readonly _count: {
    readonly sites: number;
    readonly scanAttempts: number;
    readonly rewardClaims: number;
  };
};

type ContractorDetailRecord = ContractorWithUserAndCounts & {
  readonly sites: readonly SiteWithCounts[];
};

type ContractorSummarySite = Pick<Site, "clientName" | "area" | "city">;

type SiteWithCounts = Site & {
  readonly _count: {
    readonly scanAttempts: number;
  };
  readonly scanAttempts: readonly SiteScanAttemptForAdmin[];
};

type SiteScanAttemptForAdmin = {
  readonly qrValuePoints: number | null;
  readonly creditedPoints: number | null;
  readonly qrUnit: {
    readonly points: number;
    readonly invoiceLine: {
      readonly productName: string;
    } | null;
  } | null;
};

@Injectable()
export class PrismaAdminContractorRepository implements AdminContractorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listContractors(): Promise<readonly AdminContractorSummary[]> {
    const contractors = await this.prisma.contractor.findMany({
      include: {
        user: true,
        _count: {
          select: {
            sites: true,
            scanAttempts: true,
            rewardClaims: true,
          },
        },
        sites: {
          select: {
            clientName: true,
            area: true,
            city: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return contractors.map(mapContractorSummary);
  }

  async getContractorDetail(contractorId: string): Promise<AdminContractorDetail | null> {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id: contractorId },
      include: {
        user: true,
        sites: {
          include: {
            scanAttempts: {
              select: {
                qrValuePoints: true,
                creditedPoints: true,
                qrUnit: {
                  select: {
                    points: true,
                    invoiceLine: {
                      select: {
                        productName: true,
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
            _count: {
              select: {
                scanAttempts: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            sites: true,
            scanAttempts: true,
            rewardClaims: true,
          },
        },
      },
    });

    return contractor ? mapContractorDetail(contractor) : null;
  }

  async findMobileRegistration(mobileNumber: string): Promise<AdminMobileRegistration | null> {
    const user = await this.prisma.user.findUnique({
      where: { mobileNumber },
      include: {
        contractorProfile: {
          include: {
            user: true,
            _count: {
              select: {
                sites: true,
                scanAttempts: true,
                rewardClaims: true,
              },
            },
            sites: {
              select: {
                clientName: true,
                area: true,
                city: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      role: user.role,
      ...(user.contractorProfile ? { contractor: mapContractorSummary(user.contractorProfile) } : {}),
    };
  }

  async createContractor(
    input: AdminContractorWriteInput,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminContractorDetail> {
    const contractorId = await this.prisma.$transaction(async (tx) => {
      const contractorCount = await tx.contractor.count();
      const contractorCode = formatContractorCode(contractorCount + 1);
      const user = await tx.user.create({
        data: {
          role: "CONTRACTOR",
          mobileNumber: input.mobileNumber,
          displayName: input.name,
          ...(input.photoUrl ? { photoUrl: input.photoUrl } : {}),
        },
      });
      const contractor = await tx.contractor.create({
        data: {
          userId: user.id,
          code: contractorCode,
          ...(input.belongsToNote ? { belongsToNote: input.belongsToNote } : {}),
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "ADMIN_WEB",
          action: "CONTRACTOR_REGISTERED",
          targetType: "CONTRACTOR",
          targetId: contractor.id,
          afterJson: {
            contractorId: contractor.id,
            contractorCode,
            mobileNumber: input.mobileNumber,
            name: input.name,
            belongsToNote: input.belongsToNote ?? null,
          },
          metadata: {
            welcomeMessageStatus: "MOCK_PENDING_SMS_PROVIDER",
          },
          createdAt: now,
        },
      });

      return contractor.id;
    });

    const contractor = await this.getContractorDetail(contractorId);
    if (!contractor) {
      throw new Error("Created contractor could not be loaded.");
    }
    return contractor;
  }

  async updateContractor(
    contractorId: string,
    input: AdminContractorPatchInput,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminContractorDetail> {
    const contractorIdAfterUpdate = await this.prisma.$transaction(async (tx) => {
      const current = await tx.contractor.findUniqueOrThrow({
        where: { id: contractorId },
        include: { user: true },
      });

      if ("photoUrl" in input) {
        await tx.user.update({
          where: { id: current.userId },
          data: {
            photoUrl: input.photoUrl ?? null,
          },
        });
      }
      if ("belongsToNote" in input) {
        await tx.contractor.update({
          where: { id: contractorId },
          data: {
            belongsToNote: input.belongsToNote ?? null,
          },
        });
      }

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "ADMIN_WEB",
          action: "CONTRACTOR_PROFILE_UPDATED",
          targetType: "CONTRACTOR",
          targetId: contractorId,
          beforeJson: {
            photoUrl: current.user.photoUrl,
            belongsToNote: current.belongsToNote,
          },
          afterJson: {
            ...("photoUrl" in input ? { photoUrl: input.photoUrl ?? null } : {}),
            ...("belongsToNote" in input ? { belongsToNote: input.belongsToNote ?? null } : {}),
          },
          createdAt: now,
        },
      });

      return contractorId;
    });

    const contractor = await this.getContractorDetail(contractorIdAfterUpdate);
    if (!contractor) {
      throw new Error("Updated contractor photo could not be loaded.");
    }
    return contractor;
  }

  async deactivateContractor(
    contractorId: string,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminContractorDetail> {
    const contractorIdAfterUpdate = await this.prisma.$transaction(async (tx) => {
      const current = await tx.contractor.findUniqueOrThrow({
        where: { id: contractorId },
        include: { user: true },
      });

      await tx.user.update({
        where: { id: current.userId },
        data: { status: "DEACTIVATED" },
      });
      await tx.contractor.update({
        where: { id: contractorId },
        data: {
          status: "DEACTIVATED",
          deactivatedAt: now,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "ADMIN_WEB",
          action: "CONTRACTOR_DEACTIVATED",
          targetType: "CONTRACTOR",
          targetId: contractorId,
          beforeJson: {
            status: current.status,
            userStatus: current.user.status,
          },
          afterJson: {
            status: "DEACTIVATED",
            userStatus: "DEACTIVATED",
          },
          createdAt: now,
        },
      });

      return contractorId;
    });

    const contractor = await this.getContractorDetail(contractorIdAfterUpdate);
    if (!contractor) {
      throw new Error("Deactivated contractor could not be loaded.");
    }
    return contractor;
  }

  async reactivateContractor(
    contractorId: string,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<AdminContractorDetail> {
    const contractorIdAfterUpdate = await this.prisma.$transaction(async (tx) => {
      const current = await tx.contractor.findUniqueOrThrow({
        where: { id: contractorId },
        include: { user: true },
      });

      await tx.user.update({
        where: { id: current.userId },
        data: { status: "ACTIVE" },
      });
      await tx.contractor.update({
        where: { id: contractorId },
        data: {
          status: "ACTIVE",
          deactivatedAt: null,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "ADMIN_WEB",
          action: "CONTRACTOR_REACTIVATED",
          targetType: "CONTRACTOR",
          targetId: contractorId,
          beforeJson: {
            status: current.status,
            userStatus: current.user.status,
            deactivatedAt: current.deactivatedAt?.toISOString() ?? null,
          },
          afterJson: {
            status: "ACTIVE",
            userStatus: "ACTIVE",
            deactivatedAt: null,
          },
          createdAt: now,
        },
      });

      return contractorId;
    });

    const contractor = await this.getContractorDetail(contractorIdAfterUpdate);
    if (!contractor) {
      throw new Error("Reactivated contractor could not be loaded.");
    }
    return contractor;
  }
}

function mapContractorSummary(contractor: ContractorWithUserAndCounts): AdminContractorSummary {
  return {
    contractorId: contractor.id,
    userId: contractor.userId,
    contractorCode: contractor.code,
    name: contractor.user.displayName,
    mobileNumber: contractor.user.mobileNumber,
    ...(contractor.user.photoUrl ? { photoUrl: contractor.user.photoUrl } : {}),
    ...(contractor.belongsToNote ? { belongsToNote: contractor.belongsToNote } : {}),
    status: contractor.status,
    ...(contractor.tier ? { tier: contractor.tier } : {}),
    totalAccumulatedPoints: contractor.totalAccumulatedPoints,
    availablePoints: contractor.availablePoints,
    siteCount: contractor._count.sites,
    scanCount: contractor._count.scanAttempts,
    rewardClaimCount: contractor._count.rewardClaims,
    siteSummary: summarizeSites(contractor.sites),
    citySummary: summarizeCities(contractor.sites),
    createdAt: contractor.createdAt,
    ...(contractor.deactivatedAt ? { deactivatedAt: contractor.deactivatedAt } : {}),
  };
}

function mapContractorDetail(contractor: ContractorDetailRecord): AdminContractorDetail {
  return {
    ...mapContractorSummary(contractor),
    sites: contractor.sites.map(mapSite),
  };
}

function mapSite(site: SiteWithCounts): AdminContractorSite {
  const qrValuePoints = site.scanAttempts.reduce((total, attempt) => total + (attempt.qrValuePoints ?? attempt.qrUnit?.points ?? 0), 0);
  const creditedPoints = site.scanAttempts.reduce((total, attempt) => total + (attempt.creditedPoints ?? 0), 0);
  const productSummary = summarizeProducts(site.scanAttempts.map((attempt) => attempt.qrUnit?.invoiceLine?.productName ?? null));

  return {
    siteId: site.id,
    clientName: site.clientName,
    ...(site.flatOrApartmentNo ? { flatOrApartmentNo: site.flatOrApartmentNo } : {}),
    ...(site.buildingName ? { buildingName: site.buildingName } : {}),
    ...(site.area ? { area: site.area } : {}),
    ...(site.city ? { city: site.city } : {}),
    status: site.status,
    scanCount: site._count.scanAttempts,
    qrValuePoints,
    creditedPoints,
    productSummary,
  };
}

function summarizeSites(sites: readonly ContractorSummarySite[]): string {
  const labels = uniqueNonEmpty(sites.flatMap((site) => [site.clientName, site.area]).slice(0, 8));
  return labels.slice(0, 3).join(", ") || "No sites";
}

function summarizeCities(sites: readonly ContractorSummarySite[]): string {
  const labels = uniqueNonEmpty(sites.map((site) => site.city));
  return labels.slice(0, 3).join(", ") || "No city";
}

function uniqueNonEmpty(values: readonly (string | null)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized && !seen.has(normalized.toLowerCase())) {
      seen.add(normalized.toLowerCase());
      result.push(normalized);
    }
  }
  return result;
}

function summarizeProducts(values: readonly (string | null)[]): string {
  const labels = uniqueNonEmpty(values);
  return labels.slice(0, 4).join(", ") || "No successful item scans";
}
