import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ACTOR_ROLE } from "@volt-rewards/domain";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import type { SiteSummary, SiteWriteInput, SitesRepository } from "./sites.repository.js";
import { SitesService } from "./sites.service.js";

const contractorActor: AuthenticatedActor = {
  role: ACTOR_ROLE.CONTRACTOR,
  contractorId: "contractor_1",
};

test("SitesService creates normalized sites using contractor actor scope", async () => {
  const repository = new InMemorySitesRepository();
  const service = new SitesService(repository);

  const created = await service.createSite(
    contractorActor,
    {
      clientName: "  Shinde   Residence ",
      flatOrApartmentNo: " A-402 ",
      area: " Baner ",
      city: " Pune ",
    },
    new Date("2026-07-01T00:00:00.000Z"),
  );

  assert.equal(created.contractorId, "contractor_1");
  assert.equal(created.clientName, "Shinde Residence");
  assert.equal(created.flatOrApartmentNo, "A-402");
  assert.equal(created.area, "Baner");
  assert.equal(created.city, "Pune");
});

test("SitesService lists only active sites for Team Member site selection", async () => {
  const repository = new InMemorySitesRepository([
    makeSite({ siteId: "site_active", contractorId: "contractor_1", status: "ACTIVE" }),
    makeSite({ siteId: "site_archived", contractorId: "contractor_1", status: "ARCHIVED" }),
  ]);
  const service = new SitesService(repository);

  const sites = await service.listTeamMemberSites("contractor_1");

  assert.deepEqual(
    sites.map((site) => site.siteId),
    ["site_active"],
  );
});

test("SitesService blocks editing or archiving another contractor site", async () => {
  const repository = new InMemorySitesRepository([
    makeSite({ siteId: "site_2", contractorId: "contractor_2", status: "ACTIVE" }),
  ]);
  const service = new SitesService(repository);

  await assert.rejects(
    service.updateSite(contractorActor, "site_2", { clientName: "Wrong Site" }),
    (error) => error instanceof NotFoundException,
  );
});

test("SitesService blocks archived site mutation", async () => {
  const repository = new InMemorySitesRepository([
    makeSite({ siteId: "site_archived", contractorId: "contractor_1", status: "ARCHIVED" }),
  ]);
  const service = new SitesService(repository);

  await assert.rejects(
    service.archiveSite(contractorActor, "site_archived"),
    (error) => error instanceof BadRequestException,
  );
});

class InMemorySitesRepository implements SitesRepository {
  private readonly sites = new Map<string, SiteSummary>();

  constructor(seed: readonly SiteSummary[] = []) {
    for (const site of seed) {
      this.sites.set(site.siteId, site);
    }
  }

  async listSites(
    contractorId: string,
    options: { readonly activeOnly?: boolean } = {},
  ): Promise<readonly SiteSummary[]> {
    return [...this.sites.values()].filter(
      (site) => site.contractorId === contractorId && (!options.activeOnly || site.status === "ACTIVE"),
    );
  }

  async getSite(siteId: string): Promise<SiteSummary | null> {
    return this.sites.get(siteId) ?? null;
  }

  async createSite(contractorId: string, input: SiteWriteInput): Promise<SiteSummary> {
    const site = makeSite({
      siteId: `site_${this.sites.size + 1}`,
      contractorId,
      status: "ACTIVE",
      ...input,
    });
    this.sites.set(site.siteId, site);
    return site;
  }

  async updateSite(siteId: string, input: SiteWriteInput): Promise<SiteSummary> {
    const current = this.sites.get(siteId);
    if (!current) {
      throw new Error("Missing site.");
    }
    const updated = {
      ...current,
      ...input,
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    };
    this.sites.set(siteId, updated);
    return updated;
  }

  async archiveSite(siteId: string): Promise<SiteSummary> {
    const current = this.sites.get(siteId);
    if (!current) {
      throw new Error("Missing site.");
    }
    const archived: SiteSummary = {
      ...current,
      status: "ARCHIVED",
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    };
    this.sites.set(siteId, archived);
    return archived;
  }
}

function makeSite(input: {
  readonly siteId: string;
  readonly contractorId: string;
  readonly status: SiteSummary["status"];
  readonly clientName?: string;
  readonly flatOrApartmentNo?: string;
  readonly buildingName?: string;
  readonly area?: string;
  readonly city?: string;
}): SiteSummary {
  return {
    siteId: input.siteId,
    contractorId: input.contractorId,
    clientName: input.clientName ?? "Default Site",
    status: input.status,
    scanCount: 0,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    ...(input.flatOrApartmentNo ? { flatOrApartmentNo: input.flatOrApartmentNo } : {}),
    ...(input.buildingName ? { buildingName: input.buildingName } : {}),
    ...(input.area ? { area: input.area } : {}),
    ...(input.city ? { city: input.city } : {}),
  };
}
