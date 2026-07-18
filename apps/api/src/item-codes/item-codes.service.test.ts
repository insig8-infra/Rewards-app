import assert from "node:assert/strict";
import test from "node:test";
import { ACTOR_ROLE, ITEM_CODE_STATUS } from "@volt-rewards/domain";
import type { PrismaService } from "../prisma/prisma.service.js";
import { ItemCodesService } from "./item-codes.service.js";

test("BUSY item master full sync preserves Volt reward rules and marks missing active items", async () => {
  const prisma = createFakeItemCodePrisma([
    buildItemCodeRow({
      id: "item_40291",
      tempItemCode: "40291",
      itemName: "Old TestItem",
      price: "100.00",
      fixedPoints: 10,
      status: ITEM_CODE_STATUS.IN_USE,
    }),
    buildItemCodeRow({
      id: "item_old",
      tempItemCode: "OLD",
      itemName: "Old Missing Item",
      price: "50.00",
      fixedPoints: 5,
      status: ITEM_CODE_STATUS.IN_USE,
    }),
  ]);
  const service = new ItemCodesService(prisma as unknown as PrismaService);
  const syncedAt = new Date("2026-07-17T10:00:00.000Z");

  const result = await service.syncFromBusyItemMasterPayload(
    {
      items: [
        {
          tmpItemCode: "40291",
          ItemName: "Updated TestItem",
          Price: "200",
          tmpGroupName: "General",
        },
      ],
    },
    { mode: "FULL", syncedAt },
  );

  assert.equal(result.sourceCount, 1);
  assert.equal(result.updatedCount, 1);
  assert.equal(result.createdCount, 0);
  assert.equal(result.missingCount, 1);

  const updated = prisma.findByCode("40291");
  assert.equal(updated?.itemName, "Updated TestItem");
  assert.equal(updated?.price, "200.00");
  assert.equal(updated?.fixedPoints, 10);
  assert.equal(updated?.status, ITEM_CODE_STATUS.IN_USE);
  assert.equal(updated?.busyActive, true);

  const missing = prisma.findByCode("OLD");
  assert.equal(missing?.busyActive, false);
  assert.equal(missing?.status, ITEM_CODE_STATUS.NOT_IN_BUSY);
  assert.equal(missing?.missingSince?.toISOString(), syncedAt.toISOString());
  assert.equal(prisma.auditEvents[0]?.actorRole, ACTOR_ROLE.SYSTEM);
  assert.equal(prisma.auditEvents[0]?.action, "BUSY_ITEM_CODES_FULL_SYNC");
});

test("BUSY item master delta upsert creates new items without marking unrelated items missing", async () => {
  const prisma = createFakeItemCodePrisma([
    buildItemCodeRow({
      id: "item_existing",
      tempItemCode: "EXISTING",
      itemName: "Existing Item",
      price: "50.00",
      fixedPoints: null,
      status: ITEM_CODE_STATUS.NOT_IN_USE,
    }),
  ]);
  const service = new ItemCodesService(prisma as unknown as PrismaService);
  const syncedAt = new Date("2026-07-17T11:00:00.000Z");

  const result = await service.syncFromBusyItemMasterPayload(
    [{ tmpItemCode: "777", ItemName: "New BUSY Item", Price: "75.5", Active: "yes" }],
    { mode: "DELTA", syncedAt },
  );

  assert.equal(result.sourceCount, 1);
  assert.equal(result.createdCount, 1);
  assert.equal(result.missingCount, 0);

  const existing = prisma.findByCode("EXISTING");
  assert.equal(existing?.busyActive, true);
  assert.equal(existing?.status, ITEM_CODE_STATUS.NOT_IN_USE);

  const created = prisma.findByCode("777");
  assert.equal(created?.itemName, "New BUSY Item");
  assert.equal(created?.price, "75.50");
  assert.equal(created?.fixedPoints, null);
  assert.equal(created?.status, ITEM_CODE_STATUS.NOT_IN_USE);
  assert.equal(created?.busyActive, true);
  assert.equal(prisma.auditEvents[0]?.action, "BUSY_ITEM_CODES_DELTA_SYNC");
});

interface FakeItemCodeRow {
  id: string;
  tempItemCode: string;
  itemName: string;
  productCategory: string | null;
  price: string;
  fixedPoints: number | null;
  percentOfPricePoints: string | number | null;
  status: string;
  busyActive: boolean;
  lastBusySyncAt: Date | null;
  missingSince: Date | null;
  sourcePriceField: string;
  rawSource: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface FakeAuditEvent {
  readonly actorRole: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly metadata?: unknown;
}

function buildItemCodeRow(input: Partial<FakeItemCodeRow> & {
  readonly id: string;
  readonly tempItemCode: string;
  readonly itemName: string;
  readonly price: string;
}): FakeItemCodeRow {
  const now = new Date("2026-07-17T09:00:00.000Z");
  return {
    productCategory: null,
    fixedPoints: null,
    percentOfPricePoints: null,
    status: ITEM_CODE_STATUS.NOT_IN_USE,
    busyActive: true,
    lastBusySyncAt: null,
    missingSince: null,
    sourcePriceField: "Price",
    rawSource: {},
    createdAt: now,
    updatedAt: now,
    ...input,
  };
}

function createFakeItemCodePrisma(initialRows: readonly FakeItemCodeRow[]) {
  const rows = initialRows.map((row) => ({ ...row }));
  const auditEvents: FakeAuditEvent[] = [];
  let nextId = rows.length + 1;

  const itemCode = {
    findUnique: async (args: { readonly where: { readonly tempItemCode?: string; readonly id?: string }; readonly select?: Record<string, boolean> }) => {
      const row = findRow(rows, args.where);
      return row ? projectRow(row, args.select) : null;
    },
    create: async (args: { readonly data: Record<string, unknown> }) => {
      const now = new Date("2026-07-17T12:00:00.000Z");
      const row = buildItemCodeRow({
        id: `item_${nextId++}`,
        tempItemCode: String(args.data.tempItemCode),
        itemName: String(args.data.itemName),
        productCategory: (args.data.productCategory as string | null | undefined) ?? null,
        price: String(args.data.price),
        fixedPoints: (args.data.fixedPoints as number | null | undefined) ?? null,
        percentOfPricePoints: (args.data.percentOfPricePoints as string | number | null | undefined) ?? null,
        status: String(args.data.status),
        busyActive: Boolean(args.data.busyActive),
        lastBusySyncAt: (args.data.lastBusySyncAt as Date | null | undefined) ?? null,
        missingSince: (args.data.missingSince as Date | null | undefined) ?? null,
        sourcePriceField: String(args.data.sourcePriceField ?? "Price"),
        rawSource: args.data.rawSource ?? {},
        createdAt: now,
        updatedAt: now,
      });
      rows.push(row);
      return row;
    },
    update: async (args: { readonly where: { readonly id: string }; readonly data: Record<string, unknown> }) => {
      const row = rows.find((candidate) => candidate.id === args.where.id);
      assert.ok(row);
      Object.assign(row, args.data, { updatedAt: new Date("2026-07-17T12:30:00.000Z") });
      return row;
    },
    findMany: async (args: { readonly where?: Record<string, unknown>; readonly select?: Record<string, boolean> } = {}) => {
      const filtered = rows.filter((row) => matchesWhere(row, args.where));
      return args.select ? filtered.map((row) => projectRow(row, args.select)) : filtered;
    },
  };

  const auditEvent = {
    create: async (args: { readonly data: FakeAuditEvent }) => {
      auditEvents.push(args.data);
      return args.data;
    },
  };

  return {
    itemCode,
    auditEvent,
    auditEvents,
    $transaction: async <T>(run: (tx: { readonly itemCode: typeof itemCode; readonly auditEvent: typeof auditEvent }) => Promise<T>) =>
      run({ itemCode, auditEvent }),
    findByCode: (tempItemCode: string) => rows.find((row) => row.tempItemCode === tempItemCode),
  };
}

function findRow(
  rows: readonly FakeItemCodeRow[],
  where: { readonly tempItemCode?: string; readonly id?: string },
): FakeItemCodeRow | undefined {
  return rows.find((row) => row.tempItemCode === where.tempItemCode || row.id === where.id);
}

function projectRow(row: FakeItemCodeRow, select: Record<string, boolean> | undefined): Record<string, unknown> {
  if (!select) {
    return row as unknown as Record<string, unknown>;
  }
  const projected: Record<string, unknown> = {};
  for (const [key, include] of Object.entries(select)) {
    if (include) {
      projected[key] = (row as unknown as Record<string, unknown>)[key];
    }
  }
  return projected;
}

function matchesWhere(row: FakeItemCodeRow, where: Record<string, unknown> | undefined): boolean {
  if (!where) {
    return true;
  }
  if (where.busyActive !== undefined && row.busyActive !== where.busyActive) {
    return false;
  }
  if (isRecord(where.tempItemCode)) {
    const notIn = where.tempItemCode.notIn;
    if (Array.isArray(notIn) && notIn.includes(row.tempItemCode)) {
      return false;
    }
  }
  if (isRecord(where.status)) {
    const values = where.status.in;
    if (Array.isArray(values) && !values.includes(row.status)) {
      return false;
    }
  }
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
