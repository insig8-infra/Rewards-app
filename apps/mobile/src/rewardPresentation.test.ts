import assert from "node:assert/strict";
import { test } from "node:test";
import type { RewardCatalogTile } from "./api";
import { selectFeaturedRewards, splitRewardCatalog } from "./rewardPresentation";

test("featured rewards exclude delivered rewards", () => {
  const rewards = [
    reward({ name: "Delivered TV", status: "FULFILLED", pointsRequired: 12000, pointsGap: 0 }),
    reward({ name: "Toolbox", status: "ELIGIBLE", pointsRequired: 500, pointsGap: 0 }),
  ];

  assert.deepEqual(selectFeaturedRewards(rewards).map((item) => item.name), ["Toolbox"]);
});

test("featured rewards prioritize claim raised, get now, then nearest locked rewards", () => {
  const rewards = [
    reward({ name: "Far Drill", status: "LOCKED", pointsRequired: 4200, pointsGap: 3000 }),
    reward({ name: "Air Fryer", status: "LOCKED", pointsRequired: 1500, pointsGap: 200 }),
    reward({ name: "Toolbox", status: "ELIGIBLE", pointsRequired: 500, pointsGap: 0 }),
    reward({ name: "Wire Kit", status: "CHOSEN", pointsRequired: 850, pointsGap: 0, claimId: "CLM-1" }),
  ];

  assert.deepEqual(selectFeaturedRewards(rewards).map((item) => item.name), [
    "Wire Kit",
    "Toolbox",
    "Air Fryer",
    "Far Drill",
  ]);
});

test("reward catalog sections separate available, claim raised, and delivered rewards", () => {
  const rewards = [
    reward({ name: "Delivered TV", status: "FULFILLED", pointsRequired: 12000, pointsGap: 0 }),
    reward({ name: "Far Drill", status: "LOCKED", pointsRequired: 4200, pointsGap: 3000 }),
    reward({ name: "Air Fryer", status: "LOCKED", pointsRequired: 1500, pointsGap: 200 }),
    reward({ name: "Toolbox", status: "ELIGIBLE", pointsRequired: 500, pointsGap: 0 }),
    reward({ name: "Wire Kit", status: "CHOSEN", pointsRequired: 850, pointsGap: 0, claimId: "CLM-1" }),
  ];

  const sections = splitRewardCatalog(rewards);

  assert.deepEqual(sections.available.map((item) => item.name), ["Toolbox", "Air Fryer", "Far Drill"]);
  assert.deepEqual(sections.claims.map((item) => item.name), ["Wire Kit"]);
  assert.deepEqual(sections.delivered.map((item) => item.name), ["Delivered TV"]);
});

function reward(overrides: Partial<RewardCatalogTile>): RewardCatalogTile {
  return {
    rewardId: overrides.rewardId ?? overrides.name ?? "reward",
    name: overrides.name ?? "Reward",
    pointsRequired: overrides.pointsRequired ?? 100,
    status: overrides.status ?? "LOCKED",
    pointsGap: overrides.pointsGap ?? 0,
    displayValue: overrides.displayValue ?? "100 points",
    ...(overrides.description ? { description: overrides.description } : {}),
    ...(overrides.imageUrl ? { imageUrl: overrides.imageUrl } : {}),
    ...(overrides.tierRequired ? { tierRequired: overrides.tierRequired } : {}),
    ...(overrides.tierGap ? { tierGap: overrides.tierGap } : {}),
    ...(overrides.claimId ? { claimId: overrides.claimId } : {}),
    ...(overrides.claimStatus ? { claimStatus: overrides.claimStatus } : {}),
  };
}
