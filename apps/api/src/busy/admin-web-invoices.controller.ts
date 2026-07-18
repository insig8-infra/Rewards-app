import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { AdminWebInvoiceReadService } from "./admin-web-invoice-read.service.js";

@Controller("admin-web/invoices")
@UseGuards(ActorGuard)
export class AdminWebInvoicesController {
  constructor(private readonly invoices: AdminWebInvoiceReadService) {}

  @Get()
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  listInvoices(): ReturnType<AdminWebInvoiceReadService["listInvoices"]> {
    return this.invoices.listInvoices();
  }

  @Get(":invoiceId")
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  getInvoiceDetail(
    @Param("invoiceId") invoiceId: string,
  ): ReturnType<AdminWebInvoiceReadService["getInvoiceDetail"]> {
    return this.invoices.getInvoiceDetail(invoiceId);
  }
}
