"use client";

import {
  ArrowLeft,
  KeyRound,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createAdminApiClient, type AdminStaffSummary } from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { AdminPortalShell } from "./AdminPortalShell";
import { Avatar, ProfilePhotoUpload } from "./ProfilePhotoUpload";

type StaffFilter = "all" | "active" | "deactivated";
type StaffSort = "newest" | "name" | "last-opened";

interface StaffFormState {
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl: string;
}

const emptyForm: StaffFormState = {
  name: "",
  mobileNumber: "",
  photoUrl: "",
};

export function AdminStaffWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="staff" session={session} subtitle="Admin Web" title="Staff">
      <StaffDirectory />
    </AdminPortalShell>
  );
}

export function AdminStaffCreateWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="staff" session={session} subtitle="Admin Web" title="Add Staff">
      <StaffCreate />
    </AdminPortalShell>
  );
}

export function AdminStaffDetailWorkspace({
  session,
  staffId,
}: {
  readonly session: AdminSessionView;
  readonly staffId: string;
}) {
  return (
    <AdminPortalShell activeSection="staff" session={session} subtitle="Admin Web" title="Staff Detail">
      <StaffDetail staffId={staffId} />
    </AdminPortalShell>
  );
}

export function AdminStaffSelfProfileWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="profile" session={session} subtitle="Admin Web" title="My Profile">
      <StaffSelfProfile />
    </AdminPortalShell>
  );
}

function StaffDirectory() {
  const [staff, setStaff] = useState<readonly AdminStaffSummary[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [sort, setSort] = useState<StaffSort>("newest");
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Loading staff" });
  const [loading, setLoading] = useState(false);
  const api = useMemo(() => createAdminApiClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadStaff() {
      setLoading(true);
      setStatus({ tone: "idle", message: "Loading staff" });

      try {
        const response = await api.listStaff();
        if (!cancelled) {
          setStaff(response);
          setStatus({ tone: "success", message: "Staff loaded" });
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

    void loadStaff();

    return () => {
      cancelled = true;
    };
  }, [api]);

  const visibleStaff = useMemo(() => applyStaffListTools(staff, query, filter, sort), [filter, query, sort, staff]);
  const activeCount = staff.filter((staffMember) => staffMember.status === "ACTIVE").length;
  const deactivatedCount = staff.filter((staffMember) => staffMember.status === "DEACTIVATED").length;

  async function refreshStaff() {
    setLoading(true);
    setStatus({ tone: "idle", message: "Loading staff" });

    try {
      setStaff(await api.listStaff());
      setStatus({ tone: "success", message: "Staff loaded" });
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
          <div className="eyebrow">Staff Management</div>
          <h2>Create staff accounts and control OWNER delegated access</h2>
        </div>
        <div className="toolbar">
          <span className="badge good">
            <ShieldCheck size={14} aria-hidden="true" />
            OWNER only
          </span>
          <Link className="button primary" href={"/staff/new" as Route}>
            <UserPlus size={16} aria-hidden="true" />
            Add staff
          </Link>
        </div>
      </div>

      <div className="summary-grid">
        <Metric label="Staff" value={String(staff.length)} />
        <Metric label="Active" value={String(activeCount)} />
        <Metric label="Deactivated" value={String(deactivatedCount)} />
        <Metric label="PIN delivery" value="Mock" />
      </div>

      <section className="panel" aria-label="Staff directory">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Staff directory</h2>
            <div className={status.tone === "error" ? "status error" : "status"}>{status.message}</div>
          </div>
          <button className="button" type="button" onClick={() => void refreshStaff()} disabled={loading}>
            {loading ? <Loader2 size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
            Refresh
          </button>
        </div>

        <div className="control-bar staff-control-bar">
          <label className="field input-shell">
            <span className="field-label">Search</span>
            <Search size={16} aria-hidden="true" />
            <input
              className="text-input"
              placeholder="Name or mobile"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Filter</span>
            <select className="select-input" value={filter} onChange={(event) => setFilter(event.target.value as StaffFilter)}>
              <option value="all">All staff</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Sort</span>
            <select className="select-input" value={sort} onChange={(event) => setSort(event.target.value as StaffSort)}>
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="last-opened">Last opened</option>
            </select>
          </label>
          <div className="field">
            <span className="field-label">Visible</span>
            <strong>{visibleStaff.length} records</strong>
          </div>
        </div>

        <div className="ledger-list">
          {visibleStaff.length === 0 ? (
            <div className="panel-empty compact">No staff match the current controls</div>
          ) : (
            visibleStaff.map((staffMember) => (
              <Link className="ledger-row" href={`/staff/${staffMember.staffId}` as Route} key={staffMember.staffId}>
                <Avatar name={staffMember.name} photoUrl={staffMember.photoUrl} />
                <div className="ledger-main">
                  <div>
                    <strong>{staffMember.name}</strong>
                    <span>{staffMember.mobileNumber}</span>
                  </div>
                  <span className={`badge ${staffMember.status === "ACTIVE" ? "good" : "warn"}`}>{staffMember.status}</span>
                </div>
                <div className="ledger-facts">
                  <span>Created: {formatDate(staffMember.createdAt)}</span>
                  <span>Last opened: {staffMember.lastOpenedAt ? formatDate(staffMember.lastOpenedAt) : "Not recorded"}</span>
                  <span>Created by: {staffMember.createdByOwnerId ?? "Owner"}</span>
                  <span>Controls: detail page</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

function StaffCreate() {
  const router = useRouter();
  const [form, setForm] = useState<StaffFormState>(emptyForm);
  const [createdStaff, setCreatedStaff] = useState<AdminStaffSummary | null>(null);
  const [temporaryPin, setTemporaryPin] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Ready" });
  const [loading, setLoading] = useState(false);
  const api = useMemo(() => createAdminApiClient(), []);

  async function createStaff() {
    if (!form.name.trim() || !form.mobileNumber.trim()) {
      return;
    }

    setLoading(true);
    setTemporaryPin(null);
    setCreatedStaff(null);
    setStatus({ tone: "idle", message: "Creating staff" });

    try {
      const result = await api.createStaff(form);
      setCreatedStaff(result.staff);
      setTemporaryPin(result.temporaryPin);
      setForm(emptyForm);
      setStatus({ tone: "success", message: `${result.staff.name} created` });
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
          <div className="eyebrow">Add Staff</div>
          <h2>Create a staff account with a temporary PIN</h2>
        </div>
        <Link className="button" href={"/staff" as Route}>
          <ArrowLeft size={16} aria-hidden="true" />
          Directory
        </Link>
      </div>

      <section className="panel" aria-label="Add staff">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Staff identity</h2>
            <div className={status.tone === "error" ? "status error" : "status"}>{status.message}</div>
          </div>
          <span className="badge good">
            <UserCheck size={14} aria-hidden="true" />
            OWNER
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
            label="Staff photo"
            name={form.name || "Staff"}
            photoUrl={form.photoUrl}
            onError={(message) => setStatus({ tone: "error", message })}
            onPhotoChange={(photoUrl) => setForm((current) => ({ ...current, photoUrl }))}
          />
        </div>
        {temporaryPin && createdStaff ? (
          <div className="actions success-strip">
            <span>
              {createdStaff.name} PIN <strong className="token">{temporaryPin}</strong>
            </span>
            <button className="button" type="button" onClick={() => router.push(`/staff/${createdStaff.staffId}` as Route)}>
              Open detail
            </button>
          </div>
        ) : null}
        <div className="actions">
          <span className="status">PIN delivery: mock provider until production SMS is selected</span>
          <button
            className="button primary"
            type="button"
            onClick={() => void createStaff()}
            disabled={loading || !form.name.trim() || !form.mobileNumber.trim()}
          >
            {loading ? <Loader2 size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
            Add staff
          </button>
        </div>
      </section>
    </section>
  );
}

function StaffDetail({ staffId }: { readonly staffId: string }) {
  const [staff, setStaff] = useState<AdminStaffSummary | null>(null);
  const [photoDraft, setPhotoDraft] = useState("");
  const [temporaryPin, setTemporaryPin] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Loading staff" });
  const [loading, setLoading] = useState<string | null>(null);
  const api = useMemo(() => createAdminApiClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadStaff() {
      setLoading("detail");
      setStatus({ tone: "idle", message: "Loading staff" });

      try {
        const response = await api.getStaffDetail(staffId);
        if (!cancelled) {
          setStaff(response);
          setPhotoDraft(response.photoUrl ?? "");
          setStatus({ tone: "success", message: `${response.name} loaded` });
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

    void loadStaff();

    return () => {
      cancelled = true;
    };
  }, [api, staffId]);

  async function reloadStaff(message: string) {
    const response = await api.getStaffDetail(staffId);
    setStaff(response);
    setPhotoDraft(response.photoUrl ?? "");
    setStatus({ tone: "success", message });
  }

  async function savePhoto() {
    if (!staff) {
      return;
    }

    setLoading("photo");
    setStatus({ tone: "idle", message: "Saving staff photo" });

    try {
      const response = await api.updateStaffPhoto(staff.staffId, { photoUrl: photoDraft || null });
      setStaff(response);
      setPhotoDraft(response.photoUrl ?? "");
      setStatus({ tone: "success", message: "Staff photo saved" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function resetPin() {
    if (!staff || staff.status !== "ACTIVE") {
      return;
    }

    setLoading("reset");
    setTemporaryPin(null);
    setStatus({ tone: "idle", message: "Resetting PIN" });

    try {
      const result = await api.resetStaffPin(staff.staffId);
      setTemporaryPin(result.temporaryPin);
      setStaff(result.staff);
      setStatus({ tone: "success", message: `${result.staff.name} PIN reset` });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function deactivateStaff() {
    if (!staff || staff.status !== "ACTIVE") {
      return;
    }

    setLoading("deactivate");
    setStatus({ tone: "idle", message: "Deactivating staff" });

    try {
      await api.deactivateStaff(staff.staffId);
      await reloadStaff(`${staff.name} deactivated`);
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  }

  async function reactivateStaff() {
    if (!staff || staff.status !== "DEACTIVATED") {
      return;
    }

    setLoading("reactivate");
    setStatus({ tone: "idle", message: "Reactivating staff" });

    try {
      await api.reactivateStaff(staff.staffId);
      await reloadStaff(`${staff.name} reactivated`);
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
          <div className="eyebrow">Staff Detail</div>
          <h2>{staff?.name ?? "Loading staff"}</h2>
        </div>
        <Link className="button" href={"/staff" as Route}>
          <ArrowLeft size={16} aria-hidden="true" />
          Directory
        </Link>
      </div>

      {!staff ? (
        <section className="panel">
          <div className={status.tone === "error" ? "panel-empty status error" : "panel-empty"}>
            {loading ? <Loader2 size={18} aria-hidden="true" /> : <UserCheck size={18} aria-hidden="true" />}
            <span>{status.message}</span>
          </div>
        </section>
      ) : (
        <div className="workspace">
          <section className="panel" aria-label="Staff identity">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Staff identity</h2>
                <div className={status.tone === "error" ? "status error" : "status"}>{status.message}</div>
              </div>
              <span className={`badge ${staff.status === "ACTIVE" ? "good" : "warn"}`}>{staff.status}</span>
            </div>
            <div className="contractor-profile-strip">
              <Avatar name={staff.name} photoUrl={photoDraft || staff.photoUrl} size="lg" />
              <div>
                <strong>{staff.name}</strong>
                <span>{staff.mobileNumber}</span>
              </div>
            </div>
            <div className="detail-grid">
              <Metric label="Name" value={staff.name} />
              <Metric label="Mobile" value={staff.mobileNumber} />
              <Metric label="Created" value={formatDate(staff.createdAt)} />
              <Metric label="Last opened" value={staff.lastOpenedAt ? formatDate(staff.lastOpenedAt) : "Not recorded"} />
              <Metric label="Created by" value={staff.createdByOwnerId ?? "Owner"} />
              <Metric label="Status" value={staff.status} />
            </div>
            <div className="detail-action-copy">
              <strong>Staff mobile edits are deferred</strong>
              <span>For this slice, OWNER can create staff, reset PIN, deactivate, and reactivate.</span>
            </div>
          </section>

          <section className="panel" aria-label="Staff controls">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Access controls</h2>
                <div className="panel-subtitle">OWNER-only state changes</div>
              </div>
              <span className="badge good">
                <ShieldCheck size={14} aria-hidden="true" />
                Guarded
              </span>
            </div>
            <div className="detail-action-copy">
              <strong>Temporary PIN reset</strong>
              <span>Generated PIN is shown once in the browser and should be shared through the approved operational channel.</span>
            </div>
            <div className="actions">
              <button className="button" type="button" onClick={() => void resetPin()} disabled={loading !== null || staff.status !== "ACTIVE"}>
                {loading === "reset" ? <Loader2 size={16} aria-hidden="true" /> : <KeyRound size={16} aria-hidden="true" />}
                Reset PIN
              </button>
              {temporaryPin ? <span className="token">New PIN {temporaryPin}</span> : null}
            </div>
            <div className="actions danger-zone">
              <span className="status">Deactivate staff when access should be removed.</span>
              {staff.status === "ACTIVE" ? (
                <button className="button danger" type="button" onClick={() => void deactivateStaff()} disabled={loading !== null}>
                  {loading === "deactivate" ? <Loader2 size={16} aria-hidden="true" /> : <UserX size={16} aria-hidden="true" />}
                  Deactivate
                </button>
              ) : (
                <button className="button" type="button" onClick={() => void reactivateStaff()} disabled={loading !== null}>
                  {loading === "reactivate" ? <Loader2 size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
                  Reactivate
                </button>
              )}
            </div>
          </section>

          <section className="panel" aria-label="Staff photo">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Staff photo</h2>
                <div className="panel-subtitle">OWNER can update staff profile media</div>
              </div>
              <span className="badge good">OWNER</span>
            </div>
            <div className="form-grid">
              <ProfilePhotoUpload
                label="Staff photo"
                name={staff.name}
                photoUrl={photoDraft}
                onError={(message) => setStatus({ tone: "error", message })}
                onPhotoChange={setPhotoDraft}
              />
            </div>
            <div className="actions">
              <span className="status">Staff can also update their own photo from My Profile.</span>
              <button className="button primary" type="button" onClick={() => void savePhoto()} disabled={loading !== null}>
                {loading === "photo" ? <Loader2 size={16} aria-hidden="true" /> : <UserCheck size={16} aria-hidden="true" />}
                Save photo
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function StaffSelfProfile() {
  const [staff, setStaff] = useState<AdminStaffSummary | null>(null);
  const [photoDraft, setPhotoDraft] = useState("");
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Loading profile" });
  const [loading, setLoading] = useState(false);
  const api = useMemo(() => createAdminApiClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setStatus({ tone: "idle", message: "Loading profile" });

      try {
        const response = await api.getMyStaffProfile();
        if (!cancelled) {
          setStaff(response);
          setPhotoDraft(response.photoUrl ?? "");
          setStatus({ tone: "success", message: `${response.name} loaded` });
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

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [api]);

  async function savePhoto() {
    if (!staff) {
      return;
    }

    setLoading(true);
    setStatus({ tone: "idle", message: "Saving profile photo" });

    try {
      const response = await api.updateMyStaffPhoto({ photoUrl: photoDraft || null });
      setStaff(response);
      setPhotoDraft(response.photoUrl ?? "");
      setStatus({ tone: "success", message: "Profile photo saved" });
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
          <div className="eyebrow">My Profile</div>
          <h2>{staff?.name ?? "Staff profile"}</h2>
        </div>
        <span className="badge good">
          <ShieldCheck size={14} aria-hidden="true" />
          STAFF self-service
        </span>
      </div>

      {!staff ? (
        <section className="panel">
          <div className={status.tone === "error" ? "panel-empty status error" : "panel-empty"}>
            {loading ? <Loader2 size={18} aria-hidden="true" /> : <UserCheck size={18} aria-hidden="true" />}
            <span>{status.message}</span>
          </div>
        </section>
      ) : (
        <div className="workspace">
          <section className="panel" aria-label="My staff identity">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Staff identity</h2>
                <div className={status.tone === "error" ? "status error" : "status"}>{status.message}</div>
              </div>
              <span className={`badge ${staff.status === "ACTIVE" ? "good" : "warn"}`}>{staff.status}</span>
            </div>
            <div className="contractor-profile-strip">
              <Avatar name={staff.name} photoUrl={photoDraft || staff.photoUrl} size="lg" />
              <div>
                <strong>{staff.name}</strong>
                <span>{staff.mobileNumber}</span>
              </div>
            </div>
            <div className="detail-grid">
              <Metric label="Name" value={staff.name} />
              <Metric label="Mobile" value={staff.mobileNumber} />
              <Metric label="Created" value={formatDate(staff.createdAt)} />
              <Metric label="Last opened" value={staff.lastOpenedAt ? formatDate(staff.lastOpenedAt) : "Not recorded"} />
            </div>
          </section>

          <section className="panel" aria-label="My profile photo">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Profile photo</h2>
                <div className="panel-subtitle">Only your own staff photo can be changed here</div>
              </div>
              <span className="badge good">Self</span>
            </div>
            <div className="form-grid">
              <ProfilePhotoUpload
                label="Profile photo"
                name={staff.name}
                photoUrl={photoDraft}
                onError={(message) => setStatus({ tone: "error", message })}
                onPhotoChange={setPhotoDraft}
              />
            </div>
            <div className="actions">
              <span className="status">Staff management remains OWNER-only.</span>
              <button className="button primary" type="button" onClick={() => void savePhoto()} disabled={loading}>
                {loading ? <Loader2 size={16} aria-hidden="true" /> : <UserCheck size={16} aria-hidden="true" />}
                Save photo
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function applyStaffListTools(
  staff: readonly AdminStaffSummary[],
  query: string,
  filter: StaffFilter,
  sort: StaffSort,
): readonly AdminStaffSummary[] {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = staff.filter((staffMember) => {
    const matchesQuery =
      !normalizedQuery ||
      [staffMember.name, staffMember.mobileNumber].some((value) => value.toLowerCase().includes(normalizedQuery));

    if (!matchesQuery) {
      return false;
    }

    if (filter === "active") {
      return staffMember.status === "ACTIVE";
    }
    if (filter === "deactivated") {
      return staffMember.status === "DEACTIVATED";
    }
    return true;
  });

  return [...filtered].sort((left, right) => {
    switch (sort) {
      case "name":
        return left.name.localeCompare(right.name);
      case "last-opened":
        return new Date(right.lastOpenedAt ?? 0).getTime() - new Date(left.lastOpenedAt ?? 0).getTime();
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

interface StatusState {
  readonly tone: "idle" | "success" | "error";
  readonly message: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Action failed";
}
