import { BadRequestException, Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ACTION, DomainError } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { BusyImportService } from "./busy-import.service.js";

@Controller("admin-web/busy")
@UseGuards(ActorGuard)
export class AdminWebBusyController {
  constructor(private readonly busyImport: BusyImportService) {}

  @Get("mock-invoices")
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  listMockInvoices(): ReturnType<BusyImportService["listMockInvoices"]> {
    return this.busyImport.listMockInvoices();
  }

  @Get("mock-return-vouchers")
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  listMockReturnVouchers(): ReturnType<BusyImportService["listMockReturnVouchers"]> {
    return this.busyImport.listMockReturnVouchers();
  }

  @Get("sync-status")
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  getSyncStatus(): ReturnType<BusyImportService["getSyncStatus"]> {
    return this.busyImport.getSyncStatus();
  }

  @Post("mock-sync")
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  syncMockInvoices(
    @CurrentActor() actor: AuthenticatedActor,
    @Body()
    body: {
      readonly now?: string;
    },
  ): ReturnType<BusyImportService["syncMockInvoices"]> {
    return this.busyImport
      .syncMockInvoices(body.now ? new Date(body.now) : new Date(), actor)
      .catch(mapDomainError) as ReturnType<BusyImportService["syncMockInvoices"]>;
  }

  @Post("mock-import")
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  importMockInvoice(
    @CurrentActor() actor: AuthenticatedActor,
    @Body()
    body: {
      readonly externalInvoiceId: string;
      readonly now?: string;
    },
  ): ReturnType<BusyImportService["importMockInvoice"]> {
    return this.busyImport
      .importMockInvoice(
        body.externalInvoiceId,
        body.now ? new Date(body.now) : new Date(),
        actor,
      )
      .catch(mapDomainError) as ReturnType<BusyImportService["importMockInvoice"]>;
  }

  @Post("mock-return-import")
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  importMockReturnVoucher(
    @CurrentActor() actor: AuthenticatedActor,
    @Body()
    body: {
      readonly externalReturnId: string;
      readonly now?: string;
    },
  ): ReturnType<BusyImportService["importMockReturnVoucher"]> {
    return this.busyImport
      .importMockReturnVoucher(
        body.externalReturnId,
        body.now ? new Date(body.now) : new Date(),
        actor,
      )
      .catch(mapDomainError) as ReturnType<BusyImportService["importMockReturnVoucher"]>;
  }
}

function mapDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw new BadRequestException({ message: error.message, code: error.code });
  }
  throw error;
}
