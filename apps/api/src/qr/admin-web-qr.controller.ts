import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ACTION, DomainError, type QrPrintLineRequest } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { QrPrintHistoryService } from "./qr-print-history.service.js";
import { QrPrintService } from "./qr-print.service.js";

@Controller("admin-web/qr")
@UseGuards(ActorGuard)
export class AdminWebQrController {
  constructor(
    private readonly qrPrint: QrPrintService,
    private readonly printHistory: QrPrintHistoryService,
  ) {}

  @Get("print-history")
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  listPrintHistory(): ReturnType<QrPrintHistoryService["listPrintHistory"]> {
    return this.printHistory.listPrintHistory();
  }

  @Post("print")
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  printQr(
    @CurrentActor() actor: AuthenticatedActor,
    @Body()
    body: {
      readonly invoiceId: string;
      readonly lines: readonly QrPrintLineRequest[];
      readonly now?: string;
    },
  ): ReturnType<QrPrintService["printQr"]> {
    return this.qrPrint
      .printQr({
        invoiceId: body.invoiceId,
        actorRole: actor.role,
        ...(actor.userId ? { actorUserId: actor.userId } : {}),
        lines: body.lines,
        printedAt: body.now ? new Date(body.now) : new Date(),
      })
      .catch(mapDomainError) as ReturnType<QrPrintService["printQr"]>;
  }

  @Post(":qrUnitId/reprint")
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  reprintQr(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("qrUnitId") qrUnitId: string,
    @Body() body: { readonly now?: string } | undefined,
  ): ReturnType<QrPrintService["reprintQr"]> {
    return this.qrPrint
      .reprintQr({
        qrUnitId,
        actorRole: actor.role,
        ...(actor.userId ? { actorUserId: actor.userId } : {}),
        reprintedAt: body?.now ? new Date(body.now) : new Date(),
      })
      .catch(mapDomainError) as ReturnType<QrPrintService["reprintQr"]>;
  }
}

function mapDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw new BadRequestException({ message: error.message, code: error.code });
  }
  throw error;
}
