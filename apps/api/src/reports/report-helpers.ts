import { BadRequestException } from "@nestjs/common";
import type {
  AdminReportCell,
  AdminReportColumn,
  AdminReportFilters,
  AdminReportRangePreset,
  AdminReportResolvedRange,
} from "./reports.types.js";

const rangePresets = new Set<AdminReportRangePreset>([
  "today",
  "this-week",
  "last-week",
  "this-month",
  "last-3-months",
  "custom",
]);

const maxPageSize = 250;
const defaultPageSize = 50;
const istOffsetMs = 5.5 * 60 * 60 * 1000;

export function parseReportFilters(query: Record<string, unknown>): AdminReportFilters {
  const rangePreset = readRangePreset(query.rangePreset);
  const customFrom = readOptionalDate(query.from, "from");
  const customTo = readOptionalDate(query.to, "to");

  if (rangePreset === "custom" && (!customFrom || !customTo)) {
    throw new BadRequestException("Custom report range requires from and to.");
  }

  return {
    rangePreset,
    ...(customFrom ? { from: customFrom } : {}),
    ...(customTo ? { to: customTo } : {}),
    ...readOptionalString("qrStatus", query.qrStatus),
    ...readOptionalString("rewardStatus", query.rewardStatus),
    ...readOptionalString("returnStatus", query.returnStatus),
    ...readOptionalString("contractorId", query.contractorId),
    ...readOptionalString("siteId", query.siteId),
    ...readOptionalString("productCategory", query.productCategory),
    ...readOptionalString("invoiceNumber", query.invoiceNumber),
    ...readOptionalString("rewardName", query.rewardName),
    ...readOptionalString("actorUserId", query.actorUserId),
    ...readOptionalString("search", query.search),
    ...readOptionalString("sort", query.sort),
    page: readPositiveInteger(query.page, 1),
    pageSize: Math.min(maxPageSize, readPositiveInteger(query.pageSize, defaultPageSize)),
  };
}

export function resolveReportRange(filters: AdminReportFilters, now = new Date()): AdminReportResolvedRange {
  if (filters.rangePreset === "custom") {
    const from = filters.from;
    const to = filters.to;
    if (!from || !to) {
      throw new BadRequestException("Custom report range requires from and to.");
    }
    if (from > to) {
      throw new BadRequestException("Custom report range from must be before to.");
    }
    return {
      label: `${formatDateLabel(from)} to ${formatDateLabel(to)}`,
      from,
      to,
      timezone: "Asia/Kolkata",
    };
  }

  const todayParts = getIstDateParts(now);
  const todayStart = istDateToUtc(todayParts.year, todayParts.month, todayParts.day);

  switch (filters.rangePreset) {
    case "today":
      return range("Today", todayStart, addDays(todayStart, 1));
    case "this-week": {
      const dayOfWeek = getIstDayOfWeek(todayStart);
      const weekStart = addDays(todayStart, -dayOfWeek);
      return range("This Week", weekStart, addDays(todayStart, 1));
    }
    case "last-week": {
      const dayOfWeek = getIstDayOfWeek(todayStart);
      const thisWeekStart = addDays(todayStart, -dayOfWeek);
      return range("Last Week", addDays(thisWeekStart, -7), thisWeekStart);
    }
    case "this-month":
      return range(
        "This Month",
        istDateToUtc(todayParts.year, todayParts.month, 1),
        addDays(todayStart, 1),
      );
    case "last-3-months":
      return range(
        "Last 3 Months",
        istDateToUtc(todayParts.year, todayParts.month - 2, 1),
        addDays(todayStart, 1),
      );
  }
}

export function applySearch<Row extends Record<string, AdminReportCell>>(
  rows: readonly Row[],
  search: string | undefined,
): readonly Row[] {
  const needle = search?.trim().toLowerCase();
  if (!needle) {
    return rows;
  }
  return rows.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle)),
  );
}

export function paginateRows<Row>(
  rows: readonly Row[],
  page: number,
  pageSize: number,
): readonly Row[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function sortRows<Row extends Record<string, AdminReportCell>>(
  rows: readonly Row[],
  sort: string | undefined,
): readonly Row[] {
  if (!sort) {
    return rows;
  }

  const [rawKey, rawDirection] = sort.split(":");
  if (!rawKey) {
    return rows;
  }

  const direction = rawDirection === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => compareCell(left[rawKey], right[rawKey]) * direction);
}

export function makeReportResponse<Row extends Record<string, AdminReportCell>>(input: {
  readonly reportId: import("./reports.types.js").AdminReportId;
  readonly title: string;
  readonly range: AdminReportResolvedRange;
  readonly summary: readonly import("./reports.types.js").AdminReportSummaryItem[];
  readonly columns: readonly AdminReportColumn[];
  readonly rows: readonly Row[];
  readonly filters: AdminReportFilters;
}): import("./reports.types.js").AdminReportResponse<Row> {
  const searched = applySearch(input.rows, input.filters.search);
  const sorted = sortRows(searched, input.filters.sort);
  return {
    reportId: input.reportId,
    title: input.title,
    resolvedRange: input.range,
    summary: input.summary,
    columns: input.columns,
    rows: paginateRows(sorted, input.filters.page, input.filters.pageSize),
    totalRows: sorted.length,
    page: input.filters.page,
    pageSize: input.filters.pageSize,
  };
}

export function qrStatusLabel(status: string): string {
  switch (status) {
    case "NOT_PRINTED":
      return "Not_Printed";
    case "PRINTED_UNCLAIMED":
      return "Printed";
    case "REPRINTED":
      return "Reprinted";
    case "SCANNED_CLAIMED":
      return "Claimed";
    case "CANCELLED":
      return "Cancelled";
    case "REVERSED":
      return "Reversed_AND_Cancelled";
    default:
      return status;
  }
}

export function rewardStatusLabel(status: string): string {
  switch (status) {
    case "CHOSEN":
      return "Claim Raised";
    case "FULFILLED":
      return "Delivered";
    case "CANCELLED_BY_CONTRACTOR":
    case "REVOKED_DUE_TO_RETURN":
      return "Claim Cancelled";
    default:
      return status;
  }
}

export function formatDateTime(value: Date | null | undefined): string {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export function formatDateOnly(value: Date | null | undefined): string {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export function inDateRange(value: Date | null | undefined, range: AdminReportResolvedRange): boolean {
  return Boolean(value && value >= range.from && value < range.to);
}

function readRangePreset(value: unknown): AdminReportRangePreset {
  if (typeof value === "string" && rangePresets.has(value as AdminReportRangePreset)) {
    return value as AdminReportRangePreset;
  }
  return "this-month";
}

function readOptionalString<K extends string>(key: K, value: unknown): Partial<Record<K, string>> {
  if (typeof value !== "string") {
    return {};
  }
  const trimmed = value.trim();
  return trimmed ? { [key]: trimmed } as Partial<Record<K, string>> : {};
}

function readOptionalDate(value: unknown, label: string): Date | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${label} date.`);
  }
  return date;
}

function readPositiveInteger(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function range(label: string, from: Date, to: Date): AdminReportResolvedRange {
  return {
    label,
    from,
    to,
    timezone: "Asia/Kolkata",
  };
}

function getIstDateParts(date: Date): { readonly year: number; readonly month: number; readonly day: number } {
  const shifted = new Date(date.getTime() + istOffsetMs);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function istDateToUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - istOffsetMs);
}

function getIstDayOfWeek(utcDate: Date): number {
  return new Date(utcDate.getTime() + istOffsetMs).getUTCDay();
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(date);
}

function compareCell(left: AdminReportCell | undefined, right: AdminReportCell | undefined): number {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  return String(left ?? "").localeCompare(String(right ?? ""), "en-IN", { numeric: true, sensitivity: "base" });
}
