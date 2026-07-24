"use client";

import { ArrowDownUp, BarChart3, ChevronDown, ChevronUp, Download, Eraser, FileSpreadsheet, FileText, Loader2, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  type AdminReportCell,
  type AdminReportExportFormat,
  type AdminReportFilters,
  type AdminReportId,
  type AdminReportResponse,
  type AdminReportRangePreset,
  type AdminReportsLanding,
  createAdminApiClient,
} from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { AdminPortalShell, useAdminActor } from "./AdminPortalShell";

type StatusState = {
  readonly tone: "idle" | "success" | "error";
  readonly message: string;
};

const reportOptions: readonly { readonly reportId: AdminReportId; readonly title: string; readonly description: string }[] = [
  { reportId: "qr-print", title: "QR Print Analytics", description: "Printed QR units by invoice, product, actor, and status." },
  { reportId: "scan-history", title: "Scan History Analytics", description: "All scan attempts, sites, contractors, outcomes, and failures." },
  { reportId: "contractor-leaderboard", title: "Contractor Leaderboard", description: "Top contractors by points, scans, claims, and delivery activity." },
  { reportId: "qr-status", title: "QR Status Report", description: "Not_Printed, Printed, Reprinted, Claimed, Cancelled, Reversed_AND_Cancelled." },
  { reportId: "reward-claims", title: "Reward Claims Report", description: "Claim IDs, contractors, rewards, status, OTP, and delivery history." },
  { reportId: "returns-reversals", title: "Returns/Reversals Report", description: "BUSY return allocations and reversal impact." },
];

const rangePresets: readonly { readonly value: AdminReportRangePreset; readonly label: string }[] = [
  { value: "today", label: "Today" },
  { value: "this-week", label: "This Week" },
  { value: "last-week", label: "Last Week" },
  { value: "this-month", label: "This Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "custom", label: "Custom" },
];

const qrStatusOptions = ["Not_Printed", "Printed", "Reprinted", "Claimed", "Cancelled", "Reversed_AND_Cancelled"] as const;
const scanOutcomeOptions = ["Success", "Already Claimed", "Expired", "Invalid", "Replaced", "Permission Denied"] as const;
const rewardStatusOptions = ["Claim Raised", "Delivered", "Claim Cancelled"] as const;
const returnStatusOptions = ["NOT_PRINTED_UNAVAILABLE", "PRINTED_CANCEL_ELIGIBLE", "SCANNED_REVIEW_NEEDED", "SCANNED_REVERSED"] as const;

export function AdminReportsWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="reports" session={session} subtitle="Analytics, exports, and audit-ready report views" title="Reports">
      <ReportsContent />
    </AdminPortalShell>
  );
}

function ReportsContent() {
  const { actorRole } = useAdminActor();
  const searchParams = useSearchParams();
  const api = useMemo(() => createAdminApiClient(), []);
  const [selectedReport, setSelectedReport] = useState<AdminReportId>(() => parseInitialReport(searchParams.get("report")));
  const [landing, setLanding] = useState<AdminReportsLanding | null>(null);
  const [report, setReport] = useState<AdminReportResponse | null>(null);
  const [rangePreset, setRangePreset] = useState<AdminReportRangePreset>("this-month");
  const [customFrom, setCustomFrom] = useState(() => firstDayOfMonthInput());
  const [customTo, setCustomTo] = useState(() => todayInput());
  const [search, setSearch] = useState("");
  const [qrStatus, setQrStatus] = useState("");
  const [scanOutcome, setScanOutcome] = useState("");
  const [rewardStatus, setRewardStatus] = useState("");
  const [returnStatus, setReturnStatus] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Loading reports" });
  const [loading, setLoading] = useState<"landing" | "report" | "export" | null>(null);
  const canExport = actorRole === "OWNER" || actorRole === "ADMIN";

  useEffect(() => {
    void loadLanding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  useEffect(() => {
    void loadReport(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport, rangePreset, customFrom, customTo, search, qrStatus, scanOutcome, rewardStatus, returnStatus, invoiceNumber, productCategory, sort, page, pageSize, api]);

  function buildFilters(pageOverride = page): AdminReportFilters {
    const base: AdminReportFilters = {
      rangePreset,
      ...(rangePreset === "custom" ? { from: dateInputToStartIso(customFrom), to: dateInputToExclusiveEndIso(customTo) } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(sort ? { sort } : {}),
      ...(invoiceNumber.trim() ? { invoiceNumber: invoiceNumber.trim() } : {}),
      ...(productCategory.trim() ? { productCategory: productCategory.trim() } : {}),
      page: pageOverride,
      pageSize,
    };

    return {
      ...base,
      ...(usesQrStatus(selectedReport) && qrStatus ? { qrStatus } : {}),
      ...(usesScanOutcome(selectedReport) && scanOutcome ? { qrStatus: scanOutcome } : {}),
      ...(usesRewardStatus(selectedReport) && rewardStatus ? { rewardStatus } : {}),
      ...(selectedReport === "returns-reversals" && returnStatus ? { returnStatus } : {}),
    };
  }

  async function loadLanding(): Promise<void> {
    setLoading((current) => current ?? "landing");
    try {
      const nextLanding = await api.getReportsLanding({
        page: 1,
        pageSize: 25,
      });
      setLanding(nextLanding);
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setLoading(null);
    }
  }

  async function loadReport(nextPage = page): Promise<void> {
    setLoading("report");
    setStatus({ tone: "idle", message: "Loading report" });
    try {
      const nextReport = await api.getReport(selectedReport, buildFilters(nextPage));
      setReport(nextReport);
      setStatus({ tone: "success", message: `${nextReport.title} refreshed` });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setLoading(null);
    }
  }

  async function exportReport(format: AdminReportExportFormat): Promise<void> {
    if (!canExport) {
      setStatus({ tone: "error", message: "Only OWNER/Admin can export reports." });
      return;
    }
    setLoading("export");
    setStatus({ tone: "idle", message: `Preparing ${format === "PDF" ? "PDF" : "Excel"} export` });
    try {
      const file = await api.exportReport(selectedReport, format, buildFilters(1));
      if (file.blob.size === 0) {
        throw new Error("The export returned an empty file. Please refresh and try again.");
      }
      triggerDownload(file.blob, file.fileName);
      setStatus({ tone: "success", message: `${file.fileName} downloaded` });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setLoading(null);
    }
  }

  function chooseReport(reportId: AdminReportId): void {
    setSelectedReport(reportId);
    setPage(1);
    setSort("");
    setQrStatus("");
    setScanOutcome("");
    setRewardStatus("");
    setReturnStatus("");
  }

  async function refreshReports(): Promise<void> {
    await loadLanding();
    await loadReport(1);
  }

  function clearFilters(): void {
    setRangePreset("this-month");
    setCustomFrom(firstDayOfMonthInput());
    setCustomTo(todayInput());
    setSearch("");
    setQrStatus("");
    setScanOutcome("");
    setRewardStatus("");
    setReturnStatus("");
    setInvoiceNumber("");
    setProductCategory("");
    setSort("");
    setPage(1);
    setPageSize(25);
  }

  function toggleColumnSort(columnKey: string): void {
    setSort((current) => {
      const [currentKey, currentDirection] = current.split(":");
      if (currentKey !== columnKey) {
        return `${columnKey}:asc`;
      }
      if (currentDirection === "asc") {
        return `${columnKey}:desc`;
      }
      return "";
    });
    setPage(1);
  }

  const totalPages = report ? Math.max(1, Math.ceil(report.totalRows / report.pageSize)) : 1;
  const selectedOption = reportOptions.find((option) => option.reportId === selectedReport) ?? reportOptions[0]!;
  const hasActiveFilters = Boolean(
    search.trim() ||
      qrStatus ||
      scanOutcome ||
      rewardStatus ||
      returnStatus ||
      invoiceNumber.trim() ||
      productCategory.trim() ||
      sort ||
      rangePreset !== "this-month" ||
      pageSize !== 25,
  );

  return (
    <section className="content reports-content">
      <div className="page-intro reports-page-intro">
        <div>
          <div className="eyebrow">Admin analytics</div>
          <h2>Report desk for QR, scan, reward, return, and contractor operations</h2>
          <span className={status.tone === "error" ? "status error" : status.tone === "success" ? "status success" : "status"}>
            {loading === "report" ? "Refreshing report data" : status.message}
          </span>
        </div>
        <div className="page-intro-actions">
          <button className="button" type="button" disabled={loading !== null} onClick={() => void refreshReports()}>
            {loading === "report" ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
            Refresh
          </button>
          <button className="button" type="button" disabled={!canExport || loading !== null} onClick={() => void exportReport("PDF")}>
            <FileText size={16} aria-hidden="true" />
            PDF
          </button>
          <button className="button primary" type="button" disabled={!canExport || loading !== null} onClick={() => void exportReport("EXCEL")}>
            <FileSpreadsheet size={16} aria-hidden="true" />
            Excel
          </button>
        </div>
      </div>

      <div className="summary-grid reports-summary-grid">
        {(landing?.cards ?? []).slice(0, 8).map((card) => (
          <button className={`metric report-metric ${card.tone ?? "info"}`} key={card.key} type="button" onClick={() => chooseReport(reportFromHref(card.href) ?? selectedReport)}>
            <span className="metric-label">{card.label}</span>
            <strong className="metric-value">{card.value}</strong>
            {card.meta ? <span className="metric-meta">{card.meta}</span> : null}
          </button>
        ))}
      </div>

      {landing?.charts?.length ? (
        <div className="reports-insights-grid">
          {landing.charts.map((chart) => {
            const total = chart.segments.reduce((sum, segment) => sum + segment.value, 0);
            const denominator = Math.max(1, total);
            return (
              <section className="panel report-chart-card" key={chart.key}>
                <div className="panel-header compact-header">
                  <div>
                    <h2 className="panel-title">{chart.title}</h2>
                    <div className="panel-subtitle">{chart.description}</div>
                  </div>
                  <BarChart3 size={17} aria-hidden="true" />
                </div>
                <div className="report-chart-bars">
                  {chart.segments.length === 0 ? (
                    <div className="status">No activity yet.</div>
                  ) : chart.segments.map((segment, segmentIndex) => {
                    const width = total > 0 ? Math.round((segment.value / denominator) * 100) : 0;
                    return (
                      <div className="report-chart-row" key={`${chart.key}-${segment.label}-${segmentIndex}`}>
                        <div className="report-chart-row-label">
                          <span>{segment.label}</span>
                          <strong>{formatCell(segment.value)}</strong>
                        </div>
                        <div className="report-chart-track" aria-hidden="true">
                          <span className={`report-chart-fill ${segment.tone ?? "info"}`} style={{ width: `${width}%` }} />
                        </div>
                        {segment.meta ? <div className="metric-meta">{segment.meta}</div> : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

      {!canExport ? (
        <div className="notice warn">
          <Download size={17} aria-hidden="true" />
          <div>
            <strong>STAFF can view reports but cannot export.</strong>
            <span>The export buttons stay disabled here and the API also blocks STAFF with role policy.</span>
          </div>
        </div>
      ) : null}

      <section className="panel report-selector-strip">
        <div className="panel-header compact-header">
          <div>
            <h2 className="panel-title">Report library</h2>
            <div className="panel-subtitle">{landing ? `Generated ${formatDateTime(landing.generatedAt)}` : "Loading report list"}</div>
          </div>
          <SlidersHorizontal size={17} aria-hidden="true" />
        </div>
        <div className="report-tab-list">
          {(landing?.reportShortcuts.length ? landing.reportShortcuts : reportOptions).map((option) => (
            <button
              className={`report-tab ${option.reportId === selectedReport ? "selected" : ""}`}
              key={option.reportId}
              type="button"
              onClick={() => chooseReport(option.reportId)}
            >
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="stack reports-main-stack">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">{selectedOption.title}</h2>
              <div className="panel-subtitle">{selectedOption.description}</div>
            </div>
            <div className="toolbar">
              <span className="badge">{report?.resolvedRange.label ?? "Loading"}</span>
              <button className="button compact" type="button" disabled={!hasActiveFilters || loading !== null} onClick={clearFilters}>
                <Eraser size={15} aria-hidden="true" />
                Clear filters
              </button>
            </div>
          </div>

          <div className="report-filter-grid">
            <label className="field">
              <span className="field-label">Date range</span>
              <select className="select-input" value={rangePreset} onChange={(event) => { setRangePreset(event.target.value as AdminReportRangePreset); setPage(1); }}>
                {rangePresets.map((range) => (
                  <option value={range.value} key={range.value}>{range.label}</option>
                ))}
              </select>
            </label>
            <label className={`field custom-date-field ${rangePreset === "custom" ? "" : "inactive"}`}>
              <span className="field-label">From</span>
              <input className="text-input" type="date" value={customFrom} disabled={rangePreset !== "custom"} onChange={(event) => { setCustomFrom(event.target.value); setPage(1); }} />
            </label>
            <label className={`field custom-date-field ${rangePreset === "custom" ? "" : "inactive"}`}>
              <span className="field-label">To</span>
              <input className="text-input" type="date" value={customTo} disabled={rangePreset !== "custom"} onChange={(event) => { setCustomTo(event.target.value); setPage(1); }} />
            </label>
            <label className="field">
              <span className="field-label">Invoice</span>
              <input className="text-input" value={invoiceNumber} placeholder="VR/26-7/1003" onChange={(event) => { setInvoiceNumber(event.target.value); setPage(1); }} />
            </label>
            <label className="field">
              <span className="field-label">Product/category</span>
              <input className="text-input" value={productCategory} placeholder="Wire, Fan, Bulb" onChange={(event) => { setProductCategory(event.target.value); setPage(1); }} />
            </label>
            {usesQrStatus(selectedReport) ? (
              <label className="field">
                <span className="field-label">QR status</span>
                <select className="select-input" value={qrStatus} onChange={(event) => { setQrStatus(event.target.value); setPage(1); }}>
                  <option value="">All statuses</option>
                  {qrStatusOptions.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
            ) : null}
            {usesScanOutcome(selectedReport) ? (
              <label className="field">
                <span className="field-label">Scan outcome</span>
                <select className="select-input" value={scanOutcome} onChange={(event) => { setScanOutcome(event.target.value); setPage(1); }}>
                  <option value="">All outcomes</option>
                  {scanOutcomeOptions.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
            ) : null}
            {usesRewardStatus(selectedReport) ? (
              <label className="field">
                <span className="field-label">Reward status</span>
                <select className="select-input" value={rewardStatus} onChange={(event) => { setRewardStatus(event.target.value); setPage(1); }}>
                  <option value="">All statuses</option>
                  {rewardStatusOptions.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
            ) : null}
            {selectedReport === "returns-reversals" ? (
              <label className="field">
                <span className="field-label">Return status</span>
                <select className="select-input" value={returnStatus} onChange={(event) => { setReturnStatus(event.target.value); setPage(1); }}>
                  <option value="">All statuses</option>
                  {returnStatusOptions.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
            ) : null}
            <label className="field report-search-field">
              <span className="field-label">Search rows</span>
              <span className="input-shell">
                <Search size={16} aria-hidden="true" />
                <input className="text-input" value={search} placeholder="Contractor, claim, product, site" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
              </span>
            </label>
          </div>
        </section>

        {report ? (
          <>
            <div className="summary-grid report-summary-strip">
              {report.summary.map((item) => (
                <div className="metric" key={item.label}>
                  <div className="metric-label">{item.label}</div>
                  <div className="metric-value">{item.value}</div>
                  {item.meta ? <div className="metric-meta">{item.meta}</div> : null}
                </div>
              ))}
            </div>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Report rows</h2>
                  <div className="panel-subtitle">{report.totalRows} rows · page {report.page} of {totalPages}</div>
                </div>
                <div className="toolbar">
                  <select className="select-input compact-select" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                  </select>
                </div>
              </div>
              <div className="data-table-wrap report-table-wrap">
                <table className="data-table report-table">
                  <thead>
                    <tr>
                      {report.columns.map((column) => (
                        <th
                          aria-sort={sortAria(sort, column.key)}
                          className={column.align === "right" ? "number-cell" : undefined}
                          key={column.key}
                        >
                          <button
                            className={`column-sort-button ${column.align === "right" ? "right" : ""}`}
                            type="button"
                            onClick={() => toggleColumnSort(column.key)}
                          >
                            <span>{column.label}</span>
                            <SortIndicator columnKey={column.key} sort={sort} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.length === 0 ? (
                      <tr>
                        <td colSpan={report.columns.length}>No rows match this report filter.</td>
                      </tr>
                    ) : report.rows.map((row, index) => (
                      <tr key={`${report.reportId}-${report.page}-${index}`}>
                        {report.columns.map((column) => (
                          <td className={column.align === "right" ? "number-cell" : undefined} key={column.key}>
                            {formatCell(row[column.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="actions">
                <span className="status">{loading === "report" ? "Loading latest data" : `Showing ${report.rows.length} of ${report.totalRows}`}</span>
                <div className="toolbar">
                  <button className="button compact" type="button" disabled={page <= 1 || loading !== null} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    Previous
                  </button>
                  <button className="button compact" type="button" disabled={page >= totalPages || loading !== null} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                    Next
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Loading report</h2>
                <div className="panel-subtitle">Waiting for the API response.</div>
              </div>
              <Loader2 className="spin" size={18} aria-hidden="true" />
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

function parseInitialReport(value: string | null): AdminReportId {
  return reportOptions.some((option) => option.reportId === value) ? (value as AdminReportId) : "qr-print";
}

function reportFromHref(href: string | undefined): AdminReportId | null {
  if (!href) {
    return null;
  }
  const report = new URL(href, "http://local.test").searchParams.get("report");
  return reportOptions.some((option) => option.reportId === report) ? (report as AdminReportId) : null;
}

function usesQrStatus(reportId: AdminReportId): boolean {
  return reportId === "qr-print" || reportId === "qr-status";
}

function usesScanOutcome(reportId: AdminReportId): boolean {
  return reportId === "scan-history";
}

function usesRewardStatus(reportId: AdminReportId): boolean {
  return reportId === "reward-claims";
}

function sortDirection(sort: string, columnKey: string): "asc" | "desc" | null {
  const [currentKey, currentDirection] = sort.split(":");
  if (currentKey !== columnKey) {
    return null;
  }
  return currentDirection === "asc" || currentDirection === "desc" ? currentDirection : null;
}

function sortAria(sort: string, columnKey: string): "ascending" | "descending" | "none" {
  const direction = sortDirection(sort, columnKey);
  if (direction === "asc") {
    return "ascending";
  }
  if (direction === "desc") {
    return "descending";
  }
  return "none";
}

function SortIndicator({ columnKey, sort }: { readonly columnKey: string; readonly sort: string }) {
  const direction = sortDirection(sort, columnKey);
  if (direction === "asc") {
    return <ChevronUp size={14} aria-hidden="true" />;
  }
  if (direction === "desc") {
    return <ChevronDown size={14} aria-hidden="true" />;
  }
  return <ArrowDownUp size={13} aria-hidden="true" />;
}

function formatCell(value: AdminReportCell | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-IN").format(value);
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return value;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function firstDayOfMonthInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function dateInputToStartIso(value: string): string {
  return `${value}T00:00:00+05:30`;
}

function dateInputToExclusiveEndIso(value: string): string {
  const date = new Date(`${value}T00:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to complete reports task.";
}
