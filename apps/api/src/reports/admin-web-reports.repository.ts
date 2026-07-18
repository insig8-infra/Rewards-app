import type {
  AdminReportExportAuditInput,
  AdminReportFilters,
  AdminReportId,
  AdminReportResponse,
  AdminReportsLanding,
} from "./reports.types.js";

export const ADMIN_WEB_REPORTS_REPOSITORY = Symbol("ADMIN_WEB_REPORTS_REPOSITORY");

export interface AdminWebReportsRepository {
  getLanding(filters: AdminReportFilters): Promise<AdminReportsLanding>;
  getReport(reportId: AdminReportId, filters: AdminReportFilters): Promise<AdminReportResponse>;
  recordExport(input: AdminReportExportAuditInput): Promise<void>;
}
