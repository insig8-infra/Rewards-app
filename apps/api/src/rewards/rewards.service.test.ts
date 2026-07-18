import assert from "node:assert/strict";
import test from "node:test";
import { ACTOR_ROLE } from "@volt-rewards/domain";
import { getTier } from "./rewards.service.js";
import { RewardsService } from "./rewards.service.js";

test("getTier maps total accumulated points to Silver, Gold, Platinum, and Diamond", () => {
  assert.equal(getTier(0), "Silver");
  assert.equal(getTier(999), "Silver");
  assert.equal(getTier(1000), "Gold");
  assert.equal(getTier(4999), "Gold");
  assert.equal(getTier(5000), "Platinum");
  assert.equal(getTier(14999), "Platinum");
  assert.equal(getTier(15000), "Diamond");
});

test("RewardsService system-populates reward code for normal catalog creation", async () => {
  const fake = createRewardCatalogFakePrisma();
  const service = new RewardsService(fake.prisma);
  const actor = { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" };

  const first = await service.createCatalogItem(actor, {
    name: "Tool Bag",
    quickDescription: "Canvas electrician tool bag",
    cashValueInr: 1200,
    pointsRequired: 900,
    totalQuantity: 10,
    status: "DRAFT",
  }, new Date("2026-07-14T10:00:00.000Z"));
  const second = await service.createCatalogItem(actor, {
    name: "Tool Bag",
    quickDescription: "Second canvas electrician tool bag",
    cashValueInr: 1500,
    pointsRequired: 1000,
    totalQuantity: 8,
    status: "DRAFT",
  }, new Date("2026-07-14T10:05:00.000Z"));

  assert.equal(first.code, "RW-TOOL-BAG-001");
  assert.equal(second.code, "RW-TOOL-BAG-002");
  assert.deepEqual(fake.state.audits.map((audit) => audit.action), ["REWARD_CATALOG_CREATED", "REWARD_CATALOG_CREATED"]);
});

function createRewardCatalogFakePrisma() {
  const state = {
    items: [] as FakeRewardCatalogItem[],
    audits: [] as Array<Record<string, unknown>>,
  };
  const prisma = {
    rewardCatalogItem: {
      findUnique: async ({ where }: { readonly where: { readonly id?: string; readonly code?: string } }) =>
        state.items.find((item) => item.id === where.id || item.code === where.code) ?? null,
      create: async ({ data }: { readonly data: Record<string, unknown> }) => {
        const now = new Date("2026-07-14T10:00:00.000Z");
        const item: FakeRewardCatalogItem = {
          id: `reward_${state.items.length + 1}`,
          code: String(data.code),
          name: String(data.name),
          description: String(data.description ?? ""),
          cashValueInr: Number(data.cashValueInr),
          pointsRequired: Number(data.pointsRequired),
          totalQuantity: Number(data.totalQuantity),
          tierRequired: null,
          imageUrl: null,
          status: String(data.status ?? "DRAFT"),
          images: [],
          rewardClaims: [],
          createdAt: data.createdAt instanceof Date ? data.createdAt : now,
          updatedAt: now,
        };
        state.items.push(item);
        return item;
      },
    },
    auditEvent: {
      create: async ({ data }: { readonly data: Record<string, unknown> }) => {
        state.audits.push(data);
        return data;
      },
    },
  };
  return { prisma: prisma as never, state };
}

type FakeRewardCatalogItem = {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly cashValueInr: number;
  readonly pointsRequired: number;
  readonly totalQuantity: number;
  readonly tierRequired: string | null;
  readonly imageUrl: string | null;
  readonly status: string;
  readonly images: readonly [];
  readonly rewardClaims: readonly [];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
