import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ContractorSitesController } from "./contractor-sites.controller.js";
import { PrismaSitesRepository } from "./prisma-sites.repository.js";
import { SITES_REPOSITORY } from "./sites.repository.js";
import { SitesService } from "./sites.service.js";
import { TeamMemberSitesController } from "./team-member-sites.controller.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ContractorSitesController, TeamMemberSitesController],
  providers: [
    SitesService,
    {
      provide: SITES_REPOSITORY,
      useClass: PrismaSitesRepository,
    },
  ],
  exports: [SitesService],
})
export class SitesModule {}
