import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ACTOR_ROLE } from "@volt-rewards/domain";
import { Prisma, type Promotion } from "../generated/prisma/client.js";
import { PromotionStatus, PromotionTargetPersona } from "../generated/prisma/enums.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { resolveMediaUrlForRead, uploadPromotionAssetToStorage } from "../storage/media-storage.js";

export type PromotionFontStyle = "regular" | "bold" | "italic" | "boldItalic";
export type PromotionFontFamily =
  | "noto-sans-devanagari"
  | "noto-serif-devanagari"
  | "hind"
  | "mukta"
  | "inter"
  | "system";

export interface PromotionAssetInput {
  readonly fileName?: string;
  readonly contentType?: string;
  readonly dataUrl?: string;
  readonly altText?: string;
}

export interface PromotionWriteInput {
  readonly title?: string;
  readonly body?: string;
  readonly assetUrl?: string | null;
  readonly assetAltText?: string | null;
  readonly assetUpload?: PromotionAssetInput;
  readonly overlayText?: string | null;
  readonly overlayTextColor?: string;
  readonly overlayFontSize?: number;
  readonly overlayFontFamily?: PromotionFontFamily;
  readonly overlayFontStyle?: PromotionFontStyle;
  readonly marqueeEnabled?: boolean;
  readonly endsAt?: string | null;
  readonly status?: "DRAFT" | "ACTIVE";
  readonly targetPersona?: "ALL";
}

export interface AdminPromotionView {
  readonly promotionId: string;
  readonly title: string;
  readonly body: string;
  readonly assetUrl?: string;
  readonly assetAltText?: string;
  readonly overlayText?: string;
  readonly overlayTextColor: string;
  readonly overlayFontSize: number;
  readonly overlayFontFamily: PromotionFontFamily;
  readonly overlayFontStyle: PromotionFontStyle;
  readonly marqueeEnabled: boolean;
  readonly targetPersona: "ALL";
  readonly status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  readonly startsAt?: Date;
  readonly endsAt?: Date;
  readonly archivedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type PromotionBannerView = Omit<AdminPromotionView, "status" | "archivedAt">;

const promotionFontStyles = new Set<PromotionFontStyle>(["regular", "bold", "italic", "boldItalic"]);
const promotionFontFamilies = new Set<PromotionFontFamily>([
  "noto-sans-devanagari",
  "noto-serif-devanagari",
  "hind",
  "mukta",
  "inter",
  "system",
]);
const promotionTitleMaxLength = 80;
const promotionBodyMaxLength = 180;
const promotionOverlayMaxLength = 60;
const minOverlayFontSize = 14;
const maxOverlayFontSize = 42;

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdminPromotions(): Promise<readonly AdminPromotionView[]> {
    const promotions = await this.prisma.promotion.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });
    return promotions.map(mapAdminPromotion);
  }

  async createPromotion(actor: AuthenticatedActor, input: PromotionWriteInput, now = new Date()): Promise<AdminPromotionView> {
    assertAllUserTarget(input.targetPersona);
    const parsed = parsePromotionWriteInput(input, { requireTitle: true });
    const desiredStatus = input.status ?? "DRAFT";
    const created = await this.prisma.promotion.create({
      data: {
        title: parsed.title,
        body: parsed.body,
        assetUrl: parsed.assetUrl ?? null,
        assetAltText: parsed.assetAltText ?? null,
        overlayText: parsed.overlayText ?? null,
        overlayTextColor: parsed.overlayTextColor,
        overlayFontSize: parsed.overlayFontSize,
        overlayFontFamily: parsed.overlayFontFamily,
        overlayFontStyle: parsed.overlayFontStyle,
        marqueeEnabled: parsed.marqueeEnabled,
        targetPersona: PromotionTargetPersona.ALL,
        status: PromotionStatus.DRAFT,
        endsAt: parsed.endsAt ?? null,
        createdAt: now,
        updatedAt: now,
      },
    });

    let current = created;
    if (input.assetUpload) {
      current = await this.uploadAndAttachAsset(current, input.assetUpload);
    }
    if (desiredStatus === "ACTIVE") {
      assertCanActivate(current, now);
      current = await this.prisma.promotion.update({
        where: { id: current.id },
        data: {
          status: PromotionStatus.ACTIVE,
          archivedAt: null,
          updatedAt: now,
        },
      });
    }

    await this.auditPromotionChange(actor, "PROMOTION_CREATED", current.id, undefined, promotionAuditSnapshot(current), now);
    return mapAdminPromotion(current);
  }

  async updatePromotion(
    actor: AuthenticatedActor,
    promotionId: string,
    input: PromotionWriteInput,
    now = new Date(),
  ): Promise<AdminPromotionView> {
    assertAllUserTarget(input.targetPersona);
    const current = await this.getPromotionOrThrow(promotionId);
    const parsed = parsePromotionWriteInput(input, { requireTitle: false });
    const candidate = buildCandidatePromotion(current, parsed, Boolean(input.assetUpload));
    if (current.status === PromotionStatus.ACTIVE) {
      assertCanActivate(candidate, now);
    }

    let updated = await this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        ...parsed.data,
        updatedAt: now,
      },
    });
    if (input.assetUpload) {
      updated = await this.uploadAndAttachAsset(updated, input.assetUpload);
    }

    await this.auditPromotionChange(
      actor,
      "PROMOTION_UPDATED",
      promotionId,
      promotionAuditSnapshot(current),
      promotionAuditSnapshot(updated),
      now,
    );
    return mapAdminPromotion(updated);
  }

  async activatePromotion(actor: AuthenticatedActor, promotionId: string, now = new Date()): Promise<AdminPromotionView> {
    const current = await this.getPromotionOrThrow(promotionId);
    assertCanActivate(current, now);
    const updated = await this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        status: PromotionStatus.ACTIVE,
        archivedAt: null,
        updatedAt: now,
      },
    });
    await this.auditPromotionChange(
      actor,
      "PROMOTION_ACTIVATED",
      promotionId,
      promotionAuditSnapshot(current),
      promotionAuditSnapshot(updated),
      now,
    );
    return mapAdminPromotion(updated);
  }

  async deactivatePromotion(actor: AuthenticatedActor, promotionId: string, now = new Date()): Promise<AdminPromotionView> {
    const current = await this.getPromotionOrThrow(promotionId);
    const updated = await this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        status: PromotionStatus.ARCHIVED,
        archivedAt: now,
        updatedAt: now,
      },
    });
    await this.auditPromotionChange(
      actor,
      "PROMOTION_DEACTIVATED",
      promotionId,
      promotionAuditSnapshot(current),
      promotionAuditSnapshot(updated),
      now,
    );
    return mapAdminPromotion(updated);
  }

  async listActivePromotionsForActor(
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<readonly PromotionBannerView[]> {
    if (actor.role !== ACTOR_ROLE.CONTRACTOR && actor.role !== ACTOR_ROLE.TEAM_MEMBER) {
      return [];
    }
    const promotions = await this.prisma.promotion.findMany({
      where: {
        status: PromotionStatus.ACTIVE,
        targetPersona: PromotionTargetPersona.ALL,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 5,
    });
    return promotions.map(mapPromotionBanner);
  }

  private async uploadAndAttachAsset(promotion: Promotion, input: PromotionAssetInput): Promise<Promotion> {
    const parsed = parsePromotionAssetInput(input, promotion.title);
    const uploaded = await uploadPromotionAssetToStorage({
      promotionId: promotion.id,
      fileName: parsed.fileName,
      contentType: parsed.contentType,
      dataBase64: parsed.dataBase64,
    }).catch((error: unknown) => {
      throw new BadRequestException(error instanceof Error ? error.message : "Promotion asset upload failed.");
    });

    return this.prisma.promotion.update({
      where: { id: promotion.id },
      data: {
        assetUrl: uploaded.assetUrl,
        assetAltText: parsed.altText,
      },
    });
  }

  private async getPromotionOrThrow(promotionId: string): Promise<Promotion> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });
    if (!promotion) {
      throw new NotFoundException("Promotion was not found.");
    }
    return promotion;
  }

  private async auditPromotionChange(
    actor: AuthenticatedActor,
    action: string,
    targetId: string,
    beforeJson: Prisma.InputJsonValue | undefined,
    afterJson: Prisma.InputJsonValue,
    now: Date,
  ): Promise<void> {
    const actorUserId = actor.userId ? await this.findExistingUserId(actor.userId) : undefined;
    await this.prisma.auditEvent.create({
      data: {
        actorRole: actor.role,
        ...(actorUserId ? { actorUserId } : {}),
        surface: "ADMIN_WEB",
        action,
        targetType: "PROMOTION",
        targetId,
        ...(beforeJson ? { beforeJson } : {}),
        afterJson,
        createdAt: now,
      },
    });
  }

  private async findExistingUserId(userId: string): Promise<string | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return user?.id;
  }
}

function parsePromotionWriteInput(input: PromotionWriteInput, options: { readonly requireTitle: boolean }): {
  readonly title: string;
  readonly body: string;
  readonly assetUrl: string | null | undefined;
  readonly assetAltText: string | null | undefined;
  readonly overlayText: string | null | undefined;
  readonly overlayTextColor: string;
  readonly overlayFontSize: number;
  readonly overlayFontFamily: PromotionFontFamily;
  readonly overlayFontStyle: PromotionFontStyle;
  readonly marqueeEnabled: boolean;
  readonly endsAt: Date | null | undefined;
  readonly data: Prisma.PromotionUpdateInput;
} {
  const title = parseRequiredText(input.title, "Promotion title", promotionTitleMaxLength, options.requireTitle);
  const body = parseRequiredText(input.body, "Promotion body", promotionBodyMaxLength, options.requireTitle);
  const overlayText = parseOptionalText(input.overlayText, "Overlay text", promotionOverlayMaxLength);
  const overlayTextColor = parseColor(input.overlayTextColor ?? "#FFFFFF");
  const overlayFontSize = parseFontSize(input.overlayFontSize ?? 24);
  const overlayFontFamily = parseFontFamily(input.overlayFontFamily ?? "noto-sans-devanagari");
  const overlayFontStyle = parseFontStyle(input.overlayFontStyle ?? "bold");
  const marqueeEnabled = parseMarqueeEnabled(input.marqueeEnabled ?? false);
  const endsAt = parseOptionalDate(input.endsAt);
  const assetUrl = parseOptionalUrl(input.assetUrl);
  const assetAltText = parseOptionalText(input.assetAltText, "Asset alt text", 100);

  const data: Prisma.PromotionUpdateInput = {};
  if (input.title !== undefined) {
    data.title = title;
  }
  if (input.body !== undefined) {
    data.body = body;
  }
  if (input.assetUrl !== undefined) {
    data.assetUrl = assetUrl ?? null;
  }
  if (input.assetAltText !== undefined) {
    data.assetAltText = assetAltText ?? null;
  }
  if (input.overlayText !== undefined) {
    data.overlayText = overlayText ?? null;
  }
  if (input.overlayTextColor !== undefined) {
    data.overlayTextColor = overlayTextColor;
  }
  if (input.overlayFontSize !== undefined) {
    data.overlayFontSize = overlayFontSize;
  }
  if (input.overlayFontFamily !== undefined) {
    data.overlayFontFamily = overlayFontFamily;
  }
  if (input.overlayFontStyle !== undefined) {
    data.overlayFontStyle = overlayFontStyle;
  }
  if (input.marqueeEnabled !== undefined) {
    data.marqueeEnabled = marqueeEnabled;
  }
  if (input.endsAt !== undefined) {
    data.endsAt = endsAt ?? null;
  }

  return {
    title,
    body,
    assetUrl,
    assetAltText,
    overlayText,
    overlayTextColor,
    overlayFontSize,
    overlayFontFamily,
    overlayFontStyle,
    marqueeEnabled,
    endsAt,
    data,
  };
}

function parseRequiredText(
  value: string | undefined,
  label: string,
  maxLength: number,
  required: boolean,
): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed && required) {
    throw new BadRequestException(`${label} is required.`);
  }
  if (trimmed.length > maxLength) {
    throw new BadRequestException(`${label} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

function parseOptionalText(value: string | null | undefined, label: string, maxLength: number): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > maxLength) {
    throw new BadRequestException(`${label} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

function parseOptionalUrl(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("Unsupported protocol.");
    }
  } catch {
    throw new BadRequestException("Promotion media URL must be a valid HTTP or HTTPS URL.");
  }
  return trimmed;
}

function parseColor(value: string): string {
  const trimmed = value.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    throw new BadRequestException("Overlay text color must be a six-character hex color.");
  }
  return trimmed.toUpperCase();
}

function parseFontSize(value: number): number {
  if (!Number.isInteger(value) || value < minOverlayFontSize || value > maxOverlayFontSize) {
    throw new BadRequestException(`Overlay font size must be between ${minOverlayFontSize} and ${maxOverlayFontSize}.`);
  }
  return value;
}

function parseFontStyle(value: PromotionFontStyle): PromotionFontStyle {
  if (!promotionFontStyles.has(value)) {
    throw new BadRequestException("Overlay font style is invalid.");
  }
  return value;
}

function parseFontFamily(value: PromotionFontFamily): PromotionFontFamily {
  if (!promotionFontFamilies.has(value)) {
    throw new BadRequestException("Overlay font family is invalid.");
  }
  return value;
}

function parseMarqueeEnabled(value: boolean): boolean {
  if (typeof value !== "boolean") {
    throw new BadRequestException("Promotion marquee setting is invalid.");
  }
  return value;
}

function parseOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value.trim() === "") {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException("Promotion expiry date is invalid.");
  }
  return date;
}

function parsePromotionAssetInput(input: PromotionAssetInput, promotionTitle: string): {
  readonly fileName: string;
  readonly contentType: string;
  readonly dataBase64: string;
  readonly altText: string;
} {
  const dataUrl = input.dataUrl?.trim();
  const match = dataUrl?.match(/^data:(image\/(?:png|jpeg|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new BadRequestException("Upload a PNG, JPG, JPEG, or GIF promotion asset.");
  }
  return {
    fileName: input.fileName?.trim() || `${promotionTitle}.png`,
    contentType: match[1] ?? "",
    dataBase64: match[2] ?? "",
    altText: input.altText?.trim() || promotionTitle,
  };
}

function assertAllUserTarget(value: PromotionWriteInput["targetPersona"]): void {
  if (value !== undefined && value !== "ALL") {
    throw new BadRequestException("Promotion targeting is all-users only in this version.");
  }
}

function assertCanActivate(promotion: Pick<Promotion, "title" | "body" | "assetUrl" | "endsAt">, now: Date): void {
  if (!promotion.title.trim()) {
    throw new BadRequestException("Promotion title is required before activation.");
  }
  if (!promotion.body.trim()) {
    throw new BadRequestException("Promotion body is required before activation.");
  }
  if (!promotion.assetUrl?.trim()) {
    throw new BadRequestException("Upload or add a promotion image before activation.");
  }
  if (promotion.endsAt && promotion.endsAt <= now) {
    throw new BadRequestException("Promotion expiry must be in the future before activation.");
  }
}

function buildCandidatePromotion(
  current: Promotion,
  parsed: ReturnType<typeof parsePromotionWriteInput>,
  hasUpload: boolean,
): Pick<Promotion, "title" | "body" | "assetUrl" | "endsAt"> {
  return {
    title: parsed.data.title === undefined ? current.title : String(parsed.data.title),
    body: parsed.data.body === undefined ? current.body : String(parsed.data.body),
    assetUrl: hasUpload
      ? "pending-upload"
      : parsed.data.assetUrl === undefined
        ? current.assetUrl
        : (parsed.data.assetUrl as string | null),
    endsAt: parsed.data.endsAt === undefined ? current.endsAt : (parsed.data.endsAt as Date | null),
  };
}

function mapAdminPromotion(promotion: Promotion): AdminPromotionView {
  const assetUrl = resolveMediaUrlForRead(promotion.assetUrl);
  return {
    promotionId: promotion.id,
    title: promotion.title,
    body: promotion.body,
    ...(assetUrl ? { assetUrl } : {}),
    ...(promotion.assetAltText ? { assetAltText: promotion.assetAltText } : {}),
    ...(promotion.overlayText ? { overlayText: promotion.overlayText } : {}),
    overlayTextColor: promotion.overlayTextColor,
    overlayFontSize: promotion.overlayFontSize,
    overlayFontFamily: normalizeFontFamily(promotion.overlayFontFamily),
    overlayFontStyle: normalizeFontStyle(promotion.overlayFontStyle),
    marqueeEnabled: promotion.marqueeEnabled,
    targetPersona: "ALL",
    status: promotion.status,
    ...(promotion.startsAt ? { startsAt: promotion.startsAt } : {}),
    ...(promotion.endsAt ? { endsAt: promotion.endsAt } : {}),
    ...(promotion.archivedAt ? { archivedAt: promotion.archivedAt } : {}),
    createdAt: promotion.createdAt,
    updatedAt: promotion.updatedAt,
  };
}

function mapPromotionBanner(promotion: Promotion): PromotionBannerView {
  const mapped = mapAdminPromotion(promotion);
  return {
    promotionId: mapped.promotionId,
    title: mapped.title,
    body: mapped.body,
    ...(mapped.assetUrl ? { assetUrl: mapped.assetUrl } : {}),
    ...(mapped.assetAltText ? { assetAltText: mapped.assetAltText } : {}),
    ...(mapped.overlayText ? { overlayText: mapped.overlayText } : {}),
    overlayTextColor: mapped.overlayTextColor,
    overlayFontSize: mapped.overlayFontSize,
    overlayFontFamily: mapped.overlayFontFamily,
    overlayFontStyle: mapped.overlayFontStyle,
    marqueeEnabled: mapped.marqueeEnabled,
    targetPersona: mapped.targetPersona,
    ...(mapped.startsAt ? { startsAt: mapped.startsAt } : {}),
    ...(mapped.endsAt ? { endsAt: mapped.endsAt } : {}),
    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
  };
}

function promotionAuditSnapshot(promotion: Promotion): Prisma.InputJsonObject {
  return {
    promotionId: promotion.id,
    title: promotion.title,
    status: promotion.status,
    targetPersona: promotion.targetPersona,
    assetUrl: promotion.assetUrl,
    overlayText: promotion.overlayText,
    overlayFontFamily: promotion.overlayFontFamily,
    marqueeEnabled: promotion.marqueeEnabled,
    endsAt: promotion.endsAt?.toISOString() ?? null,
  };
}

function normalizeFontStyle(value: string): PromotionFontStyle {
  return promotionFontStyles.has(value as PromotionFontStyle) ? value as PromotionFontStyle : "bold";
}

function normalizeFontFamily(value: string): PromotionFontFamily {
  return promotionFontFamilies.has(value as PromotionFontFamily) ? value as PromotionFontFamily : "noto-sans-devanagari";
}
