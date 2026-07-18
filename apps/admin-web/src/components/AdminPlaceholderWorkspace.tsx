"use client";

import { LockKeyhole, ShieldCheck } from "lucide-react";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { AdminPortalShell, type AdminSectionId, useAdminActor } from "./AdminPortalShell";

interface PlaceholderCard {
  readonly label: string;
  readonly value: string;
}

interface PlaceholderRow {
  readonly name: string;
  readonly status: string;
  readonly role: string;
}

interface AdminPlaceholderWorkspaceProps {
  readonly title: string;
  readonly subtitle: string;
  readonly activeSection: AdminSectionId;
  readonly session: AdminSessionView;
  readonly ownerOnly?: boolean;
  readonly cards: readonly PlaceholderCard[];
  readonly rows: readonly PlaceholderRow[];
}

export function AdminPlaceholderWorkspace({
  title,
  subtitle,
  activeSection,
  session,
  ownerOnly = false,
  cards,
  rows,
}: AdminPlaceholderWorkspaceProps) {
  return (
    <AdminPortalShell activeSection={activeSection} session={session} subtitle={subtitle} title={title}>
      <PlaceholderContent cards={cards} ownerOnly={ownerOnly} rows={rows} />
    </AdminPortalShell>
  );
}

function PlaceholderContent({
  cards,
  ownerOnly,
  rows,
}: {
  readonly cards: readonly PlaceholderCard[];
  readonly ownerOnly: boolean;
  readonly rows: readonly PlaceholderRow[];
}) {
  const { actorRole } = useAdminActor();
  const blocked = ownerOnly && actorRole !== "OWNER";

  return (
    <section className="content">
      {blocked ? (
        <section className="panel" aria-label="Access controlled">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">OWNER access</h2>
              <div className="panel-subtitle">Role policy enforced</div>
            </div>
            <span className="badge warn">
              <LockKeyhole size={14} aria-hidden="true" />
              STAFF blocked
            </span>
          </div>
        </section>
      ) : (
        <>
          <div className="summary-grid">
            {cards.map((card) => (
              <Metric label={card.label} value={card.value} key={card.label} />
            ))}
          </div>

          <section className="panel" aria-label="Workflow map">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Workflow map</h2>
                <div className="panel-subtitle">{actorRole}</div>
              </div>
              <span className="badge good">
                <ShieldCheck size={14} aria-hidden="true" />
                Non-camera
              </span>
            </div>
            <div className="activity-list">
              {rows.map((row) => (
                <div className="activity-row" key={row.name}>
                  <strong>{row.name}</strong>
                  <span>{row.status}</span>
                  <span>{row.role}</span>
                </div>
              ))}
            </div>
          </section>
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
