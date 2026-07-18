import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import type { PromotionWriteInput } from "./promotions.service.js";
import { PromotionsService } from "./promotions.service.js";

@Controller("admin-web/promotions")
@UseGuards(ActorGuard)
export class AdminWebPromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @RequireAction(ACTION.ADMIN_MANAGE_PROMOTIONS)
  listPromotions() {
    return this.promotions.listAdminPromotions();
  }

  @Post()
  @RequireAction(ACTION.ADMIN_MANAGE_PROMOTIONS)
  createPromotion(@CurrentActor() actor: AuthenticatedActor, @Body() body: PromotionWriteInput) {
    return this.promotions.createPromotion(actor, body);
  }

  @Patch(":promotionId")
  @RequireAction(ACTION.ADMIN_MANAGE_PROMOTIONS)
  updatePromotion(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("promotionId") promotionId: string,
    @Body() body: PromotionWriteInput,
  ) {
    return this.promotions.updatePromotion(actor, promotionId, body);
  }

  @Post(":promotionId/activate")
  @RequireAction(ACTION.ADMIN_MANAGE_PROMOTIONS)
  activatePromotion(@CurrentActor() actor: AuthenticatedActor, @Param("promotionId") promotionId: string) {
    return this.promotions.activatePromotion(actor, promotionId);
  }

  @Post(":promotionId/deactivate")
  @RequireAction(ACTION.ADMIN_MANAGE_PROMOTIONS)
  deactivatePromotion(@CurrentActor() actor: AuthenticatedActor, @Param("promotionId") promotionId: string) {
    return this.promotions.deactivatePromotion(actor, promotionId);
  }
}
