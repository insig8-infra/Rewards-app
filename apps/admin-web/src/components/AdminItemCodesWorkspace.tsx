"use client";

import { AlertTriangle, CheckCircle2, Hash, Loader2, Percent, RefreshCw, Save, Search, Tags } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type AdminItemCode,
  type AdminItemCodeStatus,
  createAdminApiClient,
} from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { AdminPortalShell, useAdminActor } from "./AdminPortalShell";

type StatusState = {
  readonly tone: "idle" | "success" | "error";
  readonly message: string;
};

type RuleMode = "FIXED" | "PERCENT_OF_PRICE";

interface RuleDraft {
  readonly mode: RuleMode;
  readonly fixedPoints: string;
  readonly percentOfPricePoints: string;
}

const statusOptions: readonly { readonly value: AdminItemCodeStatus | "ALL"; readonly label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "IN_USE", label: "In Use" },
  { value: "NOT_IN_USE", label: "Not In Use" },
  { value: "NOT_IN_BUSY", label: "Not in BUSY" },
];

export function AdminItemCodesWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="item-codes" session={session} subtitle="BUSY item code reward rules" title="ItemCodes">
      <ItemCodesContent />
    </AdminPortalShell>
  );
}

function ItemCodesContent() {
  const api = useMemo(() => createAdminApiClient(), []);
  const { actorRole } = useAdminActor();
  const isOwner = actorRole === "OWNER";
  const [items, setItems] = useState<readonly AdminItemCode[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminItemCodeStatus | "ALL">("ALL");
  const [draft, setDraft] = useState<RuleDraft>({ mode: "FIXED", fixedPoints: "", percentOfPricePoints: "" });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Loading ItemCodes" });

  useEffect(() => {
    void loadItemCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, statusFilter]);

  const selectedItem = items.find((item) => item.itemCodeId === selectedId) ?? items[0] ?? null;
  const inUseCount = items.filter((item) => item.status === "IN_USE").length;
  const notInUseCount = items.filter((item) => item.status === "NOT_IN_USE").length;
  const missingBusyCount = items.filter((item) => item.status === "NOT_IN_BUSY").length;
  const percentRuleCount = items.filter((item) => item.rewardRuleType === "PERCENT_OF_PRICE").length;
  const draftError = getDraftError(draft);

  async function loadItemCodes(nextQuery = query): Promise<void> {
    setBusy(true);
    setStatus({ tone: "idle", message: "Refreshing ItemCodes" });
    try {
      const nextItems = await api.listItemCodes({
        ...(nextQuery.trim() ? { q: nextQuery.trim() } : {}),
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      });
      setItems(nextItems);
      const nextSelected = selectedId && nextItems.some((item) => item.itemCodeId === selectedId)
        ? selectedId
        : nextItems[0]?.itemCodeId ?? "";
      setSelectedId(nextSelected);
      const item = nextItems.find((candidate) => candidate.itemCodeId === nextSelected) ?? nextItems[0] ?? null;
      setDraft(ruleDraftFromItem(item));
      setStatus({ tone: "success", message: "ItemCodes refreshed" });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setBusy(false);
    }
  }

  async function refreshFromBusy(): Promise<void> {
    if (!isOwner) {
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: "Refreshing from BUSY adapter" });
    try {
      const result = await api.refreshItemCodes(new Date().toISOString());
      await loadItemCodes();
      setStatus({
        tone: result.attentionCount > 0 ? "idle" : "success",
        message: `${result.sourceCount} BUSY ItemCodes synced, ${result.attentionCount} needing attention`,
      });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setBusy(false);
    }
  }

  function selectItem(item: AdminItemCode): void {
    setSelectedId(item.itemCodeId);
    setDraft(ruleDraftFromItem(item));
    setStatus({ tone: "idle", message: `${item.tempItemCode} selected` });
  }

  async function saveRule(): Promise<void> {
    if (!selectedItem || !isOwner || draftError) {
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: "Saving ItemCode rule" });
    try {
      const updated = await api.updateItemCodeRewardRule(selectedItem.itemCodeId, {
        ...(draft.mode === "FIXED"
          ? { fixedPoints: Number(draft.fixedPoints), percentOfPricePoints: null }
          : { fixedPoints: null, percentOfPricePoints: Number(draft.percentOfPricePoints) }),
        now: new Date().toISOString(),
      });
      setItems((current) => current.map((item) => (item.itemCodeId === updated.itemCodeId ? updated : item)));
      setDraft(ruleDraftFromItem(updated));
      setStatus({ tone: "success", message: "ItemCode rule saved" });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="content item-codes-content">
      <div className="page-intro item-codes-page-intro">
        <div>
          <div className="eyebrow">BUSY master data</div>
          <h2>ItemCode reward rules</h2>
          <div className={`status ${status.tone === "error" ? "error" : status.tone === "success" ? "success" : ""}`}>
            {busy ? "Working" : status.message}
          </div>
        </div>
        <div className="page-intro-actions">
          <button className="button" type="button" onClick={() => void loadItemCodes()} disabled={busy}>
            {busy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
            Refresh
          </button>
          {isOwner ? (
            <button className="button primary" type="button" onClick={() => void refreshFromBusy()} disabled={busy}>
              <Tags size={16} aria-hidden="true" />
              Sync BUSY ItemCodes
            </button>
          ) : null}
        </div>
      </div>

      <div className="summary-grid item-code-summary-grid">
        <Metric label="Loaded" value={items.length} />
        <Metric label="In Use" value={inUseCount} />
        <Metric label="Not In Use" value={notInUseCount} tone={notInUseCount > 0 ? "warn" : "good"} />
        <Metric label="Not in BUSY" value={missingBusyCount} tone={missingBusyCount > 0 ? "danger" : "good"} />
        <Metric label="% Price Rules" value={percentRuleCount} />
      </div>

      <div className="item-codes-layout">
        <section className="panel item-code-table-panel" aria-label="ItemCodes list">
          <div className="panel-header item-code-filter-bar">
            <div>
              <h2 className="panel-title">BUSY ItemCodes</h2>
              <div className="panel-subtitle">{items.length} rows in the current filter</div>
            </div>
            <div className="item-code-filters">
              <label className="input-shell item-code-search">
                <Search size={16} aria-hidden="true" />
                <input
                  className="text-input"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void loadItemCodes(event.currentTarget.value);
                    }
                  }}
                  placeholder="Search item code or product"
                  type="search"
                  value={query}
                />
              </label>
              <select
                className="select-input item-code-status-filter"
                onChange={(event) => setStatusFilter(event.target.value as AdminItemCodeStatus | "ALL")}
                value={statusFilter}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button className="button compact" type="button" onClick={() => void loadItemCodes()} disabled={busy}>
                Search
              </button>
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table item-code-table">
              <thead>
                <tr>
                  <th>ItemCode</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Absolute Points</th>
                  <th>% of Price</th>
                  <th>% of Price Points</th>
                  <th>Final Points</th>
                  <th>Status</th>
                  <th>BUSY sync</th>
                  <th className="action-cell">Edit</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10}>No ItemCodes match the current filter.</td>
                  </tr>
                ) : items.map((item) => (
                  <tr className={item.itemCodeId === selectedItem?.itemCodeId ? "selected-table-row" : ""} key={item.itemCodeId}>
                    <td>
                      <div className="data-table-primary">
                        <strong>{item.tempItemCode}</strong>
                        <span>{item.productCategory ?? "Uncategorized"}</span>
                      </div>
                    </td>
                    <td>{item.itemName}</td>
                    <td className="number-cell">Rs {formatMoney(item.price)}</td>
                    <td className="number-cell">{formatOptionalPoints(item.fixedPoints)}</td>
                    <td className="number-cell">{item.percentOfPricePoints ? `${item.percentOfPricePoints}%` : "-"}</td>
                    <td className="number-cell">{formatOptionalPoints(item.percentOfPriceCalculatedPoints)}</td>
                    <td className="number-cell strong-cell">{formatOptionalPoints(item.finalPoints)}</td>
                    <td>
                      <StatusBadge item={item} />
                    </td>
                    <td>{item.lastBusySyncAt ? formatDateTime(item.lastBusySyncAt) : "Not synced"}</td>
                    <td className="action-cell">
                      <button className="button compact" type="button" onClick={() => selectItem(item)}>
                        {isOwner ? "Edit" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel item-code-editor-panel" aria-label="Selected ItemCode">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Reward rule</h2>
              <div className="panel-subtitle">{selectedItem?.tempItemCode ?? "No ItemCode selected"}</div>
            </div>
            {selectedItem ? <StatusBadge item={selectedItem} /> : null}
          </div>

          {selectedItem ? (
            <div className="item-code-editor">
              <div className="item-code-selected">
                <div>
                  <strong>{selectedItem.itemName}</strong>
                  <span>{selectedItem.productCategory ?? "Uncategorized"} · Rs {formatMoney(selectedItem.price)}</span>
                </div>
              </div>

              {!isOwner ? (
                <div className="notice warn">
                  <AlertTriangle size={18} aria-hidden="true" />
                  <div>
                    <strong>Read-only session</strong>
                    <span>OWNER permission is required to change ItemCode reward rules.</span>
                  </div>
                </div>
              ) : null}

              <div className="rule-mode-grid" role="group" aria-label="Reward rule type">
                <button
                  className={`rule-mode-button ${draft.mode === "FIXED" ? "active" : ""}`}
                  disabled={!isOwner || busy}
                  onClick={() => setDraft((current) => ({ ...current, mode: "FIXED", percentOfPricePoints: "" }))}
                  type="button"
                >
                  <Hash size={16} aria-hidden="true" />
                  Absolute
                </button>
                <button
                  className={`rule-mode-button ${draft.mode === "PERCENT_OF_PRICE" ? "active" : ""}`}
                  disabled={!isOwner || busy}
                  onClick={() => setDraft((current) => ({ ...current, mode: "PERCENT_OF_PRICE", fixedPoints: "" }))}
                  type="button"
                >
                  <Percent size={16} aria-hidden="true" />
                  % Price
                </button>
              </div>

              <div className="form-grid item-code-rule-grid">
                <label className="field">
                  <span className="field-label">Absolute Points</span>
                  <input
                    className="text-input"
                    disabled={!isOwner || draft.mode !== "FIXED" || busy}
                    inputMode="numeric"
                    min="1"
                    onChange={(event) => setDraft((current) => ({ ...current, fixedPoints: event.target.value }))}
                    type="number"
                    value={draft.fixedPoints}
                  />
                </label>
                <label className="field">
                  <span className="field-label">% of Price</span>
                  <input
                    className="text-input"
                    disabled={!isOwner || draft.mode !== "PERCENT_OF_PRICE" || busy}
                    inputMode="decimal"
                    min="0.01"
                    onChange={(event) => setDraft((current) => ({ ...current, percentOfPricePoints: event.target.value }))}
                    step="0.01"
                    type="number"
                    value={draft.percentOfPricePoints}
                  />
                </label>
              </div>

              <div className="item-code-rule-preview">
                <CheckCircle2 size={17} aria-hidden="true" />
                <span>{getPreviewText(selectedItem, draft)}</span>
              </div>

              <div className="actions item-code-editor-actions">
                <span className={`status ${draftError ? "error" : ""}`}>{draftError ?? selectedItem.ruleSummary}</span>
                <button className="button primary" type="button" disabled={!isOwner || busy || Boolean(draftError)} onClick={() => void saveRule()}>
                  <Save size={16} aria-hidden="true" />
                  Save rule
                </button>
              </div>
            </div>
          ) : (
            <div className="panel-empty">No ItemCode selected.</div>
          )}
        </section>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: number;
  readonly tone?: "good" | "warn" | "danger";
}) {
  return (
    <div className={`metric ${tone ?? ""}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function StatusBadge({ item }: { readonly item: AdminItemCode }) {
  const tone = item.status === "NOT_IN_BUSY" ? "danger" : item.status === "NOT_IN_USE" ? "warn" : "good";
  return <span className={`badge ${tone}`}>{item.statusLabel}</span>;
}

function ruleDraftFromItem(item: AdminItemCode | null): RuleDraft {
  if (!item) {
    return { mode: "FIXED", fixedPoints: "", percentOfPricePoints: "" };
  }
  if (item.rewardRuleType === "PERCENT_OF_PRICE") {
    return {
      mode: "PERCENT_OF_PRICE",
      fixedPoints: "",
      percentOfPricePoints: item.percentOfPricePoints ?? "",
    };
  }
  return {
    mode: "FIXED",
    fixedPoints: item.fixedPoints?.toString() ?? "",
    percentOfPricePoints: "",
  };
}

function getDraftError(draft: RuleDraft): string | null {
  if (draft.mode === "FIXED") {
    const points = Number(draft.fixedPoints);
    return Number.isInteger(points) && points > 0 ? null : "Absolute Points must be a positive whole number.";
  }
  const percent = Number(draft.percentOfPricePoints);
  return Number.isFinite(percent) && percent > 0 ? null : "% of Price must be a positive number.";
}

function getPreviewText(item: AdminItemCode, draft: RuleDraft): string {
  const error = getDraftError(draft);
  if (error) {
    return "Enter one reward rule to preview points.";
  }
  if (draft.mode === "FIXED") {
    return `Final Points: ${Number(draft.fixedPoints)} per printed unit`;
  }
  const price = Number(item.price);
  const percent = Number(draft.percentOfPricePoints);
  const points = Math.round(price * percent / 100);
  return `% of Price Points: ${points}; Final Points: ${points} per printed unit`;
}

function formatOptionalPoints(value: number | undefined): string {
  return value === undefined ? "-" : new Intl.NumberFormat("en-IN").format(value);
}

function formatMoney(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(amount);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to complete ItemCode task.";
}
