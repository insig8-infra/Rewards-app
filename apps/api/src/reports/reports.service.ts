import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import {
  ADMIN_WEB_REPORTS_REPOSITORY,
  type AdminWebReportsRepository,
} from "./admin-web-reports.repository.js";
import { createReportCsv, createReportPdf, createReportXlsx } from "./report-file-generators.js";
import type {
  AdminReportExportFile,
  AdminReportExportFormat,
  AdminReportFilters,
  AdminReportId,
  AdminReportResponse,
  AdminReportsLanding,
} from "./reports.types.js";
import { ADMIN_REPORT_IDS } from "./reports.types.js";

@Injectable()
export class ReportsService {
  constructor(
    @Inject(ADMIN_WEB_REPORTS_REPOSITORY)
    private readonly reports: AdminWebReportsRepository,
  ) {}

  getLanding(_actor: AuthenticatedActor, filters: AdminReportFilters): Promise<AdminReportsLanding> {
    return this.reports.getLanding(filters);
  }

  getReport(
    _actor: AuthenticatedActor,
    reportId: string,
    filters: AdminReportFilters,
  ): Promise<AdminReportResponse> {
    return this.reports.getReport(parseReportId(reportId), filters);
  }

  async exportReport(input: {
    readonly actor: AuthenticatedActor;
    readonly reportId: string;
    readonly format: string | undefined;
    readonly filters: AdminReportFilters;
  }): Promise<AdminReportExportFile> {
    const reportId = parseReportId(input.reportId);
    const format = parseExportFormat(input.format);
    const report = await this.reports.getReport(reportId, {
      ...input.filters,
      page: 1,
      pageSize: 10_000,
    });

    const buffer = format === "PDF" ? createReportPdf(report) : format === "CSV" ? createReportCsv(report) : createReportXlsx(report);
    await this.reports.recordExport({
      actor: {
        role: input.actor.role,
        ...(input.actor.userId ? { userId: input.actor.userId } : {}),
      },
      format,
      report,
    });

    const extension = format === "PDF" ? "pdf" : format === "CSV" ? "csv" : "xlsx";
    return {
      fileName: `${report.reportId}-${new Date().toISOString().slice(0, 10)}.${extension}`,
      contentType:
        format === "PDF"
          ? "application/pdf"
          : format === "CSV"
            ? "text/csv; charset=utf-8"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    };
  }
}

function parseReportId(value: string): AdminReportId {
  if (ADMIN_REPORT_IDS.includes(value as AdminReportId)) {
    return value as AdminReportId;
  }
  throw new BadRequestException("Unknown report id.");
}

function parseExportFormat(value: string | undefined): AdminReportExportFormat {
  const normalized = value?.toUpperCase();
  if (normalized === "PDF" || normalized === "EXCEL" || normalized === "CSV") {
    return normalized;
  }
  throw new BadRequestException("Export format must be PDF, CSV, or EXCEL.");
}
