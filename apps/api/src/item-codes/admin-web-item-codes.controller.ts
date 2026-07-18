import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ACTION, DomainError } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { ItemCodesService, type AdminItemCodeStatus } from "./item-codes.service.js";

@Controller("admin-web/item-codes")
@UseGuards(ActorGuard)
export class AdminWebItemCodesController {
  constructor(private readonly itemCodes: ItemCodesService) {}

  @Get()
  @RequireAction(ACTION.ADMIN_VIEW_ITEM_CODES)
  listItemCodes(
    @Query("q") query?: string,
    @Query("status") status?: AdminItemCodeStatus | "ALL",
  ): ReturnType<ItemCodesService["listItemCodes"]> {
    return this.itemCodes.listItemCodes({
      ...(query ? { query } : {}),
      ...(status ? { status } : {}),
    });
  }

  @Post("refresh")
  @RequireAction(ACTION.ADMIN_MANAGE_ITEM_CODES)
  refreshFromBusyAdapter(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() body?: { readonly now?: string },
  ): ReturnType<ItemCodesService["refreshFromBusyAdapter"]> {
    return this.itemCodes
      .refreshFromBusyAdapter(actor, body?.now ? new Date(body.now) : new Date())
      .catch(mapDomainError) as ReturnType<ItemCodesService["refreshFromBusyAdapter"]>;
  }

  @Patch(":itemCodeId/reward-rule")
  @RequireAction(ACTION.ADMIN_MANAGE_ITEM_CODES)
  updateRewardRule(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("itemCodeId") itemCodeId: string,
    @Body()
    body: {
      readonly fixedPoints?: number | null;
      readonly percentOfPricePoints?: number | null;
      readonly now?: string;
    } = {},
  ): ReturnType<ItemCodesService["updateRewardRule"]> {
    return this.itemCodes
      .updateRewardRule(
        itemCodeId,
        {
          fixedPoints: body.fixedPoints ?? null,
          percentOfPricePoints: body.percentOfPricePoints ?? null,
        },
        actor,
        body.now ? new Date(body.now) : new Date(),
      )
      .catch(mapDomainError) as ReturnType<ItemCodesService["updateRewardRule"]>;
  }
}

function mapDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw new BadRequestException({ message: error.message, code: error.code });
  }
  throw error;
}
