import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { ItemCodesModule } from "../item-codes/item-codes.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminWebBusyController } from "./admin-web-busy.controller.js";
import { ADMIN_WEB_INVOICE_READ_REPOSITORY } from "./admin-web-invoice-read.repository.js";
import { AdminWebInvoiceReadService } from "./admin-web-invoice-read.service.js";
import { AdminWebInvoicesController } from "./admin-web-invoices.controller.js";
import { BusyIntegrationController } from "./busy-integration.controller.js";
import { BUSY_IMPORT_REPOSITORY } from "./busy-import.repository.js";
import { BusyImportService } from "./busy-import.service.js";
import { PrismaAdminWebInvoiceReadRepository } from "./prisma-admin-web-invoice-read.repository.js";
import { PrismaBusyImportRepository } from "./prisma-busy-import.repository.js";

@Module({
  imports: [AuthModule, ItemCodesModule, PrismaModule],
  controllers: [AdminWebBusyController, AdminWebInvoicesController, BusyIntegrationController],
  providers: [
    BusyImportService,
    AdminWebInvoiceReadService,
    {
      provide: BUSY_IMPORT_REPOSITORY,
      useClass: PrismaBusyImportRepository,
    },
    {
      provide: ADMIN_WEB_INVOICE_READ_REPOSITORY,
      useClass: PrismaAdminWebInvoiceReadRepository,
    },
  ],
  exports: [BusyImportService, AdminWebInvoiceReadService],
})
export class BusyModule {}
