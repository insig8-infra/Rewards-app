"use client";

import { ArrowRight, Loader2, RefreshCw, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createAdminApiClient, type PrintHistoryEntry } from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { AdminPortalShell } from "./AdminPortalShell";

type HistoryFilter = "all" | "today" | "last7" | "high-volume";
type ActorFilter = "all" | "OWNER" | "STAFF";
type HistorySort = "printed-desc" | "invoice-number" | "units-desc" | "actor";

export function PrintHistoryWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="print-history" session={session} subtitle="Admin Web" title="Print History">
      <PrintHistoryContent />
    </AdminPortalShell>
  );
}

function PrintHistoryContent() {
  const [history, setHistory] = useState<readonly PrintHistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [actorFilter, setActorFilter] = useState<ActorFilter>("all");
  const [sort, setSort] = useState<HistorySort>("printed-desc");
  const [status, setStatus] = useState<{ readonly tone: "idle" | "success" | "error"; readonly message: string }>({
    tone: "idle",
    message: "Loading print history",
  });
  const [loading, setLoading] = useState(false);
  const api = useMemo(() => createAdminApiClient(), []);

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const visibleHistory = useMemo(
    () => sortHistory(filterHistory(history, search, filter, actorFilter), sort),
    [actorFilter, filter, history, search, sort],
  );
  const printedUnitTotal = history.reduce((total, entry) => total + entry.printedUnitCount, 0);
  const invoiceCount = new Set(history.map((entry) => entry.invoiceId)).size;
  const operatorCount = new Set(history.map((entry) => entry.actorName ?? entry.actorUserId ?? entry.actorRole)).size;

  async function loadHistory() {
    setLoading(true);
    setStatus({ tone: "idle", message: "Loading print history" });
    try {
      setHistory(await api.getPrintHistory());
      setStatus({ tone: "success", message: "Print history loaded" });
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
          <div className="eyebrow">QR print audit</div>
          <h2>Print run ledger</h2>
          <span className={status.tone === "error" ? "status error" : "status"}>{status.message}</span>
        </div>
        <button className="button" disabled={loading} type="button" onClick={() => void loadHistory()}>
          {loading ? <Loader2 size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          Refresh
        </button>
      </div>

      <div className="summary-grid">
        <Metric label="Runs" value={String(history.length)} />
        <Metric label="QR units" value={String(printedUnitTotal)} />
        <Metric label="Invoices" value={String(invoiceCount)} />
        <Metric label="Operators" value={String(operatorCount)} />
      </div>

      <section className="panel" aria-label="Print history list">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Print history</h2>
            <div className="panel-subtitle">Search by invoice, customer, product, or operator</div>
          </div>
          <span className="badge">{visibleHistory.length} visible</span>
        </div>
        <div className="control-bar">
          <div className="input-shell">
            <Search size={16} aria-hidden="true" />
            <input
              aria-label="Search print history"
              className="text-input"
              placeholder="Search invoice, customer, product, actor"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            aria-label="Filter print history date"
            className="select-input"
            value={filter}
            onChange={(event) => setFilter(event.target.value as HistoryFilter)}
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="last7">Last 7 days</option>
            <option value="high-volume">High-volume runs</option>
          </select>
          <select
            aria-label="Filter print history actor"
            className="select-input"
            value={actorFilter}
            onChange={(event) => setActorFilter(event.target.value as ActorFilter)}
          >
            <option value="all">All actors</option>
            <option value="OWNER">Owner</option>
            <option value="STAFF">Staff</option>
          </select>
          <select
            aria-label="Sort print history"
            className="select-input"
            value={sort}
            onChange={(event) => setSort(event.target.value as HistorySort)}
          >
            <option value="printed-desc">Latest printed</option>
            <option value="invoice-number">Invoice number</option>
            <option value="units-desc">Units printed</option>
            <option value="actor">Actor</option>
          </select>
        </div>
        <div className="ledger-list">
          {visibleHistory.length === 0 ? (
            <div className="panel-empty compact">No print runs match the current view</div>
          ) : (
            visibleHistory.map((entry) => (
              <Link className="ledger-row" href={`/invoices/${entry.invoiceId}` as Route} key={entry.auditEventId}>
                <div className="ledger-main">
                  <div>
                    <strong>{entry.invoiceNumber}</strong>
                    <span>
                      {entry.customerName} · {entry.productSummary}
                    </span>
                  </div>
                  <ArrowRight size={17} aria-hidden="true" />
                </div>
                <div className="ledger-facts">
                  <span>{formatDateTime(entry.printedAt)}</span>
                  <span>{entry.printedUnitCount} units</span>
                  <span>{entry.lineCount} lines</span>
                  <span>{entry.actorName ?? entry.actorRole}</span>
                </div>
                <div className="chip-list compact">
                  <span className="badge good">{entry.actorRole}</span>
                  <span className="badge">{entry.actorUserId ?? "session actor"}</span>
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

function filterHistory(
  history: readonly PrintHistoryEntry[],
  search: string,
  filter: HistoryFilter,
  actorFilter: ActorFilter,
): readonly PrintHistoryEntry[] {
  const normalizedSearch = search.trim().toLowerCase();
  const now = Date.now();
  const todayKey = new Date().toDateString();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  return history.filter((entry) => {
    const printedAt = new Date(entry.printedAt);
    if (filter === "today" && printedAt.toDateString() !== todayKey) {
      return false;
    }
    if (filter === "last7" && now - printedAt.getTime() > sevenDaysMs) {
      return false;
    }
    if (filter === "high-volume" && entry.printedUnitCount < 10) {
      return false;
    }
    if (actorFilter !== "all" && entry.actorRole !== actorFilter) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }
    return [
      entry.invoiceNumber,
      entry.customerName,
      entry.productSummary,
      entry.actorName ?? "",
      entry.actorRole,
      entry.actorUserId ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
}

function sortHistory(history: readonly PrintHistoryEntry[], sort: HistorySort): readonly PrintHistoryEntry[] {
  return [...history].sort((left, right) => {
    switch (sort) {
      case "actor":
        return (left.actorName ?? left.actorRole).localeCompare(right.actorName ?? right.actorRole);
      case "invoice-number":
        return left.invoiceNumber.localeCompare(right.invoiceNumber);
      case "units-desc":
        return right.printedUnitCount - left.printedUnitCount;
      case "printed-desc":
      default:
        return new Date(right.printedAt).getTime() - new Date(left.printedAt).getTime();
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
