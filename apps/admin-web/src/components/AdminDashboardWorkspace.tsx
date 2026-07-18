"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  Gift,
  Loader2,
  Megaphone,
  Printer,
  RefreshCw,
  ShieldAlert,
  Tags,
  TrendingUp,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  createAdminApiClient,
  type AdminDashboard,
  type AdminDashboardAttentionItem,
  type AdminDashboardShortcut,
} from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { AdminPortalShell } from "./AdminPortalShell";

const emptyMetrics: AdminDashboard["metrics"] = {
  contractors: 0,
  staff: 0,
  invoices: 0,
  invoicesReadyToPrint: 0,
  qrTotal: 0,
  qrNotPrinted: 0,
  qrPrinted: 0,
  qrScanned: 0,
  qrCancelled: 0,
  qrReversed: 0,
  rewardClaims: 0,
  pendingRewardClaims: 0,
  recentReturns: 0,
};

export function AdminDashboardWorkspace({
  denied = false,
  session,
}: {
  readonly denied?: boolean;
  readonly session: AdminSessionView;
}) {
  return (
    <AdminPortalShell activeSection="dashboard" session={session} subtitle="Admin Web" title="Dashboard">
      <AdminDashboardContent denied={denied} session={session} />
    </AdminPortalShell>
  );
}

function AdminDashboardContent({
  denied,
  session,
}: {
  readonly denied: boolean;
  readonly session: AdminSessionView;
}) {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [status, setStatus] = useState<{ readonly tone: "idle" | "success" | "error"; readonly message: string }>({
    tone: "idle",
    message: "Loading dashboard",
  });
  const [loading, setLoading] = useState(false);
  const api = useMemo(() => createAdminApiClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialDashboard() {
      setLoading(true);
      setStatus({ tone: "idle", message: "Loading dashboard" });

      try {
        const response = await api.getDashboard();

        if (!cancelled) {
          setDashboard(response);
          setStatus({ tone: "success", message: "Dashboard loaded" });
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

    void loadInitialDashboard();

    return () => {
      cancelled = true;
    };
  }, [api]);

  async function refreshDashboard() {
    setLoading(true);
    setStatus({ tone: "idle", message: "Loading dashboard" });

    try {
      setDashboard(await api.getDashboard());
      setStatus({ tone: "success", message: "Dashboard loaded" });
    } catch (error) {
      setStatus({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  const metrics = dashboard?.metrics ?? emptyMetrics;
  const role = dashboard?.actorRole ?? session.role;
  const summaryCards = buildSummaryCards(metrics, role);
  const attentionItems = dashboard?.attentionQueue ?? [];
  const shortcuts = dashboard?.shortcuts ?? [];
  const statusMix = dashboard?.qrStatusMix ?? [];
  const trend = dashboard?.printTrend ?? [];
  const maxStatusCount = Math.max(1, ...statusMix.map((item) => item.count));
  const maxTrendCount = Math.max(1, ...trend.map((item) => item.printedUnits));

  return (
    <section className="content">
      {denied ? (
        <section className="notice warn" aria-label="Access blocked">
          <ShieldAlert size={18} aria-hidden="true" />
          <div>
            <strong>Owner-only area blocked</strong>
            <span>Your staff session can continue from the allowed dashboard routes.</span>
          </div>
        </section>
      ) : null}

      <div className="dashboard-hero">
        <div>
          <div className="eyebrow">Operations</div>
          <h2>{dashboard?.roleLabel ?? session.roleLabel}</h2>
          <span className={status.tone === "error" ? "status error" : "status"}>{status.message}</span>
        </div>
        <button className="button" type="button" onClick={() => void refreshDashboard()} disabled={loading}>
          {loading ? <Loader2 size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          Refresh
        </button>
      </div>

      <div className="summary-grid dashboard-summary-grid">
        {summaryCards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            meta={card.meta}
            value={String(card.value)}
            {...(card.href ? { href: card.href } : {})}
          />
        ))}
      </div>

      <div className="dashboard-layout">
        <section className="panel attention-panel" aria-label="Attention queue">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Attention queue</h2>
              <div className="panel-subtitle">Newest operational work</div>
            </div>
            <span className="badge warn">
              <AlertTriangle size={14} aria-hidden="true" />
              {attentionItems.length}
            </span>
          </div>
          <div className="attention-list">
            {attentionItems.length ? (
              attentionItems.map((item) => <AttentionRow item={item} key={item.id} />)
            ) : (
              <div className="panel-empty compact">No urgent dashboard work</div>
            )}
          </div>
        </section>

        <section className="panel" aria-label="Shortcuts">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Shortcuts</h2>
              <div className="panel-subtitle">Role-aware actions</div>
            </div>
            <span className="badge good">{role}</span>
          </div>
          <div className="shortcut-grid">
            {shortcuts.map((shortcut) => (
              <ShortcutCard key={shortcut.href} shortcut={shortcut} />
            ))}
          </div>
        </section>

        <section className="panel" aria-label="Recent activity">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Recent activity</h2>
              <div className="panel-subtitle">Audit events</div>
            </div>
            <span className="badge">
              <Activity size={14} aria-hidden="true" />
              {dashboard?.recentActivity.length ?? 0}
            </span>
          </div>
          <div className="activity-list">
            {dashboard?.recentActivity.length ? (
              dashboard.recentActivity.map((entry) => (
                <div className="activity-row" key={entry.auditEventId}>
                  <strong>{formatSection(entry.action)}</strong>
                  <span>{entry.targetLabel ?? formatSection(entry.targetType)}</span>
                  <span>{entry.actorName ?? formatSection(entry.actorRole)}</span>
                  <span>{formatDateTime(entry.createdAt)}</span>
                </div>
              ))
            ) : (
              <div className="status">No audit activity</div>
            )}
          </div>
        </section>
      </div>

      <div className="dashboard-layout lower">
        <section className="panel" aria-label="QR status mix">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">QR status mix</h2>
              <div className="panel-subtitle">{metrics.qrTotal} total QR units</div>
            </div>
            <BarChart3 size={18} aria-hidden="true" />
          </div>
          <div className="status-mix-list">
            {statusMix.length ? (
              statusMix.map((item) => (
                <div className="status-mix-row" key={item.status}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.count}</span>
                  </div>
                  <div className="mix-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(3, (item.count / maxStatusCount) * 100)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="panel-empty compact">No QR status data</div>
            )}
          </div>
        </section>

        <section className="panel" aria-label="Print trend">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Print trend</h2>
              <div className="panel-subtitle">Last 7 days</div>
            </div>
            <TrendingUp size={18} aria-hidden="true" />
          </div>
          <div className="trend-bars">
            {trend.map((item) => (
              <div className="trend-column" key={item.date}>
                <div className="trend-bar" aria-hidden="true">
                  <span style={{ height: `${Math.max(4, (item.printedUnits / maxTrendCount) * 100)}%` }} />
                </div>
                <strong>{item.printedUnits}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel" aria-label="Top contractors">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Top contractors</h2>
              <div className="panel-subtitle">Points and scan activity</div>
            </div>
            <Link className="button compact" href={"/contractors" as Route}>
              Open
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="contractor-rank-list">
            {dashboard?.topContractors.length ? (
              dashboard.topContractors.map((contractor) => (
                <Link className="rank-row" href={"/contractors" as Route} key={contractor.contractorId}>
                  <div>
                    <strong>{contractor.name}</strong>
                    <span>
                      {contractor.contractorCode} · {contractor.tier ?? "Silver"}
                    </span>
                  </div>
                  <div>
                    <strong>{contractor.availablePoints}</strong>
                    <span>{contractor.scanCount} scans</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="panel-empty compact">No contractor activity</div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function MetricCard({
  href,
  label,
  meta,
  value,
}: {
  readonly href?: string;
  readonly label: string;
  readonly meta: string;
  readonly value: string;
}) {
  const content = (
    <>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-meta">{meta}</div>
    </>
  );

  if (href) {
    return (
      <Link className="metric clickable" href={href as Route}>
        {content}
      </Link>
    );
  }

  return <div className="metric">{content}</div>;
}

function AttentionRow({ item }: { readonly item: AdminDashboardAttentionItem }) {
  const row = (
    <>
      <span className={`attention-dot ${item.tone}`} aria-hidden="true" />
      <div>
        <strong>{item.title}</strong>
        <span>{item.description}</span>
      </div>
      <b>{item.value}</b>
      {item.href ? <ArrowRight size={15} aria-hidden="true" /> : null}
    </>
  );

  if (item.href) {
    return (
      <Link className="attention-row" href={item.href as Route}>
        {row}
      </Link>
    );
  }

  return <div className="attention-row">{row}</div>;
}

function ShortcutCard({ shortcut }: { readonly shortcut: AdminDashboardShortcut }) {
  const Icon = getShortcutIcon(shortcut.icon);

  return (
    <Link className="shortcut-card" href={shortcut.href as Route}>
      <span className="shortcut-icon">
        <Icon size={17} aria-hidden="true" />
      </span>
      <div>
        <strong>{shortcut.label}</strong>
        <span>{shortcut.description}</span>
      </div>
    </Link>
  );
}

function getShortcutIcon(icon: string): LucideIcon {
  switch (icon) {
    case "gift":
      return Gift;
    case "history":
      return ClipboardList;
    case "megaphone":
      return Megaphone;
    case "printer":
      return Printer;
    case "receipt":
      return FileText;
    case "report":
      return BarChart3;
    case "staff":
      return UserCog;
    case "tag":
      return Tags;
    case "users":
      return Users;
    default:
      return Activity;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Request failed";
}

function formatSection(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildSummaryCards(metrics: AdminDashboard["metrics"], role: string) {
  const owner = role === "OWNER";

  return [
    {
      label: "Contractors",
      value: metrics.contractors,
      meta: "Active directory",
      href: "/contractors",
    },
    {
      label: "Staff",
      value: metrics.staff,
      meta: owner ? "Manage team" : "Owner managed",
      href: owner ? "/staff" : undefined,
    },
    {
      label: "Ready to print",
      value: metrics.invoicesReadyToPrint,
      meta: `${metrics.qrNotPrinted} QR pending`,
      href: "/",
    },
    {
      label: "Invoices",
      value: metrics.invoices,
      meta: `${metrics.recentReturns} returns linked`,
      href: "/invoices",
    },
    {
      label: "Printed QR",
      value: metrics.qrPrinted,
      meta: `${metrics.qrTotal} total QR`,
      href: "/print-history",
    },
    {
      label: "Claimed QR",
      value: metrics.qrScanned,
      meta: "Points collected",
      href: "/reports",
    },
    {
      label: "QR exceptions",
      value: metrics.qrCancelled + metrics.qrReversed,
      meta: `${metrics.qrCancelled} Cancelled · ${metrics.qrReversed} Reversed_AND_Cancelled`,
      href: "/reports",
    },
    {
      label: "Pending rewards",
      value: metrics.pendingRewardClaims,
      meta: `${metrics.rewardClaims} total claims`,
      href: owner ? "/rewards" : undefined,
    },
  ];
}
