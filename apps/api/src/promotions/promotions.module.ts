import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminWebPromotionsController } from "./admin-web-promotions.controller.js";
import { PromotionsController } from "./promotions.controller.js";
import { PromotionsService } from "./promotions.service.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminWebPromotionsController, PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
