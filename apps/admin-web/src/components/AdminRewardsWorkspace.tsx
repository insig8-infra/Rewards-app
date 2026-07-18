"use client";

import { ArrowLeft, CheckCircle2, ImagePlus, Loader2, LockKeyhole, RefreshCw, Search, Send, ShieldCheck, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type AdminRewardClaimHistoryEntry,
  type AdminRewardClaimLookup,
  type AdminRewardCatalogCsvPreview,
  type AdminRewardCatalogItem,
  type AdminRewardCatalogStatus,
  type AdminRewardOtpResult,
  createAdminApiClient,
} from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { AdminPortalShell, useAdminActor } from "./AdminPortalShell";
import { FilePickerButton } from "./FilePickerButton";

type ClaimFilter = "all" | "today" | "high-value";
type ClaimSort = "raised-desc" | "raised-asc" | "contractor" | "value-desc" | "claim-id";
type HistoryFilter = "all" | "raised" | "delivered" | "cancelled" | "revoked";
type HistoryRangePreset = "all" | "today" | "this-week" | "last-week" | "this-month" | "last-3-months" | "custom";
type HistorySort =
  | "claimed-desc"
  | "claimed-asc"
  | "fulfilled-desc"
  | "fulfilled-asc"
  | "contractor-asc"
  | "contractor-desc"
  | "phone-asc"
  | "phone-desc"
  | "reward-asc"
  | "reward-desc"
  | "points-desc"
  | "points-asc"
  | "status-asc"
  | "status-desc"
  | "claim-id-asc"
  | "claim-id-desc";
type HistorySortColumn = "claim-id" | "contractor" | "phone" | "reward" | "points" | "claimed" | "fulfilled" | "status";
type LoadingState = "claims" | "lookup" | "otp" | "fulfill" | null;
type RewardsWorkspaceMode = "landing" | "catalog";
type StatusState = {
  readonly tone: "idle" | "success" | "error";
  readonly message: string;
};

const maxRewardImageFileSizeBytes = 2 * 1024 * 1024;
const allowedRewardImageMimeTypes = new Set(["image/png", "image/jpeg"]);
const rewardImageAccept = ".png,.jpg,.jpeg,image/png,image/jpeg";

export function AdminRewardsWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="rewards" session={session} subtitle="Claim desk and reward history" title="Rewards">
      <RewardsContent />
    </AdminPortalShell>
  );
}

function RewardsContent() {
  const { actorRole } = useAdminActor();
  const api = useMemo(() => createAdminApiClient(), []);
  const isOwner = actorRole === "OWNER";
  const [mode, setMode] = useState<RewardsWorkspaceMode>("landing");
  const [claims, setClaims] = useState<readonly AdminRewardClaimLookup[]>([]);
  const [history, setHistory] = useState<readonly AdminRewardClaimHistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClaimFilter>("all");
  const [sort, setSort] = useState<ClaimSort>("raised-desc");
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [historyRangePreset, setHistoryRangePreset] = useState<HistoryRangePreset>("all");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historySort, setHistorySort] = useState<HistorySort>("claimed-desc");
  const [claimId, setClaimId] = useState("");
  const [lookup, setLookup] = useState<AdminRewardClaimLookup | null>(null);
  const [otpResult, setOtpResult] = useState<AdminRewardOtpResult | null>(null);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Loading rewards" });
  const [loading, setLoading] = useState<LoadingState>(null);

  useEffect(() => {
    void loadRewards({ preserveSelected: true, silent: false });
    const refreshId = window.setInterval(() => {
      void loadRewards({ preserveSelected: true, silent: true });
    }, 12_000);
    return () => window.clearInterval(refreshId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorRole, api]);

  const visibleClaims = useMemo(
    () => sortClaims(filterClaims(claims, search, filter), sort),
    [claims, filter, search, sort],
  );
  const visibleHistory = useMemo(
    () => sortHistory(filterHistory(history, historySearch, historyFilter, historyRangePreset, historyFrom, historyTo), historySort),
    [history, historyFilter, historyFrom, historyRangePreset, historySearch, historySort, historyTo],
  );
  const deliveredCount = history.filter((entry) => entry.claim.status === "FULFILLED").length;
  const cancelledOrRevokedCount = history.filter((entry) => entry.claim.status === "CANCELLED_BY_CONTRACTOR" || entry.claim.status === "REVOKED_DUE_TO_RETURN").length;

  async function fetchRewardState(input: { readonly preserveSelected: boolean; readonly autoSelectFirst?: boolean }): Promise<void> {
    const [nextClaims, nextHistory] = await Promise.all([
      isOwner ? api.listRewardClaims() : Promise.resolve([]),
      api.listRewardClaimHistory(),
    ]);
    const selectedClaim = input.preserveSelected && lookup
      ? nextClaims.find((claim) => claim.claim.claimId === lookup.claim.claimId) ?? null
      : input.autoSelectFirst === false
        ? null
        : nextClaims[0] ?? null;

    setClaims(nextClaims);
    setHistory(nextHistory);
    setLookup(isOwner ? selectedClaim : null);
    setOtpResult(null);
    setOtp("");
    if (isOwner && selectedClaim) {
      setClaimId(selectedClaim.claim.claimId);
    } else if (!input.preserveSelected || !lookup) {
      setClaimId("");
    }
  }

  async function loadRewards(input: { readonly preserveSelected: boolean; readonly silent: boolean }): Promise<void> {
    if (!input.silent) {
      setLoading("claims");
      setStatus({ tone: "idle", message: "Refreshing claim requests" });
    }
    try {
      await fetchRewardState({ preserveSelected: input.preserveSelected });
      if (!input.silent) {
        setStatus({ tone: "success", message: "Claim requests refreshed" });
      }
    } catch (taskError) {
      if (!input.silent) {
        setStatus({ tone: "error", message: getErrorMessage(taskError) });
      }
    } finally {
      if (!input.silent) {
        setLoading(null);
      }
    }
  }

  async function submitLookup(): Promise<void> {
    await run(async () => {
      const result = await api.lookupRewardClaim(claimId.trim());
      setLookup(result);
      setOtpResult(null);
      setOtp("");
      if (result.claim.status === "CHOSEN") {
        upsertClaim(result);
      }
    }, "Claim request loaded", "lookup");
  }

  async function submitSendOtp(): Promise<void> {
    if (!lookup) {
      return;
    }
    setLoading("otp");
    setStatus({ tone: "idle", message: "Checking claim request status" });
    try {
      const result = await api.sendRewardFulfillmentOtp(lookup.claim.claimId);
      setOtpResult(result);
      setOtp(result.delivery.mockOtp);
      setStatus({ tone: "success", message: "OTP sent to contractor mobile" });
    } catch (taskError) {
      setOtpResult(null);
      setOtp("");
      setLookup(null);
      setClaimId("");
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
      await fetchRewardState({ preserveSelected: false, autoSelectFirst: false }).catch(() => undefined);
    } finally {
      setLoading(null);
    }
  }

  async function submitFulfill(): Promise<void> {
    if (!lookup || !otpResult) {
      return;
    }
    setLoading("fulfill");
    setStatus({ tone: "idle", message: "Verifying claim request" });
    try {
      const result = await api.fulfillRewardClaim(lookup.claim.claimId, {
        challengeId: otpResult.challengeId,
        otp,
      });
      setLookup(result);
      setClaimId(result.claim.claimId);
      setOtpResult(null);
      setOtp("");
      setClaims((current) => current.filter((claim) => claim.claim.claimId !== result.claim.claimId));
      await refreshHistoryOnly();
      setStatus({ tone: "success", message: "Reward marked Delivered" });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
      await fetchRewardState({ preserveSelected: false, autoSelectFirst: false }).catch(() => undefined);
    } finally {
      setLoading(null);
    }
  }

  async function refreshHistoryOnly(): Promise<void> {
    setHistory(await api.listRewardClaimHistory());
  }

  async function run(task: () => Promise<void>, success: string, loadingState: LoadingState): Promise<void> {
    setLoading(loadingState);
    setStatus({ tone: "idle", message: "Working" });
    try {
      await task();
      setStatus({ tone: "success", message: success });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setLoading(null);
    }
  }

  function selectClaim(claim: AdminRewardClaimLookup): void {
    setLookup(claim);
    setClaimId(claim.claim.claimId);
    setOtpResult(null);
    setOtp("");
    setStatus({ tone: "success", message: `${claim.claim.claimId} loaded` });
  }

  function upsertClaim(nextClaim: AdminRewardClaimLookup): void {
    setClaims((current) => {
      const exists = current.some((claim) => claim.claim.claimId === nextClaim.claim.claimId);
      if (!exists) {
        return [nextClaim, ...current];
      }
      return current.map((claim) => (claim.claim.claimId === nextClaim.claim.claimId ? nextClaim : claim));
    });
  }

  const canSubmitLookup = isOwner && claimId.trim().length > 0 && loading === null;
  const canSendOtp = isOwner && Boolean(lookup?.canSendOtp) && loading === null;
  const canFulfill = isOwner && Boolean(lookup?.canFulfill && otpResult && otp.length === 6) && loading === null;

  if (isOwner && mode === "catalog") {
    return (
      <section className="content">
        <div className="page-intro catalog-page-intro">
          <div>
            <div className="eyebrow">Reward setup</div>
            <h2>Catalog Management</h2>
            <span className="status">Manage reward content, images, stock, and CSV import outside the daily claim desk.</span>
          </div>
          <button className="button" type="button" onClick={() => setMode("landing")}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Rewards
          </button>
        </div>
        <RewardCatalogManager />
      </section>
    );
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Reward claims</div>
          <h2>{isOwner ? "Fulfill Claim Raised requests and inspect reward history" : "Reward history across contractors"}</h2>
          <span className={status.tone === "error" ? "status error" : status.tone === "success" ? "status success" : "status"}>
            {status.message}
          </span>
        </div>
        <div className="page-intro-actions">
          <button
            className="button"
            type="button"
            disabled={loading !== null}
            onClick={() => void loadRewards({ preserveSelected: true, silent: false })}
          >
            {loading === "claims" ? <Loader2 size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
            Refresh Claim Requests
          </button>
          {isOwner ? (
            <button className="button primary" type="button" onClick={() => setMode("catalog")}>
              <ImagePlus size={16} aria-hidden="true" />
              Manage Reward Catalog
            </button>
          ) : null}
        </div>
      </div>

      <div className="summary-grid">
        <Metric label="Claim Raised" value={String(claims.length)} meta={isOwner ? `${visibleClaims.length} visible` : "OWNER fulfillment only"} />
        <Metric label="Delivered" value={String(deliveredCount)} meta="Fulfilled by OWNER" />
        <Metric label="History records" value={String(history.length)} meta={`${visibleHistory.length} visible`} />
        <Metric label="Cancelled / Revoked" value={String(cancelledOrRevokedCount)} meta="History only" />
      </div>

      {isOwner ? (
        <section className="workspace">
          <section className="panel" aria-label="Claim Desk">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Claim Desk</h2>
                <div className="panel-subtitle">Active Claim Raised requests only</div>
              </div>
              <span className="badge warn">{visibleClaims.length} Claim Raised</span>
            </div>

            <div className="control-bar rewards-control-bar">
              <label className="field input-shell">
                <span className="field-label">Search</span>
                <Search size={16} aria-hidden="true" />
                <input
                  className="text-input"
                  placeholder="Claim ID, contractor, mobile, reward"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Filter</span>
                <select className="select-input" value={filter} onChange={(event) => setFilter(event.target.value as ClaimFilter)}>
                  <option value="all">All Claim Raised</option>
                  <option value="today">Raised today</option>
                  <option value="high-value">High value</option>
                </select>
              </label>
              <label className="field">
                <span className="field-label">Sort</span>
                <select className="select-input" value={sort} onChange={(event) => setSort(event.target.value as ClaimSort)}>
                  <option value="raised-desc">Newest raised</option>
                  <option value="raised-asc">Oldest raised</option>
                  <option value="contractor">Contractor name</option>
                  <option value="value-desc">Highest points</option>
                  <option value="claim-id">Claim ID</option>
                </select>
              </label>
              <div className="field">
                <span className="field-label">Visible</span>
                <strong>{visibleClaims.length} records</strong>
              </div>
            </div>

            <div className="ledger-list">
              {visibleClaims.length === 0 ? (
                <div className="panel-empty compact">No active Claim Raised requests</div>
              ) : (
                visibleClaims.map((claim) => (
                  <button
                    className={`ledger-row reward-claim-row ${lookup?.claim.claimId === claim.claim.claimId ? "selected" : ""}`}
                    key={claim.claim.rewardClaimId}
                    onClick={() => selectClaim(claim)}
                    type="button"
                  >
                    <div className="ledger-main">
                      <div>
                        <strong>{claim.contractor.name}</strong>
                        <span>
                          {claim.contractor.mobileNumber} · {claim.claim.claimId}
                        </span>
                      </div>
                      <span className={claimStatusBadgeClassName(claim.claim.status)}>{formatClaimStatus(claim.claim.status)}</span>
                    </div>
                    <div className="ledger-facts">
                      <span>{claim.claim.rewardName}</span>
                      <span>{formatPoints(claim.claim.pointsDeducted)}</span>
                      <span>{formatDateTime(claim.claim.chosenAt)}</span>
                      <span>{claim.contractor.contractorCode}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="panel" aria-label="Reward fulfillment">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Claim verification</h2>
                <div className="panel-subtitle">Backend re-checks Claim Raised before OTP and Delivered</div>
              </div>
              <span className="badge good">
                <ShieldCheck size={14} aria-hidden="true" />
                OWNER only
              </span>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (canSubmitLookup) {
                  void submitLookup();
                }
              }}
            >
              <div className="form-grid rewards-lookup-grid">
                <label className="field">
                  <span className="field-label">Claim ID</span>
                  <input
                    className="text-input"
                    value={claimId}
                    placeholder="CLM-ACTIVE01"
                    onChange={(event) => setClaimId(event.target.value.toUpperCase())}
                  />
                </label>
              </div>
              <div className="actions">
                <button className="button primary" disabled={!canSubmitLookup} type="submit">
                  {loading === "lookup" ? <Loader2 size={16} aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
                  Lookup claim
                </button>
                <span className="status">Cancelled claims remain in history, not in Claim Desk</span>
              </div>
            </form>

            {lookup ? (
              <>
                <div className="detail-grid">
                  <Detail label="Claim ID" value={lookup.claim.claimId} />
                  <Detail label="Status" value={formatClaimStatus(lookup.claim.status)} />
                  <Detail label="Contractor" value={lookup.contractor.name} />
                  <Detail label="Phone number" value={lookup.contractor.mobileNumber} />
                  <Detail label="Reward" value={lookup.claim.rewardName} />
                  <Detail label="Points spent" value={formatPoints(lookup.claim.pointsDeducted)} />
                  <Detail label="Claimed date/time" value={formatDateTime(lookup.claim.chosenAt)} />
                  <Detail label="Fulfilled date/time" value={formatDateTime(lookup.claim.fulfilledAt)} />
                </div>

                {otpResult ? (
                  <div className="contractor-profile-strip">
                    <div className="avatar">OTP</div>
                    <div>
                      <strong>Local/dev OTP {otpResult.delivery.mockOtp}</strong>
                      <span>Expires {formatDateTime(otpResult.expiresAt)}. Production SMS provider is still outside this slice.</span>
                    </div>
                  </div>
                ) : null}

                <div className="form-grid">
                  <label className="field">
                    <span className="field-label">OTP</span>
                    <input
                      className="text-input"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </label>
                </div>

                <div className="actions">
                  <button className="button" disabled={!canSendOtp} type="button" onClick={() => void submitSendOtp()}>
                    {loading === "otp" ? <Loader2 size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                    Send OTP
                  </button>
                  <button
                    className="button primary"
                    disabled={!canFulfill}
                    type="button"
                    onClick={() => void submitFulfill()}
                  >
                    {loading === "fulfill" ? <Loader2 size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                    Mark Delivered
                  </button>
                  <span className="status">{fulfillmentHint(lookup)}</span>
                </div>
              </>
            ) : (
              <div className="panel-empty">Select a Claim Raised request or lookup a Claim ID.</div>
            )}
          </section>
        </section>
      ) : (
        <section className="panel" aria-label="STAFF reward access">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">History only</h2>
              <div className="panel-subtitle">STAFF can inspect reward developments but cannot fulfill claims</div>
            </div>
            <span className="badge warn">
              <LockKeyhole size={14} aria-hidden="true" />
              Fulfillment blocked
            </span>
          </div>
        </section>
      )}

      <RewardHistoryPanel
        history={visibleHistory}
        historyFilter={historyFilter}
        historyFrom={historyFrom}
        historyRangePreset={historyRangePreset}
        historySearch={historySearch}
        historySort={historySort}
        historyTo={historyTo}
        setHistoryFilter={setHistoryFilter}
        setHistoryFrom={setHistoryFrom}
        setHistoryRangePreset={setHistoryRangePreset}
        setHistorySearch={setHistorySearch}
        setHistorySort={setHistorySort}
        setHistoryTo={setHistoryTo}
      />
    </section>
  );
}

interface RewardCatalogDraft {
  readonly rewardId?: string;
  readonly code: string;
  readonly name: string;
  readonly quickDescription: string;
  readonly cashValueInr: string;
  readonly pointsRequired: string;
  readonly totalQuantity: string;
  readonly status: AdminRewardCatalogStatus;
}

const emptyCatalogDraft: RewardCatalogDraft = {
  code: "",
  name: "",
  quickDescription: "",
  cashValueInr: "",
  pointsRequired: "",
  totalQuantity: "",
  status: "DRAFT",
};

function RewardCatalogManager() {
  const api = useMemo(() => createAdminApiClient(), []);
  const [items, setItems] = useState<readonly AdminRewardCatalogItem[]>([]);
  const [draft, setDraft] = useState<RewardCatalogDraft>(emptyCatalogDraft);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminRewardCatalogStatus | "sold-out" | "needs-image">("all");
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<AdminRewardCatalogCsvPreview | null>(null);
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Loading reward catalog" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter === "sold-out" && item.availableQuantity > 0) {
        return false;
      }
      if (statusFilter === "needs-image" && item.images.length > 0) {
        return false;
      }
      if (statusFilter !== "all" && statusFilter !== "sold-out" && statusFilter !== "needs-image" && item.status !== statusFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [item.code, item.name, item.quickDescription, item.status].join(" ").toLowerCase().includes(normalized);
    });
  }, [items, search, statusFilter]);

  async function loadCatalog(): Promise<void> {
    setBusy(true);
    try {
      const nextItems = await api.listRewardCatalog();
      setItems(nextItems);
      setStatus({ tone: "success", message: `${nextItems.length} rewards loaded` });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  function editItem(item: AdminRewardCatalogItem): void {
    setDraft({
      rewardId: item.rewardId,
      code: item.code,
      name: item.name,
      quickDescription: item.quickDescription,
      cashValueInr: String(item.cashValueInr),
      pointsRequired: String(item.pointsRequired),
      totalQuantity: String(item.totalQuantity),
      status: item.status,
    });
    setStatus({ tone: "idle", message: `${item.code} loaded for editing` });
  }

  async function saveDraft(): Promise<void> {
    setBusy(true);
    setStatus({ tone: "idle", message: "Saving reward" });
    try {
      const payload = {
        name: draft.name,
        quickDescription: draft.quickDescription,
        cashValueInr: Number(draft.cashValueInr),
        pointsRequired: Number(draft.pointsRequired),
        totalQuantity: Number(draft.totalQuantity),
        status: draft.status,
      };
      const catalogPayload = draft.rewardId || draft.code.trim()
        ? { ...payload, code: draft.code }
        : payload;
      const saved = draft.rewardId
        ? await api.updateRewardCatalogItem(draft.rewardId, catalogPayload)
        : await api.createRewardCatalogItem(catalogPayload);
      setItems((current) => upsertCatalogItem(current, saved));
      setDraft({
        rewardId: saved.rewardId,
        code: saved.code,
        name: saved.name,
        quickDescription: saved.quickDescription,
        cashValueInr: String(saved.cashValueInr),
        pointsRequired: String(saved.pointsRequired),
        totalQuantity: String(saved.totalQuantity),
        status: saved.status,
      });
      setStatus({ tone: "success", message: "Reward saved" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file: File | undefined): Promise<void> {
    if (!file || !draft.rewardId) {
      setStatus({ tone: "error", message: "Save the reward before uploading images." });
      return;
    }
    const validation = validateRewardImageFile(file);
    if (!validation.ok) {
      setStatus({ tone: "error", message: validation.message });
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: "Uploading reward image" });
    try {
      const dataUrl = normalizeRewardImageDataUrl(await fileToDataUrl(file), validation.contentType);
      const updated = await api.addRewardCatalogImage(draft.rewardId, {
        fileName: file.name,
        contentType: validation.contentType,
        dataUrl,
        altText: draft.name,
      });
      setItems((current) => upsertCatalogItem(current, updated));
      setStatus({ tone: "success", message: "Reward image uploaded" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(item: AdminRewardCatalogItem): Promise<void> {
    setBusy(true);
    try {
      const updated = item.status === "ACTIVE"
        ? await api.deactivateRewardCatalogItem(item.rewardId)
        : await api.reactivateRewardCatalogItem(item.rewardId);
      setItems((current) => upsertCatalogItem(current, updated));
      setStatus({ tone: "success", message: updated.status === "ACTIVE" ? "Reward activated" : "Reward deactivated" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function previewCsv(): Promise<void> {
    setBusy(true);
    setStatus({ tone: "idle", message: "Checking CSV" });
    try {
      const preview = await api.previewRewardCatalogCsv(csvText);
      setCsvPreview(preview);
      setStatus({ tone: preview.errorCount > 0 ? "error" : "success", message: `${preview.validRowCount} valid CSV rows` });
    } catch (error) {
      setCsvPreview(null);
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function commitCsv(): Promise<void> {
    setBusy(true);
    setStatus({ tone: "idle", message: "Importing CSV rewards" });
    try {
      const result = await api.commitRewardCatalogCsv(csvText);
      setItems((current) => result.items.reduce((next, item) => upsertCatalogItem(next, item), current));
      setCsvPreview(null);
      setStatus({ tone: "success", message: `${result.created} created, ${result.updated} updated` });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  const selected = draft.rewardId ? items.find((item) => item.rewardId === draft.rewardId) : undefined;

  return (
    <section className="panel" aria-label="Reward catalog management">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Reward Catalog Management</h2>
          <div className="panel-subtitle">OWNER-managed reward list, stock, images, and CSV import</div>
        </div>
        <button className="button compact" disabled={busy} type="button" onClick={() => void loadCatalog()}>
          {busy ? <Loader2 size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          Refresh catalog
        </button>
      </div>
      <span className={status.tone === "error" ? "status error" : status.tone === "success" ? "status success" : "status"}>
        {status.message}
      </span>

      <div className="control-bar rewards-control-bar">
        <label className="field input-shell">
          <span className="field-label">Search</span>
          <Search size={16} aria-hidden="true" />
          <input
            className="text-input"
            placeholder="Reward code, name, description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Filter</span>
          <select className="select-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">All rewards</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
            <option value="sold-out">Sold out</option>
            <option value="needs-image">Needs image</option>
          </select>
        </label>
        <button className="button" type="button" onClick={() => setDraft(emptyCatalogDraft)}>
          New reward
        </button>
      </div>

      <div className="reward-catalog-grid">
        <div className="ledger-list">
          {visibleItems.map((item) => (
            <button
              className={`ledger-row reward-claim-row ${draft.rewardId === item.rewardId ? "selected" : ""}`}
              key={item.rewardId}
              onClick={() => editItem(item)}
              type="button"
            >
              <div className="ledger-main">
                <div className="catalog-row-title">
                  {item.imageUrl ? <img alt="" className="reward-thumb" src={item.imageUrl} /> : <span className="reward-thumb placeholder"><ImagePlus size={18} aria-hidden="true" /></span>}
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.code} · {formatPoints(item.pointsRequired)} to contractor</span>
                  </div>
                </div>
                <span className={item.status === "ACTIVE" ? "badge good" : item.status === "DRAFT" ? "badge warn" : "badge"}>
                  {item.status}
                </span>
              </div>
              <div className="ledger-facts">
                <span>Stock {item.availableQuantity}/{item.totalQuantity}</span>
                <span>Reserved {item.reservedQuantity}</span>
                <span>Delivered {item.deliveredQuantity}</span>
                <span>{item.images.length} images</span>
              </div>
            </button>
          ))}
          {visibleItems.length === 0 ? <div className="panel-empty compact">No rewards match current controls</div> : null}
        </div>

        <div className="catalog-editor">
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Reward code</span>
              <input
                className="text-input"
                placeholder="System generated on save"
                readOnly
                value={draft.code}
              />
              <span className="panel-subtitle">CSV import still uses explicit rewardCode for bulk updates.</span>
            </label>
            <label className="field">
              <span className="field-label">Reward name</span>
              <input className="text-input" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="field wide-field">
              <span className="field-label">Quick description</span>
              <input className="text-input" value={draft.quickDescription} onChange={(event) => setDraft((current) => ({ ...current, quickDescription: event.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Internal value INR</span>
              <input className="text-input" inputMode="numeric" value={draft.cashValueInr} onChange={(event) => setDraft((current) => ({ ...current, cashValueInr: event.target.value.replace(/\D/g, "") }))} />
            </label>
            <label className="field">
              <span className="field-label">Points/Rs required</span>
              <input className="text-input" inputMode="numeric" value={draft.pointsRequired} onChange={(event) => setDraft((current) => ({ ...current, pointsRequired: event.target.value.replace(/\D/g, "") }))} />
            </label>
            <label className="field">
              <span className="field-label">Quantity</span>
              <input className="text-input" inputMode="numeric" value={draft.totalQuantity} onChange={(event) => setDraft((current) => ({ ...current, totalQuantity: event.target.value.replace(/\D/g, "") }))} />
            </label>
            <label className="field">
              <span className="field-label">Status</span>
              <select className="select-input" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as AdminRewardCatalogStatus }))}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button className="button primary" disabled={busy} type="button" onClick={() => void saveDraft()}>
              Save reward
            </button>
            {selected ? (
              <button className="button" disabled={busy} type="button" onClick={() => void toggleActive(selected)}>
                {selected.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
            ) : null}
          </div>

          {selected ? (
            <>
              <div className="detail-grid">
                <Detail label="Available stock" value={`${selected.availableQuantity} of ${selected.totalQuantity}`} />
                <Detail label="Reserved" value={String(selected.reservedQuantity)} />
                <Detail label="Delivered" value={String(selected.deliveredQuantity)} />
                <Detail label="Images" value={String(selected.images.length)} />
              </div>
              {selected.readinessIssues.length > 0 ? (
                <div className="status error">{selected.readinessIssues.join(" ")}</div>
              ) : null}
              <div className="field">
                <span className="field-label">Upload reward image</span>
                <span className="panel-subtitle">PNG, JPG, or JPEG under 2 MB.</span>
                <FilePickerButton
                  accept={rewardImageAccept}
                  ariaLabel="Browse reward image"
                  disabled={busy}
                  icon={<ImagePlus size={16} aria-hidden="true" />}
                  label="Browse reward image"
                  onFile={(file) => void uploadImage(file)}
                />
              </div>
              <div className="reward-image-strip">
                {selected.images.map((image) => (
                  <img alt={image.altText ?? selected.name} className="reward-image-preview" key={image.imageId} src={image.imageUrl} />
                ))}
              </div>
            </>
          ) : (
            <div className="panel-empty compact">Save a reward before uploading images.</div>
          )}
        </div>
      </div>

      <div className="csv-panel">
        <div className="panel-header compact-header">
          <div>
            <h3 className="panel-title">CSV Upload</h3>
            <div className="panel-subtitle">Columns: rewardCode, rewardName, quickDescription, rewardValueInr, pointsRequired, quantity, status</div>
          </div>
          <Upload size={18} aria-hidden="true" />
        </div>
        <textarea
          className="text-input csv-textarea"
          placeholder={"rewardCode,rewardName,quickDescription,rewardValueInr,pointsRequired,quantity,status\nRW-TEST-01,Tool Bag,Canvas electrician tool bag,1200,900,10,ACTIVE"}
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
        />
        <div className="actions">
          <button className="button" disabled={busy || csvText.trim().length === 0} type="button" onClick={() => void previewCsv()}>
            Preview CSV
          </button>
          <button className="button primary" disabled={busy || !csvPreview || csvPreview.errorCount > 0} type="button" onClick={() => void commitCsv()}>
            Commit CSV
          </button>
        </div>
        {csvPreview ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Row</th>
                  <th scope="col">Code</th>
                  <th scope="col">Reward</th>
                  <th scope="col">Operation</th>
                  <th scope="col">Status</th>
                  <th scope="col">Validation</th>
                </tr>
              </thead>
              <tbody>
                {csvPreview.rows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.code}`}>
                    <td>{row.rowNumber}</td>
                    <td className="token-cell">{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.operation}</td>
                    <td>{row.requestedStatus}</td>
                    <td>{row.errors.length > 0 ? row.errors.join(" ") : row.warnings.join(" ") || "Ready"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function RewardHistoryPanel(props: {
  readonly history: readonly AdminRewardClaimHistoryEntry[];
  readonly historySearch: string;
  readonly historyFilter: HistoryFilter;
  readonly historyRangePreset: HistoryRangePreset;
  readonly historyFrom: string;
  readonly historyTo: string;
  readonly historySort: HistorySort;
  readonly setHistorySearch: (value: string) => void;
  readonly setHistoryFilter: (value: HistoryFilter) => void;
  readonly setHistoryRangePreset: (value: HistoryRangePreset) => void;
  readonly setHistoryFrom: (value: string) => void;
  readonly setHistoryTo: (value: string) => void;
  readonly setHistorySort: (value: HistorySort) => void;
}) {
  function sortBy(column: HistorySortColumn): void {
    props.setHistorySort(nextHistorySort(props.historySort, column));
  }

  return (
    <section className="panel" aria-label="Reward history">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Reward History</h2>
          <div className="panel-subtitle">Full claim developments across contractors</div>
        </div>
        <span className="badge">{props.history.length} visible</span>
      </div>
      <div className="control-bar rewards-control-bar">
        <label className="field input-shell">
          <span className="field-label">Search</span>
          <Search size={16} aria-hidden="true" />
          <input
            className="text-input"
            placeholder="Contractor, phone, claim, reward"
            value={props.historySearch}
            onChange={(event) => props.setHistorySearch(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Filter</span>
          <select className="select-input" value={props.historyFilter} onChange={(event) => props.setHistoryFilter(event.target.value as HistoryFilter)}>
            <option value="all">All developments</option>
            <option value="raised">Claim Raised</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="revoked">Revoked</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Sort</span>
          <select className="select-input" value={props.historySort} onChange={(event) => props.setHistorySort(event.target.value as HistorySort)}>
            <option value="claimed-desc">Newest claimed</option>
            <option value="claimed-asc">Oldest claimed</option>
            <option value="fulfilled-desc">Newest fulfilled</option>
            <option value="contractor-asc">Contractor A-Z</option>
            <option value="status-asc">Development A-Z</option>
            <option value="points-desc">Highest points</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Claimed date</span>
          <select className="select-input" value={props.historyRangePreset} onChange={(event) => props.setHistoryRangePreset(event.target.value as HistoryRangePreset)}>
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="this-week">This week</option>
            <option value="last-week">Last week</option>
            <option value="this-month">This month</option>
            <option value="last-3-months">Last 3 months</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">From</span>
          <input className="text-input" disabled={props.historyRangePreset !== "custom"} type="date" value={props.historyFrom} onChange={(event) => props.setHistoryFrom(event.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">To</span>
          <input className="text-input" disabled={props.historyRangePreset !== "custom"} type="date" value={props.historyTo} onChange={(event) => props.setHistoryTo(event.target.value)} />
        </label>
        <div className="field">
          <span className="field-label">Visible</span>
          <strong>{props.history.length} records</strong>
        </div>
      </div>
      {props.history.length === 0 ? (
        <div className="panel-empty compact">No reward history matches the current controls</div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table reward-history-table">
            <thead>
              <tr>
                <th scope="col"><TableSortButton column="claim-id" label="Claim ID" onSort={sortBy} sort={props.historySort} /></th>
                <th scope="col"><TableSortButton column="contractor" label="Contractor" onSort={sortBy} sort={props.historySort} /></th>
                <th scope="col"><TableSortButton column="phone" label="Phone" onSort={sortBy} sort={props.historySort} /></th>
                <th scope="col"><TableSortButton column="reward" label="Reward" onSort={sortBy} sort={props.historySort} /></th>
                <th scope="col"><TableSortButton column="points" label="Points Spent" onSort={sortBy} sort={props.historySort} /></th>
                <th scope="col"><TableSortButton column="claimed" label="Claimed Date/Time" onSort={sortBy} sort={props.historySort} /></th>
                <th scope="col"><TableSortButton column="fulfilled" label="Fulfilled Date/Time" onSort={sortBy} sort={props.historySort} /></th>
                <th scope="col"><TableSortButton column="status" label="Development" onSort={sortBy} sort={props.historySort} /></th>
              </tr>
            </thead>
            <tbody>
              {props.history.map((entry) => (
                <tr key={entry.claim.rewardClaimId}>
                  <td className="token-cell">{entry.claim.claimId}</td>
                  <td className="data-table-primary">
                    <strong>{entry.contractor.name}</strong>
                    <span>{entry.contractor.contractorCode}</span>
                  </td>
                  <td>{entry.contractor.mobileNumber}</td>
                  <td>{entry.claim.rewardName}</td>
                  <td>{formatPoints(entry.claim.pointsDeducted)}</td>
                  <td>{formatDateTime(entry.claim.chosenAt)}</td>
                  <td>{formatDateTime(entry.claim.fulfilledAt)}</td>
                  <td>
                    <span className={claimStatusBadgeClassName(entry.claim.status)}>{formatClaimStatus(entry.claim.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, meta }: { readonly label: string; readonly value: string; readonly meta?: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {meta ? <div className="metric-meta">{meta}</div> : null}
    </div>
  );
}

function Detail({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="row-title">{value}</div>
    </div>
  );
}

function TableSortButton({
  column,
  label,
  onSort,
  sort,
}: {
  readonly column: HistorySortColumn;
  readonly label: string;
  readonly onSort: (column: HistorySortColumn) => void;
  readonly sort: HistorySort;
}) {
  const active = sort.startsWith(`${column === "claimed" ? "claimed" : column === "points" ? "points" : column}-`);
  return (
    <button className={`table-sort-button ${active ? "active" : ""}`} type="button" onClick={() => onSort(column)}>
      {label}
    </button>
  );
}

function filterClaims(
  claims: readonly AdminRewardClaimLookup[],
  search: string,
  filter: ClaimFilter,
): readonly AdminRewardClaimLookup[] {
  const normalizedSearch = search.trim().toLowerCase();
  const todayKey = new Date().toDateString();

  return claims.filter((claim) => {
    if (filter === "today" && new Date(claim.claim.chosenAt).toDateString() !== todayKey) {
      return false;
    }
    if (filter === "high-value" && claim.claim.pointsDeducted < 850) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }

    return searchableClaimText(claim).includes(normalizedSearch);
  });
}

function sortClaims(claims: readonly AdminRewardClaimLookup[], sort: ClaimSort): readonly AdminRewardClaimLookup[] {
  return [...claims].sort((left, right) => {
    switch (sort) {
      case "raised-asc":
        return new Date(left.claim.chosenAt).getTime() - new Date(right.claim.chosenAt).getTime();
      case "contractor":
        return left.contractor.name.localeCompare(right.contractor.name);
      case "value-desc":
        return right.claim.pointsDeducted - left.claim.pointsDeducted;
      case "claim-id":
        return left.claim.claimId.localeCompare(right.claim.claimId);
      case "raised-desc":
      default:
        return new Date(right.claim.chosenAt).getTime() - new Date(left.claim.chosenAt).getTime();
    }
  });
}

function filterHistory(
  history: readonly AdminRewardClaimHistoryEntry[],
  search: string,
  filter: HistoryFilter,
  rangePreset: HistoryRangePreset,
  from: string,
  to: string,
): readonly AdminRewardClaimHistoryEntry[] {
  const normalizedSearch = search.trim().toLowerCase();
  const range = resolveHistoryRange(rangePreset, from, to);

  return history.filter((entry) => {
    if (filter === "raised" && entry.claim.status !== "CHOSEN") {
      return false;
    }
    if (filter === "delivered" && entry.claim.status !== "FULFILLED") {
      return false;
    }
    if (filter === "cancelled" && entry.claim.status !== "CANCELLED_BY_CONTRACTOR") {
      return false;
    }
    if (filter === "revoked" && entry.claim.status !== "REVOKED_DUE_TO_RETURN") {
      return false;
    }
    const claimedAt = new Date(entry.claim.chosenAt).getTime();
    if (range.from && claimedAt < range.from.getTime()) {
      return false;
    }
    if (range.to && claimedAt > range.to.getTime()) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }

    return searchableClaimText(entry).includes(normalizedSearch);
  });
}

function sortHistory(history: readonly AdminRewardClaimHistoryEntry[], sort: HistorySort): readonly AdminRewardClaimHistoryEntry[] {
  return [...history].sort((left, right) => {
    switch (sort) {
      case "claimed-asc":
        return new Date(left.claim.chosenAt).getTime() - new Date(right.claim.chosenAt).getTime();
      case "fulfilled-desc":
        return dateSortValue(right.claim.fulfilledAt) - dateSortValue(left.claim.fulfilledAt);
      case "fulfilled-asc":
        return dateSortValue(left.claim.fulfilledAt) - dateSortValue(right.claim.fulfilledAt);
      case "contractor-asc":
        return left.contractor.name.localeCompare(right.contractor.name);
      case "contractor-desc":
        return right.contractor.name.localeCompare(left.contractor.name);
      case "phone-asc":
        return left.contractor.mobileNumber.localeCompare(right.contractor.mobileNumber);
      case "phone-desc":
        return right.contractor.mobileNumber.localeCompare(left.contractor.mobileNumber);
      case "reward-asc":
        return left.claim.rewardName.localeCompare(right.claim.rewardName);
      case "reward-desc":
        return right.claim.rewardName.localeCompare(left.claim.rewardName);
      case "status-asc":
        return formatClaimStatus(left.claim.status).localeCompare(formatClaimStatus(right.claim.status));
      case "status-desc":
        return formatClaimStatus(right.claim.status).localeCompare(formatClaimStatus(left.claim.status));
      case "points-desc":
        return right.claim.pointsDeducted - left.claim.pointsDeducted;
      case "points-asc":
        return left.claim.pointsDeducted - right.claim.pointsDeducted;
      case "claim-id-asc":
        return left.claim.claimId.localeCompare(right.claim.claimId);
      case "claim-id-desc":
        return right.claim.claimId.localeCompare(left.claim.claimId);
      case "claimed-desc":
      default:
        return new Date(right.claim.chosenAt).getTime() - new Date(left.claim.chosenAt).getTime();
    }
  });
}

function nextHistorySort(current: HistorySort, column: HistorySortColumn): HistorySort {
  const pairs: Record<HistorySortColumn, readonly [HistorySort, HistorySort]> = {
    "claim-id": ["claim-id-asc", "claim-id-desc"],
    contractor: ["contractor-asc", "contractor-desc"],
    phone: ["phone-asc", "phone-desc"],
    reward: ["reward-asc", "reward-desc"],
    points: ["points-desc", "points-asc"],
    claimed: ["claimed-desc", "claimed-asc"],
    fulfilled: ["fulfilled-desc", "fulfilled-asc"],
    status: ["status-asc", "status-desc"],
  };
  const [primary, alternate] = pairs[column];
  return current === primary ? alternate : primary;
}

function resolveHistoryRange(rangePreset: HistoryRangePreset, from: string, to: string): { readonly from?: Date; readonly to?: Date } {
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
    const fromDate = startOfWeek(today);
    return { from: fromDate, to: endOfDay(today) };
  }
  if (rangePreset === "last-week") {
    const thisWeek = startOfWeek(today);
    const fromDate = addDays(thisWeek, -7);
    return { from: fromDate, to: endOfDay(addDays(thisWeek, -1)) };
  }
  if (rangePreset === "this-month") {
    return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: endOfDay(today) };
  }
  const fromDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  return { from: fromDate, to: endOfDay(today) };
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

function dateSortValue(value?: string): number {
  return value ? new Date(value).getTime() : 0;
}

function searchableClaimText(claim: AdminRewardClaimLookup): string {
  return [
    claim.claim.claimId,
    claim.claim.rewardName,
    claim.claim.status,
    formatClaimStatus(claim.claim.status),
    claim.contractor.name,
    claim.contractor.contractorCode,
    claim.contractor.mobileNumber,
  ]
    .join(" ")
    .toLowerCase();
}

function upsertCatalogItem(
  current: readonly AdminRewardCatalogItem[],
  item: AdminRewardCatalogItem,
): readonly AdminRewardCatalogItem[] {
  const exists = current.some((candidate) => candidate.rewardId === item.rewardId);
  if (!exists) {
    return [item, ...current];
  }
  return current.map((candidate) => (candidate.rewardId === item.rewardId ? item : candidate));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Image could not be read."));
      }
    };
    reader.onerror = () => reject(new Error("Image could not be read."));
    reader.readAsDataURL(file);
  });
}

function validateRewardImageFile(file: File):
  | { readonly ok: true; readonly contentType: "image/png" | "image/jpeg" }
  | { readonly ok: false; readonly message: string } {
  if (file.size > maxRewardImageFileSizeBytes) {
    return { ok: false, message: "Reward image must be under 2 MB." };
  }

  const extensionContentType = inferRewardImageContentType(file.name);
  const fileType = file.type.trim().toLowerCase();
  if (fileType && !allowedRewardImageMimeTypes.has(fileType)) {
    return { ok: false, message: "Reward image must be PNG, JPG, or JPEG." };
  }
  if (!extensionContentType) {
    return { ok: false, message: "Reward image must be a .png, .jpg, or .jpeg file." };
  }
  if (fileType === "image/png" || fileType === "image/jpeg") {
    return { ok: true, contentType: fileType };
  }
  return { ok: true, contentType: extensionContentType };
}

function inferRewardImageContentType(fileName: string): "image/png" | "image/jpeg" | undefined {
  const normalized = fileName.trim().toLowerCase();
  if (normalized.endsWith(".png")) {
    return "image/png";
  }
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  return undefined;
}

function normalizeRewardImageDataUrl(dataUrl: string, contentType: "image/png" | "image/jpeg"): string {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) {
    throw new Error("Image could not be read.");
  }
  return `data:${contentType};base64,${dataUrl.slice(commaIndex + 1)}`;
}

function formatClaimStatus(status: string): string {
  switch (status) {
    case "CHOSEN":
      return "Claim Raised";
    case "FULFILLED":
      return "Delivered";
    case "CANCELLED_BY_CONTRACTOR":
    case "REVOKED_DUE_TO_RETURN":
      return "Cancelled / Points Restored";
    default:
      return status.replaceAll("_", " ");
  }
}

function claimStatusBadgeClassName(status: string): string {
  switch (status) {
    case "CHOSEN":
      return "badge warn";
    case "FULFILLED":
      return "badge good";
    case "CANCELLED_BY_CONTRACTOR":
    case "REVOKED_DUE_TO_RETURN":
      return "badge danger";
    default:
      return "badge";
  }
}

function fulfillmentHint(lookup: AdminRewardClaimLookup): string {
  if (lookup.claim.status === "FULFILLED") {
    return `Delivered ${formatDateTime(lookup.claim.fulfilledAt)}`;
  }
  if (lookup.claim.status === "CANCELLED_BY_CONTRACTOR" || lookup.claim.status === "REVOKED_DUE_TO_RETURN") {
    return "Claim Request No longer available. History recorded.";
  }
  if (!lookup.canFulfill) {
    return "This claim is not eligible for delivery";
  }
  return "OTP is required before marking Delivered";
}

function formatPoints(value: number): string {
  return `${new Intl.NumberFormat("en-IN").format(value)} points`;
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Action failed";
}
