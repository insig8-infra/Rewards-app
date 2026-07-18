import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import type { RewardCatalogImageInput, RewardCatalogWriteInput } from "./rewards.service.js";
import { RewardsService } from "./rewards.service.js";

@Controller("admin-mobile/rewards")
@UseGuards(ActorGuard)
export class AdminMobileRewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get("claims")
  @RequireAction(ACTION.ADMIN_FULFILL_REWARD)
  listClaims(@CurrentActor() actor: AuthenticatedActor) {
    return this.rewards.listAdminClaims(actor);
  }

  @Get("claims/history")
  @RequireAction(ACTION.REPORT_VIEW)
  listClaimHistory(@CurrentActor() actor: AuthenticatedActor) {
    return this.rewards.listAdminClaimHistory(actor);
  }

  @Get("catalog")
  @RequireAction(ACTION.ADMIN_MANAGE_REWARD_CATALOG)
  listCatalog(@CurrentActor() actor: AuthenticatedActor) {
    return this.rewards.listAdminCatalog(actor);
  }

  @Post("catalog")
  @RequireAction(ACTION.ADMIN_MANAGE_REWARD_CATALOG)
  createCatalogItem(@CurrentActor() actor: AuthenticatedActor, @Body() body: RewardCatalogWriteInput) {
    return this.rewards.createCatalogItem(actor, body);
  }

  @Patch("catalog/:rewardId")
  @RequireAction(ACTION.ADMIN_MANAGE_REWARD_CATALOG)
  updateCatalogItem(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("rewardId") rewardId: string,
    @Body() body: RewardCatalogWriteInput,
  ) {
    return this.rewards.updateCatalogItem(actor, rewardId, body);
  }

  @Post("catalog/:rewardId/images")
  @RequireAction(ACTION.ADMIN_MANAGE_REWARD_CATALOG)
  addCatalogImage(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("rewardId") rewardId: string,
    @Body() body: RewardCatalogImageInput,
  ) {
    return this.rewards.addCatalogImage(actor, rewardId, body);
  }

  @Post("catalog/:rewardId/deactivate")
  @RequireAction(ACTION.ADMIN_MANAGE_REWARD_CATALOG)
  deactivateCatalogItem(@CurrentActor() actor: AuthenticatedActor, @Param("rewardId") rewardId: string) {
    return this.rewards.deactivateCatalogItem(actor, rewardId);
  }

  @Post("catalog/:rewardId/reactivate")
  @RequireAction(ACTION.ADMIN_MANAGE_REWARD_CATALOG)
  reactivateCatalogItem(@CurrentActor() actor: AuthenticatedActor, @Param("rewardId") rewardId: string) {
    return this.rewards.reactivateCatalogItem(actor, rewardId);
  }

  @Post("claims/lookup")
  @RequireAction(ACTION.ADMIN_FULFILL_REWARD)
  lookupClaim(@CurrentActor() actor: AuthenticatedActor, @Body() body: { readonly claimId?: string }) {
    return this.rewards.lookupClaim(actor, body.claimId ?? "");
  }

  @Post("claims/:claimId/send-otp")
  @RequireAction(ACTION.ADMIN_FULFILL_REWARD)
  sendOtp(@CurrentActor() actor: AuthenticatedActor, @Param("claimId") claimId: string) {
    return this.rewards.sendFulfillmentOtp(actor, claimId, new Date(), "ADMIN_MOBILE");
  }

  @Post("claims/:claimId/fulfill")
  @RequireAction(ACTION.ADMIN_FULFILL_REWARD)
  fulfillClaim(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("claimId") claimId: string,
    @Body() body: { readonly challengeId?: string; readonly otp?: string },
  ) {
    return this.rewards.fulfillClaim(actor, claimId, body, new Date(), "ADMIN_MOBILE");
  }
}
