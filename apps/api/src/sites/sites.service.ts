import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { normalizeSiteProfile } from "@volt-rewards/domain";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { SITES_REPOSITORY, type SiteSummary, type SiteWriteInput, type SitesRepository } from "./sites.repository.js";

@Injectable()
export class SitesService {
  constructor(
    @Inject(SITES_REPOSITORY)
    private readonly repository: SitesRepository,
  ) {}

  listContractorSites(contractorId: string): Promise<readonly SiteSummary[]> {
    return this.repository.listSites(contractorId);
  }

  listTeamMemberSites(contractorId: string): Promise<readonly SiteSummary[]> {
    return this.repository.listSites(contractorId, { activeOnly: true });
  }

  async createSite(actor: AuthenticatedActor, input: SiteWriteInput, now = new Date()): Promise<SiteSummary> {
    const contractorId = requireContractorScope(actor);
    const normalized = normalizeSiteProfile(input);
    return this.repository.createSite(contractorId, normalized, actor, now);
  }

  async updateSite(
    actor: AuthenticatedActor,
    siteId: string,
    input: SiteWriteInput,
    now = new Date(),
  ): Promise<SiteSummary> {
    const contractorId = requireContractorScope(actor);
    const current = await this.repository.getSite(siteId);
    assertEditableSite(current, contractorId);

    const normalized = normalizeSiteProfile(input);
    return this.repository.updateSite(siteId, normalized, actor, now);
  }

  async archiveSite(actor: AuthenticatedActor, siteId: string, now = new Date()): Promise<SiteSummary> {
    const contractorId = requireContractorScope(actor);
    const current = await this.repository.getSite(siteId);
    assertEditableSite(current, contractorId);

    return this.repository.archiveSite(siteId, actor, now);
  }
}

function requireContractorScope(actor: AuthenticatedActor): string {
  if (!actor.contractorId) {
    throw new BadRequestException("Contractor scope is required.");
  }
  return actor.contractorId;
}

function assertEditableSite(site: SiteSummary | null, contractorId: string): asserts site is SiteSummary {
  if (!site || site.contractorId !== contractorId) {
    throw new NotFoundException("Site was not found for this contractor.");
  }

  if (site.status !== "ACTIVE") {
    throw new BadRequestException("Archived sites cannot be edited or archived again.");
  }
}
