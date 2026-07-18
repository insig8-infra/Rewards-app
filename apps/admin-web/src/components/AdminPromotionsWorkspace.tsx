"use client";

import {
  ArrowLeft,
  CalendarClock,
  Edit3,
  ImagePlus,
  Loader2,
  Megaphone,
  Palette,
  Power,
  PowerOff,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type AdminPromotion,
  type AdminPromotionAssetInput,
  type AdminPromotionFontFamily,
  type AdminPromotionFontStyle,
  type AdminPromotionWriteInput,
  createAdminApiClient,
} from "../api/adminApi";
import type { AdminSessionView } from "../auth/adminSessionTypes";
import { AdminPortalShell } from "./AdminPortalShell";
import { FilePickerButton } from "./FilePickerButton";

type PromotionsMode = "landing" | "manage";
type StatusState = {
  readonly tone: "idle" | "success" | "error";
  readonly message: string;
};

interface PromotionDraft {
  readonly title: string;
  readonly body: string;
  readonly assetUrl: string;
  readonly assetAltText: string;
  readonly overlayText: string;
  readonly overlayTextColor: string;
  readonly overlayFontSize: string;
  readonly overlayFontFamily: AdminPromotionFontFamily;
  readonly overlayFontStyle: AdminPromotionFontStyle;
  readonly marqueeEnabled: boolean;
  readonly endsAt: string;
  readonly assetUpload?: AdminPromotionAssetInput;
  readonly uploadPreviewUrl?: string;
}

const maxPromotionAssetBytes = 2 * 1024 * 1024;
const allowedPromotionAssetTypes = new Set(["image/png", "image/jpeg", "image/gif"]);
const promotionAssetAccept = ".png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif";

const emptyDraft: PromotionDraft = {
  title: "",
  body: "",
  assetUrl: "",
  assetAltText: "",
  overlayText: "",
  overlayTextColor: "#FFFFFF",
  overlayFontSize: "28",
  overlayFontFamily: "noto-sans-devanagari",
  overlayFontStyle: "bold",
  marqueeEnabled: false,
  endsAt: "",
};

const promotionFontFamilyOptions: readonly {
  readonly value: AdminPromotionFontFamily;
  readonly label: string;
  readonly css: string;
}[] = [
  { value: "noto-sans-devanagari", label: "Noto Sans Devanagari", css: "\"Noto Sans Devanagari\", \"Hind\", system-ui, sans-serif" },
  { value: "noto-serif-devanagari", label: "Noto Serif Devanagari", css: "\"Noto Serif Devanagari\", Georgia, serif" },
  { value: "hind", label: "Hind", css: "Hind, \"Noto Sans Devanagari\", system-ui, sans-serif" },
  { value: "mukta", label: "Mukta", css: "Mukta, \"Noto Sans Devanagari\", system-ui, sans-serif" },
  { value: "inter", label: "Inter", css: "Inter, system-ui, sans-serif" },
  { value: "system", label: "System UI", css: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" },
];

export function AdminPromotionsWorkspace({ session }: { readonly session: AdminSessionView }) {
  return (
    <AdminPortalShell activeSection="promotions" session={session} subtitle="All-user end-user app banners" title="Promotions">
      <PromotionsContent />
    </AdminPortalShell>
  );
}

function PromotionsContent() {
  const api = useMemo(() => createAdminApiClient(), []);
  const [mode, setMode] = useState<PromotionsMode>("landing");
  const [promotions, setPromotions] = useState<readonly AdminPromotion[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<PromotionDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "Loading promotions" });

  useEffect(() => {
    void loadPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const activePromotions = promotions.filter((promotion) => promotion.status === "ACTIVE" && !isExpired(promotion));
  const draftPromotions = promotions.filter((promotion) => promotion.status === "DRAFT");
  const archivedPromotions = promotions.filter((promotion) => promotion.status === "ARCHIVED");
  const expiredPromotions = promotions.filter((promotion) => isExpired(promotion));
  const selectedPromotion = promotions.find((promotion) => promotion.promotionId === selectedId) ?? null;
  const previewPromotion = selectedPromotion ?? activePromotions[0] ?? promotions[0] ?? null;

  async function loadPromotions(): Promise<void> {
    setBusy(true);
    setStatus({ tone: "idle", message: "Refreshing promotions" });
    try {
      const nextPromotions = await api.listPromotions();
      setPromotions(nextPromotions);
      if (selectedId && !nextPromotions.some((promotion) => promotion.promotionId === selectedId)) {
        clearSelection();
      }
      setStatus({ tone: "success", message: "Promotions refreshed" });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setBusy(false);
    }
  }

  function startNewPromotion(): void {
    setSelectedId("");
    setDraft(emptyDraft);
    setMode("manage");
    setStatus({ tone: "idle", message: "Create a promotion, save it, then activate when ready" });
  }

  function selectPromotion(promotion: AdminPromotion): void {
    setSelectedId(promotion.promotionId);
    setDraft(draftFromPromotion(promotion));
    setMode("manage");
    setStatus({ tone: "idle", message: "Editing promotion" });
  }

  function clearSelection(): void {
    setSelectedId("");
    setDraft(emptyDraft);
  }

  async function savePromotion(): Promise<void> {
    setBusy(true);
    setStatus({ tone: "idle", message: selectedId ? "Saving promotion" : "Creating promotion" });
    try {
      const payload = buildPromotionPayload(draft);
      const saved = selectedId
        ? await api.updatePromotion(selectedId, payload)
        : await api.createPromotion(payload);
      await loadPromotions();
      setSelectedId(saved.promotionId);
      setDraft(draftFromPromotion(saved));
      setStatus({ tone: "success", message: selectedId ? "Promotion saved" : "Promotion created" });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setBusy(false);
    }
  }

  async function activatePromotion(promotion: AdminPromotion): Promise<void> {
    setBusy(true);
    setStatus({ tone: "idle", message: "Activating promotion" });
    try {
      const updated = await api.activatePromotion(promotion.promotionId);
      await loadPromotions();
      setSelectedId(updated.promotionId);
      setDraft(draftFromPromotion(updated));
      setStatus({ tone: "success", message: "Promotion activated" });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setBusy(false);
    }
  }

  async function deactivatePromotion(promotion: AdminPromotion): Promise<void> {
    setBusy(true);
    setStatus({ tone: "idle", message: "Deactivating promotion" });
    try {
      const updated = await api.deactivatePromotion(promotion.promotionId);
      await loadPromotions();
      setSelectedId(updated.promotionId);
      setDraft(draftFromPromotion(updated));
      setStatus({ tone: "success", message: "Promotion deactivated" });
    } catch (taskError) {
      setStatus({ tone: "error", message: getErrorMessage(taskError) });
    } finally {
      setBusy(false);
    }
  }

  async function handlePromotionAsset(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }
    if (!allowedPromotionAssetTypes.has(file.type)) {
      setStatus({ tone: "error", message: "Upload a PNG, JPG, JPEG, or GIF promotion image." });
      return;
    }
    if (file.size > maxPromotionAssetBytes) {
      setStatus({ tone: "error", message: "Promotion image must be 2 MB or smaller." });
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setDraft((current) => ({
      ...current,
      assetUrl: "",
      assetAltText: current.assetAltText || current.title,
      assetUpload: {
        fileName: file.name,
        contentType: file.type,
        dataUrl,
        altText: current.assetAltText || current.title || file.name,
      },
      uploadPreviewUrl: dataUrl,
    }));
    setStatus({ tone: "success", message: "Promotion image selected. Save to upload it." });
  }

  if (mode === "landing") {
    return (
      <div className="stack">
        <div className={`status ${status.tone === "error" ? "error" : status.tone === "success" ? "success" : ""}`}>
          {busy ? <Loader2 size={14} aria-hidden="true" className="spin" /> : null}
          {status.message}
        </div>

        <div className="summary-grid">
          <Metric label="Live banners" value={activePromotions.length} meta="Visible to Contractor and Team Member apps" />
          <Metric label="Drafts" value={draftPromotions.length} meta="Saved but not visible" />
          <Metric label="Expired" value={expiredPromotions.length} meta="Automatically hidden from mobile" />
          <Metric label="Archived" value={archivedPromotions.length} meta="Inactive promotion history" />
        </div>

        <section className="promotion-landing">
          <div className="promotion-hero-panel">
            <div className="panel-header compact-header">
              <div>
                <h2 className="panel-title">Current App Banner</h2>
                <div className="panel-subtitle">The end-user app shows active, non-expired all-user promotions.</div>
              </div>
              <Megaphone size={19} aria-hidden="true" />
            </div>
            {previewPromotion ? <PromotionPreview promotion={previewPromotion} /> : <div className="panel-empty">No promotions have been created yet.</div>}
          </div>
          <div className="promotion-control-panel">
            <div>
              <div className="eyebrow">Owner Controls</div>
              <h2 className="panel-title">Manage Promotions</h2>
              <p className="panel-subtitle">
                Create all-user banners, upload media, control overlay text, and deactivate expired campaigns without touching app code.
              </p>
            </div>
            <div className="actions vertical-actions">
              <button className="button primary" type="button" onClick={() => setMode("manage")}>
                <Edit3 size={16} aria-hidden="true" />
                Manage Promotions
              </button>
              <button className="button" disabled={busy} type="button" onClick={() => void loadPromotions()}>
                <RefreshCw size={16} aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <div className="panel">
          <div className="panel-header compact-header">
            <div>
              <h2 className="panel-title">Promotion Register</h2>
              <div className="panel-subtitle">OWNER-only campaign history and current state.</div>
            </div>
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          <PromotionList
            busy={busy}
            promotions={promotions}
            onActivate={activatePromotion}
            onDeactivate={deactivatePromotion}
            onSelect={selectPromotion}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="actions">
        <button className="button" type="button" onClick={() => setMode("landing")}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Promotions
        </button>
        <button className="button" type="button" onClick={startNewPromotion}>
          <Megaphone size={16} aria-hidden="true" />
          New Promotion
        </button>
        <button className="button" disabled={busy} type="button" onClick={() => void loadPromotions()}>
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className={`status ${status.tone === "error" ? "error" : status.tone === "success" ? "success" : ""}`}>
        {busy ? <Loader2 size={14} aria-hidden="true" className="spin" /> : null}
        {status.message}
      </div>

      <div className="promotions-manage-grid">
        <section className="panel">
          <div className="panel-header compact-header">
            <div>
              <h2 className="panel-title">{selectedPromotion ? "Edit Promotion" : "Create Promotion"}</h2>
              <div className="panel-subtitle">All promotions are all-user banners in this version.</div>
            </div>
            <Palette size={18} aria-hidden="true" />
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="field-label">Title</span>
              <input className="text-input" maxLength={80} value={draft.title} onChange={(event) => setDraftValue("title", event.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Overlay text</span>
              <input className="text-input" maxLength={60} value={draft.overlayText} onChange={(event) => setDraftValue("overlayText", event.target.value)} />
            </label>
            <label className="field wide-field">
              <span className="field-label">Body</span>
              <textarea className="text-input promotion-textarea" maxLength={180} value={draft.body} onChange={(event) => setDraftValue("body", event.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Overlay color</span>
              <input className="color-input" type="color" value={draft.overlayTextColor} onChange={(event) => setDraftValue("overlayTextColor", event.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Font size</span>
              <input className="text-input" inputMode="numeric" value={draft.overlayFontSize} onChange={(event) => setDraftValue("overlayFontSize", event.target.value.replace(/\D/g, ""))} />
            </label>
            <label className="field">
              <span className="field-label">Font type</span>
              <select className="select-input" value={draft.overlayFontFamily} onChange={(event) => setDraftValue("overlayFontFamily", event.target.value as AdminPromotionFontFamily)}>
                {promotionFontFamilyOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <fieldset className="field toggle-field">
              <legend className="field-label">Text treatment</legend>
              <label className="check-row">
                <input
                  checked={isBoldStyle(draft.overlayFontStyle)}
                  className="checkbox"
                  type="checkbox"
                  onChange={(event) => setDraftValue("overlayFontStyle", fontStyleFromToggles(event.target.checked, isItalicStyle(draft.overlayFontStyle)))}
                />
                <span>Bold</span>
              </label>
              <label className="check-row">
                <input
                  checked={isItalicStyle(draft.overlayFontStyle)}
                  className="checkbox"
                  type="checkbox"
                  onChange={(event) => setDraftValue("overlayFontStyle", fontStyleFromToggles(isBoldStyle(draft.overlayFontStyle), event.target.checked))}
                />
                <span>Italic</span>
              </label>
            </fieldset>
            <div className="field toggle-field">
              <span className="field-label">Horizontal scroller</span>
              <label className="check-row">
                <input
                  checked={draft.marqueeEnabled}
                  className="checkbox"
                  type="checkbox"
                  onChange={(event) => setDraftValue("marqueeEnabled", event.target.checked)}
                />
                <span>Marquee text</span>
              </label>
            </div>
            <label className="field">
              <span className="field-label">Expiry</span>
              <input className="text-input" type="datetime-local" value={draft.endsAt} onChange={(event) => setDraftValue("endsAt", event.target.value)} />
            </label>
            <label className="field wide-field">
              <span className="field-label">Media URL</span>
              <input className="text-input" placeholder="https://..." value={draft.assetUrl} onChange={(event) => setDraftValue("assetUrl", event.target.value)} />
            </label>
            <label className="field wide-field">
              <span className="field-label">Alt text</span>
              <input className="text-input" value={draft.assetAltText} onChange={(event) => setDraftValue("assetAltText", event.target.value)} />
            </label>
          </div>

          <div className="promotion-upload-row">
            <div>
              <span className="field-label">Upload promotion image</span>
              <span className="panel-subtitle">PNG, JPG, JPEG, or GIF under 2 MB.</span>
            </div>
            <FilePickerButton
              accept={promotionAssetAccept}
              ariaLabel="Browse promotion image"
              disabled={busy}
              icon={<ImagePlus size={16} aria-hidden="true" />}
              label="Browse promotion image"
              onFile={(file) => void handlePromotionAsset(file)}
            />
          </div>

          <div className="actions">
            <button className="button primary" disabled={busy} type="button" onClick={() => void savePromotion()}>
              Save Promotion
            </button>
            {selectedPromotion?.status === "ACTIVE" ? (
              <button className="button danger" disabled={busy} type="button" onClick={() => void deactivatePromotion(selectedPromotion)}>
                <PowerOff size={16} aria-hidden="true" />
                Deactivate
              </button>
            ) : selectedPromotion ? (
              <button className="button" disabled={busy} type="button" onClick={() => void activatePromotion(selectedPromotion)}>
                <Power size={16} aria-hidden="true" />
                Activate
              </button>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header compact-header">
            <div>
              <h2 className="panel-title">Live Preview</h2>
              <div className="panel-subtitle">Approximate end-user dashboard treatment.</div>
            </div>
            <CalendarClock size={18} aria-hidden="true" />
          </div>
          <DraftPromotionPreview draft={draft} />
          <PromotionList
            busy={busy}
            compact
            promotions={promotions}
            onActivate={activatePromotion}
            onDeactivate={deactivatePromotion}
            onSelect={selectPromotion}
          />
        </section>
      </div>
    </div>
  );

  function setDraftValue<Key extends keyof PromotionDraft>(key: Key, value: PromotionDraft[Key]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }
}

function Metric({ label, meta, value }: { readonly label: string; readonly meta: string; readonly value: number }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-meta">{meta}</div>
    </div>
  );
}

function PromotionList({
  busy,
  compact = false,
  onActivate,
  onDeactivate,
  onSelect,
  promotions,
}: {
  readonly busy: boolean;
  readonly compact?: boolean;
  readonly onActivate: (promotion: AdminPromotion) => Promise<void>;
  readonly onDeactivate: (promotion: AdminPromotion) => Promise<void>;
  readonly onSelect: (promotion: AdminPromotion) => void;
  readonly promotions: readonly AdminPromotion[];
}) {
  if (promotions.length === 0) {
    return <div className="panel-empty compact">No promotions yet.</div>;
  }

  return (
    <div className={compact ? "promotion-list compact" : "promotion-list"}>
      {promotions.map((promotion) => (
        <div className="promotion-row" key={promotion.promotionId}>
          <div className="promotion-row-media">
            {promotion.assetUrl ? <img alt={promotion.assetAltText ?? promotion.title} src={promotion.assetUrl} /> : <Megaphone size={18} aria-hidden="true" />}
          </div>
          <div className="promotion-row-copy">
            <strong>{promotion.title}</strong>
            <span>{promotion.body}</span>
            <div className="promotion-row-meta">
              <StatusBadge promotion={promotion} />
              <span>{promotion.endsAt ? `Expires ${formatDateTime(promotion.endsAt)}` : "No expiry"}</span>
            </div>
          </div>
          <div className="promotion-row-actions">
            <button className="button compact" type="button" onClick={() => onSelect(promotion)}>
              Edit
            </button>
            {promotion.status === "ACTIVE" ? (
              <button className="button compact danger" disabled={busy} type="button" onClick={() => void onDeactivate(promotion)}>
                Deactivate
              </button>
            ) : (
              <button className="button compact" disabled={busy || isExpired(promotion)} type="button" onClick={() => void onActivate(promotion)}>
                Activate
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ promotion }: { readonly promotion: AdminPromotion }) {
  const expired = isExpired(promotion);
  const label = expired ? "Expired" : promotion.status === "ACTIVE" ? "Active" : promotion.status === "DRAFT" ? "Draft" : "Archived";
  const tone = expired ? "warn" : promotion.status === "ACTIVE" ? "good" : promotion.status === "ARCHIVED" ? "danger" : "";
  return <span className={`badge ${tone}`}>{label}</span>;
}

function PromotionPreview({ promotion }: { readonly promotion: AdminPromotion }) {
  return (
    <div className="promotion-preview" style={{ backgroundImage: promotion.assetUrl ? `url(${promotion.assetUrl})` : undefined }}>
      <div className="promotion-preview-shade">
        <div
          className={`promotion-preview-title ${fontStyleClass(promotion.overlayFontStyle)} ${promotion.marqueeEnabled ? "marquee" : ""}`}
          style={{
            color: promotion.overlayTextColor,
            fontFamily: fontFamilyCss(promotion.overlayFontFamily),
            fontSize: `${promotion.overlayFontSize}px`,
          }}
        >
          <span>{promotion.overlayText || promotion.title}</span>
        </div>
        <p>{promotion.body}</p>
      </div>
    </div>
  );
}

function DraftPromotionPreview({ draft }: { readonly draft: PromotionDraft }) {
  const previewUrl = draft.uploadPreviewUrl || draft.assetUrl.trim();
  const title = draft.overlayText.trim() || draft.title.trim() || "Promotion headline";
  return (
    <div className="promotion-preview" style={{ backgroundImage: previewUrl ? `url(${previewUrl})` : undefined }}>
      <div className="promotion-preview-shade">
        <div
          className={`promotion-preview-title ${fontStyleClass(draft.overlayFontStyle)} ${draft.marqueeEnabled ? "marquee" : ""}`}
          style={{
            color: draft.overlayTextColor,
            fontFamily: fontFamilyCss(draft.overlayFontFamily),
            fontSize: `${Number(draft.overlayFontSize) || 28}px`,
          }}
        >
          <span>{title}</span>
        </div>
        <p>{draft.body.trim() || "Promotion description will appear here."}</p>
      </div>
    </div>
  );
}

function draftFromPromotion(promotion: AdminPromotion): PromotionDraft {
  return {
    title: promotion.title,
    body: promotion.body,
    assetUrl: promotion.assetUrl ?? "",
    assetAltText: promotion.assetAltText ?? "",
    overlayText: promotion.overlayText ?? "",
    overlayTextColor: promotion.overlayTextColor,
    overlayFontSize: String(promotion.overlayFontSize),
    overlayFontFamily: promotion.overlayFontFamily,
    overlayFontStyle: promotion.overlayFontStyle,
    marqueeEnabled: promotion.marqueeEnabled,
    endsAt: promotion.endsAt ? toDateTimeLocalValue(promotion.endsAt) : "",
  };
}

function buildPromotionPayload(draft: PromotionDraft): AdminPromotionWriteInput {
  const basePayload = {
    title: draft.title,
    body: draft.body,
    assetAltText: draft.assetAltText.trim() || null,
    overlayText: draft.overlayText.trim() || null,
    overlayTextColor: draft.overlayTextColor,
    overlayFontSize: Number(draft.overlayFontSize) || 28,
    overlayFontFamily: draft.overlayFontFamily,
    overlayFontStyle: draft.overlayFontStyle,
    marqueeEnabled: draft.marqueeEnabled,
    endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
    targetPersona: "ALL" as const,
  };
  if (draft.assetUpload) {
    return {
      ...basePayload,
      assetUpload: draft.assetUpload,
    };
  } else {
    return {
      ...basePayload,
      assetUrl: draft.assetUrl.trim() || null,
    };
  }
}

function isExpired(promotion: AdminPromotion): boolean {
  return promotion.endsAt ? new Date(promotion.endsAt).getTime() <= Date.now() : false;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read selected promotion image."));
    reader.readAsDataURL(file);
  });
}

function fontStyleClass(style: AdminPromotionFontStyle): string {
  switch (style) {
    case "italic":
      return "italic";
    case "boldItalic":
      return "bold italic";
    case "bold":
      return "bold";
    case "regular":
      return "";
  }
}

function isBoldStyle(style: AdminPromotionFontStyle): boolean {
  return style === "bold" || style === "boldItalic";
}

function isItalicStyle(style: AdminPromotionFontStyle): boolean {
  return style === "italic" || style === "boldItalic";
}

function fontStyleFromToggles(bold: boolean, italic: boolean): AdminPromotionFontStyle {
  if (bold && italic) {
    return "boldItalic";
  }
  if (bold) {
    return "bold";
  }
  if (italic) {
    return "italic";
  }
  return "regular";
}

function fontFamilyCss(value: AdminPromotionFontFamily): string {
  return promotionFontFamilyOptions.find((option) => option.value === value)?.css ?? promotionFontFamilyOptions[0]!.css;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
