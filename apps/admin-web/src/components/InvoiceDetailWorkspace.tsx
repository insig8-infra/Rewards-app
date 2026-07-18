"use client";

import { ArrowLeft, Loader2, Printer, RefreshCw, RotateCcw } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createAdminApiClient, type AdminInvoiceDetail } from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { getQrStatusBadgeClassName, getQrStatusDisplayLabel, getQrStatusDisplays } from "../lib/qrStatusDisplay";
import { AdminPortalShell } from "./AdminPortalShell";

export function InvoiceDetailWorkspace({
  invoiceId,
  session,
}: {
  readonly invoiceId: string;
  readonly session: AdminSessionView;
}) {
  return (
    <AdminPortalShell activeSection="invoices" session={session} subtitle="Admin Web" title="Invoice Detail">
      <InvoiceDetailContent invoiceId={invoiceId} />
    </AdminPortalShell>
  );
}

function InvoiceDetailContent({ invoiceId }: { readonly invoiceId: string }) {
  const [invoice, setInvoice] = useState<AdminInvoiceDetail | null>(null);
  const [reprintedTokens, setReprintedTokens] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ readonly tone: "idle" | "success" | "error"; readonly message: string }>({
    tone: "idle",
    message: "Loading invoice detail",
  });
  const [loading, setLoading] = useState(false);
  const [reprintingQrUnitId, setReprintingQrUnitId] = useState<string | null>(null);
  const api = useMemo(() => createAdminApiClient(), []);
  const qrUnitsForReprint = useMemo(
    () =>
      invoice?.lines.flatMap((line) =>
        line.qrUnits
          .filter((unit) => unit.status !== "NOT_PRINTED")
          .map((unit) => ({
            ...unit,
            productName: line.productName,
            sku: line.sku,
          })),
      ) ?? [],
    [invoice],
  );

  useEffect(() => {
    void loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, invoiceId]);

  async function loadInvoice() {
    setLoading(true);
    setStatus({ tone: "idle", message: "Loading invoice detail" });
    try {
      const detail = await api.getInvoiceDetail(invoiceId);
      setInvoice(detail);
      setStatus({ tone: "success", message: `${detail.invoiceNumber} loaded` });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function reprintQrUnit(qrUnitId: string) {
    setReprintingQrUnitId(qrUnitId);
    setStatus({ tone: "idle", message: "Reprinting QR unit" });

    try {
      const replacement = await api.reprintQr(qrUnitId, new Date().toISOString());
      setReprintedTokens((current) => ({ ...current, [qrUnitId]: replacement.tokenValue }));
      setInvoice(await api.getInvoiceDetail(invoiceId));
      setStatus({ tone: "success", message: `Unit ${replacement.unitIndex} reprinted with a new token` });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setReprintingQrUnitId(null);
    }
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Invoice detail</div>
          <h2>{invoice?.invoiceNumber ?? "Invoice"}</h2>
          <span className={status.tone === "error" ? "status error" : "status"}>{status.message}</span>
        </div>
        <div className="toolbar">
          <Link className="button" href={"/invoices" as Route}>
            <ArrowLeft size={16} aria-hidden="true" />
            Ledger
          </Link>
          {invoice && invoice.printableUnitCount > 0 ? (
            <Link className="button primary" href={`/?invoiceId=${encodeURIComponent(invoice.invoiceId)}` as Route}>
              <Printer size={16} aria-hidden="true" />
              Print queue
            </Link>
          ) : null}
          <button className="button" disabled={loading} type="button" onClick={() => void loadInvoice()}>
            {loading ? <Loader2 size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
            Refresh
          </button>
        </div>
      </div>

      {!invoice ? (
        <section className="panel">
          <div className="panel-empty compact">Invoice detail is not available</div>
        </section>
      ) : (
        <>
          <div className="summary-grid">
            <Metric label="Printable" value={String(invoice.printableUnitCount)} />
            <Metric label="Printed" value={String(invoice.printedUnitCount)} />
            <Metric label="Claimed" value={String(invoice.scannedUnitCount)} />
            <Metric label="Returned" value={String(invoice.returnedUnitCount)} />
            <Metric label="Review" value={String(invoice.reviewNeededCount)} />
            <Metric label="Final total" value={`INR ${invoice.finalTotal}`} />
          </div>

          <section className="panel" aria-label="Invoice metadata">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">{invoice.customer.name}</h2>
                <div className="panel-subtitle">
                  {invoice.customer.gstin ? `GSTIN ${invoice.customer.gstin}` : "Customer GSTIN unavailable"}
                </div>
              </div>
              <span className="badge">{invoice.status}</span>
            </div>
            <div className="detail-grid invoice-detail-grid">
              <Fact label="Invoice date" value={formatDateTime(invoice.invoiceDate)} />
              <Fact label="Imported" value={formatDateTime(invoice.importedAt)} />
              <Fact label="Seller" value={invoice.seller.name} />
              <Fact label="Place of supply" value={invoice.placeOfSupply || "-"} />
              <Fact label="Payment mode" value={invoice.paymentMode ?? "-"} />
              <Fact label="Sales person" value={invoice.salesPerson ?? "-"} />
              <Fact label="GST total" value={`INR ${invoice.gstTotal}`} />
              <Fact label="Taxable" value={`INR ${invoice.taxableSubtotal}`} />
              <Fact label="CGST" value={`INR ${invoice.cgstTotal}`} />
              <Fact label="SGST" value={`INR ${invoice.sgstTotal}`} />
              <Fact label="Round off" value={`INR ${invoice.roundOff}`} />
              <Fact label="Amount words" value={invoice.amountInWords ?? "-"} />
            </div>
          </section>

          <section className="panel" aria-label="Invoice line facts">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Line items</h2>
                <div className="panel-subtitle">One row per BUSY invoice item with current QR status mix</div>
              </div>
              <span className="badge">{invoice.lines.length} lines</span>
            </div>
            <div className="data-table-wrap">
              <table className="data-table invoice-line-table">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Sold</th>
                    <th scope="col">Returned</th>
                    <th scope="col">Printable</th>
                    <th scope="col">QR status</th>
                    <th scope="col">Reward</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line) => (
                    <tr key={line.invoiceLineId}>
                      <td className="data-table-primary">
                        <strong>{line.productName}</strong>
                        <span>
                          {line.sku} · {line.category ?? "Electrical"} · {line.unit}
                        </span>
                        {line.hsnCode ? <span>HSN {line.hsnCode}</span> : null}
                      </td>
                      <td className="number-cell">{line.quantity}</td>
                      <td className={line.returnedQty > 0 ? "number-cell warn-cell" : "number-cell"}>{line.returnedQty}</td>
                      <td className="number-cell">{line.printableQuantity}</td>
                      <td>
                        <QrStatusMix statuses={line.qrUnits.map((unit) => unit.status)} />
                      </td>
                      <td className="number-cell">{line.pointsPerUnit} pts/unit</td>
                      <td className="amount-cell">
                        <strong>INR {line.lineTotal}</strong>
                        <span>Rate INR {line.unitRate}</span>
                        <span>GST {line.gstRatePercent}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" aria-label="QR unit reprint">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">QR unit reprint</h2>
                <div className="panel-subtitle">Only active unclaimed labels can be reprinted; claimed QR is blocked</div>
              </div>
              <span className="badge">{qrUnitsForReprint.length} QR units</span>
            </div>
            {qrUnitsForReprint.length === 0 ? (
              <div className="print-list">
                <div className="panel-empty compact">No printed QR units are available for this invoice</div>
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table qr-unit-table">
                  <thead>
                    <tr>
                      <th scope="col">Unit</th>
                      <th scope="col">Item</th>
                      <th scope="col">Status</th>
                      <th scope="col">Expiry</th>
                      <th scope="col">Replacement token</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qrUnitsForReprint.map((unit) => (
                      <tr key={unit.qrUnitId}>
                        <td className="number-cell">{unit.unitIndex}</td>
                        <td className="data-table-primary">
                          <strong>{unit.productName}</strong>
                          <span>{unit.sku}</span>
                        </td>
                        <td>
                          <span className={getQrStatusBadgeClassName(unit.status)}>{getQrStatusDisplayLabel(unit.status)}</span>
                        </td>
                        <td>{unit.expiresAt ? formatDateTime(unit.expiresAt) : "No expiry"}</td>
                        <td className="token token-cell">{reprintedTokens[unit.qrUnitId] ?? "New token appears after reprint"}</td>
                        <td className="action-cell">
                          <button
                            className="button compact"
                            type="button"
                            onClick={() => void reprintQrUnit(unit.qrUnitId)}
                            disabled={!isReprintEligibleQrStatus(unit.status) || reprintingQrUnitId !== null}
                          >
                            {reprintingQrUnitId === unit.qrUnitId ? (
                              <Loader2 size={14} aria-hidden="true" />
                            ) : (
                              <RotateCcw size={14} aria-hidden="true" />
                            )}
                            Reprint
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="dashboard-layout lower">
            <section className="panel" aria-label="Return history">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Return history</h2>
                  <div className="panel-subtitle">Linked BUSY Return of Sale vouchers</div>
                </div>
                <span className={invoice.reviewNeededCount > 0 ? "badge warn" : "badge"}>
                  {invoice.returnHistory.length} vouchers
                </span>
              </div>
              <div className="return-list">
                {invoice.returnHistory.length === 0 ? (
                  <div className="panel-empty compact">No linked return vouchers</div>
                ) : (
                  invoice.returnHistory.map((voucher) => (
                    <div className="return-row" key={voucher.returnVoucherId}>
                      <div>
                        <strong>{voucher.returnNumber}</strong>
                        <span>{formatDateTime(voucher.returnDate)}</span>
                      </div>
                      <span className="badge">{voucher.status}</span>
                      {voucher.lines.map((line) => (
                        <div className="return-line" key={line.returnLineId}>
                          <span>{line.productName}</span>
                          <span>
                            {line.quantity} returned · {line.allocationCount} allocated · {line.reviewNeededCount} review
                          </span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel" aria-label="Print runs">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Print runs</h2>
                  <div className="panel-subtitle">Audit history for this invoice</div>
                </div>
                <Link className="button compact" href={"/print-history" as Route}>
                  Open all
                </Link>
              </div>
              <div className="history-list">
                {invoice.printHistory.length === 0 ? (
                  <div className="panel-empty compact">No QR print runs yet</div>
                ) : (
                  invoice.printHistory.map((entry) => (
                    <div className="history-row" key={entry.auditEventId}>
                      <strong>{formatDateTime(entry.printedAt)}</strong>
                      <span>{entry.printedUnitCount} units</span>
                      <span>{entry.actorName ?? entry.actorRole}</span>
                      <span>{entry.lineCount} lines</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel" aria-label="Next action">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Next action</h2>
                  <div className="panel-subtitle">Admin Web does not cancel or reverse returned-product QR</div>
                </div>
              </div>
              <div className="detail-action-copy">
                {invoice.printableUnitCount > 0 ? (
                  <>
                    <strong>{invoice.printableUnitCount} units can still be printed.</strong>
                    <span>Open the QR Print Queue to print remaining non-returned units.</span>
                  </>
                ) : invoice.status === "CANCELLED" ? (
                  <>
                    <strong>Invoice is cancelled.</strong>
                    <span>No QR printing action is available from Admin Web.</span>
                  </>
                ) : (
                  <>
                    <strong>No printable units remain.</strong>
                    <span>Printing is complete or blocked by linked returns.</span>
                  </>
                )}
              </div>
            </section>
          </div>
        </>
      )}
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

function isReprintEligibleQrStatus(status: string): boolean {
  return status === "PRINTED_UNCLAIMED" || status === "REPRINTED";
}

function QrStatusMix({ statuses }: { readonly statuses: readonly string[] }) {
  const displays = getQrStatusDisplays(statuses);

  if (displays.length === 0) {
    return <span className="status">No QR units</span>;
  }

  return (
    <div className="status-chip-group">
      {displays.map((display) => (
        <span className={display.badgeClassName} key={display.status}>
          {display.label} {display.count}
        </span>
      ))}
    </div>
  );
}

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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
