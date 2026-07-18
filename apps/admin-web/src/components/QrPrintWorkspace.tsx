"use client";

import {
  CheckCircle2,
  CircleAlert,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  createAdminApiClient,
  type AdminInvoiceDetail,
  type AdminInvoiceSummary,
  type BusySyncStatus,
  type MockInvoiceSummary,
  type PrintedQrUnit,
} from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { getQrStatusBadgeClassName, getQrStatusDisplayLabel } from "../lib/qrStatusDisplay";
import { AdminPortalShell } from "./AdminPortalShell";

const defaultMockInvoices: readonly MockInvoiceSummary[] = [
  {
    externalInvoiceId: "busy-inv-2026-1001",
    invoiceNumber: "VR/26-27/1001",
    customerName: "Sharma Electrical Contractors",
    gstTotal: "5814.00",
    finalTotal: "38114.00",
    lineCount: 3,
  },
];

type QueueFilter = "ready" | "partial" | "imported-today" | "returns";
type QueueSort = "imported-desc" | "invoice-date-desc" | "invoice-number" | "customer" | "printable-desc";

interface UiLine {
  readonly invoiceLineId: string;
  readonly productName: string;
  readonly sku: string;
  readonly category: string;
  readonly unit: string;
  readonly available: number;
  readonly printed: number;
  readonly scanned: number;
  readonly cancelled: number;
  readonly reversed: number;
  readonly returned: number;
  readonly points: number;
  readonly lineTotal: string;
}

interface SelectionState {
  readonly checked: boolean;
  readonly quantity: number;
}

export function QrPrintWorkspace({
  initialInvoiceId,
  session,
}: {
  readonly initialInvoiceId?: string | undefined;
  readonly session: AdminSessionView;
}) {
  return (
    <AdminPortalShell activeSection="qr-print" session={session} subtitle="Admin Web" title="Print QR codes">
      <QrPrintContent initialInvoiceId={initialInvoiceId} />
    </AdminPortalShell>
  );
}

function QrPrintContent({ initialInvoiceId }: { readonly initialInvoiceId?: string | undefined }) {
  const [mockInvoices, setMockInvoices] = useState<readonly MockInvoiceSummary[]>(defaultMockInvoices);
  const [busySyncStatus, setBusySyncStatus] = useState<BusySyncStatus>({
    latestSyncAt: null,
    sourceInvoiceCount: defaultMockInvoices.length,
  });
  const [importedInvoices, setImportedInvoices] = useState<readonly AdminInvoiceSummary[]>([]);
  const [invoiceDetail, setInvoiceDetail] = useState<AdminInvoiceDetail | null>(null);
  const [lines, setLines] = useState<readonly UiLine[]>([]);
  const [selection, setSelection] = useState<Record<string, SelectionState>>({});
  const [printedUnits, setPrintedUnits] = useState<readonly PrintedQrUnit[]>([]);
  const [reprintedUnits, setReprintedUnits] = useState<Record<string, PrintedQrUnit>>({});
  const [queueSearch, setQueueSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("ready");
  const [queueSort, setQueueSort] = useState<QueueSort>("imported-desc");
  const [status, setStatus] = useState<{ readonly tone: "idle" | "success" | "error"; readonly message: string }>({
    tone: "idle",
    message: "Loading print queue",
  });
  const [loading, setLoading] = useState<"invoices" | "detail" | "sync" | "print" | null>(null);

  const api = useMemo(() => createAdminApiClient(), []);

  useEffect(() => {
    void loadInvoices(initialInvoiceId);
    // api is memoized once; loadInvoices intentionally lives in component scope for status updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, initialInvoiceId]);

  const printableInvoices = importedInvoices.filter(isPrintableSaleInvoice);
  const visibleQueue = useMemo(
    () => sortQueue(filterQueue(printableInvoices, queueSearch, queueFilter), queueSort),
    [printableInvoices, queueFilter, queueSearch, queueSort],
  );
  const selectedCount = Object.values(selection).reduce(
    (total, item) => total + (item.checked ? item.quantity : 0),
    0,
  );
  const selectedPoints = lines.reduce((total, line) => {
    const item = selection[line.invoiceLineId];
    return total + (item?.checked ? item.quantity * line.points : 0);
  }, 0);
  const printableUnitTotal = printableInvoices.reduce((total, invoice) => total + invoice.printableUnitCount, 0);
  const returnedUnitTotal = importedInvoices.reduce((total, invoice) => total + invoice.returnedUnitCount, 0);
  const latestSyncAt = busySyncStatus.latestSyncAt;
  const printSelections = useMemo(
    () =>
      lines.flatMap((line) => {
        const item = selection[line.invoiceLineId];
        return item?.checked && item.quantity > 0 ? [{ invoiceLineId: line.invoiceLineId, quantity: item.quantity }] : [];
      }),
    [lines, selection],
  );

  async function loadInvoices(selectInvoiceId?: string) {
    setLoading("invoices");
    setStatus({ tone: "idle", message: "Loading print queue" });
    try {
      const [mockResponse, importedResponse, syncStatus] = await Promise.all([
        api.listMockInvoices(),
        api.listImportedInvoices(),
        api.getBusySyncStatus(),
      ]);
      setMockInvoices(mockResponse);
      setImportedInvoices(importedResponse);
      setBusySyncStatus(syncStatus);

      if (selectInvoiceId) {
        const targetInvoice = importedResponse.find((invoice) => invoice.invoiceId === selectInvoiceId);
        if (!targetInvoice) {
          setInvoiceDetail(null);
          setLines([]);
          setSelection({});
          setStatus({ tone: "error", message: "Selected dashboard invoice is no longer in the QR print queue." });
          return;
        }

        const detail = await api.getInvoiceDetail(selectInvoiceId);
        applyInvoiceDetail(detail);
        setQueueFilter("ready");
        setQueueSearch(targetInvoice.invoiceNumber);
        setPrintedUnits([]);
        setReprintedUnits({});
        setStatus({ tone: "success", message: `${detail.invoiceNumber} opened from dashboard` });
        return;
      }

      setStatus({ tone: "success", message: "Print queue loaded" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function loadInvoiceDetail(invoiceId: string) {
    setLoading("detail");
    setPrintedUnits([]);
    setReprintedUnits({});
    setStatus({ tone: "idle", message: "Loading invoice detail" });
    try {
      const detail = await api.getInvoiceDetail(invoiceId);
      applyInvoiceDetail(detail);
      setStatus({ tone: "success", message: `${detail.invoiceNumber} ready for line selection` });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function syncFromBusy() {
    setLoading("sync");
    setStatus({ tone: "idle", message: "Syncing BUSY source into database" });
    try {
      const syncResult = await api.syncMockInvoices(new Date().toISOString());
      const [importedResponse, syncStatus] = await Promise.all([
        api.listImportedInvoices(),
        api.getBusySyncStatus(),
      ]);
      setImportedInvoices(importedResponse);
      setBusySyncStatus({
        latestSyncAt: syncStatus.latestSyncAt ?? syncResult.latestSyncAt,
        sourceInvoiceCount: syncStatus.sourceInvoiceCount,
      });
      if (invoiceDetail) {
        applyInvoiceDetail(await api.getInvoiceDetail(invoiceDetail.invoiceId));
      }
      setStatus({ tone: "success", message: `${syncResult.syncedInvoiceCount} BUSY invoices synced` });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function printQr() {
    if (!invoiceDetail || selectedCount <= 0 || printSelections.length === 0) {
      setStatus({ tone: "error", message: "Select at least one printable line before printing." });
      return;
    }

    setLoading("print");
    setStatus({ tone: "idle", message: "Printing QR units" });
    try {
      const result = await api.printQr(invoiceDetail.invoiceId, printSelections, new Date().toISOString());
      setPrintedUnits(result.printedUnits);
      setReprintedUnits({});
      const detail = await api.getInvoiceDetail(invoiceDetail.invoiceId);
      applyInvoiceDetail(detail);
      setImportedInvoices(await api.listImportedInvoices());
      setStatus({ tone: "success", message: `${result.printedUnits.length} units printed` });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function refreshQueue() {
    setLoading("invoices");
    setStatus({ tone: "idle", message: "Refreshing queue from database" });

    try {
      const [importedResponse, syncStatus] = await Promise.all([
        api.listImportedInvoices(),
        api.getBusySyncStatus(),
      ]);
      setImportedInvoices(importedResponse);
      setBusySyncStatus(syncStatus);
      if (invoiceDetail) {
        applyInvoiceDetail(await api.getInvoiceDetail(invoiceDetail.invoiceId));
      }
      setStatus({ tone: "success", message: "Queue refreshed from database" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function reprintQrUnit(qrUnitId: string) {
    setLoading("print");
    setStatus({ tone: "idle", message: "Reprinting QR unit" });

    try {
      const replacement = await api.reprintQr(qrUnitId, new Date().toISOString());
      setReprintedUnits((current) => ({ ...current, [qrUnitId]: replacement }));
      if (invoiceDetail) {
        applyInvoiceDetail(await api.getInvoiceDetail(invoiceDetail.invoiceId));
      }
      setStatus({ tone: "success", message: `Unit ${replacement.unitIndex} reprinted with a new token` });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  function applyInvoiceDetail(detail: AdminInvoiceDetail) {
    setInvoiceDetail(detail);

    const nextLines = detail.lines.map((line) => ({
      invoiceLineId: line.invoiceLineId,
      productName: line.productName,
      sku: line.sku,
      category: line.category ?? "Electrical",
      unit: line.unit,
      available: line.printableQuantity,
      printed: line.printedQuantity,
      scanned: line.scannedQuantity,
      cancelled: line.cancelledQuantity,
      reversed: line.reversedQuantity,
      returned: line.returnedQty,
      points: line.pointsPerUnit,
      lineTotal: line.lineTotal,
    }));
    setLines(nextLines);
    setSelection(
      Object.fromEntries(
        nextLines.map((line) => [
          line.invoiceLineId,
          { checked: line.available > 0, quantity: line.available },
        ]),
      ),
    );
  }

  return (
    <section className="content">
      <div className="summary-grid">
        <Metric label="Queue invoices" value={String(printableInvoices.length)} />
        <Metric label="Printable units" value={String(printableUnitTotal)} />
        <Metric label="Selected units" value={String(selectedCount)} />
        <Metric label="Selected points" value={String(selectedPoints)} />
        <Metric label="Returns linked" value={String(returnedUnitTotal)} />
        <Metric label="Latest BUSY sync" value={latestSyncAt ? formatDateTime(latestSyncAt) : "No sync yet"} />
      </div>

      <div className="workspace">
        <div className="stack">
          <section className="panel" aria-label="BUSY sync">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">BUSY sync</h2>
                <div className="panel-subtitle">Source ingestion status; invoice selection happens in the QR Print Queue</div>
              </div>
              <span className="badge">{latestSyncAt ? formatDateTime(latestSyncAt) : "Not synced"}</span>
            </div>
            <div className="detail-grid">
              <SyncFact label="Source" value="Mock BUSY API" />
              <SyncFact label="Source invoices" value={String(busySyncStatus.sourceInvoiceCount || mockInvoices.length)} />
              <SyncFact label="Persisted invoices" value={String(importedInvoices.length)} />
              <SyncFact label="Latest sync" value={latestSyncAt ? formatDateTime(latestSyncAt) : "No sync yet"} />
            </div>
            <div className="actions">
              <span className={status.tone === "error" ? "status error" : "status"}>{status.message}</span>
              <button
                className="button primary"
                type="button"
                onClick={() => void syncFromBusy()}
                disabled={loading !== null}
              >
                {loading === "sync" ? <Loader2 size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                Sync from BUSY
              </button>
            </div>
          </section>

          <section className="panel" aria-label="QR print queue">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">QR print queue</h2>
                <div className="panel-subtitle">Printable sale invoices only</div>
              </div>
              <div className="toolbar">
                <span className="badge good">{visibleQueue.length} visible</span>
                <button className="button compact" type="button" onClick={() => void refreshQueue()} disabled={loading !== null}>
                  {loading === "invoices" ? <Loader2 size={14} aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}
                  Refresh queue
                </button>
              </div>
            </div>
            <div className="control-bar">
              <input
                aria-label="Search print queue"
                className="text-input"
                placeholder="Search invoice, customer, GSTIN, product"
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
              />
              <select
                aria-label="Filter print queue"
                className="select-input"
                value={queueFilter}
                onChange={(event) => setQueueFilter(event.target.value as QueueFilter)}
              >
                <option value="ready">Ready to print</option>
                <option value="partial">Partially printed</option>
                <option value="imported-today">Imported today</option>
                <option value="returns">Has returns</option>
              </select>
              <select
                aria-label="Sort print queue"
                className="select-input"
                value={queueSort}
                onChange={(event) => setQueueSort(event.target.value as QueueSort)}
              >
                <option value="imported-desc">Latest import</option>
                <option value="invoice-date-desc">Invoice date</option>
                <option value="invoice-number">Invoice number</option>
                <option value="customer">Customer</option>
                <option value="printable-desc">Printable units</option>
              </select>
            </div>
            <div className="invoice-list">
              {visibleQueue.length === 0 ? (
                <div className="panel-empty compact">No printable sale invoices match the current view</div>
              ) : (
                visibleQueue.map((invoice) => (
                  <button
                    className={`invoice-row ${invoice.invoiceId === invoiceDetail?.invoiceId ? "selected" : ""}`}
                    key={invoice.invoiceId}
                    type="button"
                    onClick={() => void loadInvoiceDetail(invoice.invoiceId)}
                    disabled={loading !== null}
                  >
                    <div className="row-main">
                      <span className="row-title">{invoice.invoiceNumber}</span>
                      <span className="badge good">{invoice.printableUnitCount} printable</span>
                    </div>
                    <span className="row-meta">
                      {invoice.customerName} · {invoice.productSummary} · INR {invoice.finalTotal}
                    </span>
                    <span className="row-meta">
                      Imported {formatDateTime(invoice.importedAt)} · {invoice.printedUnitCount} printed ·{" "}
                      {invoice.returnedUnitCount} returned
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="panel" aria-label="QR print selection">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">{invoiceDetail?.invoiceNumber ?? "Invoice lines"}</h2>
              <div className="panel-subtitle">
                {invoiceDetail ? `${invoiceDetail.customerName} · ${invoiceDetail.productSummary}` : "Open a printable invoice"}
              </div>
            </div>
            {invoiceDetail ? (
              <Link className="button compact" href={`/invoices/${invoiceDetail.invoiceId}` as Route}>
                <FileText size={14} aria-hidden="true" />
                Detail
              </Link>
            ) : selectedCount > 0 ? (
              <span className="badge good">{selectedCount} selected</span>
            ) : (
              <span className="badge warn">
                <CircleAlert size={14} aria-hidden="true" />
                Empty
              </span>
            )}
          </div>

          <div className="line-table">
            {lines.length === 0 ? (
              <div className="panel-empty compact">No invoice selected</div>
            ) : (
              lines.map((line) => {
                const item = selection[line.invoiceLineId] ?? { checked: false, quantity: 0 };
                return (
                  <div className="line-row" key={line.invoiceLineId}>
                    <input
                      aria-label={`Select ${line.productName}`}
                      checked={item.checked}
                      className="checkbox"
                      disabled={line.available <= 0}
                      type="checkbox"
                      onChange={(event) =>
                        setSelection((current) => ({
                          ...current,
                          [line.invoiceLineId]: {
                            ...item,
                            checked: event.target.checked,
                          },
                        }))
                      }
                    />
                    <div className="line-name">
                      <strong>{line.productName}</strong>
                      <span>
                        {line.sku} · {line.category} · {line.unit} · INR {line.lineTotal}
                      </span>
                    </div>
                    <span className="badge">
                      {line.available} printable · {line.printed} printed labels · {line.returned} returned · {line.scanned} claimed
                    </span>
                    <input
                      aria-label={`Quantity for ${line.productName}`}
                      className="qty-input"
                      disabled={!item.checked || line.available <= 0}
                      max={line.available}
                      min={line.available > 0 ? 1 : 0}
                      type="number"
                      value={item.quantity}
                      onChange={(event) =>
                        setSelection((current) => ({
                          ...current,
                          [line.invoiceLineId]: {
                            ...item,
                            quantity: clamp(Number(event.target.value), line.available > 0 ? 1 : 0, line.available),
                          },
                        }))
                      }
                    />
                  </div>
                );
              })
            )}
          </div>

          <div className="actions">
            <span className={status.tone === "success" ? "status success" : status.tone === "error" ? "status error" : "status"}>
              {invoiceDetail ? `${selectedPoints} points in batch` : status.message}
            </span>
            <button
              className="button primary"
              type="button"
              onClick={() => void printQr()}
              disabled={!invoiceDetail || printSelections.length === 0 || selectedCount <= 0 || loading !== null}
            >
              {loading === "print" ? <Loader2 size={16} aria-hidden="true" /> : <Printer size={16} aria-hidden="true" />}
              Print
            </button>
          </div>
        </section>
      </div>

      <section className="panel" aria-label="Latest print batch">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Latest print batch</h2>
            <div className="panel-subtitle">Raw QR tokens are shown once after print</div>
          </div>
          <span className="badge">{printedUnits.length} units</span>
        </div>
        <div className="print-list">
          {printedUnits.length === 0 ? (
            <div className="status">No new batch printed in this session</div>
          ) : (
            printedUnits.map((unit) => (
              <div className="print-row" key={unit.qrUnitId}>
                <strong>Unit {unit.unitIndex}</strong>
                <span className="qr-label-copy">Collect {reprintedUnits[unit.qrUnitId]?.points ?? unit.points} points</span>
                <span className={getQrStatusBadgeClassName(reprintedUnits[unit.qrUnitId] ? "REPRINTED" : "PRINTED_UNCLAIMED")}>
                  {getQrStatusDisplayLabel(reprintedUnits[unit.qrUnitId] ? "REPRINTED" : "PRINTED_UNCLAIMED")}
                </span>
                <span className="token">{reprintedUnits[unit.qrUnitId]?.tokenValue ?? unit.tokenValue}</span>
                <button className="button compact" type="button" onClick={() => void reprintQrUnit(unit.qrUnitId)} disabled={loading !== null}>
                  {loading === "print" ? <Loader2 size={14} aria-hidden="true" /> : <RotateCcw size={14} aria-hidden="true" />}
                  Reprint
                </button>
              </div>
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

function SyncFact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function isPrintableSaleInvoice(invoice: AdminInvoiceSummary): boolean {
  return invoice.status !== "CANCELLED" && invoice.printableUnitCount > 0;
}

function filterQueue(
  invoices: readonly AdminInvoiceSummary[],
  search: string,
  filter: QueueFilter,
): readonly AdminInvoiceSummary[] {
  const normalizedSearch = search.trim().toLowerCase();
  const todayKey = new Date().toDateString();

  return invoices.filter((invoice) => {
    if (filter === "partial" && invoice.printedUnitCount <= 0) {
      return false;
    }
    if (filter === "imported-today" && new Date(invoice.importedAt).toDateString() !== todayKey) {
      return false;
    }
    if (filter === "returns" && invoice.returnVoucherCount <= 0) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }

    return [
      invoice.invoiceNumber,
      invoice.customerName,
      invoice.customerGstin ?? "",
      invoice.productSummary,
      invoice.categorySummary,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
}

function sortQueue(invoices: readonly AdminInvoiceSummary[], sort: QueueSort): readonly AdminInvoiceSummary[] {
  return [...invoices].sort((left, right) => {
    switch (sort) {
      case "customer":
        return left.customerName.localeCompare(right.customerName);
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

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.trunc(value)));
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
