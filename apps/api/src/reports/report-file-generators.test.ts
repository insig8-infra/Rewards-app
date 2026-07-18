import assert from "node:assert/strict";
import test from "node:test";
import { ACTOR_ROLE } from "@volt-rewards/domain";
import { createReportPdf, createReportXlsx } from "./report-file-generators.js";
import { ReportsService } from "./reports.service.js";
import type { AdminWebReportsRepository } from "./admin-web-reports.repository.js";
import type { AdminReportFilters, AdminReportResponse, AdminReportsLanding } from "./reports.types.js";

const report: AdminReportResponse = {
  reportId: "qr-status",
  title: "QR Status Report",
  resolvedRange: {
    label: "This Month",
    from: new Date("2026-07-01T00:00:00.000Z"),
    to: new Date("2026-07-09T00:00:00.000Z"),
    timezone: "Asia/Kolkata",
  },
  summary: [
    { label: "QR units", value: 2 },
    { label: "Claimed", value: 1 },
  ],
  columns: [
    { key: "invoiceNumber", label: "Invoice" },
    { key: "productName", label: "Product" },
    { key: "printed", label: "Printed", align: "right" },
    { key: "claimed", label: "Claimed", align: "right" },
  ],
  rows: [
    { invoiceNumber: "VR/26-27/1001", productName: "Havells Wire", printed: 1, claimed: 0 },
    { invoiceNumber: "VR/26-27/1002", productName: "Atomberg Fan", printed: 0, claimed: 1 },
  ],
  totalRows: 2,
  page: 1,
  pageSize: 25,
};

const filters: AdminReportFilters = {
  rangePreset: "this-month",
  page: 1,
  pageSize: 25,
};

test("report file generators create PDF and XLSX bytes without external runtime dependencies", () => {
  const pdf = createReportPdf(report);
  const xlsx = createReportXlsx(report);

  assert.equal(pdf.subarray(0, 8).toString("utf8"), "%PDF-1.4");
  assert.match(pdf.toString("utf8"), /QR Status Report/);
  assert.equal(xlsx.subarray(0, 2).toString("utf8"), "PK");
  assert.match(xlsx.toString("latin1"), /\[Content_Types\]\.xml/);
  assert.match(xlsx.toString("latin1"), /xl\/worksheets\/sheet1\.xml/);
});

test("ReportsService exports all filtered rows and records export audit metadata", async () => {
  const capturedFilters: AdminReportFilters[] = [];
  let capturedAuditFormat: string | null = null;
  const repository: AdminWebReportsRepository = {
    getLanding: async (): Promise<AdminReportsLanding> => ({
      resolvedRange: report.resolvedRange,
      generatedAt: new Date("2026-07-08T00:00:00.000Z"),
      cards: [],
      reportShortcuts: [],
      charts: [],
    }),
    getReport: async (_reportId, nextFilters) => {
      capturedFilters.push(nextFilters);
      return report;
    },
    recordExport: async (input) => {
      capturedAuditFormat = input.format;
      assert.equal(input.actor.role, ACTOR_ROLE.OWNER);
      assert.equal(input.report.reportId, "qr-status");
    },
  };
  const service = new ReportsService(repository);

  const exported = await service.exportReport({
    actor: { role: ACTOR_ROLE.OWNER, userId: "owner_1" },
    reportId: "qr-status",
    format: "EXCEL",
    filters,
  });

  assert.equal(capturedFilters[0]?.page, 1);
  assert.equal(capturedFilters[0]?.pageSize, 10_000);
  assert.equal(capturedAuditFormat, "EXCEL");
  assert.equal(exported.contentType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(exported.buffer.subarray(0, 2).toString("utf8"), "PK");
  assert.match(exported.fileName, /^qr-status-\d{4}-\d{2}-\d{2}\.xlsx$/);
});
