import { Injectable } from "@nestjs/common";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import type { Site } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { SiteSummary, SiteWriteInput, SitesRepository } from "./sites.repository.js";

type SiteWithCounts = Site & {
  readonly _count: {
    readonly scanAttempts: number;
  };
};

@Injectable()
export class PrismaSitesRepository implements SitesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listSites(
    contractorId: string,
    options: { readonly activeOnly?: boolean } = {},
  ): Promise<readonly SiteSummary[]> {
    const sites = await this.prisma.site.findMany({
      where: {
        contractorId,
        ...(options.activeOnly ? { status: "ACTIVE" } : {}),
      },
      include: {
        _count: {
          select: {
            scanAttempts: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    return sites.map(mapSiteSummary);
  }

  async getSite(siteId: string): Promise<SiteSummary | null> {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: {
        _count: {
          select: {
            scanAttempts: true,
          },
        },
      },
    });

    return site ? mapSiteSummary(site) : null;
  }

  async createSite(
    contractorId: string,
    input: SiteWriteInput,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<SiteSummary> {
    const siteId = await this.prisma.$transaction(async (tx) => {
      const site = await tx.site.create({
        data: {
          contractorId,
          clientName: input.clientName,
          ...(input.flatOrApartmentNo ? { flatOrApartmentNo: input.flatOrApartmentNo } : {}),
          ...(input.buildingName ? { buildingName: input.buildingName } : {}),
          ...(input.area ? { area: input.area } : {}),
          ...(input.city ? { city: input.city } : {}),
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "END_USER_APP",
          action: "SITE_CREATED",
          targetType: "SITE",
          targetId: site.id,
          afterJson: {
            contractorId,
            clientName: input.clientName,
            flatOrApartmentNo: input.flatOrApartmentNo ?? null,
            buildingName: input.buildingName ?? null,
            area: input.area ?? null,
            city: input.city ?? null,
          },
          createdAt: now,
        },
      });

      return site.id;
    });

    const site = await this.getSite(siteId);
    if (!site) {
      throw new Error("Created site could not be loaded.");
    }
    return site;
  }

  async updateSite(
    siteId: string,
    input: SiteWriteInput,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<SiteSummary> {
    const updatedSiteId = await this.prisma.$transaction(async (tx) => {
      const current = await tx.site.findUniqueOrThrow({
        where: { id: siteId },
      });

      await tx.site.update({
        where: { id: siteId },
        data: {
          clientName: input.clientName,
          flatOrApartmentNo: input.flatOrApartmentNo ?? null,
          buildingName: input.buildingName ?? null,
          area: input.area ?? null,
          city: input.city ?? null,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "END_USER_APP",
          action: "SITE_UPDATED",
          targetType: "SITE",
          targetId: siteId,
          beforeJson: {
            clientName: current.clientName,
            flatOrApartmentNo: current.flatOrApartmentNo,
            buildingName: current.buildingName,
            area: current.area,
            city: current.city,
          },
          afterJson: {
            clientName: input.clientName,
            flatOrApartmentNo: input.flatOrApartmentNo ?? null,
            buildingName: input.buildingName ?? null,
            area: input.area ?? null,
            city: input.city ?? null,
          },
          createdAt: now,
        },
      });

      return siteId;
    });

    const site = await this.getSite(updatedSiteId);
    if (!site) {
      throw new Error("Updated site could not be loaded.");
    }
    return site;
  }

  async archiveSite(siteId: string, actor: AuthenticatedActor, now: Date): Promise<SiteSummary> {
    const updatedSiteId = await this.prisma.$transaction(async (tx) => {
      const current = await tx.site.findUniqueOrThrow({
        where: { id: siteId },
      });

      await tx.site.update({
        where: { id: siteId },
        data: {
          status: "ARCHIVED",
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          surface: "END_USER_APP",
          action: "SITE_ARCHIVED",
          targetType: "SITE",
          targetId: siteId,
          beforeJson: {
            status: current.status,
          },
          afterJson: {
            status: "ARCHIVED",
          },
          createdAt: now,
        },
      });

      return siteId;
    });

    const site = await this.getSite(updatedSiteId);
    if (!site) {
      throw new Error("Archived site could not be loaded.");
    }
    return site;
  }
}

function mapSiteSummary(site: SiteWithCounts): SiteSummary {
  return {
    siteId: site.id,
    contractorId: site.contractorId,
    clientName: site.clientName,
    status: site.status,
    scanCount: site._count.scanAttempts,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
    ...(site.flatOrApartmentNo ? { flatOrApartmentNo: site.flatOrApartmentNo } : {}),
    ...(site.buildingName ? { buildingName: site.buildingName } : {}),
    ...(site.area ? { area: site.area } : {}),
    ...(site.city ? { city: site.city } : {}),
  };
}
