"use client";

import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createAdminApiClient,
  type AdminContractorDetail,
  type AdminContractorSummary,
} from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { AdminPortalShell, useAdminActor } from "./AdminPortalShell";
import { Avatar, ProfilePhotoUpload } from "./ProfilePhotoUpload";

type ContractorFilter = "all" | "active" | "deactivated" | "has-rewards" | "has-scans" | "silver" | "gold" | "platinum" | "diamond";
type ContractorSort = "newest" | "name" | "business-inr" | "total-points" | "scan-count" | "reward-value";

interface ContractorFormState {
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl: string;
  readonly belongsToNote: string;
}

const emptyForm: ContractorFormState = {
  name: "",
  mobileNumber: "",
  photoUrl: "",
  belongsToNote: "",
};

export function AdminContractorsWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="contractors" session={session} subtitle="Admin Web" title="Contractors">
      <ContractorDirectory />
    </AdminPortalShell>
  );
}

export function AdminContractorCreateWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="contractors" session={session} subtitle="Admin Web" title="Add Contractor">
      <ContractorCreate />
    </AdminPortalShell>
  );
}

export function AdminContractorDetailWorkspace({
  contractorId,
  session,
}: {
  readonly contractorId: string;
  readonly session: AdminSessionView;
}) {
  return (
    <AdminPortalShell activeSection="contractors" session={session} subtitle="Admin Web" title="Contractor Detail">
      <ContractorDetail contractorId={contractorId} />
    </AdminPortalShell>
  );
}

function ContractorDirectory() {
  const { actorRole } = useAdminActor();
  const [contractors, setContractors] = useState<readonly AdminContractorSummary[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ContractorFilter>("all");
  const [sort, setSort] = useState<ContractorSort>("newest");
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Loading contractors" });
  const [loading, setLoading] = useState(false);
  const api = useMemo(() => createAdminApiClient(), []);
  const canMutate = actorRole === "OWNER" || actorRole === "ADMIN";

  useEffect(() => {
    let cancelled = false;

    async function loadContractors() {
      setLoading(true);
      setStatus({ tone: "idle", message: "Loading contractors" });

      try {
        const response = await api.listContractors();
        if (!cancelled) {
          setContractors(response);
          setStatus({ tone: "success", message: "Contractors loaded" });
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({ tone: "error", message: getErrorMessage(error) });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadContractors();

    return () => {
      cancelled = true;
    };
  }, [api]);

  const visibleContractors = useMemo(
    () => applyContractorListTools(contractors, query, filter, sort),
    [contractors, filter, query, sort],
  );
  const activeCount = contractors.filter((contractor) => contractor.status === "ACTIVE").length;
  const totalCollectedPoints = contractors.reduce((total, contractor) => total + contractor.totalAccumulatedPoints, 0);
  const totalScannedBusinessInr = contractors.reduce((total, contractor) => total + Number(contractor.scannedBusinessInr), 0);
  const totalFulfilledRewards = contractors.reduce((total, contractor) => total + contractor.fulfilledRewardCount, 0);
  const totalFulfilledRewardValueInr = contractors.reduce((total, contractor) => total + contractor.fulfilledRewardValueInr, 0);

  async function refreshContractors() {
    setLoading(true);
    setStatus({ tone: "idle", message: "Loading contractors" });

    try {
      setContractors(await api.listContractors());
      setStatus({ tone: "success", message: "Contractors loaded" });
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
          <div className="eyebrow">Contractor Management</div>
          <h2>Find contractors, inspect status, and open account controls</h2>
        </div>
        <div className="toolbar">
          <span className={`badge ${canMutate ? "good" : "warn"}`}>
            {canMutate ? <ShieldCheck size={14} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}
            {canMutate ? "OWNER / ADMIN controls" : "STAFF read only"}
          </span>
          {canMutate ? (
            <Link className="button primary" href={"/contractors/new" as Route}>
              <UserPlus size={16} aria-hidden="true" />
              Add contractor
            </Link>
          ) : null}
        </div>
      </div>

      <div className="summary-grid">
        <Metric label="Contractors" value={String(contractors.length)} />
        <Metric label="Active" value={String(activeCount)} />
        <Metric label="Sites" value={String(contractors.reduce((total, item) => total + item.siteCount, 0))} />
        <Metric label="Total points collected" value={formatMetricNumber(totalCollectedPoints)} />
        <Metric label="Business generated" value={formatInr(totalScannedBusinessInr)} />
        <Metric label="Rewards collected" value={String(totalFulfilledRewards)} />
        <Metric label="Reward value" value={formatInr(totalFulfilledRewardValueInr)} />
      </div>

      <section className="panel" aria-label="Contractor directory">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Contractor directory</h2>
            <div className={status.tone === "error" ? "status error" : "status"}>{status.message}</div>
          </div>
          <button className="button" type="button" onClick={() => void refreshContractors()} disabled={loading}>
            {loading ? <Loader2 size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
            Refresh
          </button>
        </div>

        <div className="control-bar">
          <label className="field input-shell">
            <span className="field-label">Search</span>
            <Search size={16} aria-hidden="true" />
            <input
              className="text-input"
              placeholder="Name, mobile, code, area, site"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Filter</span>
            <select className="select-input" value={filter} onChange={(event) => setFilter(event.target.value as ContractorFilter)}>
              <option value="all">All contractors</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
              <option value="has-rewards">Has rewards</option>
              <option value="has-scans">Has scans</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="diamond">Diamond</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Sort</span>
            <select className="select-input" value={sort} onChange={(event) => setSort(event.target.value as ContractorSort)}>
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="business-inr">Business generated</option>
              <option value="total-points">Total points</option>
              <option value="scan-count">Scan count</option>
              <option value="reward-value">Reward value</option>
            </select>
          </label>
          <div className="field">
            <span className="field-label">Visible</span>
            <strong>{visibleContractors.length} records</strong>
          </div>
        </div>

        <div className="ledger-list">
          {visibleContractors.length === 0 ? (
            <div className="panel-empty compact">No contractors match the current controls</div>
          ) : (
            visibleContractors.map((contractor) => (
              <Link className="ledger-row directory-row" href={`/contractors/${contractor.contractorId}` as Route} key={contractor.contractorId}>
                <Avatar name={contractor.name} photoUrl={contractor.photoUrl} />
                <div className="ledger-main">
                  <div>
                    <strong>{contractor.name}</strong>
                    <span>
                      {contractor.contractorCode} · {contractor.mobileNumber} · Area: {contractor.belongsToNote || "Not recorded"}
                    </span>
                  </div>
                  <div className="chip-list compact">
                    <span className={`badge ${contractor.status === "ACTIVE" ? "good" : "warn"}`}>{contractor.status}</span>
                    <span className="badge">{contractor.tier ?? "Silver"}</span>
                  </div>
                </div>
                <div className="ledger-facts">
                  <span>Points: {contractor.totalAccumulatedPoints}</span>
                  <span>Business: {formatInr(contractor.scannedBusinessInr)}</span>
                  <span>Rewards: {contractor.fulfilledRewardCount}</span>
                  <span>Reward INR: {formatInr(contractor.fulfilledRewardValueInr)}</span>
                  <span>Sites: {contractor.siteCount}</span>
                  <span>Scans: {contractor.successfulScanCount}</span>
                </div>
                <div className="status">{contractor.siteSummary}</div>
              </Link>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

function ContractorCreate() {
  const router = useRouter();
  const [form, setForm] = useState<ContractorFormState>(emptyForm);
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Ready" });
  const [loading, setLoading] = useState(false);
  const api = useMemo(() => createAdminApiClient(), []);

  async function registerContractor() {
    if (!form.name.trim() || !form.mobileNumber.trim()) {
      return;
    }

    setLoading(true);
    setStatus({ tone: "idle", message: "Registering contractor" });

    try {
      const contractor = await api.registerContractor({
        name: form.name,
        mobileNumber: form.mobileNumber,
        ...(form.photoUrl ? { photoUrl: form.photoUrl } : {}),
        ...(form.belongsToNote.trim() ? { belongsToNote: form.belongsToNote } : {}),
      });
      setStatus({ tone: "success", message: `${contractor.contractorCode} registered` });
      router.push(`/contractors/${contractor.contractorId}` as Route);
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
          <div className="eyebrow">Add Contractor</div>
          <h2>Register a contractor and create their app identity</h2>
        </div>
        <Link className="button" href={"/contractors" as Route}>
          <ArrowLeft size={16} aria-hidden="true" />
          Directory
        </Link>
      </div>

      <section className="panel" aria-label="Register contractor">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Contractor identity</h2>
            <div className={status.tone === "error" ? "status error" : "status"}>{status.message}</div>
          </div>
          <span className="badge good">
            <UserPlus size={14} aria-hidden="true" />
            OWNER / ADMIN
          </span>
        </div>

        <div className="form-grid three">
          <TextField label="Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          <TextField
            label="Mobile"
            value={form.mobileNumber}
            onChange={(value) => setForm((current) => ({ ...current, mobileNumber: value }))}
          />
          <ProfilePhotoUpload
            label="Contractor photo"
            name={form.name || "Preview"}
            photoUrl={form.photoUrl}
            onError={(message) => setStatus({ tone: "error", message })}
            onPhotoChange={(photoUrl) => setForm((current) => ({ ...current, photoUrl }))}
          />
          <label className="field wide-field">
            <span className="field-label">Area</span>
            <textarea
              className="text-input promotion-textarea"
              maxLength={1000}
              placeholder="Dealer branch, sales area, electrician group, or relationship context"
              value={form.belongsToNote}
              onChange={(event) => setForm((current) => ({ ...current, belongsToNote: event.target.value }))}
            />
          </label>
        </div>

        <div className="detail-action-copy">
          <strong>Name and mobile lock after registration</strong>
          <span>Incorrect identity data must be handled by deactivating this profile and registering a new contractor.</span>
        </div>

        <div className="actions">
          <span className="status">Welcome SMS: mock provider until production SMS is selected</span>
          <button
            className="button primary"
            type="button"
            onClick={() => void registerContractor()}
            disabled={loading || !form.name.trim() || !form.mobileNumber.trim()}
          >
            {loading ? <Loader2 size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
            Register contractor
          </button>
        </div>
      </section>
    </section>
  );
}

function ContractorDetail({ contractorId }: { readonly contractorId: string }) {
  const { actorRole } = useAdminActor();
  const [contractor, setContractor] = useState<AdminContractorDetail | null>(null);
  const [photoDraft, setPhotoDraft] = useState("");
  const [belongsToNoteDraft, setBelongsToNoteDraft] = useState("");
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [temporaryMpin, setTemporaryMpin] = useState<{ readonly value: string; readonly expiresAt: string } | null>(null);
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Loading contractor" });
  const [loading, setLoading] = useState<string | null>(null);
  const api = useMemo(() => createAdminApiClient(), []);
  const canMutate = actorRole === "OWNER" || actorRole === "ADMIN";

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setLoading("detail");
      setStatus({ tone: "idle", message: "Loading contractor" });

      try {
        const detail = await api.getContractorDetail(contractorId);
        if (!cancelled) {
          setContractor(detail);
          setPhotoDraft(detail.photoUrl ?? "");
          setBelongsToNoteDraft(detail.belongsToNote ?? "");
          setStatus({ tone: "success", message: `${detail.contractorCode} loaded` });
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({ tone: "error", message: getErrorMessage(error) });
        }
      } finally {
        if (!cancelled) {
          setLoading(null);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [api, contractorId]);

  async function reloadContractor(message = "Contractor loaded") {
    const detail = await api.getContractorDetail(contractorId);
    setContractor(detail);
    setPhotoDraft(detail.photoUrl ?? "");
    setBelongsToNoteDraft(detail.belongsToNote ?? "");
    setStatus({ tone: "success", message });
  }

  async function savePhoto() {
    if (!canMutate || !contractor) {
      return;
    }

    setLoading("photo");
    setStatus({ tone: "idle", message: "Saving photo" });

    try {
      const detail = await api.updateContractorPhoto(contractor.contractorId, { photoUrl: photoDraft || null });
      setContractor(detail);
      setPhotoDraft(detail.photoUrl ?? "");
      setBelongsToNoteDraft(detail.belongsToNote ?? "");
      setStatus({ tone: "success", message: "Contractor photo saved" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function saveAssociationNote() {
    if (!canMutate || !contractor) {
      return;
    }

    setLoading("association");
    setStatus({ tone: "idle", message: "Saving contractor association" });

    try {
      const detail = await api.updateContractorPhoto(contractor.contractorId, { belongsToNote: belongsToNoteDraft || null });
      setContractor(detail);
      setPhotoDraft(detail.photoUrl ?? "");
      setBelongsToNoteDraft(detail.belongsToNote ?? "");
      setStatus({ tone: "success", message: "Contractor association saved" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function deactivateContractor() {
    if (!canMutate || !contractor || contractor.status !== "ACTIVE") {
      return;
    }

    setLoading("deactivate");
    setStatus({ tone: "idle", message: "Deactivating contractor" });

    try {
      await api.deactivateContractor(contractor.contractorId);
      await reloadContractor(`${contractor.contractorCode} deactivated`);
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function reactivateContractor() {
    if (!canMutate || !contractor || contractor.status !== "DEACTIVATED") {
      return;
    }

    setLoading("reactivate");
    setStatus({ tone: "idle", message: "Reactivating contractor" });

    try {
      await api.reactivateContractor(contractor.contractorId);
      await reloadContractor(`${contractor.contractorCode} reactivated`);
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function resetMpin() {
    if (!canMutate || !contractor || contractor.status !== "ACTIVE") {
      return;
    }

    setLoading("mpin");
    setTemporaryMpin(null);
    setStatus({ tone: "idle", message: "Resetting MPIN" });

    try {
      const result = await api.resetContractorMpin(contractor.contractorId);
      setTemporaryMpin({ value: result.temporaryMpin, expiresAt: result.expiresAt });
      setStatus({ tone: "success", message: "Temporary MPIN generated" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Contractor Detail</div>
          <h2>{contractor?.name ?? "Loading contractor"}</h2>
        </div>
        <Link className="button" href={"/contractors" as Route}>
          <ArrowLeft size={16} aria-hidden="true" />
          Directory
        </Link>
      </div>

      {!contractor ? (
        <section className="panel">
          <div className={status.tone === "error" ? "panel-empty status error" : "panel-empty"}>
            {loading ? <Loader2 size={18} aria-hidden="true" /> : <Users size={18} aria-hidden="true" />}
            <span>{status.message}</span>
          </div>
        </section>
      ) : (
        <>
          <section className="panel" aria-label="Contractor identity">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Locked identity</h2>
                <div className={status.tone === "error" ? "status error" : "status"}>{status.message}</div>
              </div>
              <span className={`badge ${contractor.status === "ACTIVE" ? "good" : "warn"}`}>{contractor.status}</span>
            </div>
            <div className="contractor-profile-strip">
              <Avatar name={contractor.name} photoUrl={photoDraft || contractor.photoUrl} size="lg" />
              <div>
                <strong>{contractor.name}</strong>
                <span>
                  {contractor.contractorCode} · {contractor.mobileNumber}
                </span>
              </div>
            </div>
            <div className="detail-grid">
              <LockedFact label="Name" value={contractor.name} />
              <LockedFact label="Mobile" value={contractor.mobileNumber} />
              <Metric label="Current balance" value={String(contractor.availablePoints)} />
              <Metric label="Total points collected" value={String(contractor.totalAccumulatedPoints)} />
              <Metric label="Business generated" value={formatInr(contractor.scannedBusinessInr)} />
              <Metric label="Rewards collected" value={String(contractor.fulfilledRewardCount)} />
              <Metric label="Reward value" value={formatInr(contractor.fulfilledRewardValueInr)} />
              <Metric label="Sites" value={String(contractor.siteCount)} />
              <Metric label="Successful scans" value={String(contractor.successfulScanCount)} />
              <Metric label="Tier" value={contractor.tier ?? "Silver"} />
            </div>
            <div className="detail-action-copy">
              <strong>Name and mobile are immutable</strong>
              <span>If either identity field is wrong, deactivate this contractor and create a new record.</span>
            </div>
            <div className="detail-action-copy">
              <strong>Area</strong>
              <span>{contractor.belongsToNote || "Not recorded"}</span>
            </div>
          </section>

          <div className="workspace">
            <section className="panel" aria-label="Contractor photo">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Profile photo</h2>
                  <div className="panel-subtitle">Device upload preview</div>
                </div>
                <span className={`badge ${canMutate ? "good" : "warn"}`}>{canMutate ? "OWNER / ADMIN" : "Read only"}</span>
              </div>
              {canMutate ? (
                <>
                  <div className="form-grid">
                    <ProfilePhotoUpload
                      label="Contractor photo"
                      name={contractor.name}
                      photoUrl={photoDraft}
                      onError={(message) => setStatus({ tone: "error", message })}
                      onPhotoChange={setPhotoDraft}
                    />
                  </div>
                  <div className="actions">
                    <span className="status">Use a clear face photo so store teams can identify the contractor confidently.</span>
                    <button className="button primary" type="button" onClick={() => void savePhoto()} disabled={loading !== null}>
                      {loading === "photo" ? <Loader2 size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                      Save photo
                    </button>
                  </div>
                </>
              ) : (
                <div className="panel-empty compact">Photo update is available to OWNER/Admin sessions</div>
              )}
            </section>

            <section className="panel" aria-label="Contractor association">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Area</h2>
                  <div className="panel-subtitle">Retailer context visible to admins</div>
                </div>
                <span className={`badge ${canMutate ? "good" : "warn"}`}>{canMutate ? "OWNER / ADMIN" : "Read only"}</span>
              </div>
              {canMutate ? (
                <>
                  <label className="field">
                    <span className="field-label">Area</span>
                    <textarea
                      className="text-input promotion-textarea"
                      maxLength={1000}
                      value={belongsToNoteDraft}
                      onChange={(event) => setBelongsToNoteDraft(event.target.value)}
                    />
                  </label>
                  <div className="actions">
                    <span className="status">Use this for branch, market, site cluster, or relationship context.</span>
                    <button className="button primary" type="button" onClick={() => void saveAssociationNote()} disabled={loading !== null}>
                      {loading === "association" ? <Loader2 size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                      Save association
                    </button>
                  </div>
                </>
              ) : (
                <div className="panel-empty compact">{contractor.belongsToNote || "No association note recorded"}</div>
              )}
            </section>

            <section className="panel" aria-label="Contractor controls">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Account controls</h2>
                  <div className="panel-subtitle">Separated from identity edits</div>
                </div>
                <span className={`badge ${canMutate ? "good" : "warn"}`}>{canMutate ? "Guarded" : "Read only"}</span>
              </div>
              {canMutate ? (
                <>
                  <div className="detail-action-copy">
                    <strong>Temporary MPIN reset</strong>
                    <span>Use only when the contractor contacts the retailer. The contractor should set their own MPIN after login.</span>
                  </div>
                  <div className="actions">
                    <button
                      className="button"
                      type="button"
                      onClick={() => void resetMpin()}
                      disabled={loading !== null || contractor.status !== "ACTIVE"}
                    >
                      {loading === "mpin" ? <Loader2 size={16} aria-hidden="true" /> : <KeyRound size={16} aria-hidden="true" />}
                      Reset MPIN
                    </button>
                    {temporaryMpin ? (
                      <span className="token">
                        {temporaryMpin.value} · expires {formatDateTime(temporaryMpin.expiresAt)}
                      </span>
                    ) : null}
                  </div>
                  <div className="actions danger-zone">
                    <span className="status">Deactivate an account when the contractor should no longer use the program.</span>
                    {contractor.status === "ACTIVE" ? (
                      <button className="button danger" type="button" onClick={() => void deactivateContractor()} disabled={loading !== null}>
                        {loading === "deactivate" ? <Loader2 size={16} aria-hidden="true" /> : <UserX size={16} aria-hidden="true" />}
                        Deactivate
                      </button>
                    ) : (
                      <button className="button" type="button" onClick={() => void reactivateContractor()} disabled={loading !== null}>
                        {loading === "reactivate" ? <Loader2 size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
                        Reactivate
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="panel-empty compact">STAFF can inspect contractor records but cannot change them</div>
              )}
            </section>
          </div>

          <section className="panel" aria-label="Contractor sites">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Sites</h2>
                <div className="panel-subtitle">{contractor.siteCount} registered</div>
              </div>
              <span className="badge">
                <CheckCircle2 size={14} aria-hidden="true" />
                Scan context
              </span>
            </div>
            <div className="ledger-list">
              {contractor.sites.length === 0 ? (
                <div className="panel-empty compact">No sites registered</div>
              ) : (
                contractor.sites.map((site) => (
                  <div className="site-drilldown" key={site.siteId}>
                    <div className="ledger-row">
                      <div className="ledger-main">
                        <div>
                          <strong>{site.clientName}</strong>
                          <span>{[site.flatOrApartmentNo, site.buildingName, site.area, site.city].filter(Boolean).join(", ") || "No address"}</span>
                        </div>
                        <span className={`badge ${site.status === "ACTIVE" ? "good" : "warn"}`}>{site.status}</span>
                      </div>
                      <div className="ledger-facts">
                        <span>Successful scans: {site.successfulScanCount}</span>
                        <span>Points: {formatMetricNumber(site.creditedPoints)}</span>
                        <span>Business: {formatInr(site.scannedBusinessInr)}</span>
                        <button className="button compact" type="button" onClick={() => setExpandedSiteId(expandedSiteId === site.siteId ? null : site.siteId)}>
                          {expandedSiteId === site.siteId ? "Hide analytics" : "View analytics"}
                        </button>
                      </div>
                    </div>
                    {expandedSiteId === site.siteId ? (
                      <div className="site-analytics-block">
                        <div className="detail-grid">
                          <Metric label="Total scan attempts" value={String(site.scanCount)} />
                          <Metric label="Successful scans" value={String(site.successfulScanCount)} />
                          <Metric label="Points collected" value={formatMetricNumber(site.creditedPoints)} />
                          <Metric label="Business generated" value={formatInr(site.scannedBusinessInr)} />
                        </div>
                        {site.scannedItems.length === 0 ? (
                          <div className="panel-empty compact">No successful item scans for this site yet</div>
                        ) : (
                          <div className="data-table-wrap">
                            <table className="data-table site-analytics-table">
                              <thead>
                                <tr>
                                  <th scope="col">Item</th>
                                  <th scope="col">ItemCode</th>
                                  <th scope="col">Qty</th>
                                  <th scope="col">Price</th>
                                  <th scope="col">Amount</th>
                                  <th scope="col">Points</th>
                                </tr>
                              </thead>
                              <tbody>
                                {site.scannedItems.map((item) => (
                                  <tr key={`${item.sku}-${item.productName}-${item.unitPriceInr}`}>
                                    <td className="data-table-primary">
                                      <strong>{item.productName}</strong>
                                    </td>
                                    <td>{item.sku}</td>
                                    <td className="number-cell">{item.quantity}</td>
                                    <td className="amount-cell">INR {item.unitPriceInr}</td>
                                    <td className="amount-cell">INR {item.totalAmountInr}</td>
                                    <td className="number-cell">{item.pointsCollected}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function applyContractorListTools(
  contractors: readonly AdminContractorSummary[],
  query: string,
  filter: ContractorFilter,
  sort: ContractorSort,
): readonly AdminContractorSummary[] {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = contractors.filter((contractor) => {
    const matchesQuery =
      !normalizedQuery ||
      [
        contractor.name,
        contractor.mobileNumber,
        contractor.contractorCode,
        contractor.belongsToNote,
        contractor.tier,
        contractor.siteSummary,
        contractor.citySummary,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedQuery));

    if (!matchesQuery) {
      return false;
    }

    switch (filter) {
      case "active":
        return contractor.status === "ACTIVE";
      case "deactivated":
        return contractor.status === "DEACTIVATED";
      case "has-rewards":
        return contractor.rewardClaimCount > 0;
      case "has-scans":
        return contractor.scanCount > 0;
      case "silver":
      case "gold":
      case "platinum":
      case "diamond":
        return (contractor.tier ?? "Silver").toLowerCase() === filter;
      default:
        return true;
    }
  });

  return [...filtered].sort((left, right) => {
    switch (sort) {
      case "name":
        return left.name.localeCompare(right.name);
      case "business-inr":
        return Number(right.scannedBusinessInr) - Number(left.scannedBusinessInr);
      case "total-points":
        return right.totalAccumulatedPoints - left.totalAccumulatedPoints;
      case "scan-count":
        return right.successfulScanCount - left.successfulScanCount;
      case "reward-value":
        return right.fulfilledRewardValueInr - left.fulfilledRewardValueInr;
      default:
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }
  });
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function LockedFact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="fact locked-fact">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>Locked</em>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input className="text-input" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMetricNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "0";
}

function formatInr(value: string | number | null | undefined): string {
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (typeof numericValue !== "number" || !Number.isFinite(numericValue)) {
    return "INR 0.00";
  }
  return `INR ${numericValue.toFixed(2)}`;
}

interface StatusState {
  readonly tone: "idle" | "success" | "error";
  readonly message: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Request failed";
}
