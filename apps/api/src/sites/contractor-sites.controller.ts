import { Body, Controller, Get, Param, Patch, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { SitesService } from "./sites.service.js";
import type { SiteWriteInput } from "./sites.repository.js";

@Controller("contractor/sites")
@UseGuards(ActorGuard)
export class ContractorSitesController {
  constructor(private readonly sites: SitesService) {}

  @Get()
  @RequireAction(ACTION.CONTRACTOR_MANAGE_OWN_SITE)
  listSites(@CurrentActor() actor: AuthenticatedActor) {
    return this.sites.listContractorSites(requireContractorScope(actor));
  }

  @Post()
  @RequireAction(ACTION.CONTRACTOR_MANAGE_OWN_SITE)
  createSite(@CurrentActor() actor: AuthenticatedActor, @Body() body: SiteWriteInput) {
    return this.sites.createSite(actor, body);
  }

  @Patch(":siteId")
  @RequireAction(ACTION.CONTRACTOR_MANAGE_OWN_SITE)
  updateSite(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("siteId") siteId: string,
    @Body() body: SiteWriteInput,
  ) {
    return this.sites.updateSite(actor, siteId, body);
  }

  @Post(":siteId/archive")
  @RequireAction(ACTION.CONTRACTOR_MANAGE_OWN_SITE)
  archiveSite(@CurrentActor() actor: AuthenticatedActor, @Param("siteId") siteId: string) {
    return this.sites.archiveSite(actor, siteId);
  }
}

function requireContractorScope(actor: AuthenticatedActor): string {
  if (!actor.contractorId) {
    throw new UnauthorizedException("Contractor scope is required.");
  }
  return actor.contractorId;
}
