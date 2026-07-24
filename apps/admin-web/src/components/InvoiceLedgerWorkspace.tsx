"use client";

import { ArrowRight, Loader2, RefreshCw, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createAdminApiClient, type AdminInvoiceSummary } from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { AdminPortalShell } from "./AdminPortalShell";

type LedgerFilter = "all" | "printable" | "fully-printed" | "returned" | "review" | "cancelled";
type LedgerRangePreset = "all" | "today" | "this-week" | "last-week" | "this-month" | "last-3-months" | "custom";
type LedgerSort = "imported-desc" | "invoice-date-desc" | "invoice-number" | "customer" | "final-total" | "printable-desc";

export function InvoiceLedgerWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="invoices" session={session} subtitle="Admin Web" title="Invoice Ledger">
      <InvoiceLedgerContent />
    </AdminPortalShell>
  );
}

function InvoiceLedgerContent() {
  const [invoices, setInvoices] = useState<readonly AdminInvoiceSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [rangePreset, setRangePreset] = useState<LedgerRangePreset>("all");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [sort, setSort] = useState<LedgerSort>("imported-desc");
  const [status, setStatus] = useState<{ readonly tone: "idle" | "success" | "error"; readonly message: string }>({
    tone: "idle",
    message: "Loading invoice ledger",
  });
  const [loading, setLoading] = useState(false);
  const api = useMemo(() => createAdminApiClient(), []);

  useEffect(() => {
    void loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const visibleInvoices = useMemo(
    () => sortInvoices(filterInvoices(invoices, search, filter, rangePreset, rangeFrom, rangeTo), sort),
    [filter, invoices, rangeFrom, rangePreset, rangeTo, search, sort],
  );
  const printableCount = invoices.filter((invoice) => invoice.printableUnitCount > 0).length;
  const fullyPrintedCount = invoices.filter((invoice) => invoice.qrUnitCount > 0 && invoice.printableUnitCount === 0).length;
  const returnedCount = invoices.filter((invoice) => invoice.returnVoucherCount > 0).length;
  const reviewCount = invoices.filter((invoice) => invoice.reviewNeededCount > 0).length;

  async function loadInvoices() {
    setLoading(true);
    setStatus({ tone: "idle", message: "Loading invoice ledger" });
    try {
      setInvoices(await api.listImportedInvoices());
      setStatus({ tone: "success", message: "Invoice ledger loaded" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Sales invoice record</div>
          <h2>All imported sale invoices</h2>
          <span className={status.tone === "error" ? "status error" : "status"}>{status.message}</span>
        </div>
        <button className="button" disabled={loading} type="button" onClick={() => void loadInvoices()}>
          {loading ? <Loader2 size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          Refresh
        </button>
      </div>

      <div className="summary-grid">
        <Metric label="Invoices" value={String(invoices.length)} />
        <Metric label="Printable" value={String(printableCount)} />
        <Metric label="Fully printed" value={String(fullyPrintedCount)} />
        <Metric label="Returned" value={String(returnedCount)} />
        <Metric label="Review needed" value={String(reviewCount)} />
      </div>

      <section className="panel" aria-label="Invoice ledger list">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Ledger</h2>
            <div className="panel-subtitle">Return vouchers are shown against their original sale invoice</div>
          </div>
          <span className="badge">{visibleInvoices.length} visible</span>
        </div>
        <div className="control-bar">
          <div className="input-shell">
            <Search size={16} aria-hidden="true" />
            <input
              aria-label="Search invoice ledger"
              className="text-input"
              placeholder="Search invoice, party, item, code"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            aria-label="Filter invoice ledger"
            className="select-input"
            value={filter}
            onChange={(event) => setFilter(event.target.value as LedgerFilter)}
          >
            <option value="all">All invoices</option>
            <option value="printable">Printable</option>
            <option value="fully-printed">Fully printed or blocked</option>
            <option value="returned">Has returns</option>
            <option value="review">Review needed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            aria-label="Invoice date range"
            className="select-input"
            value={rangePreset}
            onChange={(event) => setRangePreset(event.target.value as LedgerRangePreset)}
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="this-week">This week</option>
            <option value="last-week">Last week</option>
            <option value="this-month">This month</option>
            <option value="last-3-months">Last 3 months</option>
            <option value="custom">Custom</option>
          </select>
          <input
            aria-label="Invoice date from"
            className="text-input"
            disabled={rangePreset !== "custom"}
            type="date"
            value={rangeFrom}
            onChange={(event) => setRangeFrom(event.target.value)}
          />
          <input
            aria-label="Invoice date to"
            className="text-input"
            disabled={rangePreset !== "custom"}
            type="date"
            value={rangeTo}
            onChange={(event) => setRangeTo(event.target.value)}
          />
          <select
            aria-label="Sort invoice ledger"
            className="select-input"
            value={sort}
            onChange={(event) => setSort(event.target.value as LedgerSort)}
          >
            <option value="imported-desc">Latest import</option>
            <option value="invoice-date-desc">Invoice date</option>
            <option value="invoice-number">Invoice number</option>
            <option value="customer">Customer</option>
            <option value="final-total">Final total</option>
            <option value="printable-desc">Printable units</option>
          </select>
        </div>
        <div className="ledger-list">
          {visibleInvoices.length === 0 ? (
            <div className="panel-empty compact">No invoices match the current view</div>
          ) : (
            visibleInvoices.map((invoice) => (
              <Link className="ledger-row" href={`/invoices/${invoice.invoiceId}` as Route} key={invoice.invoiceId}>
                <div className="ledger-main">
                  <div>
                    <strong>{invoice.invoiceNumber}</strong>
                    <span>
                      {invoice.customerName} · {invoice.productSummary}
                    </span>
                  </div>
                  <ArrowRight size={17} aria-hidden="true" />
                </div>
                <div className="ledger-facts">
                  <span>Invoice {formatDateTime(invoice.invoiceDate)}</span>
                  <span>Imported {formatDateTime(invoice.importedAt)}</span>
                  <span>INR {invoice.finalTotal}</span>
                  <span>{invoice.lineCount} lines</span>
                </div>
                <div className="chip-list compact">
                  <span className="badge good">{invoice.printableUnitCount} printable</span>
                  <span className="badge">{invoice.printedUnitCount} printed</span>
                  <span className={invoice.returnedUnitCount > 0 ? "badge warn" : "badge"}>
                    {invoice.returnedUnitCount} returned
                  </span>
                  <span className={invoice.reviewNeededCount > 0 ? "badge warn" : "badge"}>
                    {invoice.reviewNeededCount} review
                  </span>
                  <span className="badge">{invoice.status}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function filterInvoices(
  invoices: readonly AdminInvoiceSummary[],
  search: string,
  filter: LedgerFilter,
  rangePreset: LedgerRangePreset,
  from: string,
  to: string,
): readonly AdminInvoiceSummary[] {
  const normalizedSearch = search.trim().toLowerCase();
  const range = resolveLedgerRange(rangePreset, from, to);
  return invoices.filter((invoice) => {
    if (filter === "printable" && invoice.printableUnitCount <= 0) {
      return false;
    }
    if (filter === "fully-printed" && !(invoice.qrUnitCount > 0 && invoice.printableUnitCount === 0)) {
      return false;
    }
    if (filter === "returned" && invoice.returnVoucherCount <= 0) {
      return false;
    }
    if (filter === "review" && invoice.reviewNeededCount <= 0) {
      return false;
    }
    if (filter === "cancelled" && invoice.status !== "CANCELLED") {
      return false;
    }
    const invoiceTime = new Date(invoice.invoiceDate).getTime();
    if (range.from && invoiceTime < range.from.getTime()) {
      return false;
    }
    if (range.to && invoiceTime > range.to.getTime()) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }
    return [
      invoice.invoiceNumber,
      invoice.externalInvoiceId,
      invoice.customerName,
      invoice.productSummary,
      invoice.categorySummary,
      invoice.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
}

function resolveLedgerRange(rangePreset: LedgerRangePreset, from: string, to: string): { readonly from?: Date; readonly to?: Date } {
  if (rangePreset === "all") {
    return {};
  }
  if (rangePreset === "custom") {
    return {
      ...(from ? { from: startOfDay(new Date(`${from}T00:00:00`)) } : {}),
      ...(to ? { to: endOfDay(new Date(`${to}T00:00:00`)) } : {}),
    };
  }

  const now = new Date();
  const today = startOfDay(now);
  if (rangePreset === "today") {
    return { from: today, to: endOfDay(today) };
  }
  if (rangePreset === "this-week") {
    return { from: startOfWeek(today), to: endOfDay(today) };
  }
  if (rangePreset === "last-week") {
    const thisWeek = startOfWeek(today);
    return { from: addDays(thisWeek, -7), to: endOfDay(addDays(thisWeek, -1)) };
  }
  if (rangePreset === "this-month") {
    return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: endOfDay(today) };
  }
  return { from: new Date(today.getFullYear(), today.getMonth() - 2, 1), to: endOfDay(today) };
}

function startOfWeek(date: Date): Date {
  const result = startOfDay(date);
  const day = result.getDay();
  const offset = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - offset);
  return result;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function sortInvoices(invoices: readonly AdminInvoiceSummary[], sort: LedgerSort): readonly AdminInvoiceSummary[] {
  return [...invoices].sort((left, right) => {
    switch (sort) {
      case "customer":
        return left.customerName.localeCompare(right.customerName);
      case "final-total":
        return Number(right.finalTotal) - Number(left.finalTotal);
      case "invoice-date-desc":
        return new Date(right.invoiceDate).getTime() - new Date(left.invoiceDate).getTime();
      case "invoice-number":
        return left.invoiceNumber.localeCompare(right.invoiceNumber);
      case "printable-desc":
        return right.printableUnitCount - left.printableUnitCount;
      case "imported-desc":
      default:
        return new Date(right.importedAt).getTime() - new Date(left.importedAt).getTime();
    }
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Request failed";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
