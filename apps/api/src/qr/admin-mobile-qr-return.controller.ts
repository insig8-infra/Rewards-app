import { BadRequestException, Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ACTION, DomainError } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { QrReturnService } from "./qr-return.service.js";

@Controller("admin-mobile/return-qr")
@UseGuards(ActorGuard)
export class AdminMobileQrReturnController {
  constructor(private readonly returns: QrReturnService) {}

  @Post("lookup")
  @RequireAction(ACTION.ADMIN_CANCEL_QR)
  lookup(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() body: { readonly token?: string; readonly now?: string },
  ): ReturnType<QrReturnService["lookupByToken"]> {
    return this.returns
      .lookupByToken(actor, body.token ?? "", body.now ? new Date(body.now) : new Date())
      .catch(mapDomainError) as ReturnType<QrReturnService["lookupByToken"]>;
  }

  @Post(":qrUnitId/cancel")
  @RequireAction(ACTION.ADMIN_CANCEL_QR)
  cancel(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("qrUnitId") qrUnitId: string,
    @Body() body: { readonly labelRemovedAndDiscarded?: boolean; readonly now?: string },
  ): ReturnType<QrReturnService["cancelQr"]> {
    return this.returns
      .cancelQr(actor, qrUnitId, {
        ...(typeof body.labelRemovedAndDiscarded === "boolean"
          ? { labelRemovedAndDiscarded: body.labelRemovedAndDiscarded }
          : {}),
        ...(body.now ? { now: new Date(body.now) } : {}),
      })
      .catch(mapDomainError) as ReturnType<QrReturnService["cancelQr"]>;
  }

  @Post(":qrUnitId/reverse")
  @RequireAction(ACTION.ADMIN_REVERSE_QR)
  reverse(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("qrUnitId") qrUnitId: string,
    @Body() body: { readonly labelRemovedAndDiscarded?: boolean; readonly now?: string },
  ): ReturnType<QrReturnService["reverseQr"]> {
    return this.returns
      .reverseQr(actor, qrUnitId, {
        ...(typeof body.labelRemovedAndDiscarded === "boolean"
          ? { labelRemovedAndDiscarded: body.labelRemovedAndDiscarded }
          : {}),
        ...(body.now ? { now: new Date(body.now) } : {}),
      })
      .catch(mapDomainError) as ReturnType<QrReturnService["reverseQr"]>;
  }
}

function mapDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw new BadRequestException({ message: error.message, code: error.code });
  }
  throw error;
}
