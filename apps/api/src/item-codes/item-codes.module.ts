import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminWebItemCodesController } from "./admin-web-item-codes.controller.js";
import { ItemCodesService } from "./item-codes.service.js";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminWebItemCodesController],
  providers: [ItemCodesService],
  exports: [ItemCodesService],
})
export class ItemCodesModule {}
