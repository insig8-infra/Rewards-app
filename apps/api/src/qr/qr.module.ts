import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminMobileQrReturnController } from "./admin-mobile-qr-return.controller.js";
import { AdminWebQrController } from "./admin-web-qr.controller.js";
import { PrismaQrPrintHistoryRepository } from "./prisma-qr-print-history.repository.js";
import { PrismaQrPrintRepository } from "./prisma-qr-print.repository.js";
import { PrismaQrScanRepository } from "./prisma-qr-scan.repository.js";
import { QR_PRINT_HISTORY_REPOSITORY } from "./qr-print-history.repository.js";
import { QrPrintHistoryService } from "./qr-print-history.service.js";
import { QR_PRINT_REPOSITORY } from "./qr-print.repository.js";
import { QrPrintService } from "./qr-print.service.js";
import { QrReturnService } from "./qr-return.service.js";
import { QR_SCAN_REPOSITORY } from "./qr-scan.repository.js";
import { QrScanService } from "./qr-scan.service.js";
import { ScanController } from "./scan.controller.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminWebQrController, AdminMobileQrReturnController, ScanController],
  providers: [
    QrPrintService,
    QrPrintHistoryService,
    QrScanService,
    QrReturnService,
    {
      provide: QR_PRINT_HISTORY_REPOSITORY,
      useClass: PrismaQrPrintHistoryRepository,
    },
    {
      provide: QR_PRINT_REPOSITORY,
      useClass: PrismaQrPrintRepository,
    },
    {
      provide: QR_SCAN_REPOSITORY,
      useClass: PrismaQrScanRepository,
    },
  ],
  exports: [QrPrintService, QrPrintHistoryService, QrScanService, QrReturnService],
})
export class QrModule {}
