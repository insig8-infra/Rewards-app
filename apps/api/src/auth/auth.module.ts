import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminWebContractorAuthController } from "./admin-web-contractor-auth.controller.js";
import { ActorGuard } from "./actor.guard.js";
import { MobileAuthController } from "./mobile-auth.controller.js";
import { MOBILE_AUTH_REPOSITORY } from "./mobile-auth.repository.js";
import { MobileAuthService } from "./mobile-auth.service.js";
import { PrismaMobileAuthRepository } from "./prisma-mobile-auth.repository.js";

@Module({
  imports: [PrismaModule],
  controllers: [MobileAuthController, AdminWebContractorAuthController],
  providers: [
    ActorGuard,
    MobileAuthService,
    {
      provide: MOBILE_AUTH_REPOSITORY,
      useClass: PrismaMobileAuthRepository,
    },
  ],
  exports: [ActorGuard, MobileAuthService],
})
export class AuthModule {}
