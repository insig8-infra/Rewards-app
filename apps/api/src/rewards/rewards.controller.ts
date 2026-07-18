import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { RewardsService } from "./rewards.service.js";

@Controller("rewards")
@UseGuards(ActorGuard)
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get("catalog")
  @RequireAction(ACTION.CONTRACTOR_VIEW_REWARDS)
  getCatalog(@CurrentActor() actor: AuthenticatedActor) {
    return this.rewards.getCatalog(actor);
  }

  @Get("catalog/:rewardId")
  @RequireAction(ACTION.CONTRACTOR_VIEW_REWARDS)
  getRewardDetail(@CurrentActor() actor: AuthenticatedActor, @Param("rewardId") rewardId: string) {
    return this.rewards.getRewardDetail(actor, rewardId);
  }

  @Post(":rewardId/redeem")
  @RequireAction(ACTION.CONTRACTOR_VIEW_REWARDS)
  redeemReward(@CurrentActor() actor: AuthenticatedActor, @Param("rewardId") rewardId: string) {
    return this.rewards.redeemReward(actor, rewardId);
  }

  @Post("claims/:claimId/cancel")
  @RequireAction(ACTION.CONTRACTOR_VIEW_REWARDS)
  cancelClaim(@CurrentActor() actor: AuthenticatedActor, @Param("claimId") claimId: string) {
    return this.rewards.cancelClaim(actor, claimId);
  }

  @Get("balance-book")
  @RequireAction(ACTION.CONTRACTOR_VIEW_REWARDS)
  getBalanceBook(
    @CurrentActor() actor: AuthenticatedActor,
    @Query() query: { readonly type?: string; readonly from?: string; readonly to?: string; readonly limit?: string },
  ) {
    return this.rewards.getBalanceBook(actor, query);
  }
}
