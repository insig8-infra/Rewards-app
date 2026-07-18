import { Controller, Get, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { SitesService } from "./sites.service.js";

@Controller("team-member/sites")
@UseGuards(ActorGuard)
export class TeamMemberSitesController {
  constructor(private readonly sites: SitesService) {}

  @Get()
  @RequireAction(ACTION.TEAM_MEMBER_SCAN)
  listSites(@CurrentActor() actor: AuthenticatedActor) {
    if (!actor.contractorId) {
      throw new UnauthorizedException("Contractor scope is required.");
    }

    return this.sites.listTeamMemberSites(actor.contractorId);
  }
}
