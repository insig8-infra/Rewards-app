import { Injectable } from "@nestjs/common";
import {
  ACTOR_ROLE,
  DomainError,
  ITEM_CODE_STATUS,
  resolveItemCodeStatus,
  validateItemCodeRewardRule,
  type ItemCodeRewardRuleType,
  ITEM_CODE_REWARD_RULE_TYPE,
} from "@volt-rewards/domain";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { MOCK_BUSY_INVOICES } from "../busy/mock-busy-invoices.js";
import { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";

export type AdminItemCodeStatus = "IN_USE" | "NOT_IN_USE" | "NOT_IN_BUSY";

export interface AdminItemCodeView {
  readonly itemCodeId: string;
  readonly tempItemCode: string;
  readonly itemName: string;
  readonly productCategory?: string;
  readonly price: string;
  readonly fixedPoints?: number;
  readonly percentOfPricePoints?: string;
  readonly percentOfPriceCalculatedPoints?: number;
  readonly finalPoints?: number;
  readonly rewardRuleType: ItemCodeRewardRuleType;
  readonly ruleSummary: string;
  readonly status: AdminItemCodeStatus;
  readonly statusLabel: string;
  readonly busyActive: boolean;
  readonly sourcePriceField: string;
  readonly lastBusySyncAt?: Date;
  readonly missingSince?: Date;
  readonly updatedAt: Date;
}

export interface ItemCodeRefreshResult {
  readonly sourceCount: number;
  readonly createdCount: number;
  readonly updatedCount: number;
  readonly missingCount: number;
  readonly attentionCount: number;
  readonly latestSyncAt: Date;
  readonly itemsNeedingAttention: readonly AdminItemCodeView[];
}

export type BusyItemMasterSyncMode = "FULL" | "DELTA";

export interface BusyItemMasterSyncOptions {
  readonly mode: BusyItemMasterSyncMode;
  readonly syncedAt: Date;
  readonly actor?: AuthenticatedActor;
}

export interface ItemCodeRewardRuleUpdateInput {
  readonly fixedPoints?: number | null;
  readonly percentOfPricePoints?: number | null;
}

interface BusyItemCodeSource {
  readonly tempItemCode: string;
  readonly itemName: string;
  readonly productCategory?: string;
  readonly price: string;
  readonly fixedPoints: number | null;
  readonly busyActive: boolean;
  readonly rawSource: Prisma.InputJsonObject;
}

@Injectable()
export class ItemCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async listItemCodes(input: {
    readonly query?: string;
    readonly status?: AdminItemCodeStatus | "ALL";
  } = {}): Promise<readonly AdminItemCodeView[]> {
    const query = input.query?.trim();
    const rows = await this.prisma.itemCode.findMany({
      where: {
        ...(input.status && input.status !== "ALL" ? { status: input.status } : {}),
        ...(query
          ? {
              OR: [
                { tempItemCode: { contains: query, mode: "insensitive" as const } },
                { itemName: { contains: query, mode: "insensitive" as const } },
                { productCategory: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ status: "asc" }, { itemName: "asc" }],
    });

    return rows.map(toItemCodeView);
  }

  async refreshFromBusyAdapter(actor: AuthenticatedActor, refreshedAt: Date): Promise<ItemCodeRefreshResult> {
    assertOwner(actor);
    const sourceRows = buildBusyItemCodeSources();
    const sourceCodes = [...sourceRows.keys()];
    let createdCount = 0;
    let updatedCount = 0;
    let missingCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const source of sourceRows.values()) {
        const existing = await tx.itemCode.findUnique({
          where: { tempItemCode: source.tempItemCode },
          select: {
            id: true,
            fixedPoints: true,
            percentOfPricePoints: true,
          },
        });

        if (existing) {
          await tx.itemCode.update({
            where: { id: existing.id },
            data: {
              itemName: source.itemName,
              productCategory: source.productCategory ?? null,
              price: source.price,
              status: resolveItemCodeStatus({
                busyActive: true,
                fixedPoints: existing.fixedPoints,
                percentOfPricePoints: existing.percentOfPricePoints
                  ? Number(existing.percentOfPricePoints)
                  : null,
              }),
              busyActive: true,
              lastBusySyncAt: refreshedAt,
              missingSince: null,
              sourcePriceField: "Price",
              rawSource: source.rawSource,
            },
          });
          updatedCount += 1;
        } else {
          await tx.itemCode.create({
            data: {
              tempItemCode: source.tempItemCode,
              itemName: source.itemName,
              productCategory: source.productCategory ?? null,
              price: source.price,
              fixedPoints: source.fixedPoints,
              percentOfPricePoints: null,
              status: resolveItemCodeStatus({
                busyActive: true,
                fixedPoints: source.fixedPoints,
              }),
              busyActive: true,
              lastBusySyncAt: refreshedAt,
              sourcePriceField: "Price",
              rawSource: source.rawSource,
            },
          });
          createdCount += 1;
        }
      }

      const missingItems = await tx.itemCode.findMany({
        where: {
          busyActive: true,
          ...(sourceCodes.length > 0 ? { tempItemCode: { notIn: sourceCodes } } : {}),
        },
        select: {
          id: true,
          missingSince: true,
        },
      });

      for (const item of missingItems) {
        await tx.itemCode.update({
          where: { id: item.id },
          data: {
            busyActive: false,
            status: ITEM_CODE_STATUS.NOT_IN_BUSY,
            missingSince: item.missingSince ?? refreshedAt,
            lastBusySyncAt: refreshedAt,
          },
        });
      }
      missingCount = missingItems.length;

      await tx.auditEvent.create({
        data: {
          actorRole: actor.role,
          surface: "ADMIN_WEB",
          action: "ITEM_CODES_REFRESH",
          targetType: "ITEM_CODE",
          targetId: "BULK",
          ...(actor.userId ? { actorUserId: actor.userId } : {}),
          metadata: {
            sourceCount: sourceRows.size,
            createdCount,
            updatedCount,
            missingCount,
          },
          createdAt: refreshedAt,
        },
      });
    });

    const attentionRows = await this.getAttentionRows();
    return {
      sourceCount: sourceRows.size,
      createdCount,
      updatedCount,
      missingCount,
      attentionCount: attentionRows.length,
      latestSyncAt: refreshedAt,
      itemsNeedingAttention: attentionRows,
    };
  }

  async syncFromBusyItemMasterPayload(
    payload: unknown,
    options: BusyItemMasterSyncOptions,
  ): Promise<ItemCodeRefreshResult> {
    const sourceRows = buildBusyItemCodeSourcesFromPayload(payload);
    const sourceCodes = [...sourceRows.keys()];
    let createdCount = 0;
    let updatedCount = 0;
    let missingCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const source of sourceRows.values()) {
        const existing = await tx.itemCode.findUnique({
          where: { tempItemCode: source.tempItemCode },
          select: {
            id: true,
            fixedPoints: true,
            percentOfPricePoints: true,
            missingSince: true,
          },
        });

        if (existing) {
          await tx.itemCode.update({
            where: { id: existing.id },
            data: {
              itemName: source.itemName,
              productCategory: source.productCategory ?? null,
              price: source.price,
              status: resolveItemCodeStatus({
                busyActive: source.busyActive,
                fixedPoints: existing.fixedPoints,
                percentOfPricePoints: existing.percentOfPricePoints
                  ? Number(existing.percentOfPricePoints)
                  : null,
              }),
              busyActive: source.busyActive,
              lastBusySyncAt: options.syncedAt,
              missingSince: source.busyActive ? null : existing.missingSince ?? options.syncedAt,
              sourcePriceField: "Price",
              rawSource: source.rawSource,
            },
          });
          updatedCount += 1;
        } else {
          await tx.itemCode.create({
            data: {
              tempItemCode: source.tempItemCode,
              itemName: source.itemName,
              productCategory: source.productCategory ?? null,
              price: source.price,
              fixedPoints: null,
              percentOfPricePoints: null,
              status: resolveItemCodeStatus({
                busyActive: source.busyActive,
                fixedPoints: null,
                percentOfPricePoints: null,
              }),
              busyActive: source.busyActive,
              lastBusySyncAt: options.syncedAt,
              missingSince: source.busyActive ? null : options.syncedAt,
              sourcePriceField: "Price",
              rawSource: source.rawSource,
            },
          });
          createdCount += 1;
        }
      }

      if (options.mode === "FULL") {
        const missingItems = await tx.itemCode.findMany({
          where: {
            busyActive: true,
            tempItemCode: { notIn: sourceCodes },
          },
          select: {
            id: true,
            missingSince: true,
          },
        });

        for (const item of missingItems) {
          await tx.itemCode.update({
            where: { id: item.id },
            data: {
              busyActive: false,
              status: ITEM_CODE_STATUS.NOT_IN_BUSY,
              missingSince: item.missingSince ?? options.syncedAt,
              lastBusySyncAt: options.syncedAt,
            },
          });
        }
        missingCount = missingItems.length;
      }

      await tx.auditEvent.create({
        data: {
          actorRole: options.actor?.role ?? ACTOR_ROLE.SYSTEM,
          surface: "BACKEND_JOB",
          action: options.mode === "FULL" ? "BUSY_ITEM_CODES_FULL_SYNC" : "BUSY_ITEM_CODES_DELTA_SYNC",
          targetType: "ITEM_CODE",
          targetId: "BULK",
          ...(options.actor?.userId ? { actorUserId: options.actor.userId } : {}),
          metadata: {
            source: "BUSY_INTEGRATION",
            mode: options.mode,
            sourceCount: sourceRows.size,
            createdCount,
            updatedCount,
            missingCount,
          },
          createdAt: options.syncedAt,
        },
      });
    });

    const attentionRows = await this.getAttentionRows();
    return {
      sourceCount: sourceRows.size,
      createdCount,
      updatedCount,
      missingCount,
      attentionCount: attentionRows.length,
      latestSyncAt: options.syncedAt,
      itemsNeedingAttention: attentionRows,
    };
  }

  async updateRewardRule(
    itemCodeId: string,
    input: ItemCodeRewardRuleUpdateInput,
    actor: AuthenticatedActor,
    updatedAt: Date,
  ): Promise<AdminItemCodeView> {
    assertOwner(actor);
    const rule = validateItemCodeRewardRule(input);
    const existing = await this.prisma.itemCode.findUnique({
      where: { id: itemCodeId },
    });
    if (!existing) {
      throw new DomainError("ITEM_CODE_NOT_FOUND", "ItemCode was not found.");
    }

    const updated = await this.prisma.itemCode.update({
      where: { id: itemCodeId },
      data: {
        fixedPoints: rule.fixedPoints,
        percentOfPricePoints: rule.percentOfPricePoints,
        status: resolveItemCodeStatus({
          busyActive: existing.busyActive,
          fixedPoints: rule.fixedPoints,
          percentOfPricePoints: rule.percentOfPricePoints,
        }),
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        actorRole: actor.role,
        surface: "ADMIN_WEB",
        action: "ITEM_CODE_REWARD_RULE_UPDATE",
        targetType: "ITEM_CODE",
        targetId: itemCodeId,
        ...(actor.userId ? { actorUserId: actor.userId } : {}),
        beforeJson: {
          fixedPoints: existing.fixedPoints,
          percentOfPricePoints: existing.percentOfPricePoints?.toString() ?? null,
          status: existing.status,
        },
        afterJson: {
          fixedPoints: updated.fixedPoints,
          percentOfPricePoints: updated.percentOfPricePoints?.toString() ?? null,
          status: updated.status,
        },
        createdAt: updatedAt,
      },
    });

    return toItemCodeView(updated);
  }

  private async getAttentionRows(): Promise<readonly AdminItemCodeView[]> {
    const rows = await this.prisma.itemCode.findMany({
      where: { status: { in: [ITEM_CODE_STATUS.NOT_IN_USE, ITEM_CODE_STATUS.NOT_IN_BUSY] } },
      orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
      take: 8,
    });
    return rows.map(toItemCodeView);
  }
}

function assertOwner(actor: AuthenticatedActor): void {
  if (actor.role !== ACTOR_ROLE.OWNER) {
    throw new DomainError("ITEM_CODE_MANAGE_FORBIDDEN", "Only OWNER can edit ItemCode reward rules.");
  }
}

function buildBusyItemCodeSources(): Map<string, BusyItemCodeSource> {
  const rows = new Map<string, BusyItemCodeSource>();
  for (const invoice of MOCK_BUSY_INVOICES) {
    for (const line of invoice.lines) {
      rows.set(line.sku, {
        tempItemCode: line.sku,
        itemName: line.productName,
        ...(line.category ? { productCategory: line.category } : {}),
        price: line.unitRate,
        fixedPoints: line.pointsPerUnit > 0 ? line.pointsPerUnit : null,
        busyActive: true,
        rawSource: {
          tmpItemCode: line.sku,
          ItemName: line.productName,
          Price: line.unitRate,
          Qty: line.quantity,
          category: line.category ?? null,
          sourceInvoiceTmpVchCode: invoice.externalInvoiceId,
          sourceInvoiceNumber: invoice.invoiceNumber,
          PartyName: invoice.customer.name,
        },
      });
    }
  }

  return rows;
}

function buildBusyItemCodeSourcesFromPayload(payload: unknown): Map<string, BusyItemCodeSource> {
  const rows = new Map<string, BusyItemCodeSource>();
  const itemRows = extractBusyItemMasterRows(payload);

  for (const row of itemRows) {
    const tempItemCode = requiredItemMasterString(
      row,
      ["tmpItemCode", "TempItemCode", "ItemCode", "itemCode", "code"],
      "tmpItemCode",
    );
    if (rows.has(tempItemCode)) {
      throw new DomainError(
        "BUSY_ITEM_MASTER_DUPLICATE_ITEM_CODE",
        `BUSY item master payload included duplicate tmpItemCode ${tempItemCode}.`,
      );
    }

    const itemName = requiredItemMasterString(row, ["ItemName", "itemName", "Name", "name"], "ItemName");
    const price = decimalItemMasterString(
      requiredItemMasterString(row, ["Price", "price", "SalePrice", "salePrice", "MRP", "mrp"], "Price"),
      "Price",
    );
    const productCategory = optionalItemMasterString(row, [
      "tmpGroupName",
      "GroupName",
      "ItemGroup",
      "itemGroup",
      "ProductCategory",
      "category",
    ]);
    const busyActive = resolveBusyItemActive(row);

    rows.set(tempItemCode, {
      tempItemCode,
      itemName,
      ...(productCategory ? { productCategory } : {}),
      price,
      fixedPoints: null,
      busyActive,
      rawSource: toPrismaJsonObject(row),
    });
  }

  if (rows.size === 0) {
    throw new DomainError("BUSY_ITEM_MASTER_EMPTY", "BUSY item master payload did not include any item rows.");
  }

  return rows;
}

function extractBusyItemMasterRows(payload: unknown): readonly Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }
  if (!isRecord(payload)) {
    throw new DomainError("BUSY_ITEM_MASTER_INVALID_PAYLOAD", "BUSY item master payload must be an object or array.");
  }

  const candidateLists = [
    payload.items,
    payload.itemCodes,
    payload.ItemCodes,
    payload.ItemMaster,
    payload.ItemMasters,
    payload.ItemDetail,
  ];
  for (const candidate of candidateLists) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }
  }

  if (isRecord(payload.items)) {
    const nestedItems = payload.items.items;
    if (Array.isArray(nestedItems)) {
      return nestedItems.filter(isRecord);
    }
  }

  if (optionalItemMasterString(payload, ["tmpItemCode", "TempItemCode", "ItemCode", "itemCode", "code"])) {
    return [payload];
  }

  throw new DomainError("BUSY_ITEM_MASTER_INVALID_PAYLOAD", "BUSY item master payload did not include item rows.");
}

function requiredItemMasterString(row: Record<string, unknown>, keys: readonly string[], label: string): string {
  const value = optionalItemMasterString(row, keys);
  if (!value) {
    throw new DomainError("BUSY_ITEM_MASTER_FIELD_REQUIRED", `BUSY item master field ${label} is required.`);
  }
  return value;
}

function optionalItemMasterString(row: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) {
      continue;
    }
    const stringValue = String(value).trim();
    if (stringValue.length > 0) {
      return stringValue;
    }
  }
  return undefined;
}

function decimalItemMasterString(value: string, label: string): string {
  const normalized = value.replace(/,/g, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new DomainError("BUSY_ITEM_MASTER_PRICE_INVALID", `BUSY item master field ${label} must be a non-negative number.`);
  }
  return parsed.toFixed(2);
}

function resolveBusyItemActive(row: Record<string, unknown>): boolean {
  const deleted = optionalItemMasterString(row, ["IsDeleted", "isDeleted", "Deleted", "deleted"]);
  if (deleted && isTruthyBusyFlag(deleted)) {
    return false;
  }

  const active = optionalItemMasterString(row, ["IsActive", "isActive", "Active", "active", "busyActive"]);
  if (active) {
    return isTruthyBusyFlag(active);
  }

  const status = optionalItemMasterString(row, ["Status", "status", "ItemStatus", "itemStatus"]);
  if (status) {
    return !["inactive", "deleted", "disabled", "not in busy", "not_in_busy", "0", "false", "no"].includes(
      status.toLowerCase(),
    );
  }

  return true;
}

function isTruthyBusyFlag(value: string): boolean {
  return ["1", "true", "yes", "y", "active"].includes(value.toLowerCase());
}

function toPrismaJsonObject(row: Record<string, unknown>): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonObject;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toItemCodeView(item: {
  readonly id: string;
  readonly tempItemCode: string;
  readonly itemName: string;
  readonly productCategory: string | null;
  readonly price: unknown;
  readonly fixedPoints: number | null;
  readonly percentOfPricePoints: { readonly toString: () => string } | string | number | null;
  readonly status: string;
  readonly busyActive: boolean;
  readonly sourcePriceField: string;
  readonly lastBusySyncAt: Date | null;
  readonly missingSince: Date | null;
  readonly updatedAt: Date;
}): AdminItemCodeView {
  const percent = item.percentOfPricePoints?.toString();
  const percentOfPriceCalculatedPoints = resolvePercentOfPriceCalculatedPoints(String(item.price), percent);
  const finalPoints = item.fixedPoints ?? percentOfPriceCalculatedPoints ?? undefined;
  return {
    itemCodeId: item.id,
    tempItemCode: item.tempItemCode,
    itemName: item.itemName,
    ...(item.productCategory ? { productCategory: item.productCategory } : {}),
    price: String(item.price),
    ...(item.fixedPoints !== null ? { fixedPoints: item.fixedPoints } : {}),
    ...(percent ? { percentOfPricePoints: percent } : {}),
    ...(percentOfPriceCalculatedPoints !== undefined ? { percentOfPriceCalculatedPoints } : {}),
    ...(finalPoints !== undefined ? { finalPoints } : {}),
    rewardRuleType: getRewardRuleType(item.fixedPoints, percent),
    ruleSummary: getRuleSummary(item.fixedPoints, percent),
    status: item.status as AdminItemCodeStatus,
    statusLabel: getStatusLabel(item.status),
    busyActive: item.busyActive,
    sourcePriceField: item.sourcePriceField,
    ...(item.lastBusySyncAt ? { lastBusySyncAt: item.lastBusySyncAt } : {}),
    ...(item.missingSince ? { missingSince: item.missingSince } : {}),
    updatedAt: item.updatedAt,
  };
}

function resolvePercentOfPriceCalculatedPoints(price: string, percentOfPricePoints: string | undefined): number | undefined {
  if (!percentOfPricePoints) {
    return undefined;
  }
  const priceValue = Number(price);
  const percentValue = Number(percentOfPricePoints);
  if (!Number.isFinite(priceValue) || !Number.isFinite(percentValue)) {
    return undefined;
  }
  return Math.round(priceValue * percentValue / 100);
}

function getRewardRuleType(fixedPoints: number | null, percentOfPricePoints: string | undefined): ItemCodeRewardRuleType {
  if (fixedPoints !== null) {
    return ITEM_CODE_REWARD_RULE_TYPE.FIXED;
  }
  if (percentOfPricePoints) {
    return ITEM_CODE_REWARD_RULE_TYPE.PERCENT_OF_PRICE;
  }
  return ITEM_CODE_REWARD_RULE_TYPE.NONE;
}

function getRuleSummary(fixedPoints: number | null, percentOfPricePoints: string | undefined): string {
  if (fixedPoints !== null) {
    return `${fixedPoints} absolute pts`;
  }
  if (percentOfPricePoints) {
    return `${percentOfPricePoints}% of Price`;
  }
  return "No reward rule";
}

function getStatusLabel(status: string): string {
  if (status === ITEM_CODE_STATUS.IN_USE) {
    return "In Use";
  }
  if (status === ITEM_CODE_STATUS.NOT_IN_BUSY) {
    return "Not in BUSY";
  }
  return "Not In Use";
}
