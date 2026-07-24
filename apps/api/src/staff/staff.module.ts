import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ADMIN_STAFF_REPOSITORY } from "./admin-staff.repository.js";
import { AdminStaffService } from "./admin-staff.service.js";
import { AdminMobileStaffController } from "./admin-mobile-staff.controller.js";
import { AdminWebAdminsController } from "./admin-web-admins.controller.js";
import { AdminWebStaffController } from "./admin-web-staff.controller.js";
import { PrismaAdminStaffRepository } from "./prisma-admin-staff.repository.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminWebStaffController, AdminMobileStaffController, AdminWebAdminsController],
  providers: [
    AdminStaffService,
    {
      provide: ADMIN_STAFF_REPOSITORY,
      useClass: PrismaAdminStaffRepository,
    },
  ],
  exports: [AdminStaffService],
})
export class StaffModule {}
