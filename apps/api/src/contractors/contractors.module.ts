import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ADMIN_CONTRACTOR_REPOSITORY } from "./admin-contractor.repository.js";
import { AdminContractorService } from "./admin-contractor.service.js";
import { AdminMobileContractorsController } from "./admin-mobile-contractors.controller.js";
import { AdminWebContractorsController } from "./admin-web-contractors.controller.js";
import { PrismaAdminContractorRepository } from "./prisma-admin-contractor.repository.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminWebContractorsController, AdminMobileContractorsController],
  providers: [
    AdminContractorService,
    {
      provide: ADMIN_CONTRACTOR_REPOSITORY,
      useClass: PrismaAdminContractorRepository,
    },
  ],
  exports: [AdminContractorService],
})
export class ContractorsModule {}
