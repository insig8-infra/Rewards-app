import { Controller, Get, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { PromotionsService } from "./promotions.service.js";

@Controller("promotions")
@UseGuards(ActorGuard)
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get("active")
  @RequireAction(ACTION.PROMOTION_VIEW)
  listActivePromotions(@CurrentActor() actor: AuthenticatedActor) {
    return this.promotions.listActivePromotionsForActor(actor);
  }
}
