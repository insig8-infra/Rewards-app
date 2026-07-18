import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "./actor.guard.js";
import type { AuthenticatedActor } from "./authenticated-actor.js";
import { CurrentActor } from "./current-actor.decorator.js";
import { MobileAuthService } from "./mobile-auth.service.js";
import { RequireAction } from "./require-action.decorator.js";

@Controller("admin-web/contractors")
@UseGuards(ActorGuard)
export class AdminWebContractorAuthController {
  constructor(private readonly auth: MobileAuthService) {}

  @Post(":contractorId/reset-mpin")
  @RequireAction(ACTION.ADMIN_EDIT_CONTRACTOR)
  resetContractorMpin(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("contractorId") contractorId: string,
    @Body()
    body: {
      readonly now?: string;
    } = {},
  ): ReturnType<MobileAuthService["resetContractorMpin"]> {
    return this.auth.resetContractorMpin(contractorId, actor, body.now ? new Date(body.now) : new Date());
  }
}
