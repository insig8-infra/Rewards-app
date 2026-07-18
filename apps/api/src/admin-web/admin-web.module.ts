import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminMobileDashboardController } from "./admin-mobile-dashboard.controller.js";
import { AdminWebDashboardController } from "./admin-web-dashboard.controller.js";
import { ADMIN_WEB_DASHBOARD_REPOSITORY } from "./admin-web-dashboard.repository.js";
import { AdminWebDashboardService } from "./admin-web-dashboard.service.js";
import { PrismaAdminWebDashboardRepository } from "./prisma-admin-web-dashboard.repository.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminWebDashboardController, AdminMobileDashboardController],
  providers: [
    AdminWebDashboardService,
    {
      provide: ADMIN_WEB_DASHBOARD_REPOSITORY,
      useClass: PrismaAdminWebDashboardRepository,
    },
  ],
  exports: [AdminWebDashboardService],
})
export class AdminWebModule {}
