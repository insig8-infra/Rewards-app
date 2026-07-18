import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminMobileRewardsController } from "./admin-mobile-rewards.controller.js";
import { AdminWebRewardsController } from "./admin-web-rewards.controller.js";
import { RewardsController } from "./rewards.controller.js";
import { RewardsService } from "./rewards.service.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RewardsController, AdminWebRewardsController, AdminMobileRewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
