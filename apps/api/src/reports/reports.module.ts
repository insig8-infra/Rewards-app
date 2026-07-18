import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ADMIN_WEB_REPORTS_REPOSITORY } from "./admin-web-reports.repository.js";
import { AdminMobileReportsController } from "./admin-mobile-reports.controller.js";
import { AdminWebReportsController } from "./admin-web-reports.controller.js";
import { PrismaAdminWebReportsRepository } from "./prisma-admin-web-reports.repository.js";
import { ReportsService } from "./reports.service.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminWebReportsController, AdminMobileReportsController],
  providers: [
    ReportsService,
    {
      provide: ADMIN_WEB_REPORTS_REPOSITORY,
      useClass: PrismaAdminWebReportsRepository,
    },
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
