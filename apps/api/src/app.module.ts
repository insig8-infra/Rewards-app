import { Module } from "@nestjs/common";
import { AdminWebModule } from "./admin-web/admin-web.module.js";
import { BusyModule } from "./busy/busy.module.js";
import { ContractorsModule } from "./contractors/contractors.module.js";
import { DomainModule } from "./domain/domain.module.js";
import { HealthController } from "./health/health.controller.js";
import { ItemCodesModule } from "./item-codes/item-codes.module.js";
import { PoliciesModule } from "./policies/policies.module.js";
import { PromotionsModule } from "./promotions/promotions.module.js";
import { QrModule } from "./qr/qr.module.js";
import { ReportsModule } from "./reports/reports.module.js";
import { RewardsModule } from "./rewards/rewards.module.js";
import { SitesModule } from "./sites/sites.module.js";
import { StaffModule } from "./staff/staff.module.js";

@Module({
  imports: [AdminWebModule, BusyModule, ContractorsModule, DomainModule, ItemCodesModule, PoliciesModule, PromotionsModule, QrModule, ReportsModule, RewardsModule, SitesModule, StaffModule],
  controllers: [HealthController],
})
export class AppModule {}
