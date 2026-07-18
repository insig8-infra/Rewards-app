import { Body, Controller, Get, Param, Post, Query, Res, StreamableFile, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import type { FastifyReply } from "fastify";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import { parseReportFilters } from "./report-helpers.js";
import { ReportsService } from "./reports.service.js";

@Controller("admin-web/reports")
@UseGuards(ActorGuard)
export class AdminWebReportsController {
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

  @Post(":reportId/export")
  @RequireAction(ACTION.REPORT_EXPORT)
  async exportReport(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("reportId") reportId: string,
    @Body() body: { readonly format?: string; readonly filters?: Record<string, unknown> },
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    const file = await this.reports.exportReport({
      actor,
      reportId,
      format: body.format,
      filters: parseReportFilters(body.filters ?? {}),
    });
    response.header("Content-Type", file.contentType);
    response.header("Content-Disposition", `attachment; filename="${file.fileName}"`);
    return new StreamableFile(file.buffer);
  }
}
