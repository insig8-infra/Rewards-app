import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { parseReportFilters } from "./report-helpers.js";
import { ReportsService } from "./reports.service.js";

@Controller("admin-mobile/reports")
@UseGuards(ActorGuard)
export class AdminMobileReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("landing")
  @RequireAction(ACTION.REPORT_VIEW)
  getLanding(@CurrentActor() actor: AuthenticatedActor, @Query() query: Record<string, unknown>) {
    return this.reports.getLanding(actor, parseReportFilters(query));
  }

  @Get(":reportId")
  @RequireAction(ACTION.REPORT_VIEW)
  getReport(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("reportId") reportId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.reports.getReport(actor, reportId, parseReportFilters(query));
  }
}
