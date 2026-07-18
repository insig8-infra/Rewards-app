import { Controller, Get, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { AdminWebDashboardService } from "./admin-web-dashboard.service.js";

@Controller("admin-mobile/dashboard")
@UseGuards(ActorGuard)
export class AdminMobileDashboardController {
  constructor(private readonly dashboard: AdminWebDashboardService) {}

  @Get()
  @RequireAction(ACTION.REPORT_VIEW)
  getDashboard(
    @CurrentActor() actor: AuthenticatedActor,
  ): ReturnType<AdminWebDashboardService["getDashboard"]> {
    return this.dashboard.getDashboard(actor.role);
  }
}
