import assert from "node:assert/strict";
import test from "node:test";
import { ACTOR_ROLE } from "@volt-rewards/domain";
import { PromotionsService } from "./promotions.service.js";

test("PromotionsService returns only active non-expired all-user promotions for mobile actors", async () => {
  const now = new Date("2026-07-08T10:00:00.000Z");
  const fake = createFakePrisma([
    promotion({ id: "active_all", title: "Visible", status: "ACTIVE", targetPersona: "ALL", endsAt: new Date("2026-07-09T10:00:00.000Z") }),
    promotion({ id: "expired_all", title: "Expired", status: "ACTIVE", targetPersona: "ALL", endsAt: new Date("2026-07-07T10:00:00.000Z") }),
    promotion({ id: "archived_all", title: "Archived", status: "ARCHIVED", targetPersona: "ALL" }),
    promotion({ id: "persona_specific", title: "Hidden", status: "ACTIVE", targetPersona: "CONTRACTOR", endsAt: new Date("2026-07-09T10:00:00.000Z") }),
  ]);
  const service = new PromotionsService(fake.prisma);

  const promotions = await service.listActivePromotionsForActor({ role: ACTOR_ROLE.CONTRACTOR, contractorId: "contractor_1" }, now);

  assert.deepEqual(promotions.map((item) => item.promotionId), ["active_all"]);
});

test("PromotionsService rejects activation without promotion media", async () => {
  const fake = createFakePrisma();
  const service = new PromotionsService(fake.prisma);

  await assert.rejects(
    service.createPromotion(
      { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
      {
        title: "NEW SALE IS ON!",
        body: "Earn extra rewards this week.",
        overlayText: "NEW SALE IS ON!",
        status: "ACTIVE",
        targetPersona: "ALL",
      },
      new Date("2026-07-08T10:00:00.000Z"),
    ),
    /promotion image before activation/i,
  );
  assert.equal(fake.state.audits.length, 0);
});

test("PromotionsService audits create and deactivate with robust actor user lookup", async () => {
  const fake = createFakePrisma();
  const service = new PromotionsService(fake.prisma);
  const created = await service.createPromotion(
    { role: ACTOR_ROLE.OWNER, userId: "non_existing_user" },
    {
      title: "NEW SALE IS ON!",
      body: "Earn extra rewards this week.",
      assetUrl: "https://example.test/banner.jpg",
      overlayText: "NEW SALE IS ON!",
      targetPersona: "ALL",
    },
    new Date("2026-07-08T10:00:00.000Z"),
  );

  await service.deactivatePromotion(
    { role: ACTOR_ROLE.OWNER, userId: "non_existing_user" },
    created.promotionId,
    new Date("2026-07-08T10:05:00.000Z"),
  );

  assert.deepEqual(fake.state.audits.map((audit) => audit.action), ["PROMOTION_CREATED", "PROMOTION_DEACTIVATED"]);
  assert.equal(fake.state.audits[0]?.actorUserId, undefined);
  assert.equal(fake.state.audits[1]?.targetType, "PROMOTION");
});

test("PromotionsService persists capped marquee and Hindi-safe font controls", async () => {
  const fake = createFakePrisma();
  const service = new PromotionsService(fake.prisma);

  const created = await service.createPromotion(
    { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
    {
      title: "Monsoon Rewards",
      body: "Scroll this offer across the app banner.",
      assetUrl: "https://example.test/monsoon.jpg",
      overlayText: "मानसून बोनस",
      overlayTextColor: "#0A4F57",
      overlayFontFamily: "hind",
      overlayFontStyle: "boldItalic",
      marqueeEnabled: true,
      targetPersona: "ALL",
    },
    new Date("2026-07-08T10:00:00.000Z"),
  );

  assert.equal(created.overlayFontFamily, "hind");
  assert.equal(created.overlayFontStyle, "boldItalic");
  assert.equal(created.marqueeEnabled, true);

  await assert.rejects(
    service.updatePromotion(
      { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
      created.promotionId,
      { overlayFontFamily: "comic-sans" as never },
      new Date("2026-07-08T10:05:00.000Z"),
    ),
    /font family is invalid/i,
  );
});

function createFakePrisma(initialPromotions: readonly FakePromotion[] = []) {
  const state = {
    promotions: [...initialPromotions],
    audits: [] as Array<Record<string, unknown>>,
  };
  const prisma = {
    promotion: {
      findMany: async ({ take, where }: { readonly take?: number; readonly where?: Record<string, unknown> }) => {
        const rows = filterPromotions(state.promotions, where);
        return typeof take === "number" ? rows.slice(0, take) : rows;
      },
      findUnique: async ({ where }: { readonly where: { readonly id: string } }) =>
        state.promotions.find((item) => item.id === where.id) ?? null,
      create: async ({ data }: { readonly data: Record<string, unknown> }) => {
        const row = promotion({
          id: `promo_${state.promotions.length + 1}`,
          ...data,
        });
        state.promotions.push(row);
        return row;
      },
      update: async ({ data, where }: { readonly data: Record<string, unknown>; readonly where: { readonly id: string } }) => {
        const index = state.promotions.findIndex((item) => item.id === where.id);
        if (index === -1) {
          throw new Error("Promotion not found in fake prisma.");
        }
        const row = {
          ...state.promotions[index],
          ...data,
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : state.promotions[index]?.updatedAt,
        } as FakePromotion;
        state.promotions[index] = row;
        return row;
      },
    },
    auditEvent: {
      create: async ({ data }: { readonly data: Record<string, unknown> }) => {
        state.audits.push(data);
        return data;
      },
    },
    user: {
      findUnique: async ({ where }: { readonly where: { readonly id: string } }) =>
        where.id === "owner_user_1" ? { id: where.id } : null,
    },
  };
  return { prisma: prisma as never, state };
}

function filterPromotions(promotions: readonly FakePromotion[], where?: Record<string, unknown>): FakePromotion[] {
  if (!where) {
    return [...promotions];
  }
  const now = extractVisibilityNow(where);
  return promotions.filter((item) => {
    if (where.status && item.status !== where.status) {
      return false;
    }
    if (where.targetPersona && item.targetPersona !== where.targetPersona) {
      return false;
    }
    if (now && item.startsAt && item.startsAt > now) {
      return false;
    }
    if (now && item.endsAt && item.endsAt <= now) {
      return false;
    }
    return true;
  });
}

function extractVisibilityNow(where: Record<string, unknown>): Date | undefined {
  const and = where.AND;
  if (!Array.isArray(and)) {
    return undefined;
  }
  const expiryClause = and[0] as { readonly OR?: readonly unknown[] } | undefined;
  const date = (expiryClause?.OR?.[1] as { readonly endsAt?: { readonly gt?: Date } } | undefined)?.endsAt?.gt;
  return date instanceof Date ? date : undefined;
}

type FakePromotion = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly assetUrl: string | null;
  readonly assetAltText: string | null;
  readonly overlayText: string | null;
  readonly overlayTextColor: string;
  readonly overlayFontSize: number;
  readonly overlayFontFamily: string;
  readonly overlayFontStyle: string;
  readonly marqueeEnabled: boolean;
  readonly targetPersona: string;
  readonly status: string;
  readonly startsAt: Date | null;
  readonly endsAt: Date | null;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

function promotion(overrides: Partial<FakePromotion> = {}): FakePromotion {
  const now = new Date("2026-07-08T10:00:00.000Z");
  return {
    id: "promo_1",
    title: "Promotion",
    body: "Earn extra rewards.",
    assetUrl: "https://example.test/banner.jpg",
    assetAltText: null,
    overlayText: null,
    overlayTextColor: "#FFFFFF",
    overlayFontSize: 28,
    overlayFontFamily: "noto-sans-devanagari",
    overlayFontStyle: "bold",
    marqueeEnabled: false,
    targetPersona: "ALL",
    status: "DRAFT",
    startsAt: null,
    endsAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
